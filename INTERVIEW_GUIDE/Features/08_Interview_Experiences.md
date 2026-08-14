# Interview Experiences

---

### Feature Overview

**What is it?**
After each interview, users can log their experience: company, role, difficulty, outcome, and detailed notes using rich text editor. Experiences are shared with community for others to learn from.

**Why?**
- Document learning from each interview
- Help others prepare for same companies
- Upvote useful experiences
- Filter by company/type/difficulty
- Build knowledge base for interview prep

**How it works:**
User completes interview → Writes experience notes → Saves to database → Appears in community feed → Others upvote/read → Contributes to platform knowledge

---

### Working Flow

```
USER WANTS TO SHARE EXPERIENCE:

1. User navigates to /experiences page

2. InterviewExperiences component loads
   - Fetches list of all experiences from database
   - Shows as cards in feed
   - Shows filters and sort options
   
3. User clicks "+ Share Your Experience" button

4. Form appears (showForm = true):
   - Company dropdown: Cisco, Amazon, etc.
   - Role text input: "Software Engineer"
   - Interview Type dropdown: DSA, HR, System Design, etc.
   - Difficulty dropdown: Beginner, Intermediate, Advanced
   - Outcome dropdown: Selected, Rejected, No Decision
   - Mode dropdown: On Campus, Off Campus, Referral
   - Location text input: "Mumbai"
   - Content: Rich text editor (with bold, heading, lists, code blocks, links)
   - Submit button

5. User fills form and types experience in rich editor:
   - Rich editor (Tiptap) stores content as JSON
   - Example: {type: 'paragraph', content: [{type: 'text', text: '...'}]}
   - User can use bold, italic, headings, code blocks, links
   
6. User clicks "Save Experience" button

7. handleSubmit runs:
   - Validates user is logged in
   - setSumbitting(true) - disable button
   - FormData includes all fields + content (JSON string)
   
8. Frontend sends POST request:
   POST /api/experiences
   Headers:
     - x-auth-token: JWT_TOKEN
     - Content-Type: application/json
   Body:
   {
     company: 'Amazon',
     role: 'SDE-1',
     interviewType: 'DSA',
     difficulty: 'Intermediate',
     outcome: 'Selected',
     mode: 'On Campus',
     location: 'Bangalore',
     content: '{"type":"doc","content":[{"type":"paragraph",...}]}'
   }

9. Backend receives POST /api/experiences

10. Middleware 'auth' verifies JWT token
    - Extracts req.user.id from token
    
11. Route handler processes:
    - Destructure all fields from req.body
    - Create new Experience document:
      {
        user: req.user.id,          // Current user
        company: 'Amazon',
        role: 'SDE-1',
        interviewType: 'DSA',
        difficulty: 'Intermediate',
        outcome: 'Selected' (or empty string if not set),
        mode: 'On Campus',
        location: 'Bangalore',
        content: '{"type":"doc",...}',
        upvotes: [],                // Empty array initially
        reads: 0,                   // No reads yet
        createdAt: now              // Auto-generated timestamp
      }
    
12. Save to MongoDB
    - experience.save() → Document inserted
    - Auto-generates _id (experience ID)

13. Populate user reference:
    - Experience.findById(newId).populate('user', fields)
    - Gets user details: name, college, degree, branch, year, graduationYear
    - Returns full experience with user info

14. Backend sends response:
    {
      _id: '63a2ce6d...',
      user: {
        _id: '62b1ce3c...',
        name: 'Alice',
        college: 'IIT Bombay',
        degree: 'B.Tech',
        branch: 'CSE',
        year: 'BE',
        graduationYear: 2026
      },
      company: 'Amazon',
      role: 'SDE-1',
      interviewType: 'DSA',
      difficulty: 'Intermediate',
      outcome: 'Selected',
      mode: 'On Campus',
      location: 'Bangalore',
      content: '{"type":"doc",...}',
      upvotes: [],
      reads: 0,
      createdAt: '2024-01-15T10:30:00Z'
    }

15. Frontend receives response

16. Show success message: "Experience shared!"

17. Clear form and close modal

18. Fetch all experiences again to refresh list


VIEWING EXPERIENCES FEED:

1. GET /api/experiences?sort=newest&company=&interviewType=

2. Backend receives query:
   - Extract query parameters: company, interviewType, difficulty, sort
   - Build MongoDB filter object:
     {
       company: 'Amazon' (if provided),
       interviewType: 'DSA' (if provided),
       difficulty: 'Intermediate' (if provided)
     }
   - If no filters, filter = {}
   
3. MongoDB query:
   - Experience.find(filter)
     .populate('user', 'name college degree branch year graduationYear')
     .sort({createdAt: -1})
     .lean()
   
   - .find(filter) = Get all matching documents
   - .populate('user', ...) = Replace user ID with actual user object
   - .sort({createdAt: -1}) = Sort by date, newest first
   - .lean() = Return plain JS objects (faster, read-only)
   
4. Backend maps results:
   - For each experience, add upvotesCount = length of upvotes array
   - result.sort() by upvotesCount if sort='upvotes'
   - result.sort() by createdAt if sort='oldest'

5. Backend sends array of experiences to frontend

6. Frontend displays as cards:
   - Company & role
   - Type, difficulty, outcome
   - Author (college, batch)
   - Upvotes count with button
   - Read count
   - "View details" link


UPVOTING EXPERIENCE:

1. User clicks upvote button on experience card

2. handleUpvote(experienceId) runs:
   - Check if user logged in (require auth)
   - POST /api/experiences/{id}/upvote
   
3. Backend receives POST /api/experiences/{id}/upvote

4. Middleware 'auth' verifies JWT

5. Route handler:
   - Find experience by ID
   - Get current user ID from req.user.id
   
   - Check if user already upvoted:
     experience.upvotes.some(id => id.toString() === userId)
     = Does ANY element in upvotes array equal current user?
     = true: User already upvoted
     = false: User hasn't upvoted yet
   
   - If already upvoted (toggle off):
     experience.upvotes = experience.upvotes.filter(id => id.toString() !== userId)
     = Keep all elements EXCEPT current user
     = Removes upvote
   
   - If not upvoted (toggle on):
     experience.upvotes.push(userId)
     = Add current user ID to array
     = Adds upvote
   
   - Save updated experience
   - Populate user and return

6. Backend sends back updated experience with new upvotes array

7. Frontend:
   - setExperiences() updates experience in list
   - UI shows updated count


VIEWING EXPERIENCE DETAILS:

1. User clicks "View Details" link on card

2. Navigate to /experiences/{experienceId}

3. ExperienceDetail component loads:
   - useParams() gets ID from URL
   - useEffect fetches GET /api/experiences/{id}
   
4. Backend receives GET /api/experiences/{id}

5. Route handler:
   - Find experience by ID
   - Populate user reference
   - Increment reads counter by 1
   - Save (updates reads in DB)
   - Send to frontend

6. Frontend renders detail page:
   - Author name, college, batch
   - Company & role
   - Interview type, difficulty, outcome, mode, location
   - Upvotes and reads count
   - Rich text content (HTML rendered from JSON)
   - Back button

7. Content rendering:
   - Experience.content = JSON string: '{"type":"doc","content":[...]}'
   - renderContent() function:
     1. Parse JSON string to object
     2. Use Tiptap's generateHTML() with extensions
     3. Convert to HTML: <p>, <h1>, <code>, <ul>, <a> tags
     4. Display in <div dangerouslySetInnerHTML={{__html: htmlContent}} />
```

