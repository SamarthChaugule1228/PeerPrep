# Socket.IO Communication

---

### Feature Overview

**What is it?**
Real-time bidirectional communication between frontend and backend using WebSockets (Socket.IO).

**Why?**
- HTTP requests are request-response only
- Socket.IO maintains persistent connection
- Instant updates (code changes, messages, status)
- Both server and client can initiate communication

**Key difference from HTTP:**
- HTTP: Client asks → Server responds (one-way)
- Socket.IO: Connection stays open → Both can send anytime

---

### Working Flow

```
CONNECTION SETUP:
1. Frontend connects on page load:
   const socket = io(BACKEND_URL, { auth: { token } })

2. Backend authenticates token in Socket.IO middleware

3. Connection established - socket ready

4. Backend verifies Socket.IO auth:
   io.use(async (socket, next) => {
     const token = socket.handshake.auth.token
     const decoded = jwt.verify(token, SECRET)
     socket.user = await User.findById(decoded.user.id)
     next() // Allow connection
   })

REAL-TIME EVENTS:
5. User makes change (types code, updates timer, etc)

6. Frontend emits event with data:
   socket.emit('code-change', { sessionId, code: "..." })

7. Backend receives and broadcasts to room:
   socket.to(sessionId).emit('code-update', code)

8. Both users in room get instant update

DATA PERSISTENCE:
9. Backend also saves to database:
   await Session.findByIdAndUpdate(sessionId, { code })

10. If page refreshes, data restored from DB
```

---

### Files Used

| File | Purpose |
|------|---------|
| `backend/socket/socket.js` | All Socket.IO events and room management |
| `frontend/pages/Dashboard.jsx` | Connects socket, emits 'find-peer' |
| `frontend/pages/MatchRoom.jsx` | Emits code-change, timer-start, etc |
| `backend/models/Session.js` | Stores code, notes, timer in database |

---

### Important Code

#### **1. Socket.IO Authentication Middleware**

**File:** `backend/socket/socket.js` → `io.use()` middleware

**What it does:**
Verifies JWT token before allowing Socket.IO connection. Same as HTTP auth middleware.

**Why important:**
Without this, anyone could connect to Socket.IO and eavesdrop or send malicious events.

**How it works (step-by-step):**
```
User opens PeerPrep in browser
  ↓
Frontend tries to connect to Socket.IO server:
  socket = io(BACKEND_URL, { auth: { token: 'jwt_token_123' } })
  ↓
Socket.IO sends auth token to backend
  ↓
Backend middleware io.use() runs:
  1. Get token from socket.handshake.auth
  2. Verify token using JWT secret
  3. If valid: Decode token to get user ID
  4. Fetch user from database
  5. Attach user to socket object (socket.user)
  6. Call next() to allow connection
  7. If invalid: Throw error to reject connection
  ↓
If auth succeeds: Connection established
If auth fails: Connection rejected, socket closes
```

**Packages/Methods explained:**

- **JWT (JSON Web Token)** = Standard way to pass authentication info
  - Format: `header.payload.signature` (3 parts separated by dots)
  - Example: `eyJhbGc.eyJ1c2VySWQ.SflKxw`
  - Why? Stateless - server doesn't store sessions, just verifies token signature
- **`socket.handshake`** = Object containing connection info
  - `socket.handshake.auth` = Authentication data sent during connection
  - `socket.handshake.auth.token` = JWT token from frontend
  - Why? Different from normal HTTP headers - Socket.IO uses custom handshake
- **`jwt.verify(token, secret)`** = Verify JWT token using secret key
  - If token valid and signature matches secret: Decodes and returns payload
  - If invalid/tampered: Throws error
  - Why? Prevents someone from forging fake tokens
- **`User.findById()`** = Mongoose method to fetch user from MongoDB by ID
  - Example: `User.findById('63a1b2c3')` returns user with that ID or null if not found
  - Why? Double-check user still exists in database
- **`.select('-password')`** = Exclude password field from response
  - `-password` means "don't include password"
  - Why? Never send passwords to frontend, even over secure connections
- **`socket.user`** = Attach user object to socket for later use
  - Now in future events, can access current user via `socket.user`
  - Example: In `socket.on('find-peer')`, can use `socket.user._id`
