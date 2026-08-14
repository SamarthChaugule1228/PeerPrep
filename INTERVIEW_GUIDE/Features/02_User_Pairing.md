# User Pairing (Matchmaking)

---

### Feature Overview

**What is it?**
A system that matches two users with complementary roles (candidate ↔ interviewer) based on interview preferences.

**Why?**
- Users can't interview alone
- Need real interviewer + real candidate pairs
- Preferences (DSA, HR, difficulty, company) help find compatible partners
- Anonymous option for privacy

**User Flow:**
User sets preferences → Clicks "Find Peer" → Joins waiting queue → System finds match with opposite role → Both get notified → Join interview room

---

### Working Flow

```
SEARCHING FOR MATCH:
1. User on Dashboard selects preferences:
   - Interview type (DSA, HR, System Design, etc)
   - Difficulty (Beginner, Intermediate, Advanced)
   - Preferred language (Java, C++, Python)
   - Role (Candidate OR Interviewer)
   - Identity (Named OR Anonymous)

2. User clicks "Find Peer" button

3. Frontend connects to backend via Socket.IO

4. Frontend sends 'find-peer' event with preferences

5. Backend adds user to waitingQueue
   - Format: { socketId, userId, name, preferences }

6. Backend runs findMatch(userId) function:
   - Looks for user with OPPOSITE role preference
   - Example: If user is "candidate", finds "interviewer"
   - Example: If user is "interviewer", finds "candidate"
   - Returns match if found: { user1, user2 }

7. If NO match yet:
   - User stays in queue
   - Waits for another user to join
   - Timer shows elapsed time

MATCH FOUND:
8. Backend creates Session in MongoDB with:
   - Two participants
   - Assigned roles (candidate/interviewer)
   - Empty code/notes
   - Status = "active"

9. Backend removes both from queue

10. Backend assigns roles:
    - user1 gets "candidate" (if preference is candidate)
    - user2 gets "interviewer" (opposite role)
    - If both same role → flip one to opposite

11. Backend respects identity preference:
    - If partner wants "Anonymous" → Don't send name
    - If partner wants "Named" → Send real name

12. Both users receive 'matched' event with:
    - sessionId (unique room ID)
    - partner details (name or "Anonymous")
    - Their assigned role
    - Partner's userId

13. Frontend receives 'matched' event

14. Shows "Match found! Redirecting..." message

15. After 1.5 seconds, navigates to /matchroom/{sessionId}

16. Both users now in same interview room
```

---

### Files Used

| File | Purpose |
|------|---------|
| `backend/socket/socket.js` | Manages Socket.IO connections, matching, room logic |
| `backend/models/Session.js` | Database schema for interview sessions |
| `frontend/pages/Dashboard.jsx` | Preferences form + search button + match notification |
| `frontend/pages/MatchRoom.jsx` | Interview room after match found |
| `frontend/context/AuthContext.jsx` | User data + preferences |

---

### Important Code

#### **1. Finding a Match**

**File:** `backend/socket/socket.js` → `findMatch(currentUserId)` function

**What it does:**
Searches waiting queue for user with opposite role preference.

**Why important:**
Core logic - without this, matching wouldn't work.

**How it works (step-by-step):**
```
findMatch(userId) is called
  ↓
Find current user in waitingQueue
  ↓
Get their role preference (candidate or interviewer)
  ↓
Loop through other users in queue
  ↓
For each other user:
  - Skip if same userId (don't match yourself)
  - Get their role preference
  - If same role as current → skip (don't want two candidates or two interviewers)
  - If opposite role → FOUND MATCH! Return {user1, user2}
  ↓
If loop ends with no match found → return null
```

**Packages/Methods explained:**

- **`waitingQueue`** = Simple JavaScript array storing all searching users. Each entry has: `{ userId, socketId, preferences }`
- **`.find()`** = JavaScript method to find first item in array matching condition. Returns single item or null if not found.
  - Example: `waitingQueue.find(q => q.userId.equals(currentUserId))` = Get the first user in queue with matching userId
- **`q.userId.equals()`** = MongoDB method to compare two IDs (because MongoDB IDs are special objects, not plain numbers/strings)
  - Why? IDs are stored as MongoDB ObjectId, so `===` won't work. Must use `.equals()`
- **`||` (OR operator)** = `current.preferences?.rolePreference || 'candidate'` means: Use rolePreference if exists, otherwise default to 'candidate'
- **`continue`** = Skip current loop iteration and go to next one

