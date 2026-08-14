# Profile Management

---

### Feature Overview

**What is it?**
User profile page where students add/update their academic details: college, degree, branch, year of study, and graduation year.

**Why?**
- Personalizes interview experience
- Helps match with relevant questions
- Shows professional profile to partner
- One-time setup during registration

**How it works:**
User navigates to Profile page → Sees current info → Clicks "Edit profile" → Form appears → Updates fields → Saves to database → Profile updated for future sessions

---

### Working Flow

```
USER OPENS PROFILE PAGE:

1. Frontend navigates to /profile
   
2. Profile.jsx component mounts

3. Effect hook runs:
   - Gets user from AuthContext
   - User object contains: name, email, college, degree, branch, year, graduationYear
   - Renders Profile page with current values
   
4. Profile page displays:
   - Header: "Your professional profile"
   - Overview section showing all fields
   - Each field shown as card: College: IIT Bombay
   - "Edit profile" button at top right

5. User clicks "Edit profile" button
   
6. setShowEdit(true) is called
   - ProfileForm component appears below
   
7. ProfileForm shows:
   - College dropdown (IIT Bombay, NIT Trichy, etc)
   - Degree input: "Bachelor of Technology"
   - Branch input: "Computer Science"
   - Year dropdown: "TE", "BE", "Other"
   - Graduation year input: number field (2026)
   - "Save profile" button

8. User changes fields:
   - Example: Branch from "Not set" to "Information Technology"
   - onChange fires for each keystroke
   - Form state updates: setForm({...form, [name]: value})
   
9. User clicks "Save profile" button

10. handleSubmit runs:
    - Prevents default form submission
    - setSaving(true) - shows "Saving..." status
    
11. Frontend sends HTTP PUT request:
    PUT /api/auth/profile
    Headers:
      - x-auth-token: "jwt_token_123..."
      - Content-Type: application/json
    Body:
    {
      college: "IIT Bombay",
      degree: "B.Tech",
      branch: "Information Technology",
      year: "TE",
      graduationYear: 2026
    }

12. Backend receives PUT /api/auth/profile

13. Middleware 'auth' verifies JWT token
    - Extracts req.user.id from token
    
14. Route handler processes:
    - Extract fields from req.body
    - Create updateFields object (only non-undefined values)
    - Call User.findByIdAndUpdate(userId, {$set: updateFields}, {new: true})
    - Returns updated user object
    
15. MongoDB updates:
    - Find user document by ID
    - Set new values for college, degree, branch, year, graduationYear
    - Save to database
    - Return updated document (without password)

16. Backend sends response:
    {
      _id: "63a2ce6d...",
      name: "Alice",
      email: "alice@example.com",
      college: "IIT Bombay",
      degree: "B.Tech",
      branch: "Information Technology",
      year: "TE",
      graduationYear: 2026,
      preferences: {...}
    }

17. Frontend receives response

18. setMessage('Profile updated successfully')
    - Shows success message for 3 seconds
    
19. setSaving(false)
    - "Saving..." status removed
    - Button re-enabled

20. AuthContext updates globally:
    - user object in context now has new profile data
    - All pages that display user info update automatically

21. Profile page refreshes to show new data

22. User clicks "Cancel edit" or navigates away
    - ProfileForm hidden
    - Back to read-only profile view
```

---

### Files Used

| File | Purpose |
|------|---------|
| `frontend/pages/Profile.jsx` | Display profile page with profile overview cards |
| `frontend/components/ProfileForm.jsx` | Form for editing profile (college, degree, branch, year, graduation) |
| `backend/routes/auth.js` | PUT /api/auth/profile endpoint to update user profile |
| `backend/models/User.js` | User schema with profile fields (college, degree, branch, year, graduationYear) |
| `frontend/context/AuthContext.jsx` | Stores user data globally, triggers update on save |
| `frontend/services/api.js` | Axios instance for PUT request with auth token |

---

### Important Code

#### **1. Profile Display Component**

**File:** `frontend/pages/Profile.jsx`

**What it does:**
Shows user's current profile information in card format. Renders Edit button.

**How it works (step-by-step):**
```
Profile page loads
  ↓
useAuth() hook called
  ↓
Get user object from AuthContext
  ↓
Create profileItems array with user data:
  [
    {label: 'College', value: user.college || 'Not set'},
    {label: 'Degree', value: user.degree || 'Not set'},
    ...
  ]
  ↓
Map over profileItems array
  ↓
For each item, create a card:
  <div className="...">
    <p>{item.label}</p>
    <p>{item.value}</p>
  </div>
  ↓
Render all cards in grid layout
  ↓
Show "Edit profile" button
  ↓
When button clicked:
  setShowEdit(!showEdit)
  If true: ProfileForm appears
  If false: ProfileForm hidden
```