- **`next()`** = Continue to next middleware or allow connection
  - Without calling next(), socket connection hangs/blocks
  - `next(error)` = Reject connection with error
- **`io.use()`** = Register middleware that runs for ALL socket connections
  - Different from `socket.on()` which is event-specific
  - Middleware runs BEFORE allowing connection

**Interview point:**
"Socket.IO has same auth requirement as HTTP API. We verify JWT token in handshake. If token invalid, reject connection. This prevents unauthenticated users from connecting."

```javascript
// Backend middleware - runs BEFORE allowing any socket connection
io.use(async (socket, next) => {
  // socket = new connection object
  // next = callback to allow/reject connection
  
  try {
    // Step 1: Get JWT token from socket connection data
    const token = socket.handshake.auth.token;
    // socket.handshake.auth = { token: 'eyJ...' }
    // This is how token is passed during Socket.IO connection
    
    if (!token) return next(new Error('Authentication error'));
    // If no token provided, reject immediately
    
    // Step 2: Verify token is valid and hasn't been tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // jwt.verify() checks token signature using SECRET
    // If valid: Returns decoded payload { user: { id: '63a...' }, iat: 1704... }
    // If invalid/expired: Throws error (caught by catch block)
    
    // Step 3: Fetch user from database
    const user = await User.findById(decoded.user.id).select('-password');
    // User.findById() = MongoDB query to find by ID
    // .select('-password') = Don't include password in response
    // Returns: { _id: '63a...', name: 'Alice', email: '...', preferences: {...} }
    
    // Step 4: Attach user to socket for use in events
    socket.user = user;
    // Now in future events: socket.user = { _id, name, email, ... }
    // Can access anywhere: socket.on('any-event', ...) can use socket.user
    
    // Step 5: Allow connection to proceed
    next();
    // Calls next middleware or completes connection
    // Socket is now ready to use
    
  } catch (err) {
    // Error in any step above: invalid token, user not found, etc.
    console.log('Auth error:', err.message);
    next(new Error('Authentication error'));
    // Reject connection - socket won't be allowed to connect
  }
});

// After middleware completes successfully:
// Socket is connected and socket.user is populated
// All future events can access: socket.user._id, socket.user.name, etc.
```

---

#### **2. Broadcasting Code Changes to Room**

**File:** `backend/socket/socket.js` → `socket.on('code-change')` event

**What it does:**
When one user types code, broadcasts change to other user in same session room.

**Why important:**
Real-time collaboration - both users see code instantly.

**How it works (step-by-step):**
```
User A in MatchRoom types code: "function hello()"
  ↓
Monaco editor triggers onChange event
  ↓
Frontend emits to backend:
  socket.emit('code-change', {
    sessionId: '63a2ce6d...',
    code: 'function hello()'
  })
  ↓
Backend receives 'code-change' event
  ↓
Two things happen SIMULTANEOUSLY:

  1. BROADCAST to room (User B gets instant update):
     socket.to(sessionId).emit('code-update', code)
     = Send to everyone in this session room EXCEPT sender
     = User B receives code-update event
     = User B's Monaco editor updates to show new code
     = User B sees code in real-time
  
  2. SAVE to database (persistence):
     await Session.findByIdAndUpdate(sessionId, { code })
     = Update MongoDB session document
     = If page refreshes, code still exists in DB
     = User can rejoin session and see same code
```

**Packages/Methods explained:**

- **`socket.on(eventName, handler)`** = Listen for event from frontend
  - Example: `socket.on('code-change', (data) => { ... })`
  - When frontend does `socket.emit('code-change', {...})`, this handler runs
  - Handler receives data object from frontend
- **`socket.to(room)`** = Target specific Socket.IO room
  - `sessionId` is used as room name
  - `.to(sessionId)` = All sockets in that room
  - Excludes sender (socket that called to())
  - Why? Sender already has updated code locally
- **`.emit(eventName, data)`** = Send event to targeted socket(s)
  - `socket.to(sessionId).emit('code-update', code)`
  - = Send 'code-update' event with code data to all in room except sender
  - Frontend receives: `socket.on('code-update', (code) => { ... })`
- **`Session.findByIdAndUpdate()`** = Find document and update it in one operation
  - MongoDB method via Mongoose
  - Example: `Session.findByIdAndUpdate('63a2ce6d', { code: 'new code' })`
  - Returns updated document
  - Why one operation? Faster than separate findById + save