---

### Files Used

| File | Purpose |
|------|---------|
| `frontend/pages/InterviewExperiences.jsx` | List experiences, create form, filtering, sorting, upvoting |
| `frontend/pages/ExperienceDetail.jsx` | Display single experience with full content |
| `frontend/components/RichTextEditor.jsx` | Tiptap rich text editor for writing experiences |
| `backend/models/Experience.js` | Experience schema (company, role, content, upvotes, reads) |
| `backend/routes/experiences.js` | API routes: POST (create), GET (list/detail), POST upvote |
| `frontend/services/api.js` | Axios instance for experience API calls |

---

### Important Code

#### **1. Create and Submit Experience**

**File:** `frontend/pages/InterviewExperiences.jsx` → `handleSubmit()`

**What it does:**
Collects form data (company, role, type, difficulty, content) and sends to backend API. Creates new experience entry.

**How it works (step-by-step):**
```
User fills form and clicks "Save Experience"
  ↓
handleSubmit(e) runs:
  1. e.preventDefault() - Stop page reload
  2. setSumbitting(true) - Show "Saving..." disable button
  3. Build request body with all form fields
  4. POST /api/experiences with formData
  5. Wait for response (await)
  ↓
If success:
  - Reset form (clear all fields)
  - Close modal (setShowForm(false))
  - Show "Experience shared!" message
  - Re-fetch experiences to show new post
  - Auto-hide message after 3 seconds
  ↓
If error:
  - Show alert "Failed to share experience"
  - Don't clear form (user can retry)
  ↓
Finally:
  - setSumbitting(false) - Hide saving state
```

**Packages/Methods explained:**

- **`setFormData({ company: '', role: '', ... })`** = Reset form
  - Sets all fields to empty string
  - After successful submission, clears inputs
  - Why? Ready for next experience
- **`e.preventDefault()`** = Stop form default behavior
  - Without it: Page reloads, loses state
  - With it: Form submitted via JavaScript
- **`setSumbitting(true)`** = Disable form during save
  - Button shows "Submitting..."
  - User can't click multiple times
- **`await api.post('/experiences', formData)`** = Send to backend
  - Async operation (wait for response)
  - api (axios) auto-adds auth token header
  - formData = Request body as JSON
- **`try/catch`** = Error handling
  - try: Attempt to save
  - catch: Handle failure (network error, server error)
  - finally: Always runs (clear saving state)
- **`setTimeout(() => setMessage(''), 3000)`** = Auto-hide message
  - After 3 seconds, clear success message
  - Why? Message disappears so UI clean