**Packages/Methods explained:**

- **`useAuth()`** = Custom React hook from AuthContext
  - Returns `{ user, loading, login, logout, ... }`
  - `user` = Current logged-in user object with all fields
  - Why? Provides user data without prop drilling
- **`useState(false)`** = React hook for state
  - `showEdit` = Boolean (true or false)
  - `setShowEdit` = Function to change state
  - When state changes, component re-renders
  - Why? Toggling edit mode on/off
- **`user?.college || 'Not set'`** = Optional chaining + OR operator
  - `user?.college` = Get college if user exists (safe)
  - `|| 'Not set'` = If college undefined/null, use 'Not set'
  - Why? Show "Not set" instead of blank if no college
- **`.map((item) => (...))`** = Array method to loop and create JSX
  - For each item in profileItems, create a `<div>`
  - `key={item.label}` = Unique identifier for React (required in loops)
  - Why? Efficient rendering of list items
- **`className` with Tailwind** = Styling classes (not JavaScript)
  - `"rounded-[22px]"` = Rounded corners 22px
  - `"bg-slate-50"` = Light gray background
  - `"grid gap-4 md:grid-cols-2"` = 2 columns on medium screens
  - Why? Responsive design without CSS files

**Interview point:**
"We use optional chaining `?.` to safely access user properties. If user not loaded yet, it doesn't crash. We show 'Not set' for empty fields to inform users which fields need updating."

```javascript
// This is how Profile.jsx displays the user profile

import { useAuth } from '../context/AuthContext';

const Profile = () => {
  // Get user data from context
  const { user } = useAuth();
  // user = { _id: '63a...', name: 'Alice', college: 'IIT Bombay', ... }
  
  // Track if edit mode is on/off
  const [showEdit, setShowEdit] = useState(false);
  // showEdit = false initially (form hidden)
  // When user clicks "Edit profile", setShowEdit(true)
  
  // Create array of fields to display
  const profileItems = [
    {
      label: 'College',
      value: user?.college || 'Not set',
      // user?.college = Get college if user exists
      // || 'Not set' = If college empty, show "Not set"
      accent: 'from-indigo-500 to-violet-500'  // Gradient color
    },
    {
      label: 'Degree',
      value: user?.degree || 'Not set',
      accent: 'from-emerald-500 to-teal-500'
    },
    {
      label: 'Branch',
      value: user?.branch || 'Not set',
      accent: 'from-amber-500 to-orange-500'
    },
    {
      label: 'Year',
      value: user?.year || 'Not set',
      accent: 'from-sky-500 to-cyan-500'
    },
    {
      label: 'Graduation',
      value: user?.graduationYear || 'Not set',
      accent: 'from-rose-500 to-pink-500'
    }
  ];

  return (
    <div>
      {/* Edit button */}
      <button onClick={() => setShowEdit((prev) => !prev)}>
        {showEdit ? 'Cancel edit' : 'Edit profile'}
        {/* If showEdit = true, show "Cancel edit" */}
        {/* If showEdit = false, show "Edit profile" */}
      </button>

      {/* Display profile cards in grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {profileItems.map((item) => (
          // .map() = Loop through each item, create JSX for each
          <div key={item.label} className="...">
            {/* Gradient accent bar */}
            <div className={`bg-gradient-to-r ${item.accent}`} />
            
            {/* Label and value */}
            <p>{item.label}</p>
            <p>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Show form only if edit mode on */}
      {showEdit && (
        <div>
          <ProfileForm />
        </div>
      )}
    </div>
  );
};
```

---

#### **2. Profile Form Component**

**File:** `frontend/components/ProfileForm.jsx`

**What it does:**
Renders form with input fields for college, degree, branch, year, graduation year. Handles form changes and submission.

**How it works (step-by-step):**
```
ProfileForm component renders
  ↓
useState creates form state:
  {
    college: 'IIT Bombay' (from user),
    degree: 'B.Tech',
    branch: 'CSE',
    year: 'TE',
    graduationYear: 2026
  }
  ↓
User types in "Degree" field: "B.Tech" → "B.Sc"
  ↓
onChange event fires
  ↓
handleChange(event):
  - Get field name and value from event.target
  - setForm({...form, [name]: value})
  - Spread operator {...form} = Copy all existing fields
  - [name]: value = Update only changed field
  - State updates, component re-renders with new value
  ↓
User clicks "Save profile" button
  ↓
handleSubmit(e):
  - e.preventDefault() = Stop page reload
  - setSaving(true) = Show "Saving..." status
  - Call api.put('/auth/profile', {...form})
  - Wait for response (await)
  ↓
API sends PUT request with JWT token
  ↓
Backend updates database
  ↓
Response comes back
  ↓
setMessage('Profile updated successfully')
  - Show success message in green
  - Auto-hide after 3 seconds
  ↓
setSaving(false)
  - Hide "Saving..." status
  - Button becomes enabled again
```

