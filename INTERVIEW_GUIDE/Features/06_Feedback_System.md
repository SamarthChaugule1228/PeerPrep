# Feedback System

---

### Feature Overview

**What is it?**
After interview ends, users rate each other (1-5 stars) on Communication, Technical Skills, and Overall performance.

**Why?**
- Users improve by knowing their weaknesses
- Platform tracks user ratings over time
- Average ratings shown on Dashboard
- Feedback helps refine interview skills

**How it works:**
Interview ends → Feedback modal appears → Rate each other → Save to database → Ratings shown on next dashboard visit

---

### Working Flow

```
INTERVIEW SESSION ENDS:

1. Interviewer clicks "End interview" button

2. MatchRoom.jsx receives 'interview-ended' event

3. Frontend emits 'show-feedback' to both users

4. FeedbackModal component shows:
   - Communication: 1-5 stars
   - Technical: 1-5 stars
   - Overall: 1-5 stars
   - Optional note (max 300 chars)

5. User clicks "Submit Feedback"

6. Frontend sends POST /api/feedback with:
   {
     sessionId: "...",
     communication: 4,
     technical: 3,
     overall: 3.5,
     note: "Good approach but missed edge cases"
   }

7. Backend receives feedback:
   - Check session exists
   - Check user is participant
   - Find the OTHER participant (partner)
   - Check if feedback already submitted (prevent duplicate)
   - Create Feedback document:
     {
       session: sessionId,
       fromUser: userA._id,
       toUser: userB._id,
       communication: 4,
       technical: 3,
       overall: 3.5,
       note: "Good approach...",
       createdAt: now
     }
   - Save to database

8. Frontend closes modal, redirects to dashboard

9. User sees average ratings on Dashboard:
   - Fetches GET /api/feedback/stats
   - Backend runs aggregation:
     - Find all feedback WHERE toUser = currentUser
     - Average the communication scores
     - Average the technical scores
     - Average the overall scores
     - Return averages

10. Dashboard shows:
    - ★ Communication: 4.2 (from 5 sessions)
    - ★ Technical: 3.8
    - ★ Overall: 4.0
```

---

### Files Used

| File | Purpose |
|------|---------|
| `backend/models/Feedback.js` | Feedback schema (ratings, notes, timestamps) |
| `backend/routes/feedback.js` | POST /api/feedback to save, GET /stats to fetch averages |
| `frontend/components/FeedbackModal.jsx` | UI form for rating stars |
| `frontend/pages/MatchRoom.jsx` | Shows modal when interview ends |
| `frontend/pages/Dashboard.jsx` | Displays average ratings |

---

### Important Code

#### **1. Submit Feedback to Backend**

**File:** `backend/routes/feedback.js` → `router.post('/')` route

**What it does:**
Receives feedback from one user about their interview partner, validates, saves to database.

**How it works:**
```
Frontend sends POST /api/feedback with:
  {
    sessionId: "63a2ce6d60fd...",
    communication: 4,
    technical: 3,
    overall: 3.5,
    note: "Good discussion"
  }
  ↓
Backend middleware 'auth' verifies JWT token
  ↓
Extract req.user.id (who is giving feedback)
  ↓
Extract body: sessionId, communication, technical, overall, note
  ↓
Session.findById(sessionId) = Verify session exists
  ↓
Check: Is current user a participant in this session?
  ↓
Find partner (the OTHER participant in session)
  ↓
Check: Did this user already submit feedback for this session?
  ↓
If yes: Return error "Feedback already submitted"
  ↓
If no: Create Feedback document
  ↓
Save to MongoDB
  ↓
Return feedback object with _id (proof it was saved)
```

**Why important:**
Core backend logic - validates and saves feedback safely.

```javascript
router.post('/', auth, async (req, res) => {
  try {
    const { sessionId, communication, technical, overall, note } = req.body;

    // Step 1: Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ msg: 'Session not found' });
    // If session doesn't exist in DB, someone is trying to fake it

    // Step 2: Check if user is a participant
    const participant = session.participants.find(
      p => p.user.toString() === req.user.id
    );
    if (!participant) return res.status(403).json({ msg: 'Not a participant' });
    // Only people in the session can give feedback

    // Step 3: Find the partner (other participant)
    const partner = session.participants.find(
      p => p.user.toString() !== req.user.id
    );
    if (!partner) return res.status(400).json({ msg: 'Partner not found' });
    // Should always have 2 participants, but check just in case

    // Step 4: Check if feedback already submitted
    const existing = await Feedback.findOne({
      session: sessionId,
      fromUser: req.user.id
    });
    if (existing) return res.status(400).json({ msg: 'Feedback already submitted' });
    // Prevent duplicate feedback submissions

    // Step 5: Create feedback document
    const feedback = new Feedback({
      session: sessionId,
      fromUser: req.user.id,
      toUser: partner.user,
      communication,    // 1-5 stars
      technical,        // 1-5 stars
      overall,          // 1-5 stars
      note: note || ''  // Optional note
    });

    // Step 6: Save to database
    await feedback.save();
    
    res.json(feedback);
    // Return the saved feedback with _id and timestamps
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Feedback already submitted' });
    }
    res.status(500).send('Server error');
  }
});
```