**Interview point:**
"Form submission is async - we wait for server response before clearing form. We disable button during submit to prevent duplicates. Error caught and shown to user. Success message auto-hides after 3 seconds."

```javascript
// How experience is created and submitted

const handleSubmit = async (e) => {
  e.preventDefault();
  // Prevent page reload when form submitted

  if (!user) {
    alert('Please log in to share your experience');
    return;
    // Only logged-in users can create experiences
  }

  setSumbitting(true);
  // Show "Saving..." status, disable button
  // setSumbitting(false) later to re-enable

  try {
    // Attempt to save experience to backend
    await api.post('/experiences', formData);
    // formData = {company, role, interviewType, difficulty, outcome, mode, location, content}
    // api.post() sends POST request with auth token
    // await = Wait for response before continuing

    setShowForm(false);
    // Hide form modal after successful save

    setFormData({
      company: '',
      role: '',
      interviewType: 'DSA',
      difficulty: 'Intermediate',
      outcome: '',
      mode: '',
      location: '',
      content: '',
    });
    // Reset form - clear all fields for next experience

    setMessage('Experience shared!');
    // Show success message

    fetchExperiences();
    // Re-fetch list so new experience appears
    // Doesn't require page reload

    setTimeout(() => setMessage(''), 3000);
    // Clear success message after 3 seconds
    // Auto-hide so UI stays clean

  } catch (err) {
    // If request fails (network, server, validation error)
    console.error('Failed to share experience:', err);
    alert('Failed to share experience');
    // Show error - form stays open so user can retry
    // Form data NOT cleared - user doesn't lose typed content

  } finally {
    // Always run (success or fail)
    setSumbitting(false);
    // Hide "Saving..." status
    // Re-enable button so user can try again
  }
};
```

---

#### **2. Create Experience (Backend)**

**File:** `backend/routes/experiences.js` → `router.post('/')`

**What it does:**
Receives experience data from frontend. Creates new Experience document in MongoDB. Returns populated document with user details.

**How it works (step-by-step):**
```
Frontend sends POST /api/experiences
  {
    company: 'Amazon',
    role: 'SDE-1',
    interviewType: 'DSA',
    difficulty: 'Intermediate',
    outcome: 'Selected',
    mode: 'On Campus',
    location: 'Bangalore',
    content: '{"type":"doc","content":[...]}'
  }
  ↓
Backend receives request
  ↓
Middleware 'auth' verifies JWT
  - req.user.id = Current user's ID
  ↓
Route handler:
  1. Destructure fields from req.body
  2. Create new Experience object:
     {
       user: req.user.id,
       company, role, interviewType, difficulty,
       outcome: outcome || '',     (empty string if not set)
       mode: mode || '',
       location: location || '',
       content
     }
  3. experience.save() → Insert to MongoDB
  4. MongoDB generates _id (unique experience ID)
  5. Return: Just created experience object
  ↓
Populate user reference:
  - Experience.findById(experience._id)
  - .populate('user', fields)
  - Replaces user ID with full user object
  - Returns: experience with user {_id, name, college, ...}
  ↓
Send to frontend:
  Full experience with populated user data
```

**Packages/Methods explained:**

- **`new Experience({...})`** = Create document instance
  - Not yet saved to database
  - Only in memory
  - Must call `.save()` to persist
- **`experience.save()`** = Save to MongoDB
  - Inserts document into collection
  - Generates _id (unique identifier)
  - Returns promise (use await)
- **`.populate('user', fields)`** = Replace ID with full object
  - `user` field contains user ID: '63a2ce6d...'
  - `.populate()` does MongoDB join operation
  - Replaces with full user object: {_id, name, college, ...}
  - `'name college ...'` = Only include these fields
  - Why? Frontend needs user details to display author
- **`Experience.findById(id)`** = Query by document ID
  - _id is auto-generated primary key
  - `.findById()` is shorthand for `.find({_id: id})`
- **`outcome || ''`** = Fallback to empty string
  - If outcome not provided, use empty string
  - Outcome is optional, not required
  - Why? Not all users fill outcome field

**Interview point:**
"We create Experience with current user ID. After saving, we populate the user reference so frontend gets author details. Optional fields (outcome, mode) default to empty string if not provided."