**Packages/Methods explained:**

- **`useState(initialValue)`** = React state hook
  - `const [form, setForm] = useState({...})`
  - `form` = Current state (read-only)
  - `setForm` = Function to update state (causes re-render)
  - Why? Track form changes as user types
- **`handleChange(event)`** = Event handler for input fields
  - `event.target.name` = Input field name (college, degree, etc)
  - `event.target.value` = What user typed
  - `{...form, [name]: value}` = Update that field only, keep others
  - Why? Dynamically handle all inputs with one handler
- **`[name]: value` (computed property)** = Dynamic object key
  - Instead of `{college: value}`, use `{[name]: value}`
  - If name = 'degree', creates `{degree: value}`
  - If name = 'branch', creates `{branch: value}`
  - Why? One handler works for multiple fields
- **`e.preventDefault()`** = Stop default form behavior
  - Without it: Page reloads on submit (loses state)
  - With it: Form submits via JavaScript, page doesn't reload
- **`await api.put(url, data)`** = Make async HTTP PUT request
  - `await` = Wait for response before continuing
  - `api.put()` = Axios method (auto-adds auth token)
  - Returns response or throws error
  - Why? Form doesn't proceed until server responds
- **`try/catch`** = Error handling
  - `try` block: Code that might fail
  - If error occurs, jump to `catch` block
  - Example: Network error, server error, validation error
- **`setTimeout(callback, ms)`** = Run code after delay
  - `setTimeout(() => setMessage(''), 3000)` = Clear message after 3 seconds
  - Why? Auto-hide success message so user can see it briefly
- **`Number(form.graduationYear)`** = Convert string to number
  - Input field returns string "2026"
  - Must be sent as number 2026 to database
  - Why? Number type for year, not string
- **`disabled={saving}`** = Disable button while saving
  - When `saving = true`, button disabled
  - User can't click multiple times
  - Why? Prevent duplicate submissions

**Interview point:**
"Form state tracks all inputs. When user types, onChange fires and updates state. On submit, we send all form data to backend via PUT request with auth token. Backend validates, updates database, returns updated user object. We show success message and refresh UI."

```javascript
// ProfileForm.jsx - How the edit form works

import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfileForm = () => {
  const { user } = useAuth();
  // Get current user profile to pre-fill form
  
  // Form state - tracks all changes
  const [form, setForm] = useState({
    college: user?.college || '',
    // Pre-fill with current value, or empty string
    degree: user?.degree || '',
    branch: user?.branch || '',
    year: user?.year || '',
    graduationYear: user?.graduationYear || ''
  });

  // Track if currently saving
  const [saving, setSaving] = useState(false);
  // saving = false initially
  // When user clicks Save: saving = true (show "Saving...")
  // When response arrives: saving = false

  // Track status message
  const [message, setMessage] = useState('');
  // message = '' initially (empty)
  // On success: message = 'Profile updated successfully'
  // After 3 seconds: message = '' (cleared)

  // Handle input field changes
  const handleChange = (e) => {
    // e.target = The input field user typed in
    // e.target.name = Field name ('college', 'degree', etc)
    // e.target.value = What user typed
    
    setForm({
      ...form,                  // Spread: Copy all existing fields
      [e.target.name]: e.target.value
      // [name]: value = Update only this field
      // Example: If user types in 'degree' field
      // setForm({...form, degree: 'B.Sc'})
    });
    
    // After this, component re-renders with new form state
    // Input field now shows updated value
  };

  // Handle college dropdown special case
  const handleCollegeSelect = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      // If user selects "Other", clear field so they can type
      setForm({ ...form, college: '' });
    } else {
      // Otherwise, set to selected college name
      setForm({ ...form, college: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    // async = Function contains await (asynchronous operation)
    
    e.preventDefault();
    // Prevent page reload on form submit
    
    setSaving(true);
    // Show "Saving..." status, disable button
    
    try {
      // Attempt to save to backend
      
      const response = await api.put('/auth/profile', {
        // await = Wait for response before continuing
        // api.put() = Axios POST request
        // '/auth/profile' = Backend endpoint
        // {...form, graduationYear: ...}  = Request body
        
        ...form,
        // Spread all form fields (college, degree, branch, year)
        
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)  // Convert "2026" → 2026
          : null                          // If empty, send null
      });

      // If request succeeds, response contains updated user
      setMessage('Profile updated successfully');
      // Show success message
      
      setTimeout(() => setMessage(''), 3000);
      // Clear message after 3 seconds (auto-hide)
      
    } catch (err) {
      // If request fails (network error, server error, etc)
      
      console.error('Error:', err);
      setMessage('Failed to update profile');
      // Show error message
      
    } finally {
      // Always run (whether success or fail)
      
      setSaving(false);
      // Hide "Saving..." status, enable button
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* College field - dropdown with popular colleges */}
      <select
        value={form.college}
        onChange={handleCollegeSelect}
        className="..."
      >
        <option value="">Select College</option>
        <option value="IIT Bombay">IIT Bombay</option>
        <option value="NIT Trichy">NIT Trichy</option>
        {/* ... more colleges ... */}
        <option value="Other">Other</option>
      </select>

      {/* Degree field - text input */}
      <input
        name="degree"
        value={form.degree}
        onChange={handleChange}
        // onChange = Called on every keystroke
        // handleChange updates form.degree
        placeholder="Bachelor of Technology"
        className="..."
      />

      {/* Branch field - text input */}
      <input
        name="branch"
        value={form.branch}
        onChange={handleChange}
        placeholder="Computer Science"
        className="..."
      />

      {/* Year field - dropdown */}
      <select name="year" value={form.year} onChange={handleChange}>
        <option value="">Select Year</option>
        <option value="TE">TE</option>
        <option value="BE">BE</option>
        <option value="Other">Other</option>
      </select>

      {/* Graduation year field - number input */}
      <input
        name="graduationYear"
        type="number"
        value={form.graduationYear}
        onChange={handleChange}
        placeholder="2026"
        className="..."
      />

      {/* Submit button */}
      <button
        type="submit"
        disabled={saving}
        // disabled = true: button is grayed out, can't click
        // disabled = false: button is active, can click
      >
        {saving ? 'Saving...' : 'Save profile'}
        {/* If saving = true, show "Saving..." */}
        {/* If saving = false, show "Save profile" */}
      </button>

      {/* Status message */}
      {message && <p>{message}</p>}
      {/* Show message only if message is not empty */}
    </form>
  );
};

export default ProfileForm;
```