- **`await`** = Wait for database update to complete
  - Without await, code continues before DB updated
  - With await, function pauses until DB responds
- **`async`** = Function marked with async to use await inside
  - Syntax requirement in JavaScript

**Why broadcast AND save?**
- **Broadcast (socket.to())** = Instant visual feedback - other user sees change immediately
- **Save to DB (Session.update())** = Persistence - if anyone refreshes, code still there

**Interview point:**
"socket.to(sessionId) sends to everyone in that room EXCEPT sender. So when user types, they see their own change immediately. Other user gets broadcast update."

```javascript
// Event handler for when one user types code
socket.on('code-change', async ({ sessionId, code }) => {
  // sessionId = '63a2ce6d...' (session ID as room name)
  // code = 'function hello() { ... }' (new code text)
  
  // PART 1: Broadcast to other user in real-time
  socket.to(sessionId).emit('code-update', code);
  // socket.to() = Target specific room
  // sessionId = Room identifier (both users in same sessionId room)
  // .emit('code-update', code) = Send event name and code to that room
  // EXCEPT sender (so sender's own change isn't received twice)
  //
  // Other user's frontend receives:
  //   socket.on('code-update', (code) => {
  //     editorRef.current.setValue(code);  // Update Monaco editor
  //   })
  
  // PART 2: Persist to database
  await Session.findByIdAndUpdate(
    sessionId,                    // Find session with this ID
    { code: code }                // Update its code field
  );
  // Session document now has latest code
  // If either user refreshes page or network drops:
  //   1. Reconnect to Socket.IO
  //   2. Emit 'join-room' event
  //   3. Backend fetches Session from DB
  //   4. Sends updated code to frontend
  //   5. User sees same code they were working on
});

// Frontend (MatchRoom.jsx) that triggers this:
// const handleCodeChange = (newCode) => {
//   socket.emit('code-change', {
//     sessionId: sessionId,
//     code: newCode
//   });
// }
// This is called every keystroke in Monaco editor
```

---

#### **3. Timer Synchronization**

**File:** `backend/socket/socket.js` → `socket.on('timer-start')` event

**What it does:**
When timer starts, backend broadcasts end time to room. All users' timers count down from same point.

**Why important:**
Both users see exactly same remaining time (no drift).

**How it works (step-by-step):**
```
Interviewer clicks "Start 15 min timer" button
  ↓
Frontend emits:
  socket.emit('timer-start', {
    sessionId: '63a2ce6d...',
    duration: 900 (15 minutes in seconds)
  })
  ↓
Backend receives 'timer-start'
  ↓
Calculate when timer should END (not duration):
  timerEnd = Date.now() + (900 * 1000)
  = Current timestamp + 900 seconds in milliseconds
  = Absolute point in time when timer runs out
  Example: If now is 10:00:00 AM, timerEnd = 10:15:00 AM
  ↓
Broadcast end time to BOTH users in room:
  io.to(sessionId).emit('timer-update', { timerEnd })
  = Send to everyone INCLUDING sender
  ↓
Both frontends receive timerEnd timestamp
  ↓
Frontend timer logic (every 100ms):
  timeRemaining = timerEnd - Date.now()
  If timeRemaining > 0:
    display: Math.floor(timeRemaining / 1000) + ' seconds'
  Else:
    display: 'Time up!'
  ↓
Because both use SAME timerEnd timestamp:
  They always show same remaining time
  (Within 1 second, depending on network delay)
  ↓
Persist to database:
  Save timerEnd to Session document
  If user disconnects and reconnects:
    Fetch Session from DB
    Get timerEnd
    Continue countdown from same point
```

**Packages/Methods explained:**

- **`Date.now()`** = Current timestamp in milliseconds since Jan 1, 1970
  - Example: `Date.now()` might return `1704067200000`
  - Why milliseconds? More precise than seconds
- **`Date.now() + duration * 1000`** = Calculate future end time
  - Example: Now is 10:00:00 AM, duration is 900 seconds (15 min)
  - Calculation: current_time + (900 * 1000 milliseconds)
  - Result: 10:15:00 AM
  - Why? Store absolute endpoint, not relative duration