```javascript
// Backend route - Create new experience

router.post('/', auth, async (req, res) => {
  // auth middleware: Verify JWT, set req.user.id
  // async: Allow await
  
  try {
    // Step 1: Extract fields from request body
    const { company, role, interviewType, difficulty, outcome, mode, location, content } = req.body;
    // FormData sent from frontend includes all these fields
    // content = JSON string of rich text

    // Step 2: Create new Experience document
    const experience = new Experience({
      user: req.user.id,
      // Current logged-in user (from JWT token)
      // Stores their MongoDB _id
      
      company,
      role,
      interviewType,
      difficulty,
      // These fields are provided and required
      
      outcome: outcome || '',
      // If outcome provided: use it
      // If not provided (undefined): use empty string ''
      // outcome is optional, not required
      
      mode: mode || '',
      // Same logic
      
      location: location || '',
      // Same logic
      
      content
      // JSON string of rich text content
      // Stored as-is, will be parsed later when displaying
    });
    // experience object now in memory (not saved yet)

    // Step 3: Save to MongoDB
    await experience.save();
    // .save() = Insert document into 'experiences' collection
    // await = Wait for database response
    // MongoDB auto-generates experience._id
    // experience object now has _id added

    // Step 4: Populate user reference
    const populated = await Experience.findById(experience._id)
      // Find the experience we just created
      // experience._id = Auto-generated MongoDB ID
      
      .populate('user', 'name college degree branch year graduationYear');
      // Replace user: userId with full user object
      // .populate('user', fields) = Join with User collection
      // fields = Only include these user fields in result
      // Alternative: .populate('user') would include all fields (with password if not excluded)

    // populated now = {
    //   _id: ObjectId(...),
    //   user: {
    //     _id: ObjectId(...),
    //     name: 'Alice',
    //     college: 'IIT Bombay',
    //     degree: 'B.Tech',
    //     branch: 'CSE',
    //     year: 'BE',
    //     graduationYear: 2026
    //   },
    //   company: 'Amazon',
    //   role: 'SDE-1',
    //   ... other fields ...
    // }

    // Step 5: Send response to frontend
    res.json(populated);
    // Frontend receives full experience with author details
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
```

---

#### **3. Fetch and Filter Experiences**

**File:** `backend/routes/experiences.js` → `router.get('/')`

**What it does:**
Retrieves all experiences with optional filters (company, type, difficulty). Sorts by date or upvotes.

**How it works (step-by-step):**
```
Frontend sends GET /api/experiences?company=Amazon&sort=upvotes
  ↓
Backend receives query parameters:
  - company: 'Amazon'
  - interviewType: ''
  - difficulty: ''
  - sort: 'upvotes'
  ↓
Build MongoDB filter:
  const filter = {};
  if (company) filter.company = 'Amazon';  // Add to filter
  if (interviewType) filter.interviewType = '...'; // Not provided, skip
  if (difficulty) filter.difficulty = '...'; // Not provided, skip
  ↓
Result: filter = {company: 'Amazon'}
  ↓
MongoDB query:
  Experience.find(filter)
    = Get all experiences WHERE company = 'Amazon'
  .populate('user', fields)
    = Get user details for each
  .sort({createdAt: -1})
    = Sort by date, newest first (-1 = descending)
  .lean()
    = Return plain JS objects (not Mongoose documents)
    = Faster, read-only
  ↓
Results returned as plain array
  ↓
Client-side sorting:
  if (sort === 'upvotes'):
    result.sort((a, b) => b.upvotesCount - a.upvotesCount)
    = Sort by upvote count, most upvoted first
  else if (sort === 'oldest'):
    result.sort((a, b) => a.createdAt - b.createdAt)
    = Sort by date, oldest first
  ↓
Send to frontend: Array of experiences
```

**Packages/Methods explained:**

- **`req.query`** = URL query parameters
  - URL: `/experiences?company=Amazon&sort=upvotes`
  - `req.query.company` = 'Amazon'
  - `req.query.sort` = 'upvotes'
  - Why? Extract search/filter parameters
- **`const filter = {}`** = MongoDB filter object
  - `find(filter)` returns documents matching filter
  - `find({company: 'Amazon'})` = All with company='Amazon'
  - `find({})` = All documents (no filter)
- **`Experience.find(filter)`** = Query documents
  - Returns all matching documents
  - Mongoose documents (with methods)
- **`.populate(field, fields)`** = MongoDB join
  - `populate('user', ...)` = Replace user ID reference with full user object
  - fields = Specific fields to include
  - Why? Get author details without separate queries
- **`.sort({field: order})`** = Sort results
  - `-1` = Descending (newest first)
  - `1` = Ascending (oldest first)
  - `{createdAt: -1}` = Most recent first
- **`.lean()`** = Return plain JS objects
  - Without `.lean()`: Returns Mongoose documents (with methods, more memory)
  - With `.lean()`: Returns plain objects (faster, read-only)
  - Why? Read-only data, don't need Mongoose methods
- **`.some(condition)`** = Array method
  - Returns true if ANY element matches condition
  - `arr.some(x => x > 5)` = Any element > 5?
  - Used to check if user already upvoted
- **`.sort((a, b) => ...)`** = JavaScript sort
  - Compare function: return positive/negative/0
  - `b.count - a.count` = Descending (largest first)
  - `a.count - b.count` = Ascending (smallest first)

**Interview point:**
"We build filter object conditionally - only include provided parameters. We use MongoDB .find() with filter. We populate user references to get author details. We sort by date first, then client-side sort by upvotes if needed. We use .lean() for performance since this is read-only."