---

#### **3. Backend Update Profile Route**

**File:** `backend/routes/auth.js` → `router.put('/profile', auth, ...)`

**What it does:**
Receives PUT request with updated profile fields. Validates fields. Updates MongoDB user document. Returns updated user.

**How it works (step-by-step):**
```
Frontend sends PUT /api/auth/profile
  {
    college: 'IIT Bombay',
    degree: 'B.Tech',
    branch: 'CSE',
    year: 'TE',
    graduationYear: 2026
  }
  ↓
Backend receives request
  ↓
Middleware 'auth' runs:
  - Verify JWT token from header
  - Extract user ID from token
  - req.user.id = User's MongoDB ID
  ↓
Route handler processes:
  - Destructure fields from req.body
  - Create updateFields object
  - Check each field:
    If field !== undefined: Add to updateFields
    (This prevents sending empty/null fields unnecessarily)
  ↓
Example:
  const { college, degree, branch, year, graduationYear } = req.body;
  const updateFields = {};
  if (college !== undefined) updateFields.college = college;
  if (degree !== undefined) updateFields.degree = degree;
  // etc...
  
  Result: updateFields = {
    college: 'IIT Bombay',
    degree: 'B.Tech',
    branch: 'CSE',
    year: 'TE',
    graduationYear: 2026
  }
  ↓
MongoDB operation:
  User.findByIdAndUpdate(
    req.user.id,           // Find user with this ID
    { $set: updateFields }, // Update these fields
    { new: true }          // Return updated document
  )
  ↓
MongoDB finds user by ID in database
  ↓
Sets specified fields to new values
  ↓
Saves to database
  ↓
Returns updated user object (including all fields)
  ↓
`.select('-password')` removes password from response
  ↓
Backend sends response to frontend:
  {
    _id: '63a2ce6d...',
    name: 'Alice',
    email: 'alice@example.com',
    college: 'IIT Bombay',
    degree: 'B.Tech',
    branch: 'CSE',
    year: 'TE',
    graduationYear: 2026,
    preferences: {...}
  }
  ↓
Frontend receives response
  ↓
Show success message
  ↓
Update AuthContext with new user object
```

**Packages/Methods explained:**

- **`router.put(path, middleware, handler)`** = Express route
  - `put` = HTTP PUT method (update existing resource)
  - `'/profile'` = Route path (full: /api/auth/profile)
  - `auth` = Middleware (verify JWT before handler)
  - `handler` = Function that processes request
  - Why? Handles profile updates
- **`req.body`** = Data sent by frontend
  - Parsed from JSON in request
  - Example: `{ college: 'IIT Bombay', degree: 'B.Tech' }`
  - Why? Frontend sends form data here
- **`const { college, degree, ... } = req.body`** = Destructuring
  - Extract specific fields from req.body
  - If field not in body, it's undefined
  - Why? Cleaner code than `req.body.college`, `req.body.degree`
