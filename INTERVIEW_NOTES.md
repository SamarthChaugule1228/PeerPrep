# PeerPrep Interview Notes

## 1. User Authentication

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

### Key Methods Explained

| Method | What | Why | Example |
|--------|------|-----|---------|
| `bcrypt.genSalt(10)` | Generate random salt for hashing | Different passwords produce different hashes | `const salt = await bcrypt.genSalt(10)` |
| `bcrypt.hash(password, salt)` | Encrypt password with salt | Never store plain passwords | `user.password = await bcrypt.hash(password, salt)` |
| `bcrypt.compare(entered, stored)` | Compare passwords without revealing hash | Verify login without storing plain text | `const match = await bcrypt.compare(password, user.password)` |
| `jwt.sign(payload, secret, options)` | Create JWT token | Generate proof of login | `jwt.sign({user:{id}}, SECRET, {expiresIn:'7d'})` |
| `jwt.verify(token, secret)` | Verify and decode JWT | Ensure token is real and not expired | `const decoded = jwt.verify(token, SECRET)` |
| `localStorage.setItem(key, value)` | Save token in browser | User stays logged in after refresh | `localStorage.setItem('token', token)` |
| `localStorage.getItem(key)` | Retrieve token from browser | Get token for API requests | `const token = localStorage.getItem('token')` |

---

### Interview Q&A

**Q1: What is JWT and why use it instead of server sessions?**

Simple: JWT is a token with encrypted user ID. User stores it locally. When user makes request, sends token. Server decrypts token to know who it is. No need to store who's logged in on server (stateless).

Follow-up: Why not use plain session IDs? → Because we'd need to store all logged-in users in memory/database. JWT is better for distributed systems (multiple servers).

---

**Q2: Why use bcryptjs instead of simple hashing like SHA256?**

Simple: bcryptjs adds random salt + intentionally slow (takes time to compute). SHA256 is fast, so hackers can try billion passwords per second. bcrypt might take 1 second per password, so much harder to crack.

Follow-up: What if someone uses same password as another user? → bcrypt adds different salt each time, so same password creates different hashes.

---

**Q3: Explain complete login flow.**

Simple: User enters email/password → Backend finds user → Compares passwords → If match, creates JWT token with user ID inside → Sends token to frontend → React stores in localStorage → React auto-adds token to all requests → User authenticated.

Follow-up: What happens if token expires? → User gets 401 error. Would need to redirect to login page.

---

**Q4: How does auth middleware work?**

Simple: Middleware is code that runs BEFORE route handler. When user requests protected route, middleware checks request header for token. If no token → deny. If invalid token → deny. If valid → extract user ID and allow request to continue.

Follow-up: Why check signature? → Because user could modify token. Signature proves token wasn't modified after creation.

---

**Q5: What happens if user token is stored in localStorage and browser is compromised?**

Simple: Anyone with access to browser can see token and use it to impersonate user. This is XSS (Cross-Site Scripting) attack.