```javascript
// Backend route - Get experiences with filters & sorting

router.get('/', async (req, res) => {
  try {
    // Step 1: Extract query parameters
    const { company, interviewType, difficulty, sort } = req.query;
    // URL: /experiences?company=Amazon&difficulty=Intermediate&sort=upvotes
    // req.query = { company: 'Amazon', difficulty: 'Intermediate', sort: 'upvotes' }

    // Step 2: Build MongoDB filter object
    const filter = {};
    // filter = Empty object initially
    // Conditionally add fields to filter

    if (company) filter.company = company;
    // If company provided in query, add to filter
    // filter.company = 'Amazon'

    if (interviewType) filter.interviewType = interviewType;
    // If type provided, add to filter

    if (difficulty) filter.difficulty = difficulty;
    // If difficulty provided, add to filter

    // Result: filter = {company: 'Amazon', difficulty: 'Intermediate'}
    // Or if no filters: filter = {}

    // Step 3: Default sort by date (newest first)
    let sortOption = { createdAt: -1 };
    // createdAt: -1 = Sort by date, newest first
    // -1 = Descending (reverse order)

    // Step 4: MongoDB query
    const experiences = await Experience.find(filter)
      // Find all documents matching filter
      // Example: {company: 'Amazon'} finds all Amazon experiences
      // If filter = {}, finds all experiences
      
      .populate('user', 'name college degree branch year graduationYear')
      // Replace user ID field with full user object
      // Only include specified fields (name, college, etc)
      // Why? Get author info to display
      
      .sort(sortOption)
      // Sort by createdAt descending (newest first)
      
      .lean();
      // Return plain JS objects, not Mongoose documents
      // Faster performance, read-only
      // Why? Just displaying data, don't need Mongoose methods

    // experiences = [
    //   {
    //     _id: ObjectId(...),
    //     user: {name: 'Alice', college: 'IIT Bombay', ...},
    //     company: 'Amazon',
    //     role: 'SDE-1',
    //     interviewType: 'DSA',
    //     difficulty: 'Intermediate',
    //     upvotes: [userId1, userId2],  // Array of user IDs who upvoted
    //     reads: 15,
    //     createdAt: Date
    //   },
    //   ... more experiences ...
    // ]

    // Step 5: Map results to add upvotesCount
    const result = experiences.map(exp => ({
      ...exp,
      // Spread all experience fields
      upvotesCount: exp.upvotes.length
      // Add new field: length of upvotes array
      // Why? Easy access to count for sorting
    }));
    // result = [{..., upvotesCount: 2}, {..., upvotesCount: 5}, ...]

    // Step 6: Client-side sorting (optional, based on sort parameter)
    if (sort === 'upvotes') {
      result.sort((a, b) => b.upvotesCount - a.upvotesCount);
      // Sort by upvotes, most first
      // (a, b) => comparison function
      // b.upvotesCount - a.upvotesCount = descending (largest first)
      // If b.count = 5, a.count = 2: 5 - 2 = 3 (positive) → b comes first
      // Why? Show most upvoted first
      
    } else if (sort === 'oldest') {
      result.sort((a, b) => a.createdAt - b.createdAt);
      // Sort by date, oldest first
      // a.createdAt - b.createdAt = ascending (smallest date first)
      // Older dates = smaller timestamps = come first
    }
    // If sort = 'newest': Already sorted by MongoDB (createdAt: -1)

    // Step 7: Send response
    res.json(result);
    // Frontend receives array of experiences sorted as requested
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
```

---

#### **4. Toggle Upvote on Experience**

**File:** `backend/routes/experiences.js` → `router.post('/:id/upvote')`

**What it does:**
Adds or removes user's upvote from experience. Toggles upvote state.

**How it works (step-by-step):**
```
User clicks upvote button on experience card
  ↓
Frontend sends POST /api/experiences/{id}/upvote
  ↓
Backend middleware 'auth' verifies JWT
  - req.user.id = Current user
  ↓
Route handler:
  1. Find experience by ID
  2. Get current user ID
  3. Check if user already upvoted:
     experience.upvotes.some(id => id.toString() === userId)
     = Does array contain this user?
  ↓
  If already upvoted (toggle OFF):
    experience.upvotes = experience.upvotes.filter(id => id.toString() !== userId)
    = Keep all EXCEPT current user
    = Removes upvote
    
  If not upvoted (toggle ON):
    experience.upvotes.push(userId)
    = Add current user to array
    = Adds upvote
  ↓
  4. Save updated experience
  5. Populate user reference
  6. Send back to frontend
  ↓
Frontend receives updated experience with new upvotes array
  ↓
UI updates: Show new upvote count
```

**Packages/Methods explained:**

- **`.some(condition)`** = Check if ANY element matches
  - `arr.some(x => x > 5)` = Any element > 5? True/false
  - `experience.upvotes.some(id => id.toString() === userId)`
    = Does upvotes array contain this user ID?
  - Returns true if found, false if not found
  - Why? Check if user already upvoted
- **`.toString()`** = Convert ObjectId to string
  - MongoDB IDs are ObjectId type (special objects)
  - `===` comparison needs strings
  - `.toString()` converts to string for comparison