- **`if (field !== undefined)`** = Conditional check
  - `!== undefined` = Field was provided
  - `=== undefined` = Field was NOT provided
  - Why? Only include provided fields in update
- **`User.findByIdAndUpdate(id, update, options)`** = Mongoose method
  - Finds user by ID and updates fields in one operation
  - Alternative: `User.findById()` then `save()` (2 operations)
  - `{ $set: updateFields }` = MongoDB update operator $set (update fields)
  - `{ new: true }` = Return updated document (not original)
  - Returns promise (use await)
- **`.select('-password')`** = Exclude field from response
  - `-password` = Don't include password field
  - Why? Never send passwords to frontend
- **`res.json(user)`** = Send JSON response
  - Converts user object to JSON
  - Sends to frontend

**Interview point:**
"We check each field !== undefined to only update provided fields. This allows partial updates - user can update just college or just branch. We use findByIdAndUpdate with {new: true} to get updated document. We exclude password field from response for security."

```javascript
// Backend route handler for PUT /api/auth/profile

router.put('/profile', auth, async (req, res) => {
  // auth middleware: Verify JWT, set req.user.id
  // async: Allow await inside function
  
  try {
    // Step 1: Extract fields from request body
    const { college, degree, branch, year, graduationYear } = req.body;
    // If frontend doesn't send a field, it's undefined
    // Example: { college: 'IIT Bombay', degree: 'B.Tech', ... }
    
    // Step 2: Build updateFields object
    // Only include fields that were provided (not undefined)
    const updateFields = {};
    
    if (college !== undefined) updateFields.college = college;
    // If college was sent: updateFields.college = 'IIT Bombay'
    
    if (degree !== undefined) updateFields.degree = degree;
    // If degree was sent: updateFields.degree = 'B.Tech'
    
    if (branch !== undefined) updateFields.branch = branch;
    if (year !== undefined) updateFields.year = year;
    if (graduationYear !== undefined) updateFields.graduationYear = graduationYear;

    // Example result:
    // updateFields = {
    //   college: 'IIT Bombay',
    //   degree: 'B.Tech',
    //   branch: 'CSE',
    //   year: 'TE',
    //   graduationYear: 2026
    // }

    // Step 3: Update user in MongoDB
    const user = await User.findByIdAndUpdate(
      req.user.id,            // Find user with this ID
      // req.user.id = Extracted from JWT token by auth middleware
      // Example: '63a2ce6d...'
      
      { $set: updateFields }, // Update operation
      // $set = MongoDB update operator (set fields to new values)
      // updateFields = Object with new values
      // MongoDB: user.college = 'IIT Bombay', user.degree = 'B.Tech', etc
      
      { new: true }           // Return updated document
      // { new: true } = After updating, return new document
      // Without it, returns original document (before update)
      // We want the updated one so we can send to frontend
    ).select('-password');
    // .select('-password') = Don't include password in response
    // Why? Never send password to frontend

    // user now = {
    //   _id: '63a2ce6d...',
    //   name: 'Alice',
    //   email: 'alice@example.com',
    //   college: 'IIT Bombay',
    //   degree: 'B.Tech',
    //   branch: 'CSE',
    //   year: 'TE',
    //   graduationYear: 2026,
    //   preferences: {...}
    // }
    // (password field excluded)

    // Step 4: Send updated user to frontend
    res.json(user);
    // Frontend receives updated user object
    // Can update UI to show new profile
    
  } catch (err) {
    // If any error occurs (DB error, validation error, etc)
    console.error(err.message);
    res.status(500).send('Server error');
    // Send error response to frontend
  }
});
```

---

#### **4. User Model with Profile Fields**

**File:** `backend/models/User.js`

**What it does:**
Defines User schema with profile fields (college, degree, branch, year, graduationYear).

**How it works (step-by-step):**
```
User schema defines:
  ↓
name: String (required)
  Example: 'Alice'
  ↓
email: String (required, unique)
  Example: 'alice@example.com'
  ↓
password: String (required)
  Example: 'hashed_password_123...'
  ↓
college: String (default: '')
  Example: 'IIT Bombay'
  Allows empty string if not set
  ↓
degree: String (default: '')
  Example: 'Bachelor of Technology'
  ↓
branch: String (default: '')
  Example: 'Computer Science'
  ↓
year: String with enum (default: '')
  Enum: ['TE', 'BE', 'Other', '']
  Only these values allowed
  Example: 'TE'
  ↓
graduationYear: Number (default: null)
  Example: 2026
  Null if not set (not 0)
  ↓
preferences: Object (default: {})
  Nested schema with interview preferences
  ↓
When user signs up:
  Only name, email, password required
  Profile fields empty by default
  ↓
User can update profile later:
  PUT /api/auth/profile
  Fills in college, degree, branch, year, graduationYear
  ↓
Next time user logs in:
  User object includes all profile fields
  Profile page can display or edit them
```

