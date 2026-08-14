# User Authentication

---

### Feature Overview

**What is it?**
Secure login/registration system using JWT tokens and encrypted passwords.

**Why?**
- Each user gets a unique token after login
- Token proves identity without storing sessions on server
- Passwords encrypted with bcryptjs (can't be read even if database hacked)

**User Flow:**
Register → Create account → Get JWT token → Stored in browser → Token sent with every request → Backend verifies token

---

### Working Flow

```
REGISTRATION:
1. User submits email/password
2. Backend checks if email exists
3. Hash password with bcryptjs
4. Save to MongoDB
5. Create JWT token with user ID
6. Send token to frontend
7. React stores token in localStorage
8. User logged in automatically

LOGIN:
1. User submits email/password
2. Backend finds user by email
3. Compare entered password with hashed password in DB
4. If match → Create JWT token
5. Send token to frontend
6. React stores in localStorage

PROTECTED REQUEST:
1. Frontend sends request with token in header
2. Auth middleware checks token
3. If valid → Verify JWT signature & expiry
4. Extract user ID from token
5. Allow request to backend route
6. If invalid → Return 401 error
```

---

### Files Used

| File | Purpose |
|------|---------|
| `backend/models/User.js` | User schema (name, email, password hashed) |
| `backend/routes/auth.js` | Register/login/get user endpoints |
| `backend/middleware/auth.js` | Verify JWT token before accessing routes |
| `frontend/context/AuthContext.jsx` | Manage login state + functions for entire app |
| `frontend/pages/Login.jsx` | Login UI form |
| `frontend/pages/Register.jsx` | Registration UI form |
| `frontend/services/api.js` | Axios with interceptor (auto-add token to requests) |

---

### Important Code

#### **1. Password Hashing on Registration**

**File:** `backend/routes/auth.js` → `router.post('/register')`

**What it does:**
Encrypts password before saving to database using bcryptjs with random salt.

**Why important:**
Security - passwords never stored as plain text.

**Interview point:**
"We use bcryptjs instead of simple encryption because bcrypt adds a random 'salt' to each password, making same password produce different hashes. Even if database leaks, passwords are unreadable."

```javascript
const salt = await bcrypt.genSalt(10);
user.password = await bcrypt.hash(password, salt);
await user.save();
```

---

#### **2. Password Verification on Login**

**File:** `backend/routes/auth.js` → `router.post('/login')`

**What it does:**
Compares entered password with hashed password without revealing the hash.

**Why important:**
Must verify password is correct without storing plain text.

**Interview point:**
"bcrypt.compare() doesn't decrypt the hash. It encrypts the entered password the same way and compares encrypted versions. This way we never see the actual password."

```javascript
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
```

---

#### **3. JWT Token Creation**

**File:** `backend/routes/auth.js` → Both register and login routes

**What it does:**
Creates a JWT token containing user ID, valid for 7 days.

**Why important:**
Token is proof of login. Sent to frontend and used for all authenticated requests.

**Interview point:**
"JWT is stateless - server doesn't store who's logged in. Token itself contains encrypted user ID. When we receive token, we decrypt it and verify signature to ensure it's real."

```javascript
const payload = { user: { id: user.id } };
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
  if (err) throw err;
  res.json({ token });
});
```

---

#### **4. Token Verification Middleware**

**File:** `backend/middleware/auth.js`

**What it does:**
Checks if request has valid JWT token before allowing access to protected routes.

**Why important:**
Without this, anyone could access other users' data.

**Interview point:**
"Middleware intercepts every request to protected routes. If no token or invalid token → deny immediately. If valid → extract user ID and attach to request object so route handler knows who is requesting."

```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded.user;
next();
```

---

#### **5. Auto-add Token to Requests**

**File:** `frontend/services/api.js`

**What it does:**
Axios interceptor automatically adds JWT token to every API request header.

**Why important:**
Without this, you'd manually add token to every request (error-prone).

**Interview point:**
"Interceptor runs before each request. Gets token from localStorage and adds to headers. So when React calls any API, token is automatically sent without extra code."

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});
```

---

### Key Methods

| Method | Why Important |
|--------|---------------|
| `bcrypt.hash()` | Encrypts password so it can never be read |
| `bcrypt.compare()` | Verifies password without revealing the hash |
| `jwt.sign()` | Creates token with user ID inside |
| `jwt.verify()` | Decrypts and validates token signature |
| `localStorage.setItem()` | Saves token in browser for persistence |
| `axios.interceptor` | Auto-adds token to every request |

---

### Interview Q&A

**Q: What is JWT and why not use sessions?**
A: JWT is a token containing encrypted user ID. Stateless - server doesn't store sessions. Scales better than sessions which need server storage.

**Q: Why bcryptjs and not simple SHA256?**
A: bcryptjs is intentionally slow + uses random salt. SHA256 is fast, so hackers can try billion passwords/second. bcryptjs takes 1 second per attempt.

**Q: Complete login flow?**
A: User enters email/password → Backend finds user → Compares passwords → Creates JWT token with user ID → Sends to frontend → React stores in localStorage → Token auto-added to all requests.

**Q: How does auth middleware work?**
A: Runs before protected routes. Checks token header. If valid → extract user ID and allow request. If invalid → return 401 error.

**Q: What if token in localStorage gets stolen?**
A: XSS attack. Attacker can impersonate user. Better to use httpOnly cookies (not accessible from JavaScript).

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Registration** | Hash password → Save → Create JWT → Send token |
| **Login** | Find user → Compare passwords → Create JWT → Send token |
| **Protected Route** | Middleware checks token → Extract user ID → Allow request |
| **Token Storage** | localStorage persists across page refreshes |
| **Security** | bcryptjs hashes passwords, JWT verifies requests |