Follow-up: How to prevent? → Store token in httpOnly cookie (JavaScript can't access it). Or implement token rotation (refresh tokens).

---

**Q6: How is token decoded and verified?**

Simple: JWT has 3 parts: Header.Payload.Signature (all base64 encoded). When we verify, we recreate signature using payload + secret key. If recreated signature matches original → token is real. Then check expiry time.

Follow-up: Can user modify token? → User can change Payload, but Signature won't match. Server rejects it.

---

**Q7: What is the difference between token expiry and logout?**

Simple: Logout = user clicks logout button, token deleted from localStorage. Expiry = token automatically becomes invalid after 7 days. Two different things.

Follow-up: If token expires while user is using app, what happens? → Next API call gets 401 error. Should show "Please login again" and redirect to login page.

---

**Q8: Why store token in localStorage instead of memory?**

Simple: If token stored in memory (JavaScript variable), it's lost on page refresh. User gets logged out. localStorage persists after refresh, so user stays logged in.

Follow-up: What's the security difference? → localStorage is slightly less secure (vulnerable to XSS) but more convenient. httpOnly cookies are more secure but harder to work with.

---

**Q9: How does axios interceptor help with authentication?**

Simple: Instead of manually adding token to every request, interceptor automatically does it. Runs before each request, gets token from localStorage, adds to headers.

Follow-up: What if token is not in localStorage? → Interceptor checks "if (token)" so it just skips adding token.

---

**Q10: What information is stored in JWT payload?**

Simple: We store user ID. Nothing else (like email or name) because token can be decoded by user. Only store minimum necessary data.

Follow-up: Why not store user preferences in token? → Token should be small and rarely change. If preferences change, token becomes stale.

---

**Q11: How do you prevent someone from using expired token?**

Simple: JWT contains expiry time. When token received, we check: current time > expiry time? If yes, reject. It's automatically checked by jwt.verify().

Follow-up: Can user extend token expiry? → User can modify expiry time in token but signature won't match, so server rejects it.

---

**Q12: What happens if database is hacked and all passwords are stolen?**

Simple: Because passwords are hashed with bcryptjs + salt, hackers can't read them. They'd need to crack each one (very hard with bcryptjs). Without bcrypt, all passwords would be readable.

Follow-up: Is hashing 100% safe? → No, but makes it very hard. Crackers need huge computing power and time. Plus we can force password reset for all users.

---

**Q13: How do you verify user is still logged in after page refresh?**

Simple: On app load, AuthContext calls loadUser(). Sends GET request to /auth/user with token from localStorage. Backend verifies token is still valid. If valid, returns user data. If invalid, token is deleted.

Follow-up: What if token expires between requests? → User data fetch fails with 401. Should handle this and redirect to login.

---

**Q14: Why send user data separately from token in login response?**

Simple: Token is small, just has user ID. But frontend needs user's full data (name, email, preferences, etc). So response sends token, then we call /auth/user to get full data.

Follow-up: Why not include full data in token? → Token should be small. Also if user profile changes, token becomes stale. Better to fetch fresh data from database.

---

**Q15: How would you implement "Remember Me" for 30 days instead of 7?**

Simple: Change expiresIn from '7d' to '30d' in jwt.sign(). But also need to refresh token when user is active (prevent logout after 30 days of inactivity).

Follow-up: What's better: long token or refresh tokens? → Refresh tokens are better security. Short-lived access token + long-lived refresh token.

---

### Real-World Scenario

**Scenario: 1000 users login together**

- Each login creates JWT token instantly (no database write, just sign)
- Each request is verified using jwt.verify (no database lookup)
- No bottleneck at server
- Scales well because stateless

**Problem:** One user's token leaked. How to invalidate?
- Can't easily invalidate because JWT is stateless
- Solution: Maintain token blacklist in Redis (list of revoked tokens)
- Check blacklist on every request

---

### Common Mistakes

**Mistake 1:** Storing password in token
- ❌ `jwt.sign({ password: user.password })`
- ✅ `jwt.sign({ user: { id: user.id } })`
- Why: Password would be visible (base64 decoded), security risk

**Mistake 2:** Forgetting to hash password
- ❌ Saving plain password to database
- ✅ `user.password = await bcrypt.hash(password, salt)`
- Why: If database hacked, all passwords readable

**Mistake 3:** No token expiry
- ❌ `jwt.sign(payload, secret)` (no expiresIn)
- ✅ `jwt.sign(payload, secret, { expiresIn: '7d' })`
- Why: Stolen token works forever

**Mistake 4:** Storing token in plain JavaScript variable
- ❌ `const token = response.data.token;` (lost on refresh)
- ✅ `localStorage.setItem('token', response.data.token);`
- Why: Token should persist across page refreshes

**Mistake 5:** Not using HTTPS in production
- ❌ Sending tokens over HTTP
- ✅ Use HTTPS (encrypted)
- Why: Attacker can intercept token over HTTP

**Mistake 6:** Checking only token validity, not expiry
- ❌ `jwt.verify(token, secret)` catches expiry automatically
- ✅ But should also handle 401 errors in frontend
- Why: If token expired, backend returns 401, frontend should redirect to login

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Registration** | Hash password → Save user → Create JWT token → Send to frontend |
| **Login** | Find user → Compare passwords → Create JWT token → Send to frontend |
| **Protected Request** | Frontend sends token in header → Middleware verifies → Backend processes |
| **Token Storage** | localStorage persists across page refreshes → User stays logged in |
| **Security** | bcryptjs hashes passwords, JWT verifies requests, Token has expiry |
| **Stateless** | Server doesn't store who's logged in, Token contains all info |

---

**Total pages: ~8 pages (interview-focused, concise)**

Ready for Feature 2?