**Packages/Methods explained:**

- **`new mongoose.Schema({...})`** = Create schema definition
  - Schema = Blueprint for documents in collection
  - Defines fields and their types
  - Like table schema in SQL databases
- **`type: String`** = Field type is string
  - Can store: 'IIT Bombay', 'B.Tech', etc.
  - Cannot store: numbers, arrays, objects (without special types)
- **`required: true`** = Field must be provided
  - Example: name and email required on signup
  - If missing, MongoDB rejects document
  - Why? Ensure critical data is always present
- **`unique: true`** = No duplicates
  - Example: `email: { type: String, unique: true }`
  - Two users can't have same email
  - Why? Users log in by email
- **`default: ''`** = Default value if not provided
  - If user doesn't set college, it's empty string ''
  - Example: `college: { type: String, default: '' }`
  - Why? Show "Not set" instead of undefined/null
- **`enum: ['TE', 'BE', 'Other', '']`** = Limited choices
  - Field value must be one of these strings
  - Example: year: 'TE' ✓, year: 'Third Year' ✗ (not in enum)
  - MongoDB rejects invalid values
  - Why? Enforce valid data
- **`default: null`** = Default is null (not provided)
  - Example: `graduationYear: { type: Number, default: null }`
  - If user doesn't set graduation year, it's null
  - Different from 0 (which would be 0)
  - Why? Distinguish "not set" from "year 0"
- **`type: Number`** = Field type is number
  - Stores: 2026, 2025, etc.
  - Not: '2026' (string)
  - Why? Comparison queries: graduationYear > 2025
- **`mongoose.model('User', userSchema)`** = Create model
  - Model = Interface to interact with collection
  - First argument: Model name (User)
  - Second argument: Schema definition
  - Creates 'users' collection in MongoDB
  - Why? Allows User.findById(), User.create(), etc.

**Interview point:**
"Schema defines the structure of documents. Profile fields are optional (have defaults) so users can sign up without them. Later, user updates profile via PUT endpoint. enum constraint ensures year is one of valid options. default: null for graduationYear distinguishes 'not set' from 'year 0'."

```javascript
// User.js - Schema definition

const mongoose = require('mongoose');

// First, define preferences sub-schema
const preferencesSchema = new mongoose.Schema({
  interviewType: {
    type: String,
    enum: ['DSA', 'HR', 'CS Fundamentals', 'System Design', 'Resume Discussion'],
    default: 'DSA'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  targetCompany: String,
  preferredLanguage: {
    type: String,
    enum: ['Java', 'C++', 'Python'],
    default: 'Python'
  },
  identityPreference: {
    type: String,
    enum: ['Anonymous', 'Named'],
    default: 'Named'
  },
  rolePreference: {
    type: String,
    enum: ['candidate', 'interviewer'],
    default: 'candidate'
  }
}, { _id: false });  // { _id: false } = Don't add _id to this sub-doc

// Main User schema
const userSchema = new mongoose.Schema({
  // Authentication fields (required)
  name: {
    type: String,
    required: true
    // Must be provided on signup
  },
  email: {
    type: String,
    required: true,
    unique: true
    // Must be provided, and no duplicates
  },
  password: {
    type: String,
    required: true
    // Must be provided (hashed)
  },

  // Profile fields (optional - can be updated later)
  college: {
    type: String,
    default: ''
    // Empty string if not provided
    // User can set later: 'IIT Bombay'
  },
  degree: {
    type: String,
    default: ''
    // Empty string if not provided
    // User can set later: 'Bachelor of Technology'
  },
  branch: {
    type: String,
    default: ''
    // Empty string if not provided
    // User can set later: 'Computer Science'
  },
  year: {
    type: String,
    enum: ['TE', 'BE', 'Other', ''],
    // Only these 4 values allowed
    // 'TE' = Third Year Engineering
    // 'BE' = Fourth Year Engineering
    // 'Other' = Not TE/BE
    // '' = Not set
    default: ''
    // Default is empty string (not set)
  },
  graduationYear: {
    type: Number,
    default: null
    // Number type (not string)
    // null = Not set (different from 0)
    // User can set: 2026
  },

  // Preferences (nested schema)
  preferences: {
    type: preferencesSchema,
    default: () => ({})
    // Default is empty preferences object
    // User sets later
  }
});

// Create and export model
module.exports = mongoose.model('User', userSchema);
// Creates 'users' collection in MongoDB
// Allows: User.findById(), User.findByIdAndUpdate(), User.create(), etc.
```

---

#### **5. Form State Management and Validation**

**File:** `frontend/components/ProfileForm.jsx` → Form validation