**Interview point:**
"We iterate through waitingQueue looking for someone with opposite role. If current user is 'candidate', we find 'interviewer'. This prevents two candidates or two interviewers from matching."

```javascript
function findMatch(currentUserId) {
  // Step 1: Find current user in waiting queue
  const current = waitingQueue.find(q => q.userId.equals(currentUserId));
  // waitingQueue = [{userId: A, role: 'candidate'}, {userId: B, role: 'interviewer'}, ...]
  // .find() returns first match or null
  if (!current) return null;  // User not found in queue - shouldn't happen

  // Step 2: Get their role (default to 'candidate' if not specified)
  const currentRole = current.preferences?.rolePreference || 'candidate';
  // If rolePreference missing, use 'candidate' as default
  // '?.' is optional chaining - safe access if preferences is null/undefined

  // Step 3: Loop through ALL users in queue
  for (const other of waitingQueue) {
    // Skip if it's the same user
    if (other.userId.equals(currentUserId)) continue;
    // If userId matches, skip this iteration, go to next user

    // Get their role
    const otherRole = other.preferences?.rolePreference || 'candidate';

    // Step 4: Skip if same role (both candidate or both interviewer)
    if (currentRole === otherRole) continue;
    // If roles are same, not a match, try next user

    // Step 5: MATCH FOUND! Both have opposite roles
    return { user1: current, user2: other };
    // Return both users as a match object
  }

  // Step 6: No match found - user stays in queue
  return null;
}
```

---

#### **2. Creating a Session**

**File:** `backend/socket/socket.js` → `socket.on('find-peer')` event handler

**What it does:**
When match found, creates new Session document in MongoDB with both participants and roles.

**Why important:**
Session is the persistent record of the interview. Stores code, notes, timer, status.

**How it works (step-by-step):**
```
Match found: user1 and user2 are now paired
  ↓
Create new MongoDB document:
  {
    participants: [
      { user: userId1, socketId: socketId1, role: 'candidate' },
      { user: userId2, socketId: socketId2, role: 'interviewer' }
    ],
    code: '',
    notes: '',
    status: 'active',
    createdAt: now
  }
  ↓
Save to MongoDB database
  ↓
MongoDB auto-generates _id (unique session ID)
  ↓
Return session object with _id
```

**Packages/Methods explained:**

- **`Session`** = Mongoose model (connection to MongoDB Session collection). Defined in `backend/models/Session.js`
- **`Session.create()`** = Mongoose method to create and save document in one call. Alternative: `new Session().save()`
  - Equivalent to: INSERT INTO sessions VALUES (...) in SQL
  - Why? Creates database record so data persists even if server crashes
- **`await`** = Wait for database operation to complete before continuing. Without it, code runs before data saved.
- **`async`** = Function must be marked `async` to use `await` inside
- **`participants`** = Array of 2 users. Each has:
  - `user` = MongoDB ObjectId (reference to User collection)
  - `socketId` = Socket.IO connection ID (temporary, for sending messages during interview)
  - `role` = String: 'candidate' or 'interviewer'
- **`createdAt`** = Auto-added by Mongoose (timestamp of when Session was created)

**Why store socketId?**
Socket IDs are temporary connection identifiers. If user disconnects and reconnects, gets new socketId. The old socketId in Session helps track who left.

**Interview point:**
"Each interview gets a unique Session ID. This ID is used as a room identifier. Both users use same sessionId to stay in sync - their code updates are synced because they're in same room."

```javascript
const session = await Session.create({
  // When match found, create new session document in MongoDB
  participants: [
    // Array of 2 participants
    {
      user: match.user1.userId,      // MongoDB ID of first user
      socketId: match.user1.socketId, // Their current socket.io connection ID
      role: user1Role                 // 'candidate' or 'interviewer'
    },
    {
      user: match.user2.userId,
      socketId: match.user2.socketId,
      role: user2Role
    }
  ],
  // MongoDB auto-fills below from Session schema default values:
  // code: '',
  // notes: '',
  // question: '',
  // status: 'active',
  // createdAt: Date.now()
});

// session now contains:
// {
//   _id: ObjectId("63a2ce..."),  // Auto-generated unique ID
//   participants: [...],
//   code: '',
//   notes: '',
//   status: 'active',
//   createdAt: 2024-01-15T10:30:00Z
// }
// This document now exists in MongoDB permanently
```

---

#### **3. Assigning Roles**