---

#### **2. Get Average Ratings (Aggregation)**

**File:** `backend/routes/feedback.js` → `router.get('/stats', auth)` route

**What it does:**
Calculates average communication, technical, and overall scores for logged-in user.

**How it works:**
```
Frontend sends GET /api/feedback/stats
  ↓
Backend middleware 'auth' verifies JWT token
  ↓
MongoDB Aggregation Pipeline:
  1. $match: Find all feedback WHERE toUser = currentUser
     = All feedback given TO me (not FROM me)
  
  2. $group: Group all matched feedback
     - _id: null (group everything together)
     - avgCommunication: $avg of all communication scores
     - avgTechnical: $avg of all technical scores
     - avgOverall: $avg of all overall scores
     - count: $sum (total feedback count)
  ↓
Result: { avgCommunication: 4.2, avgTechnical: 3.8, ... }
  ↓
Return to frontend
  ↓
Frontend displays: ★ Communication: 4.2
```

**Why important:**
Shows user how they're performing. Motivation to improve.

```javascript
router.get('/stats', auth, async (req, res) => {
  try {
    // Use MongoDB aggregation to calculate averages
    const stats = await Feedback.aggregate([
      // STAGE 1: Filter
      {
        $match: {
          toUser: new mongoose.Types.ObjectId(req.user.id)
          // Find all feedback where I am the recipient
          // toUser = "Alice" means Alice is being evaluated
          // fromUser = "Bob" means Bob is giving the feedback
        }
      },
      
      // STAGE 2: Group and calculate
      {
        $group: {
          _id: null,  // Group everything together (not separate by user)
          
          avgCommunication: { $avg: '$communication' },
          // All communication scores → Average them
          // [5, 4, 3] → avg = 4
          
          avgTechnical: { $avg: '$technical' },
          // All technical scores → Average them
          
          avgOverall: { $avg: '$overall' },
          // All overall scores → Average them
          
          count: { $sum: 1 }
          // Count how many feedback entries
        }
      }
    ]);

    // Handle if no feedback yet
    if (stats.length === 0) {
      return res.json({
        avgCommunication: 0,
        avgTechnical: 0,
        avgOverall: 0,
        count: 0
      });
    }

    // stats = [{ avgCommunication: 4.2, avgTechnical: 3.8, ... }]
    const s = stats[0];
    
    res.json({
      avgCommunication: Math.round(s.avgCommunication * 10) / 10,
      // Round to 1 decimal: 4.23 → 4.2
      
      avgTechnical: Math.round(s.avgTechnical * 10) / 10,
      avgOverall: Math.round(s.avgOverall * 10) / 10,
      count: s.count
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
```

---

#### **3. FeedbackModal Component (Star Rating UI)**

**File:** `frontend/components/FeedbackModal.jsx`

**What it does:**
Shows interactive star rating UI. User clicks stars to set rating.

**How it works:**
```
Modal shows 3 categories:
1. Communication: ★★★☆☆ (user can click any star)
2. Technical: ★★☆☆☆
3. Overall: ★★★★☆

If user clicks 4th star on Communication:
  ↓
State updates: communication = 4
  ↓
UI re-renders: ★★★★☆ (4 filled stars)

User clicks Submit:
  ↓
axios.post('/api/feedback', {
    sessionId,
    communication: 4,
    technical: 2,
    overall: 4,
    note: "..."
  })
  ↓
Backend receives and saves
  ↓
Modal closes
```

**Why important:**
User-friendly star rating UI. Standard feedback interface.

```javascript
// Star rating component logic:
const [communication, setCommunication] = useState(0);

const handleCommunicationClick = (rating) => {
  setCommunication(rating);
  // 1-5 stars
};

return (
  <div>
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        onClick={() => handleCommunicationClick(star)}
        className={star <= communication ? 'star-filled' : 'star-empty'}
      >
        ★
      </button>
    ))}
  </div>
);
```

---

#### **4. Prevent Duplicate Feedback (Unique Index)**

**File:** `backend/models/Feedback.js` → Schema definition