- **`io.to(room).emit()`** = Broadcast to ALL in room INCLUDING sender
  - Different from `socket.to()` which excludes sender
  - Use `io.to()` when everyone needs same update (like timer)
  - Why? Interviewer needs to see timer start immediately too
- **Why send `timerEnd` instead of `duration`?**
  - If you send duration 900, both frontends start from that
  - But network delays might mean one starts 0.5 sec later
  - If you send endpoint time (timerEnd), both use same reference point
  - Calculation always based on current time vs end time
  - Guarantees synchronization
- **Real-time countdown logic (frontend):**
  ```javascript
  setInterval(() => {
    const remaining = timerEnd - Date.now();
    setTimeRemaining(Math.max(0, remaining));
  }, 100);
  // Every 100ms, recalculate how much time left
  ```

**Interview point:**
"We calculate absolute end time on backend, not duration. Both users use same end timestamp. Frontend subtracts current time from end time every 100ms. This ensures both timers stay in sync."

```javascript
// Event handler for when interviewer clicks start timer
socket.on('timer-start', async ({ sessionId, duration }) => {
  // sessionId = '63a2ce6d...' (which session)
  // duration = 900 (15 minutes in seconds)
  
  // Step 1: Calculate when timer should end (absolute timestamp)
  const timerEnd = new Date(
    Date.now() + (duration * 1000)  // Current time + duration in milliseconds
  );
  // If now is 10:00:00, duration 900s → timerEnd = 10:15:00
  // This is an absolute point in time (not relative)
  
  // Step 2: Broadcast end time to BOTH users (including sender)
  io.to(sessionId).emit('timer-update', { timerEnd });
  // io.to() = Everyone in room (both users)
  // Different from socket.to() which excludes sender
  // Why both? Interviewer needs to see countdown too
  //
  // Both users' frontends receive:
  //   socket.on('timer-update', ({ timerEnd }) => {
  //     setTimerEnd(timerEnd);
  //     // Start countdown: every 100ms calculate remaining time
  //   })
  
  // Step 3: Persist to database
  await Session.findByIdAndUpdate(
    sessionId,
    { timerEnd }  // Save endpoint time, not duration
  );
  // If user disconnects mid-timer:
  //   1. Reconnect and join room
  //   2. Backend fetches Session with timerEnd
  //   3. Frontend continues countdown from same endpoint
  //   4. No time lost
});

// Frontend countdown logic:
// const [timeRemaining, setTimeRemaining] = useState(0);
// useEffect(() => {
//   const interval = setInterval(() => {
//     const remaining = timerEnd - Date.now();
//     setTimeRemaining(Math.max(0, remaining / 1000));  // Convert ms to seconds
//   }, 100);  // Update every 100ms
//   return () => clearInterval(interval);
// }, [timerEnd]);
//
// Display in UI: `${Math.floor(timeRemaining)}s remaining`
```

---

#### **4. Handling Disconnection**

**File:** `backend/socket/socket.js` → `socket.on('disconnect')` event

**What it does:**
When user disconnects (closes tab, internet cuts), remove from queue and notify partner.

**Why important:**
Partner shouldn't wait forever. Room should end gracefully.

**How it works (step-by-step):**
```
User A closes browser tab / loses internet
  ↓
Socket.IO detects connection loss
  ↓
Backend fires 'disconnect' event on socket
  ↓
Two things happen:

  1. CHECK if user was searching (in queue):
     removeFromQueue(socket.user._id)
     = Find user in waitingQueue
     = Remove them (splice)
     = If no more users in queue, it empties
  
  2. CHECK if user was in interview (active session):
     const roomId = socket.data.activeSessionId
     = Retrieve which session they were in
     
     If they were in session:
       Send to partner:
         socket.to(roomId).emit('partner-left')
         = Notify partner: "Your interview partner disconnected"
       
       Update session status:
         Session.findByIdAndUpdate(roomId, { status: 'ended' })
         = Mark session as ended in DB
         = Interview considered over
```

**Packages/Methods explained:**

- **`socket.on('disconnect')`** = Special Socket.IO event
  - Automatically fired when connection drops
  - Not emitted by frontend - Socket.IO handles it
  - Why? Catches all disconnect scenarios (tab close, network cut, timeout, etc.)