**What it does:**
Validates form fields before sending to backend. Shows appropriate input types. Handles special cases (college dropdown + text input).

**How it works (step-by-step):**
```
User opens ProfileForm
  ↓
College field is SELECT dropdown:
  - Options: IIT Bombay, NIT Trichy, ... Other
  - If user selects from list: college = 'IIT Bombay'
  - If user selects 'Other': Show text input to type college name
  ↓
Degree, Branch fields are TEXT INPUTS:
  - User types freely
  - Any text accepted
  ↓
Year field is SELECT dropdown:
  - Options: Select Year, TE, BE, Other
  - Only these values
  ↓
Graduation year field is NUMBER INPUT:
  - type="number"
  - Only accepts numbers
  - HTML prevents non-numeric input
  - Browser validation: number > 0
  ↓
On form submit:
  ↓
Check if graduationYear is number:
  Number(form.graduationYear) = Convert "2026" → 2026
  or = Number("") → 0
  or = Number(null) → 0
  ↓
For API:
  if (form.graduationYear) Number(form.graduationYear)
  else null
  ↓
Backend receives:
  {
    college: 'string',
    degree: 'string',
    branch: 'string',
    year: 'TE' | 'BE' | 'Other' | '',
    graduationYear: number | null
  }
```

**Packages/Methods explained:**

- **`type="number"`** = HTML number input
  - Browser only accepts numeric characters
  - Shows spinner arrows to increment/decrement
  - Prevents user from typing letters (mostly)
  - Why? Frontend validation before server
- **`type="text"` (default)** = Text input
  - Accepts any characters
  - No validation
  - Why? College/degree/branch can be any text
- **`<select>`** = Dropdown menu
  - Multiple `<option>` elements
  - User picks one value
  - HTML enforces picked value (not typed)
  - Why? Ensure year is valid (TE, BE, Other)
- **`Number(string)`** = Convert string to number
  - `Number("2026")` → 2026
  - `Number("")` → 0
  - `Number(null)` → 0
  - Why? Ensure graduationYear is number type for MongoDB
- **`form.graduationYear ? Number(...) : null`** = Ternary
  - If graduationYear truthy: Convert to number
  - If falsy (empty, null, 0): Keep null
  - Why? Don't send 0 year, keep as null (not set)
- **Form validation responsibility:**
  - Frontend: HTML input type, dropdown enum, visual feedback
  - Backend: Double-check enum values, type validation
  - Why? Frontend can be bypassed, backend is trusted

**Interview point:**
"Form uses HTML input types for frontend validation (number, select). Year is enum (only TE/BE/Other/empty). Graduation year is number type. On submit, we convert string to number before sending. Backend double-checks enum values. Never trust only frontend validation."

```javascript
// Form validation and input handling

// College field - special handling
const handleCollegeSelect = (e) => {
  const value = e.target.value;
  // value = Selected option from dropdown
  
  if (value === 'Other') {
    // User selected 'Other' - allow free typing
    setForm({ ...form, college: '' });
    // Empty field so user can type custom college name
  } else {
    // User selected from popular colleges list
    setForm({ ...form, college: value });
    // Set to selected college (e.g., 'IIT Bombay')
  }
};

// Graduation year validation on submit
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const submitData = {
    college: form.college,
    degree: form.degree,
    branch: form.branch,
    year: form.year,
    graduationYear: form.graduationYear
      ? Number(form.graduationYear)  // "2026" → 2026
      : null                          // "" or null → null
  };
  
  // submitData.graduationYear = 2026 or null (never 0)
  
  await api.put('/auth/profile', submitData);
};

// HTML inputs with validation
<form onSubmit={handleSubmit}>
  {/* College - Dropdown with option to enter custom */}
  <select
    value={/* Logic to determine displayed value */}
    onChange={handleCollegeSelect}
  >
    {/* Options: IIT Bombay, NIT Trichy, ..., Other */}
  </select>

  {/* Degree - Free text */}
  <input
    type="text"
    name="degree"
    placeholder="Bachelor of Technology"
    // No type validation - accepts any text
  />

  {/* Branch - Free text */}
  <input
    type="text"
    name="branch"
    placeholder="Computer Science"
    // No type validation - accepts any text
  />

  {/* Year - Dropdown with enum values */}
  <select name="year">
    <option value="">Select Year</option>
    <option value="TE">TE</option>
    <option value="BE">BE</option>
    <option value="Other">Other</option>
    {/* Only these values can be selected */}
  </select>

  {/* Graduation year - Number input */}
  <input
    type="number"
    name="graduationYear"
    placeholder="2026"
    // type="number" = Browser validates numbers only
    // Spinner arrows to increment/decrement
    // Prevents most non-numeric input
  />

  <button type="submit" disabled={saving}>
    {saving ? 'Saving...' : 'Save profile'}
  </button>
</form>
```