**File:** `backend/socket/socket.js` → `socket.on('find-peer')` event handler

**What it does:**
Determines if user is candidate or interviewer based on preference. Opposite user gets opposite role.

**Why important:**
Role determines UI and permissions. Candidate answers questions, interviewer asks them.

**How it works (step-by-step):**
```
Check user1's rolePreference:
  ↓
If rolePreference === 'candidate':
  user1Role = 'candidate'
  user2Role = 'interviewer' (opposite)
Else:
  user1Role = 'interviewer'
  user2Role = 'candidate' (opposite)
  ↓
Result: Always opposite roles
```

**Packages/Methods explained:**

- **Ternary operator: `condition ? value1 : value2`** = If/else in one line
  - Example: `age > 18 ? 'adult' : 'minor'` = If age > 18, use 'adult', else use 'minor'
  - Used here: `match.user1.preferences?.rolePreference === 'candidate' ? 'candidate' : 'interviewer'`
    - If rolePreference equals 'candidate' → use 'candidate'
    - Else → use 'interviewer'
- **`===`** = Strict equality check (checks type AND value)
  - Example: `'candidate' === 'candidate'` = true, `'candidate' === 'interviewer'` = false

**Interview point:**
"We check user1's role preference. If 'candidate', user1 is candidate and user2 is interviewer. If 'interviewer', user1 is interviewer and user2 is candidate. This ensures always opposite roles."

```javascript
// Step 1: Determine user1's role based on their preference
const user1Role = match.user1.preferences?.rolePreference === 'candidate'
  ? 'candidate'      // If they want to be candidate, they are candidate
  : 'interviewer';   // Otherwise, they are interviewer

// Examples:
// If user1 chose 'candidate' in preferences → user1Role = 'candidate'
// If user1 chose 'interviewer' in preferences → user1Role = 'interviewer'

// Step 2: Give user2 opposite role
const user2Role = user1Role === 'candidate'
  ? 'interviewer'    // If user1 is candidate, user2 is interviewer
  : 'candidate';     // If user1 is interviewer, user2 is candidate

// Examples:
// If user1Role = 'candidate' → user2Role = 'interviewer'
// If user1Role = 'interviewer' → user2Role = 'candidate'
```

---

#### **4. Respecting Anonymous Preference**

**File:** `backend/socket/socket.js` → `getPartnerDetails(userEntry, identityPreference)` function

**What it does:**
If partner wants anonymous, don't send their real name. Otherwise send name and preferences.

**Why important:**
Privacy - some users don't want to reveal identity.

**How it works (step-by-step):**
```
getPartnerDetails called with:
  userEntry = {name: 'Alice', preferences: {...}}
  identityPreference = 'Anonymous' or 'Named'
  ↓
If identityPreference === 'Anonymous':
  Return: { anonymous: true, preferences: {...} }
  (Don't send name!)
Else:
  Return: { anonymous: false, name: 'Alice', preferences: {...} }
  (Send name)
  ↓
Frontend receives this object
  ↓
If anonymous: true → Show "Anonymous Interviewer"
Else → Show "Interviewer: Alice"
```

**Packages/Methods explained:**