- **`socket.data`** = Custom data attached to socket
  - `socket.data.activeSessionId` = Session ID we stored earlier
  - Used to track which room user is in
  - Stored when user joins room: `socket.data.activeSessionId = sessionId`
- **`removeFromQueue(userId)`** = Helper function to remove user from waitingQueue
  ```javascript
  function removeFromQueue(userId) {
    const index = waitingQueue.findIndex(q => q.userId.equals(userId));
    if (index !== -1) {
      waitingQueue.splice(index, 1);
    }
  }
  ```
  - `findIndex()` = Find position of user in array
  - `splice(index, 1)` = Remove 1 item at that position
- **`socket.to(room).emit()`** = Notify other user in room
  - `socket.to(roomId)` = Send to everyone in room except disconnected user
  - Why? Disconnected user can't receive anyway
- **`Session.findByIdAndUpdate()` with `{ status: 'ended' }`** = Mark session complete
  - Status changes from 'active' to 'ended'
  - Frontend checks status and shows "Interview ended" message
  - Prevents users from continuing to interact with that session

**Edge cases handled:**

1. **User searches but doesn't find match yet, then disconnects**
   - removeFromQueue() removes them
   - No partner to notify (they weren't matched)
   - Other waiting users unaffected

2. **User matched and in interview, then disconnects**
   - removeFromQueue() doesn't find them (no longer in queue)
   - Partner gets 'partner-left' event
   - Session marked as 'ended'
   - Partner can give feedback
   - Session preserved in database (for history)

3. **Network hiccup (5 second disconnect)**
   - Socket.IO auto-reconnect might happen
   - If reconnects within timeout (default 60s), same socket continues
   - If timeout expires, treated as new connection

**Interview point:**
"Disconnect event fires when user closes tab or loses internet. We check if they were searching or in interview. If searching, remove from queue. If in interview, notify partner and mark session ended."

```javascript
// Special Socket.IO event - fires when connection drops
socket.on('disconnect', async () => {
  console.log('User disconnected:', socket.user._id);
  
  // Step 1: If user was searching (in queue), remove them
  removeFromQueue(socket.user._id);
  // removeFromQueue checks waitingQueue
  // If user is there, removes them
  // This prevents them being matched after they're gone
  
  // Step 2: If user was in active interview, notify partner
  const roomId = socket.data.activeSessionId;
  // socket.data.activeSessionId was set when they joined room
  // Example: socket.data.activeSessionId = '63a2ce6d...'
  // If not in any room, this is undefined
  
  if (roomId) {
    // User was in active interview session
    
    // Notify their partner
    socket.to(roomId).emit('partner-left');
    // socket.to(roomId) = Send to other user in session
    // .emit('partner-left') = Event name
    //
    // Partner's frontend receives:
    //   socket.on('partner-left', () => {
    //     setPartnerLeft(true);
    //     // Show popup: "Interview partner left"
    //     // Disable code editor
    //     // Cancel timer
    //   })
    
    // Mark session as ended in database
    await Session.findByIdAndUpdate(
      roomId,
      { status: 'ended' }  // Change from 'active' to 'ended'
    );
    // Partner can now:
    // - See 'session ended' message
    // - Submit feedback if available
    // - Cannot continue editing code in that session
  }
  
  // Note: Disconnected user's socket object is cleaned up automatically
  // by Socket.IO - no manual cleanup needed
});

// Helper function (in socket.js):
function removeFromQueue(userId) {
  const index = waitingQueue.findIndex(q => q.userId.equals(userId));
  // .findIndex() returns position of user in array
  // Returns -1 if not found
  
  if (index !== -1) {
    // User found in queue
    waitingQueue.splice(index, 1);
    // .splice(index, 1) = Remove 1 item at that position
    // Example: waitingQueue had [userA, userB, userC]
    //          After splice: [userA, userC] (userB removed)
  }
}
```

---

#### **5. Joining a Room**

**File:** `backend/socket/socket.js` → `socket.on('join-room')` event

**What it does:**
User joins Socket.IO room (using sessionId as room name). Now belongs to that specific session.

**Why important:**
Rooms isolate communications. Multiple sessions don't interfere.

**How it works (step-by-step):**
```
Frontend navigates to /matchroom/{sessionId}
  ↓
MatchRoom.jsx mounts
  ↓
Effect hook runs:
  socket.emit('join-room', sessionId)
  = Tell backend: "I want to join this session"
  ↓
Backend receives 'join-room' event
  ↓
Step 1: Join Socket.IO room:
  socket.join(sessionId)
  = Add this socket to the room
  = Now this socket receives broadcasts to this room
  ↓
Step 2: Remember which room user is in:
  socket.data.activeSessionId = sessionId
  = Store session ID on socket for later (used in disconnect handler)
  ↓
Step 3: Fetch latest session data from database:
  Session.findById(sessionId)
  = Get current state: code, question, notes, timer, etc.
  ↓
Step 4: Send session data to this user:
  socket.emit('session-data', {question, code, notes, ...})
  = Send to ONLY this socket (not broadcast)
  = Restore UI from database state
  ↓
Frontend receives 'session-data'
  ↓
Frontend populates UI:
  - Monaco editor gets code from DB
  - Question panel shows question
  - Timer shows current status
  ↓
Now frontend can:
  - Edit code (emits code-change)
  - Modify timer (emits timer-start)
  - Add notes (emits notes-change)
  - All syncs with other user in same room
```

**Packages/Methods explained:**

- **`socket.join(room)`** = Add socket to Socket.IO room
  - Room identified by string (sessionId in our case)
  - Multiple sockets can join same room
  - Example: Socket A and Socket B both call `socket.join('63a2ce6d')`
  - Now both are in room '63a2ce6d'
  - When `io.to('63a2ce6d').emit()`, both receive it
- **`socket.data`** = Object to store custom data on socket
  - `socket.data.activeSessionId = sessionId`
  - Persists while socket is connected
  - Used later in disconnect handler
  - Why? Disconnect event doesn't have room info, need to look it up
- **`socket.emit(eventName, data)`** = Send to this specific socket
  - Only the user who called join-room receives this
  - Used for private data (their role, their notes)
  - Different from broadcast where all in room receive
- **Difference between `socket.join()` and `socket.emit()`:**
  - `socket.join()` = Register socket with room for broadcasts
  - `socket.emit()` = Send private message to this socket
  - Both needed: join() to receive broadcasts, emit() to send private responses

**Why fetch from database on join?**
- User might refresh page mid-interview
- New socket connection created
- Must restore state from database
- Code, notes, timer status all fetched
- User continues without losing progress

**Interview point:**
"socket.join(sessionId) adds user to a room. Now broadcasts to that room are received. socket.emit() sends private data just to this user. We fetch session from DB to restore state after page refresh."

```javascript
// When user navigates to /matchroom/{sessionId}
// Frontend emits:
// socket.emit('join-room', sessionId)

// Backend receives and processes:
socket.on('join-room', async (sessionId) => {
  // sessionId = '63a2ce6d...' (the interview session)
  
  // Step 1: Add this socket to the room
  socket.join(sessionId);
  // socket.join() = Register socket in the room
  // Now this socket receives broadcasts to this room
  // Example: socket.to(sessionId).emit() will reach this socket
  
  // Step 2: Remember which session this user is in
  socket.data.activeSessionId = sessionId;
  // socket.data = Custom data object on socket
  // Store session ID for use in disconnect handler
  // When socket disconnects later, we check this to notify partner
  
  // Step 3: Fetch current session state from database
  const session = await Session.findById(sessionId);
  // Session.findById() = MongoDB query
  // session now contains:
  // {
  //   _id: ObjectId(...),
  //   participants: [...],
  //   code: 'const x = 5; ...',
  //   notes: 'User's private notes',
  //   question: 'How do you implement binary search?',
  //   language: 'javascript',
  //   status: 'active',
  //   timerEnd: 2024-01-15T10:30:00Z,
  //   ...
  // }
  
  // Step 4: Send session data to this user
  socket.emit('session-data', {
    // socket.emit() = Send to THIS socket ONLY (private)
    // Not broadcast to all in room - just this user
    
    question: session.question,      // Interviewer question
    code: session.code,              // Shared code
    language: session.language,      // Programming language
    notes: session.notes,            // User's private notes (only candidate sees)
    status: session.status,          // 'active', 'ended', etc.
    timerEnd: session.timerEnd,      // When timer ends (for countdown)
    participants: session.participants // Both users in session
  });
  // Frontend receives:
  //   socket.on('session-data', (data) => {
  //     setCode(data.code);
  //     setQuestion(data.question);
  //     setNotes(data.notes);
  //     // ... restore all UI state from database
  //   })
  
  // Example scenario:
  // - User A and B are in interview
  // - User A types code
  // - Backend: socket.to(sessionId).emit('code-update', code)
  // - Both sockets in room receive it (both code updated)
  // - User A refreshes page
  // - New socket connection
  // - Calls join-room again
  // - Fetches latest code from DB
  // - socket.emit('session-data', {code: 'latest from DB'})
  // - User A's UI updated with latest code
  // - Seamless experience
});

// Key difference from broadcast events:
// socket.on('code-change'):
//   socket.to(sessionId).emit() = Broadcast to all in room
// socket.on('join-room'):
//   socket.emit() = Send only to joining user
//   socket.join() = Register with room for future broadcasts
```

---

### Key Methods

| Method | What it does | Example |
|--------|-------------|----------|
| `socket.on(event, handler)` | Listen for event from frontend | `socket.on('code-change', (data) => {...})` |
| `socket.emit(event, data)` | Send event to this socket only (private) | `socket.emit('session-data', {...})` |
| `socket.to(room).emit()` | Broadcast to room EXCEPT sender | `socket.to(sessionId).emit('code-update', code)` |
| `io.to(room).emit()` | Broadcast to room INCLUDING sender | `io.to(sessionId).emit('timer-update', {timerEnd})` |
| `socket.join(room)` | Add socket to room (for broadcasts) | `socket.join(sessionId)` |
| `socket.leave(room)` | Remove socket from room | `socket.leave(sessionId)` |
| `socket.data` | Custom data storage on socket | `socket.data.activeSessionId = sessionId` |
| `io.use(middleware)` | Run code before connection allowed | `io.use(async (socket, next) => {...})` |
| `jwt.verify(token, secret)` | Verify JWT token is valid | `const decoded = jwt.verify(token, secret)` |
| `User.findById(id)` | Query MongoDB for user by ID | `const user = await User.findById(id)` |
| `Session.findByIdAndUpdate(id, update)` | Find and update session in DB | `await Session.findByIdAndUpdate(id, {code})` |
| `Date.now()` | Get current timestamp in milliseconds | `const now = Date.now()` |
| `.select('-password')` | Exclude field from MongoDB query | `.select('-password')` excludes password |
| `.splice(index, count)` | Remove items from array | `array.splice(0, 1)` removes first item |
| `.findIndex(condition)` | Find position of item in array | `array.findIndex(x => x.id === 5)` returns position |

---

### Interview Q&A

**Q: What's difference between socket.emit() and socket.to()?**
A: emit() sends to frontend that created socket. to() broadcasts to room (other users). Both are backend operations.

**Q: Why save to database if Socket.IO already syncs?**
A: If page refreshes, Socket.IO data lost. Database persists data. When user rejoins room, fetches from DB to restore state.

**Q: How does Socket.IO handle multiple users editing same code?**
A: Last update wins. Each emit overwrites previous. Not ideal for true collaborative editing (Google Docs uses Operational Transformation for better conflict resolution).

**Q: What happens if user in queue disconnects?**
A: 'disconnect' event fires. removeFromQueue() called. They're removed from queue. If already matched and in room, partner gets 'partner-left' event.

**Q: Why authenticate Socket.IO separately from HTTP?**
A: Socket.IO connection is separate from HTTP. Token sent in socket.handshake.auth. Server must verify just like HTTP requests.

**Q: Can two users join same sessionId?**
A: Yes, that's the point. Both use sessionId as room name. Both receive broadcasts to that room.

**Q: What if network drops for 5 seconds?**
A: Socket.IO automatically reconnects. Backend might think user disconnected, but if reconnection within timeout, continues. Otherwise marked as disconnected.

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Socket.IO** | Persistent connection, not request-response |
| **Authentication** | Verify JWT token before allowing socket connection |
| **Rooms** | Isolate communications by sessionId |
| **Broadcasting** | socket.to() sends to room, io.to() includes sender |
| **Persistence** | Save to DB so data survives page refresh |
| **Disconnection** | Handle gracefully - notify partner, clean up |