**What it does:**
Database enforces: one user can only submit feedback once per session.

**How it works:**
```
feedbackSchema.index({ session: 1, fromUser: 1 }, { unique: true });

This creates a unique index on (session, fromUser)
  ↓
User A tries to submit feedback for session 123
  ↓
MongoDB creates document:
  {
    session: 123,
    fromUser: "userA",
    ...
  }
  ↓
User A tries to submit AGAIN for session 123
  ↓
MongoDB rejects: "E11000 duplicate key error"
  ↓
Backend catches error: err.code === 11000
  ↓
Returns: "Feedback already submitted"
```

**Why important:**
Prevents spam. One user can't rate same partner multiple times.

```javascript
const feedbackSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  communication: { type: Number, min: 1, max: 5, required: true },
  technical: { type: Number, min: 1, max: 5, required: true },
  overall: { type: Number, min: 1, max: 5, required: true },
  note: { type: String, maxlength: 300, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Unique index: one feedback per (session, fromUser) pair
feedbackSchema.index(
  { session: 1, fromUser: 1 },  // Create index on these fields
  { unique: true }              // Must be unique
);

// This means:
// - (session: 123, fromUser: "userA") = allowed only ONCE
// - (session: 123, fromUser: "userB") = different fromUser, allowed
// - (session: 456, fromUser: "userA") = different session, allowed
```

---

#### **5. Show Feedback Modal When Interview Ends**

**File:** `backend/socket/socket.js` → Interview end handler

**What it does:**
When interview ends, backend tells both users to show feedback form.

**How it works:**
```
Interviewer clicks "End interview" button
  ↓
MatchRoom.jsx receives 'interview-ended' event
  ↓
Backend also sends 'show-feedback' event
  ↓
io.to(sessionId).emit('show-feedback')
  = Send to BOTH users in session
  ↓
Both users' frontends receive 'show-feedback'
  ↓
setShowFeedback(true) called
  ↓
FeedbackModal appears on both screens
```

**Why important:**
Coordinated - both users see form at same time. Prevents one user leaving before rating.

```javascript
// backend/socket/socket.js
socket.on('end-interview', async ({ sessionId }) => {
  console.log('Interview ended for session:', sessionId);
  
  // Notify both users
  io.to(sessionId).emit('interview-ended');
  
  // Show feedback modal to both
  io.to(sessionId).emit('show-feedback');
  // io.to() = send to BOTH including sender
  
  // Update database
  await Session.findByIdAndUpdate(sessionId, { status: 'ended' });
});

// frontend/pages/MatchRoom.jsx
socketRef.current.on('show-feedback', () => {
  setShowFeedback(true);  // Show modal
});
```

---

### Key Methods

| Method | What it does |
|--------|-------------|
| `Feedback.aggregate()` | Run pipeline to calculate averages |
| `$match` | Filter feedback documents |
| `$group` | Group and calculate averages |
| `$avg` | MongoDB average operator |
| `unique: true` | Index constraint - prevent duplicates |
| `err.code === 11000` | MongoDB duplicate key error |

---

### Interview Q&A

**Q: Why average ratings instead of individual scores?**
A: Privacy. Only show aggregate. If person rated 1 star, they won't know who gave it. Better for honest feedback.

**Q: Can user change their feedback after submitting?**
A: No, unique index prevents resubmitting. Current code doesn't have edit feature. Could be added later.

**Q: What if user closes modal without giving feedback?**
A: Feedback not submitted. Session marked as ended but no rating recorded. User can't access interview room again.

**Q: How long does aggregation pipeline take?**
A: Depends on feedback count. With 100 feedbacks, instant. With 1 million, might need indexing optimization.

**Q: Can you give negative feedback?**
A: Ratings are 1-5 stars (all positive). Low rating (1 star) is as negative as it gets. Note field allows critical comments.

**Q: Is feedback anonymous?**
A: Yes, from platform view. You see: "Your average rating is 4.2" but not "Alice rated you 5, Bob rated you 3". Keeps feedback honest.

**Q: What if partner doesn't submit feedback?**
A: Fine. Only feedback that's submitted is counted. If 1 person rates, their rating counts. If 2 rate, average of 2 used.

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **After Interview** | Feedback modal shown to both users |
| **Star Ratings** | 1-5 stars for Communication, Technical, Overall |
| **Validation** | Check session exists, user is participant, no duplicates |
| **Save to DB** | Feedback document stored with timestamps |
| **Aggregation** | Calculate averages from all feedback received |
| **Display** | Dashboard shows user's average ratings |
| **Unique Index** | Prevent one user rating same person twice |