- **`.filter(condition)`** = Keep only matching elements
  - `arr.filter(x => x > 5)` = Keep only elements > 5
  - `experience.upvotes.filter(id => id.toString() !== userId)`
    = Keep all IDs EXCEPT current user
  - Returns NEW array (doesn't modify original)
- **`.push(element)`** = Add element to array
  - `arr.push(5)` = Add 5 to end of array
  - `experience.upvotes.push(userId)` = Add current user ID
  - Modifies array in-place
- **Toggle pattern** = Check if exists, then add or remove
  - If exists: Remove it (toggle OFF)
  - If not exists: Add it (toggle ON)
  - Like turning light on/off

**Interview point:**
"We check if user already upvoted using .some(). If yes, we .filter() to remove them. If no, we .push() to add them. This toggle behavior is like a like button - click once to like, click again to unlike."

```javascript
// Backend route - Toggle upvote on experience

router.post('/:id/upvote', auth, async (req, res) => {
  // auth middleware: Verify JWT, set req.user.id
  // :id = URL parameter (experience ID)
  
  try {
    // Step 1: Find experience by ID
    const experience = await Experience.findById(req.params.id);
    // req.params.id = Experience ID from URL
    // Example: /experiences/63a2ce6d/upvote → req.params.id = '63a2ce6d'
    
    if (!experience) {
      return res.status(404).json({ msg: 'Experience not found' });
    }
    // If experience doesn't exist, return error

    // Step 2: Get current user ID
    const userId = req.user.id;
    // req.user.id = Extracted from JWT token by auth middleware
    // Example: '62b1ce3c...'

    // Step 3: Check if user already upvoted
    const alreadyUpvoted = experience.upvotes.some(
      id => id.toString() === userId
    );
    // .some() = Check if ANY element matches condition
    // id.toString() = Convert MongoDB ObjectId to string
    // === userId = Compare as strings
    // Returns true if user in upvotes array, false if not
    //
    // Example upvotes array: [ObjectId('user1'), ObjectId('user2'), ...]
    // If userId = 'user1': some() returns true (already upvoted)
    // If userId = 'user3': some() returns false (not upvoted yet)

    // Step 4A: If already upvoted - REMOVE upvote (toggle OFF)
    if (alreadyUpvoted) {
      experience.upvotes = experience.upvotes.filter(
        id => id.toString() !== userId
      );
      // .filter() = Keep only elements matching condition
      // id.toString() !== userId = Keep if NOT current user
      // Removes current user from array
      //
      // Example: [user1, user2, user3] - remove user2
      // Result: [user1, user3]
    }

    // Step 4B: If not upvoted - ADD upvote (toggle ON)
    else {
      experience.upvotes.push(userId);
      // .push() = Add element to end of array
      // Adds current user ID to upvotes array
      //
      // Example: [user1, user2]
      // After push(user3): [user1, user2, user3]
    }

    // Step 5: Save updated experience
    await experience.save();
    // experience.upvotes now has updated array (with or without user)
    // Save persists to MongoDB

    // Step 6: Populate user reference and return
    const populated = await Experience.findById(experience._id)
      .populate('user', 'name college degree branch year graduationYear');
    // Fetch fresh experience with populated user details
    // Why? Ensure we return fresh data with all details

    // Step 7: Send response
    res.json(populated);
    // Frontend receives updated experience with new upvotes array
    // UI can update upvote count
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Example upvote flow:
// Initial: experience.upvotes = [userId1, userId2]
// User (userId1) upvotes:
//   - alreadyUpvoted = true (user1 in array)
//   - Filter out user1: [userId2]
//   - Save and return
// Result: upvotes = [userId2] (user1 removed)
//
// Different user (userId3) upvotes:
//   - alreadyUpvoted = false (user3 not in array)
//   - Push user3: [userId1, userId2, userId3]
//   - Save and return
// Result: upvotes = [userId1, userId2, userId3] (user3 added)
```

---

#### **5. Rich Text Editor (Tiptap)**

**File:** `frontend/components/RichTextEditor.jsx`

**What it does:**
Provides rich text editing interface for writing experience. Allows bold, italics, headings, lists, code blocks, links. Stores content as JSON.

**How it works (step-by-step):**
```
RichTextEditor component renders
  ↓
useEditor hook initializes Tiptap editor:
  - Extensions: StarterKit (basic formatting), Link, CodeBlockLowlight
  - Content: Existing content (if editing) or null
  - onUpdate: When content changes, store as JSON
  ↓
Editor shows toolbar with buttons:
  - B (Bold)
  - H1, H2 (Headings)
  - • (Bullet list)
  - 1. (Ordered list)
  - 🔗 (Link)
  - <> (Code block)
  ↓
User clicks Bold button:
  - editor.chain().focus().toggleBold().run()
  - Chains editor methods
  ↓
User types text:
  - "My experience at Amazon..."
  ↓
User selects text and clicks Bold:
  - Selected text becomes bold
  ↓
onUpdate fires:
  - editor.getJSON() = Get current content as JSON
  - JSON.stringify() = Convert to string
  - onChange callback sends to parent
  ↓
JSON format: {
  type: "doc",
  content: [
    {type: "paragraph", content: [{type: "text", text: "Interview went well"}]},
    {type: "heading", attrs: {level: 1}, content: [{type: "text", text: "Questions"}]},
    {type: "codeBlock", language: "javascript", content: [{type: "text", text: "code..."}]},
    {type: "bulletList", content: [{type: "listItem", content: [{type: "paragraph", ...}]}]}
  ]
}
  ↓
When viewing experience:
  - Retrieve JSON string from database
  - Parse JSON
  - generateHTML() converts JSON to HTML
  - Display HTML on page
```

**Packages/Methods explained:**

- **`useEditor(options)`** = Tiptap hook to initialize editor
  - Creates editor instance
  - Returns editor object with methods
  - Why? Manages editor state and operations
- **`extensions: [...]`** = Editor features
  - `StarterKit` = Basic formatting (bold, italic, paragraph, list)
  - `Link` = Link support (allow URLs)
  - `CodeBlockLowlight` = Code blocks with syntax highlighting
  - Why? Define what user can do in editor
- **`content: ...`** = Initial content
  - If editing: Pass existing JSON content
  - If new: Pass null (blank editor)
- **`onUpdate: ({editor}) => {...}`** = Callback when content changes
  - Fires every keystroke
  - `editor.getJSON()` gets content as JSON object
  - Send to parent via onChange callback
- **`editor.chain().focus().toggleBold().run()`** = Chain operations
  - `.chain()` = Start chain of commands
  - `.focus()` = Focus editor
  - `.toggleBold()` = Toggle bold on selection
  - `.run()` = Execute all commands
- **`editor.isActive('bold')`** = Check if selection is bold
  - Returns true if selected text is bold
  - Used to highlight button if active
- **`JSON.stringify(json)`** = Convert object to string
  - Converts `{...}` to `"{...}"`
  - Needed to store in database (database stores strings)
- **`generateHTML(json, extensions)`** = Convert JSON to HTML
  - Input: JSON object (from database)
  - Output: HTML string (`<p>...</p>`)
  - Why? Display rich content on page

**Interview point:**
"Tiptap stores content as JSON, not HTML. JSON is more portable and can be rendered differently. We store JSON string in database. When displaying, we convert JSON to HTML using generateHTML(). User interacts with visual editor, but behind the scenes it's JSON."

```javascript
// RichTextEditor component - Tiptap integration

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const RichTextEditor = ({ content, onChange, editable = true }) => {
  // content = Initial content (if editing)
  // onChange = Callback when content changes
  // editable = true if user can edit, false if read-only

  // Step 1: Initialize editor
  const editor = useEditor({
    extensions: [
      // Define editor capabilities
      
      StarterKit.configure({
        codeBlock: false,  // We use CodeBlockLowlight instead
        link: false,       // We use Link extension instead
      }),
      // StarterKit includes: bold, italic, paragraph, list, etc
      
      Link.configure({
        openOnClick: true,  // Click link to open in browser
        HTMLAttributes: {
          class: 'text-indigo-600 underline'  // Styling for links
        },
      }),
      // Link extension for hyperlinks in editor
      
      CodeBlockLowlight.configure({
        lowlight  // Syntax highlighting
      }),
      // Code blocks with language highlighting
    ],
    
    content: content
      ? (typeof content === 'string' ? JSON.parse(content) : content)
      : null,
    // If content provided:
    //   - If string: Parse JSON string to object
    //   - If object: Use as-is
    // If no content: null (blank editor)
    
    editable,
    // editable = true: User can type and format
    // editable = false: Read-only (toolbar hidden)
    
    onUpdate: ({ editor }) => {
      // Called every keystroke (when content changes)
      
      const json = editor.getJSON();
      // Get current content as JSON object
      // Example: {type: 'doc', content: [...]}
      
      onChange?.(JSON.stringify(json));
      // Convert JSON to string
      // Send to parent component via onChange callback
      // onChange?.() = Optional chaining (call if defined)
    },
  });

  // Step 2: Handle link insertion
  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href || '';
    // Get existing link URL if any
    
    const url = window.prompt('URL', previousUrl);
    // Show prompt asking for URL
    
    if (url) {
      editor?.chain()
        .focus()
        .extendMarkRange('link')  // Select entire link
        .setLink({ href: url })   // Set URL
        .run();
      // Insert or update link
    }
  }, [editor]);

  if (!editor) return null;  // Don't render if editor not ready

  // Step 3: Render editor UI
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {editable && (
        // Toolbar - only show if editable
        <div className="flex gap-1 bg-gray-900 p-2">
          {/* Bold button */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            // Chain: focus editor → toggle bold → run
            
            className={editor.isActive('bold') ? 'bg-gray-700' : ''}
            // Highlight if selection is bold
          >
            B
          </button>

          {/* Heading buttons */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </button>
          {/* More buttons... */}

          {/* Link button */}
          <button type="button" onClick={addLink}>
            🔗
          </button>

          {/* Code block button */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            {'<>'}
          </button>
        </div>
      )}

      {/* Editor content area */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[200px]"
        // prose = Tailwind class for formatted text
        // min-h-[200px] = Minimum height
      />
    </div>
  );
};

export default RichTextEditor;

// Usage in form:
// <RichTextEditor
//   content={formData.content}
//   onChange={(json) => setFormData({...formData, content: json})}
//   editable={true}
// />
```

---

### Key Methods

| Method | What it does | Example |
|--------|-------------|---------|
| `api.post(url, data)` | Send POST request with auth token | `api.post('/experiences', formData)` |
| `api.get(url)` | Send GET request | `api.get('/experiences?company=Amazon')` |
| `Experience.find(filter)` | Query experiences | `Experience.find({company: 'Amazon'})` |
| `.populate(field, fields)` | MongoDB join operation | `.populate('user', 'name college')` |
| `.sort({field: order})` | Sort results (-1 descending, 1 ascending) | `.sort({createdAt: -1})` |
| `.lean()` | Return plain objects (faster) | `.lean()` |
| `.save()` | Save document to database | `experience.save()` |
| `.some(condition)` | Check if ANY element matches | `arr.some(x => x > 5)` |
| `.filter(condition)` | Keep matching elements | `arr.filter(x => x > 5)` |
| `.push(element)` | Add element to array | `arr.push(newItem)` |
| `.map(fn)` | Transform each element | `arr.map(x => x * 2)` |
| `useEditor(options)` | Initialize Tiptap editor | `useEditor({extensions: [...]})` |
| `editor.chain().method().run()` | Chain editor operations | `.chain().focus().toggleBold().run()` |
| `editor.getJSON()` | Get content as JSON | `const json = editor.getJSON()` |
| `generateHTML(json, ext)` | Convert JSON to HTML | `generateHTML(json, [StarterKit])` |
| `JSON.stringify()` | Convert object to string | `JSON.stringify({...})` |
| `JSON.parse()` | Convert string to object | `JSON.parse('{...}')` |

---

### Interview Q&A

**Q: Why store content as JSON instead of HTML?**
A: JSON is portable - can render as HTML, markdown, or other formats. HTML is fixed format. Also easier to transform/edit JSON (add tags, extract text, etc).

**Q: What does .lean() do? When to use it?**
A: Returns plain JS objects instead of Mongoose documents. Faster because no Mongoose overhead. Use for read-only operations. Don't use if you need to call .save() on returned objects.

**Q: How does upvote toggle work? Why both .some() and .filter()?**
A: .some() checks if user already upvoted. If yes, .filter() removes them. If no, .push() adds them. This toggle behavior is like a like button.

**Q: Can one user upvote multiple times?**
A: No! .some() prevents it. It checks if user ID already in upvotes array. If yes, toggle removes it. If no, toggle adds it. One user = one upvote maximum.

**Q: Why .populate() instead of fetching user separately?**
A: .populate() does MongoDB join automatically. Returns one document with embedded user data. Separate fetches would need two queries and manual joining. One query is faster.

**Q: What's the difference between -1 and 1 in .sort()?**
A: -1 = Descending (reverse order). 1 = Ascending (normal order). {createdAt: -1} = Newest first. {createdAt: 1} = Oldest first.

**Q: How is content stored in database - JSON or string?**
A: String! JSON object stored as JSON string in database. When retrieved, parse string back to JSON object. Why? Databases store text/numbers/dates, not objects.

**Q: Why `id.toString()`  in .some() comparison?**
A: MongoDB IDs are ObjectId type (special objects). === comparison needs strings. .toString() converts ObjectId to string for comparison to work correctly.

**Q: Can user edit their experience after posting?**
A: Current code doesn't support editing. Only POST (create) implemented. To add editing: Need PUT endpoint, check if user is author, update document, return updated version.

**Q: What if user deletes their account? What happens to their experiences?**
A: Current code doesn't handle this. Experiences would have user ID pointing to deleted account. Should add: When user deleted, either delete their experiences or set user to null.

**Q: How many experiences can one user create?**
A: Unlimited! No limit implemented. Could add: max 10 per day, max 100 total, etc. Would require counting in backend before creating.

**Q: What if MongoDB connection fails during POST?**
A: Caught by try/catch. Error response sent to frontend. Frontend shows "Failed to share experience". Form stays open. User can retry when connection works.

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Create Experience** | Form data sent to POST /api/experiences with auth token |
| **Rich Text Editor** | Tiptap stores content as JSON, displays as HTML |
| **List Experiences** | GET /api/experiences with optional filters & sorting |
| **Filter** | Build MongoDB filter object with provided parameters |
| **Populate** | MongoDB join to get author details with experience |
| **Lean** | Return plain objects for faster read-only queries |
| **Sort** | -1 = newest first, 1 = oldest first |
| **Upvote Toggle** | .some() check, .filter() remove, .push() add |
| **JSON Storage** | Content stored as JSON string in database |
| **Experience Detail** | Fetch single experience, increment reads, render content as HTML |
| **Read Tracking** | Increment reads counter every time experience viewed |
| **User Reference** | .populate('user', fields) to get author info |