- **Function parameters: `getPartnerDetails(userEntry, identityPreference)`**
  - `userEntry` = Object with user data (name, userId, preferences)
  - `identityPreference` = String: 'Anonymous' or 'Named' (user's privacy choice)
  - Why 2 parameters? Need both to decide what to return
- **`return` statement** = Exit function and send back value
  - When `return` executed, function stops. Any code after return doesn't run.
  - Example: `return { anonymous: true }` stops function and returns that object
- **Object literal syntax: `{ key: value }`** = Create object
  - Example: `{ anonymous: true, name: 'Alice' }` = Object with 2 properties

**Interview point:**
"If partner chose 'Anonymous', we return { anonymous: true }. If 'Named', we return { anonymous: false, name: ... }. Frontend checks this and shows 'Anonymous Interviewer' if needed."

```javascript
function getPartnerDetails(userEntry, identityPreference) {
  // userEntry = {name: 'Alice', userId: ..., preferences: {...}}
  // identityPreference = 'Anonymous' or 'Named'

  if (identityPreference === 'Anonymous') {
    // User wants to stay private - don't send name
    return {
      anonymous: true,
      preferences: userEntry.preferences  // Send preferences but not name
      // Frontend will show: "Anonymous Interviewer"
    };
  }

  // User wants to be identified - send full details
  return {
    anonymous: false,
    name: userEntry.name,               // Send real name: 'Alice'
    preferences: userEntry.preferences
    // Frontend will show: "Interviewer: Alice"
  };
}
```

---

#### **5. Emitting Match Notification**

**File:** `backend/socket/socket.js` → `socket.on('find-peer')` event handler

**What it does:**
Sends 'matched' event to both users with session data.

**Why important:**
Only way users know they've been matched. Triggers navigation to interview room.

**How it works (step-by-step):**
```
Both users matched (user1 and user2)
  ↓
Send to user1's socket connection:
  io.to(user1's socketId).emit('matched', {
    sessionId: '63a2ce6d...',
    partner: {name: 'Bob', anonymous: false},
    role: 'candidate'
  })
  ↓
User1's browser receives 'matched' event
  ↓
User1's frontend listens for 'matched':
  socket.on('matched', (data) => {
    Navigate to /matchroom/{data.sessionId}
  })
  ↓
Same process for user2 (reversed: they're 'interviewer')
```

**Packages/Methods explained:**

- **`io`** = Socket.IO server instance. Controls all socket connections
- **`io.to(socketId)`** = Target specific socket connection by its ID
  - Example: `io.to('socket_abc123').emit()` = Send to that specific user only
  - Why? socketId identifies which browser/user to send to
- **`.emit(eventName, data)`** = Send event to targeted socket(s)
  - First argument: Event name as string ('matched', 'message', etc.)
  - Second argument: Data to send (object)
  - Frontend must have `socket.on('matched', ...)` to receive
- **`match.user1.socketId`** = Socket.IO connection ID of user1
  - Stored when they connected with `socket.on('find-peer')`
  - Different from userId - it's temporary connection identifier
  - If user disconnects and reconnects, gets new socketId

**Why send to both separately instead of once?**
Each user gets their own perspective:
- User1 sees: "You are candidate. Partner is Bob (interviewer)."
- User2 sees: "You are interviewer. Partner is Alice (candidate)."

Both get same sessionId but different role/partner perspective.

**Interview point:**
"We use io.to(socketId).emit() to send to specific user. Each user gets their perspective - their role, their partner details, their session ID. Both sent simultaneously."

```javascript
// Send match notification to user1
io.to(match.user1.socketId).emit('matched', {
  // io.to() = Send to specific socket
  // match.user1.socketId = User1's socket.io connection ID
  
  sessionId: session._id,      // Unique session ID (MongoDB ObjectId converted to string)
  partner: partner1,           // Partner details object: {anonymous, name/not, preferences}
  role: user1Role,             // What user1 is: 'candidate' or 'interviewer'
  partnerUserId: match.user2.userId  // User2's database ID (for API calls later)
});
// Data sent to user1's browser
// Frontend receives in: socket.on('matched', (data) => { ... })

// Send match notification to user2
io.to(match.user2.socketId).emit('matched', {
  // Same structure but reversed perspective
  
  sessionId: session._id,       // Same session, different user receives it
  partner: partner2,            // Different partner object (user1's details)
  role: user2Role,              // Their role: opposite of user1
  partnerUserId: match.user1.userId  // User1's ID
});

// Now both users' frontends receive 'matched' event
// They navigate to /matchroom/{sessionId} after 1.5 second delay
// Both arrive in same room and start interview
```

---

### Key Methods

| Method | Why Important |
|--------|---------------|
| `waitingQueue.push()` | Adds user to queue when searching |
| `waitingQueue.splice()` | Removes user from queue when matched or cancelled |
| `findMatch()` | Core logic - finds user with opposite role |
| `Session.create()` | Creates database record for interview session |
| `io.to(socketId).emit()` | Sends event to specific user via Socket.IO |
| `socket.emit('find-peer')` | User triggers search |
| `socket.on('matched')` | User receives match notification |

---

### Interview Q&A

**Q: How do you prevent two candidates from matching?**
A: We check role preference. If both are 'candidate' or both 'interviewer', we skip that match. Only match when roles are opposite.

**Q: What happens if 1000 users search together?**
A: All added to waitingQueue. findMatch() runs for each, matching them in pairs. No database queries during search - all in-memory. Fast.

**Q: What if user cancels search?**
A: Frontend sends 'cancel-search' event. Backend removes them from queue. Simple.

**Q: How do users stay in sync in the interview room?**
A: Both use same sessionId. When one user types code, it emits 'code-change' with sessionId. Backend broadcasts to everyone in that sessionId room.

**Q: What if partner disconnects after match?**
A: Socket.IO 'disconnect' event triggers. Backend removes from queue. Session marked as 'ended'. Other user gets 'partner-left' event and session ends.

**Q: Why store socketId in Session?**
A: Socket IDs are temporary. When user reconnects, they get new socketId. But their participant record still has old socketId. Used for finding who left/what happened.

**Q: How do you handle duplicate entries in queue?**
A: Before pushing, check if userId already in queue. If yes, remove old entry first. Prevents one user being in queue twice.

```javascript
const existingIndex = waitingQueue.findIndex(q => q.userId.equals(socket.user._id));
if (existingIndex !== -1) waitingQueue.splice(existingIndex, 1);
waitingQueue.push(userEntry);
```

**Q: What information is needed to create a Session?**
A: Two participants (userId + socketId + role). That's it. Code, notes, timer are added later as they're used during interview.

**Q: Why send 'matched' with partner details instead of just sessionId?**
A: Frontend needs partner name/preferences immediately to show in UI. Could fetch from database, but quicker to send with match event.

**Q: How does role assignment work if both users have same preference?**
A: Currently our code checks first user's preference. If both have 'candidate' preference, user1 becomes candidate and user2 becomes interviewer anyway. This might not be ideal - could improve by letting users choose roles.

**Q: Can two users cancel search and search again?**
A: Yes. Each 'find-peer' check removes old queue entry first. They can cancel, adjust preferences, search again.

**Q: How long does match usually take?**
A: Depends on queue. If someone waiting, instant. If queue empty, matches when next person joins. Could add timeout (search for 5 minutes, then cancel) - currently doesn't have one.

**Q: What if Socket.IO connection drops during search?**
A: Backend's 'disconnect' event fires. User removed from queue. If already matched, Session marked ended, partner gets 'partner-left' event.

**Q: How do you prevent matching same user twice?**
A: In findMatch(), we skip if `other.userId.equals(currentUserId)`. Also, both removed from queue after match, so can't match again.

**Q: What database query happens when match found?**
A: Only one: `Session.create()`. No user lookups, no queue database reads - all in-memory. Efficient.

---

### Real-World Scenario

**Scenario 1: 100 users search for DSA interviews**

Queue fills with 100 users. findMatch() pairs them up instantly (no waiting). 50 sessions created simultaneously. Scales well.

**Problem:** What if all 100 are candidates (everyone wants to be interviewed)?
- findMatch() returns null for everyone
- Everyone waits
- Queue never matches
- **Solution:** Need to encourage role diversity or force role assignment

**Scenario 2: One user's internet cuts out**

User searching → Got matched → Socket disconnects → Backend 'disconnect' fires → removeFromQueue() → Partner gets 'partner-left' → Interview ends. Both users in MatchRoom see ended status.

---

### Common Mistakes

**Mistake 1:** Not removing from queue after match
- ❌ Matched user stays in queue
- ✅ Remove from queue: `waitingQueue.splice(index, 1)`
- Why: Same user could be matched twice

**Mistake 2:** Not checking opposite roles
- ❌ Two candidates match
- ✅ `if (currentRole === otherRole) continue;`
- Why: Need both perspectives

**Mistake 3:** Sending real name when anonymous requested
- ❌ `return { name: user.name };` (always)
- ✅ `if (pref === 'Anonymous') return { anonymous: true };`
- Why: Privacy violated

**Mistake 4:** Creating Session before match confirmed
- ❌ Create Session immediately when user joins queue
- ✅ Create Session only when actual match found
- Why: Database bloat with incomplete sessions

**Mistake 5:** Not handling duplicate queue entries
- ❌ User can appear in queue twice
- ✅ Check before pushing: `if (findIndex...) splice...`
- Why: User matched to themselves or double-matched

**Mistake 6:** No timeout for search
- ❌ User waits forever if no one with opposite role
- ✅ Add 5-10 minute timeout: `if (waitTime > 600s) cancelSearch()`
- Why: Better UX

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Queue** | In-memory array of waiting users |
| **findMatch()** | Finds user with opposite role preference |
| **Role Assignment** | User1 gets preference, User2 gets opposite |
| **Session Creation** | Database record with both participants |
| **Match Notification** | Send 'matched' event to both users |
| **Privacy** | Respect anonymous preference |
| **Disconnect** | Remove from queue, end session if in room |