---

### Key Methods

| Method | What it does | Example |
|--------|-------------|---------|
| `useAuth()` | Get user from context | `const { user } = useAuth()` |
| `useState(initial)` | Create state variable | `const [form, setForm] = useState({...})` |
| `setForm({...form, [name]: value})` | Update specific form field | Spread existing, override changed field |
| `...object` (spread) | Copy object properties | `{...form}` = Copy all form fields |
| `[name]: value` (computed key) | Dynamic object key | `{[e.target.name]: e.target.value}` |
| `e.preventDefault()` | Stop default form submit | Prevents page reload |
| `await` | Wait for async operation | `await api.put(...)` |
| `api.put(url, data)` | HTTP PUT request | `api.put('/auth/profile', data)` |
| `try/catch` | Error handling | Catch network/server errors |
| `setTimeout(fn, ms)` | Run after delay | Auto-hide success message |
| `Number(string)` | Convert string to number | `Number("2026")` → 2026 |
| `User.findByIdAndUpdate()` | Find and update document | MongoDB method via Mongoose |
| `.select('-field')` | Exclude field from query | `.select('-password')` |
| `$set` | MongoDB update operator | `{ $set: updateFields }` |
| `{ new: true }` | Return updated document | After update, return new version |
| `new mongoose.Schema()` | Define schema structure | Blueprint for collection |
| `enum: [...]` | Limit to specific values | `enum: ['TE', 'BE', 'Other']` |
| `default: value` | Default if not provided | `default: ''` or `default: null` |

---

### Interview Q&A

**Q: Why use `{ $set: updateFields }` instead of just `updateFields`?**
A: MongoDB update operators start with $. `$set` means "set these fields". Other operators: `$inc` (increment), `$push` (add to array), etc. Using `$set` is explicit and clear.

**Q: What's the difference between `default: ''` and `default: null`?**
A: Empty string means "not set yet but can be set later". null means "explicitly no value". For profileFields like college, empty string makes sense. For graduationYear, null better represents "not set" vs 0 (year zero).

**Q: Can user partially update profile (just update college, keep other fields)?**
A: Yes! We check `if (field !== undefined)` for each field. Only provided fields added to updateFields. MongoDB only updates those fields, leaves others unchanged.

**Q: Why convert graduationYear to number before sending?**
A: Number inputs return strings. "2026" is string type. MongoDB stores as Number type. Sending string would store as string. Comparison queries like `graduationYear > 2025` need number type to work correctly.

**Q: What if user doesn't fill any profile fields?**
A: All have defaults. college, degree, branch default to empty string. year defaults to empty string. graduationYear defaults to null. Profile page shows "Not set" for empty values. User can update anytime.

**Q: Why call `setMessage('')` and then `setTimeout(() => setMessage(''), 3000)`?**
A: First line would clear immediately. We want to show message. setTimeout clears it after 3 seconds so user sees it briefly.

**Q: What happens if server rejects update (validation error)?**
A: Caught by catch block. setMessage('Failed to update profile'). Frontend shows error. User can retry. Form data stays so user doesn't lose changes.

**Q: Is password included in profile update?**
A: No! We only update college, degree, branch, year, graduationYear. Password handled in separate endpoint (if needed). Why? Changing password is sensitive, needs special validation.

**Q: Why use findByIdAndUpdate instead of findById + save?**
A: Atomic operation. findByIdAndUpdate is one DB call. findById + save is two calls. In between, another user might update same document. Atomic = guaranteed no conflicts.

**Q: What if user changes college to custom text then selects from dropdown again?**
A: Custom text replaced. handleCollegeSelect checks if 'Other' selected. If yes, clears field (shows text input). If no, sets to selected value. Previous custom text lost.

**Q: Can user update someone else's profile?**
A: No! Middleware 'auth' verifies JWT token. req.user.id = Current user only. findByIdAndUpdate uses req.user.id. Even if hacker sends different userId, auth middleware prevents it.

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Profile Display** | Read-only card view of user profile fields |
| **Edit Mode** | Toggle button to show/hide edit form |
| **Form State** | useState tracks all form field values |
| **onChange Handler** | Updates state on every keystroke |
| **College Field** | Dropdown with 'Other' option for custom input |
| **Type Validation** | year is enum, graduationYear is number type |
| **Form Submission** | POST to /api/auth/profile with updated fields |
| **Backend Validation** | Check each field !== undefined, type check |
| **Atomic Update** | findByIdAndUpdate in single DB operation |
| **Exclude Password** | .select('-password') for security |
| **Success Message** | Show "Profile updated successfully" then auto-hide |
| **Partial Updates** | Only provided fields updated, others unchanged |
