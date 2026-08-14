# PeerPrep: 20 Interview Questions

---

## **Question 1: How does the user matching algorithm work?**

**Flow:**
```
User clicks "Find Peer" 
  ↓
Frontend sends 'find-peer' event with their role preference (candidate/interviewer)
  ↓
Backend adds user to waitingQueue array in memory
  ↓
Backend runs findMatch() function:
  Loop through all users in queue
  Check if any user has OPPOSITE role preference
  If found: Match them, create Session, remove both from queue
  If not found: Keep waiting
  ↓
Both users notified via 'matched' event with sessionId
```

**Interview Answer:**

"So the matching algorithm is actually quite simple. When a user clicks 'Find Peer', we add them to an in-memory array called waitingQueue. Then we iterate through that queue looking for someone with the opposite role preference.

For example, if Alice wants to be a candidate, we look for someone who wants to be an interviewer. We check each person in the queue: skip if same userId, skip if same role. When we find someone with opposite role, that's our match!

Then we create a Session document in MongoDB with both participants, and send a 'matched' event to both users with the sessionId. They navigate to the interview room and start.

The key thing is we use JavaScript array for the queue instead of database because it's much faster - no database round trips while searching. Once matched, we create the Session in MongoDB for persistence.

The algorithm is O(n) - linear time - because we loop through the queue once. In production, if we had thousands of users, we might optimize with hash tables or separate queues per role, but for now this works well."

---

## **Question 2: Why use Socket.IO instead of just HTTP requests?**

**Flow:**
```
HTTP (traditional):
  Client: GET /api/status → Send → Wait for response
  Server sends response
  Connection closes
  If something changes: Client must poll again every few seconds
  Result: Wasteful, delayed updates
  
Socket.IO (real-time):
  Client connects once: socket = io(url, {auth: token})
  Connection stays open (persistent WebSocket)
  Server can push updates: socket.emit('code-update', code)
  Client receives instantly
  Multiple users synced in real-time
  No polling needed
```

**Interview Answer:**

"Good question. With HTTP alone, every update would need a new request. If user types code, they'd need to send HTTP request every keystroke - that's super inefficient and creates lag.

With Socket.IO, we maintain a persistent WebSocket connection. When user types code, we just emit an event to the server, and the server broadcasts to the other user's socket in the same room. Both see code update instantly.

Think of it like messaging - HTTP would be like sending emails (slow, need to refresh to check for new mail). Socket.IO is like a live chat (instant, persistent connection).

The other benefit is authentication. Socket.IO has a handshake mechanism where we verify the JWT token before allowing connection. So we know only authenticated users can connect and participate.

Also, Socket.IO handles reconnection automatically. If someone's internet drops for 5 seconds, Socket.IO tries to reconnect automatically instead of losing the connection."

---

## **Question 3: How do you handle database persistence vs real-time updates?**

**Flow:**
```
User types code in Monaco editor
  ↓
Frontend: socket.emit('code-change', {sessionId, code})
  ↓
Backend receives event:
  1. BROADCAST (instant): socket.to(sessionId).emit('code-update', code)
     Other user sees code change immediately
  
  2. SAVE (persistence): await Session.findByIdAndUpdate(sessionId, {code})
     Saves to MongoDB
  ↓
If page refreshes:
  Frontend calls socket.emit('join-room', sessionId)
  Backend queries: Session.findById(sessionId)
  Backend sends 'session-data' with latest code from DB
  Frontend restores UI with saved code
  ↓
Result: Real-time AND persistent
```

**Interview Answer:**

"This is important - we do BOTH. We broadcast in real-time to other user, and we also save to database.

When user types code, we immediately broadcast the change via Socket.IO to the other user - this gives instant feedback. But we also save to MongoDB so the data persists.

Why both? Because Socket.IO data only exists in memory while users are connected. If someone refreshes page or loses connection, we need to restore from database.

So the flow is: User types → Broadcast to other user (real-time) → Save to database (persistence).

Later, when user refreshes or reconnects:
- They emit 'join-room' event
- Backend fetches latest session from MongoDB
- Backend sends all current state (code, notes, timer, etc) to frontend
- Frontend restores UI with saved data
- They continue where they left off

This way we get best of both worlds: instant updates for experience, plus persistence for reliability."

---

## **Question 4: How do you prevent race conditions when multiple users update simultaneously?**

**Flow:**
```
Example: Both users click upvote at same time on same experience

Traditional (bad):
  User1: Read upvotes = [user2], Add user1, Save = [user2, user1]
  User2: Read upvotes = [user2], Add user2, Save = [user2] ❌ Missing user1!
  
MongoDB (good):
  User1: findByIdAndUpdate → MongoDB handles atomically
  User2: findByIdAndUpdate → MongoDB handles atomically
  Result: Both added correctly = [user2, user1, user2, ...] ✓
  
  MongoDB ensures operations don't overlap:
  1. Find document
  2. Read current state
  3. Modify
  4. Save
  All happens as atomic unit, no interleaving
```

**Interview Answer:**

"Great question. So with concurrent operations, you can have race conditions if not careful.

Example: Two users upvoting same experience at exactly same time. If we do: read-modify-write separately, the second person might overwrite the first person's upvote.

But MongoDB's findByIdAndUpdate() is atomic. It means: find, update, and save all happen as ONE operation that can't be interrupted. No other operation can sneak in between.

So when user1 and user2 both send upvote requests:
- User1's findByIdAndUpdate runs: Find experience, add user1 to upvotes array
- User2's findByIdAndUpdate runs: Find experience, add user2 to upvotes array
- MongoDB handles these sequentially at database level
- Both additions are preserved

If we did it manually (find, then modify, then save), we could lose data when both read same version.

Another example in our code: the Session update. When both users change code simultaneously, each emit triggers socket.to().emit() AND findByIdAndUpdate(). MongoDB makes sure both saves complete without conflict.

For highly concurrent scenarios, you might use version numbers or timestamps to detect conflicts, but for our use case, MongoDB's atomic operations are sufficient."

---

## **Question 5: Why is JWT token better than session-based authentication?**

**Flow:**
```
Session-based (traditional):
  User logs in → Server creates session → Stores in server memory/DB
  Client gets session ID cookie
  Every request: Check if session ID exists in server
  Problem: Need shared session storage (hard to scale to multiple servers)

JWT (stateless):
  User logs in → Server signs JWT token with secret
  JWT contains: {userId, email, iat, exp} signed with SECRET
  Client stores token in localStorage
  Every request: Client sends token in header
  Server verifies: jwt.verify(token, SECRET)
  If signature valid and not expired: User is authentic
  Problem: Can't revoke immediately (but expiry time helps)
  
Result: No server-side session storage needed
        Scales to multiple servers easily
        Mobile/web both use same token approach
```

**Interview Answer:**

"JWT is stateless, session-based is stateful. That's the key difference.

With sessions, when user logs in, server creates a session object and stores it in memory or database. Then client gets a session ID. For every request, server must look up that session ID in storage.

This is fine for small servers, but imagine we scale to 10 servers. User logs in to server 1, session stored there. User makes next request to server 2. Server 2 doesn't have that session! We'd need shared session storage (Redis, etc).

With JWT, the token itself contains the information. Server signs it with a secret. User sends token with every request. Server just verifies the signature - if signature is valid, we know the token hasn't been tampered with.

So no server-side storage needed. Server 1, 2, 3... all can verify same token because they share the same secret.

In our code:
```javascript
const token = jwt.sign({user: {id: userId}}, process.env.JWT_SECRET, {expiresIn: '7d'});
```

When user sends this token in header, we verify:
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

If signature invalid or expired: Throws error. If valid: Decoded user info is in payload.

Also, JWT works great for mobile and web - both just store token and send in header. Sessions would need cookie management which is more complex for mobile."

---

## **Question 6: How does the rich text editor store data? Why JSON instead of HTML?**

**Flow:**
```
User writes in Tiptap editor:
  Types: "My experience"
  Clicks Bold
  Selects text and clicks Heading
  
HTML approach (bad):
  Store: "<p><b>My experience</b></p>"
  Problem: Hard to edit (parse HTML), transform (to markdown?), validate
  What if you want to change to markdown? Hard to convert back

JSON approach (good):
  Store as: {
    type: "doc",
    content: [
      {type: "paragraph", content: [{type: "text", text: "My "}]},
      {type: "paragraph", content: [{type: "text", marks: [{type: "bold"}], text: "experience"}]},
      {type: "heading", attrs: {level: 1}, content: [{type: "text", text: "..."}]}
    ]
  }
  
When displaying:
  JSON → (Tiptap generateHTML) → HTML → Browser renders
  
Alternative: JSON → (Custom function) → Markdown
            or JSON → (Custom function) → Plain text (for search)
```

**Interview Answer:**

"Good question. We use Tiptap editor which stores everything as JSON, not HTML.

JSON is much more flexible. It's a structured tree of content with metadata. Each node knows its type (paragraph, heading, code block), and its marks (bold, italic).

HTML is just markup - it's final format for rendering. If later you want to convert to markdown or plain text or something else, HTML is hard to parse back. But JSON structure makes it easy.

Also, with JSON:
- Easy to validate: Check if all content within length limits
- Easy to transform: Extract just text for search, convert to markdown
- Easy to edit programmatically: Add, remove, modify nodes
- Version control friendly: Same content can render differently

In our code:
```javascript
const json = editor.getJSON();  // Get JSON from editor
onChange(JSON.stringify(json)); // Convert to string to store
```

When storing in database, we store the JSON string.

When displaying on detail page:
```javascript
const htmlContent = generateHTML(parsed, [StarterKit, LinkExt, CodeBlockLowlight]);
// JSON → HTML using Tiptap's generateHTML with extensions
```

So JSON is the internal format, HTML is just the display format. This separation is powerful."

---

## **Question 7: How do you calculate average ratings efficiently?**

**Flow:**
```
Bad approach (fetch all feedbacks):
  GET /api/feedback/{userId}
  Database returns: [5, 4, 3, 5, 2, 4, 5, ...]  (1000 records)
  Frontend loops: sum / count = average
  Problem: Fetch lots of data, calculate in code
  
Good approach (MongoDB aggregation):
  GET /api/feedback/stats/{userId}
  
  Pipeline:
  1. $match: Find all feedback WHERE toUser = userId
     Result: [5, 4, 3, 5, 2, 4, 5, ...]
  
  2. $group: Group all, calculate
     _id: null (group everything)
     avgCommunication: $avg of [5, 4, 3, 5...] = 4.1
     avgTechnical: $avg of [4, 3, 2, 3...] = 3.2
     avgOverall: $avg of [4.5, 3.5, 2.5...] = 3.8
     count: $sum 1 = 8 records
  
  3. Returns: {avgCommunication: 4.1, avgTechnical: 3.2, count: 8}
     
  Result: One aggregation pipeline query
          Returns only aggregated numbers (not individual records)
          Database does calculation, not code
```

**Interview Answer:**

"This is a great example of database optimization. We use MongoDB aggregation pipeline instead of calculating in code.

Bad way: Query all 1000 feedback records, bring to frontend or backend code, loop through, calculate average. That's slow and uses lots of memory.

Good way: MongoDB aggregation pipeline. We tell MongoDB to do the calculation at database level.

The pipeline has stages:
1. $match: Filter to only feedback where toUser = current user
2. $group: Group all matched records together and calculate averages

It's like SQL GROUP BY with aggregate functions.

In our code:
```javascript
const stats = await Feedback.aggregate([
  {$match: {toUser: userId}},
  {$group: {
    _id: null,
    avgCommunication: {$avg: '$communication'},
    avgTechnical: {$avg: '$technical'},
    avgOverall: {$avg: '$overall'},
    count: {$sum: 1}
  }}
]);
```

MongoDB does all the work. Returns just one record with the aggregated stats. Not 1000 records.

This is much faster and more efficient. Database is optimized for this kind of calculation."

---

## **Question 8: How do you handle pagination for large lists of experiences?**

**Flow:**
```
Without pagination (bad):
  GET /api/experiences
  Database: SELECT * FROM experiences
  Returns: 10,000 records!
  Frontend loads: All 10,000 at once
  Problem: Slow, memory intensive, UI hangs
  
With pagination (good):
  GET /api/experiences?page=1&limit=10
  Database: SELECT * FROM experiences LIMIT 10 OFFSET 0
  Returns: First 10 records only
  Frontend loads: 10 records
  
  When user scrolls to bottom:
  GET /api/experiences?page=2&limit=10
  Returns: Next 10 records (items 11-20)
  Frontend appends to list
  
  Result: Small batches, fast loading, infinite scroll
```

**Interview Answer:**

"Good question. In our current code we don't have pagination, but this is definitely something we should add as platform grows.

Right now we're fetching all experiences in one query. That works fine when we have 100 experiences, but imagine 10,000 - browser would struggle to render all.

The solution is pagination. Instead of:
```
GET /api/experiences
```

We do:
```
GET /api/experiences?page=1&limit=10
```

Backend then:
```javascript
const skip = (page - 1) * limit;
const experiences = await Experience.find(filter)
  .skip(skip)
  .limit(limit);
```

So page 1: skip 0, limit 10 = records 1-10
   page 2: skip 10, limit 10 = records 11-20
   page 3: skip 20, limit 10 = records 21-30

Frontend loads first page automatically. When user scrolls near bottom, load next page and append.

Benefits:
- Faster initial load: Only 10 records instead of 10,000
- Less memory: Browser not storing all records
- Better UX: Feels snappy
- Scalable: Works with millions of records

For really large datasets, you'd use cursor-based pagination instead of offset, but for our scale, offset pagination is fine."

---

## **Question 9: What security measures do you have in place?**

**Flow:**
```
1. Authentication: JWT tokens
   - Password hashed with bcryptjs (salt factor 10)
   - Token expires in 7 days
   - Stored in localStorage (frontend)
   
2. Authorization: 'auth' middleware
   - Verify JWT on every protected request
   - Extract user ID from token
   - Attach to req.user for route handlers
   
3. Data validation:
   - Experience content: maxlength 20000
   - Unique index on (session, fromUser) for feedback
   - Enum validation on fields (year: TE/BE/Other)
   
4. API security:
   - CORS: Only allow frontend domain
   - HTTP only cookies for sensitive data
   - Rate limiting (not implemented, but should add)
   
5. Database security:
   - Passwords never returned in responses
   - .select('-password') on all user queries
   - No SQL injection (using Mongoose, not raw SQL)
```

**Interview Answer:**

"Security has several layers in our app.

First, authentication. When user signs up:
```javascript
const salt = await bcrypt.genSalt(10);
user.password = await bcrypt.hash(password, salt);
```

We hash the password with a salt factor of 10. Even if database is compromised, attacker can't see original passwords.

When user logs in, we verify:
```javascript
const isMatch = await bcrypt.compare(password, user.password);
```

If password matches, we create JWT token:
```javascript
jwt.sign({user: {id: userId}}, SECRET, {expiresIn: '7d'});
```

Token expires in 7 days so even if stolen, only works for 7 days max.

For authorization, every protected route has 'auth' middleware:
```javascript
router.put('/profile', auth, async (req, res) => {...});
```

This verifies JWT before allowing request. Attacker can't access without valid token.

For data protection:
- We never return passwords: `.select('-password')`
- We validate inputs: experience.content has maxlength, year is enum
- Unique indexes prevent duplicates: feedback can't be submitted twice for same session

Things we should add in production:
- Rate limiting: Prevent brute force attacks
- CORS: Only allow requests from our frontend domain
- HTTPS only: Tokens only sent over encrypted connections
- Input sanitization: Prevent XSS attacks
- Request validation: Schema validation for all inputs"

---

## **Question 10: How do you handle WebRTC connection? What are STUN servers?**

**Flow:**
```
Problem: Two users behind different firewalls/NATs
  User A (IP: 192.168.1.5 local, ISP IP: 203.0.113.10)
  User B (IP: 192.168.1.10 local, ISP IP: 198.51.100.20)
  Can't directly connect - don't know each other's real IPs

Solution: STUN servers
  User A: "STUN server, what's my public IP?"
  STUN: "203.0.113.10:54321"
  
  User A creates RTCPeerConnection:
  1. Gathers ICE candidates (possible connection paths)
     - Direct IP: 192.168.1.5:port (local, won't work for B)
     - Public IP: 203.0.113.10:54321 (works!)
     - Multiple candidates (STUN tries different IPs)
  
  2. Sends offer to User B via Socket.IO (signaling)
  3. B receives offer, creates answer
  4. Both exchange ICE candidates
  5. Browser tries candidates in order
  6. First one that works = connection established!
  7. P2P video/audio flows directly between peers
```

**Interview Answer:**

"WebRTC is peer-to-peer video calling. But getting two users to connect is tricky because of firewalls and NAT.

NAT is Network Address Translation - your home router. You have private IP inside network (192.168.1.5), but to outside world, your ISP assigns public IP (203.0.113.10). Behind firewall, so external device can't directly connect.

That's where STUN servers come in. STUN = Simple Traversal of UDP through NATs. It's basically a server that tells you: 'Hey, your public IP is this and port is this.'

Here's the flow:
1. User connects to STUN server
2. STUN tells them their public IP
3. User creates RTCPeerConnection and gathers ICE candidates
4. ICE = Interactive Connectivity Establishment. Tries multiple connection methods:
   - Direct connection
   - Through STUN server
   - Through relay server (TURN - if STUN fails)

In our code:
```javascript
const peer = new RTCPeerConnection({
  iceServers: [{urls: ['stun:stun.l.google.com:19302']}]
});

peer.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', event.candidate);
  }
};
```

We use Google's free STUN server. When connection established, ICE candidates exchanged via Socket.IO (signaling). Browser tries them until one works.

Once connected, video/audio flows directly peer-to-peer. Very efficient - no server relay needed."

---

## **Question 11: How do you prevent the same user from being matched twice?**

**Flow:**
```
After match:
  User removed from waitingQueue
  
Example (bad):
  waitingQueue = [userA, userB, userC]
  userA and userB matched
  But code doesn't remove them
  Result: They're matched again with userC!

Our code (good):
  Match found: userA and userB
  Remove both:
    waitingQueue = waitingQueue.filter(u => 
      u.userId !== userA.userId && u.userId !== userB.userId
    )
  Result: waitingQueue = [userC]
  
  Both userA and userB now in active session
  If they try to search again while already in session:
  Session status = 'active' or 'ended'
  Can't emit 'find-peer' again until session ends
```

**Interview Answer:**

"Good question. So when two users are matched, we remove them from the waitingQueue immediately.

In our findMatch function:
```javascript
function findMatch(currentUserId) {
  const current = waitingQueue.find(...);
  for (const other of waitingQueue) {
    if (other.userId.equals(currentUserId)) continue; // Skip self
    if (currentRole === otherRole) continue; // Skip same role
    return {user1: current, user2: other}; // Found match
  }
  return null;
}
```

Once we find match and create Session, we remove both from queue:
```javascript
waitingQueue = waitingQueue.filter(q => 
  q.userId !== user1.userId && q.userId !== user2.userId
);
```

So they're no longer in queue. Even if they try to search again, they're not in queue - they're in active session.

Also, during session, their socket is in a room (socket.join(sessionId)). When session ends, they're removed from room. Only then can they search again.

Additional safeguard: When user disconnects, we check:
```javascript
const roomId = socket.data.activeSessionId;
```

If they're in a room, we end the session. If they're in queue, we remove from queue.

So there's no way to be matched twice simultaneously."

---

## **Question 12: How do you sync timer across two users without drift?**

**Flow:**
```
Bad approach (send duration):
  User A: "Start 15 min timer"
  Backend: "Timer duration is 900 seconds"
  Send to User A and User B
  
  User A receives: 10:00:00 AM, starts countdown from 900
  Network delay...
  User B receives: 10:00:01 AM, starts countdown from 900
  Result: They see different times! (1 second off)

Good approach (send endpoint):
  User A: "Start 15 min timer at 10:00:00 AM"
  Backend calculates: timerEnd = now + 900 seconds = 10:15:00 AM
  Send timerEnd to BOTH: "Timer ends at 10:15:00 AM"
  
  User A: Calculates: 10:15:00 - 10:00:00 = 15 min
  User B: Calculates: 10:15:00 - 10:00:01 = 14:59 min
  
  Every 100ms:
  remaining = timerEnd - now()
  Both use same endpoint, so always in sync!
```

**Interview Answer:**

"This is a clever optimization. If we just send duration, users will drift because of network delays.

We send an absolute endpoint timestamp instead. Let me explain:

Backend calculates:
```javascript
const timerEnd = new Date(Date.now() + duration * 1000);
io.to(sessionId).emit('timer-update', {timerEnd});
```

So we're sending: 'Timer ends at 10:15:00 AM' (an absolute time).

Frontend doesn't say 'start counting down from 900'. Instead:
```javascript
const remaining = timerEnd - Date.now();
```

Every 100ms, we recalculate remaining time by subtracting current time from endpoint.

This way, even if User A receives message at 10:00:00 and User B at 10:00:01, they both calculate based on same endpoint. The 1 second difference is negligible - they'll see almost same countdown.

If User A has 14:59 remaining and User B has 15:00, both are close enough. As they count down, they'll be in sync.

Also, if user refreshes page mid-timer:
```javascript
const session = await Session.findById(sessionId);
socket.emit('session-data', {timerEnd: session.timerEnd});
```

Frontend knows the endpoint and continues countdown. No time lost!

This approach is so much better than duration-based because it's not affected by network delays or clock skew."

---

## **Question 13: How do you handle anonymous users?**

**Flow:**
```
User setting:
  identityPreference = 'Anonymous' or 'Named'

When matching:
  getPartnerDetails(userEntry, identityPreference):
    if 'Anonymous':
      return {anonymous: true}
      # Don't send name, college, etc
    else:
      return {anonymous: false, name: 'Alice', ...}

Example:
  Alice (Anonymous) matches Bob (Named)
  
  Alice sees: "Interviewer (Name hidden)"
             "College: hidden"
  
  Bob sees:  "Candidate: Alice"
             "College: IIT Bombay"
             "Batch: 2026"

In experience sharing:
  Anonymous users can still post experiences
  But author shows as "Anonymous" if they chose anonymous
  Others can't trace back to find their profile

Database stores userId, so admin can see who posted
But other users only see "Anonymous"
```

**Interview Answer:**

"Good privacy feature. Users can choose to stay anonymous during interviews.

When we do the match, we check their identity preference:
```javascript
function getPartnerDetails(userEntry, identityPreference) {
  if (identityPreference === 'Anonymous') {
    return {anonymous: true};
  }
  return {anonymous: false, name: userEntry.name, ...};
}
```

So if they want anonymous, we don't send their name. Other user just sees 'Anonymous Interviewer' or 'Anonymous Candidate'.

But internally, we still store their userId in the Session. This is important for:
- Giving feedback to them later
- Tracking their interview history
- Moderation (if abuse, we can see who did it)

When they share an experience later:
- If they posted while anonymous setting was on, experience shows 'Anonymous'
- If named, shows their name

This encourages honesty in interviews. Some people might give harsh feedback if they think they can't be identified. Some people get nervous being identified. Anonymous option helps both.

The key is: Users can't trace anonymous person back to profile. But internally for our records, we know who they are (admin can see). This balances privacy with accountability."

---

## **Question 14: How would you scale this to 100,000 concurrent users?**

**Flow:**
```
Current bottlenecks:
  1. waitingQueue in memory (one server only)
  2. Socket.IO connections (one server, ~10K connections max)
  3. Database queries (no caching)
  4. File uploads (no CDN)

Scaling solution:

1. Load balancing:
   Multiple Node.js servers
   Load balancer distributes connections
   But waitingQueue fragmented! User on Server1, matcher on Server2

2. Redis for queue:
   Instead of array in memory:
   RPUSH queue:waiting {userId, role, preferences}
   BLPOP queue:waiting (blocking pop - wait for next)
   All servers read from same Redis queue
   Centralized matching

3. Socket.IO with Redis adapter:
   io.adapter(redis.adapter())
   Multiple servers share rooms
   io.to(sessionId).emit() reaches users on different servers

4. Database:
   - Add caching layer: Redis cache for popular experiences
   - Read replicas: Multiple database read instances
   - Connection pooling: Reuse DB connections

5. CDN:
   - Static files on CDN (frontend JS, CSS)
   - Rich text content cached at edge

6. Message queues:
   - Heavy operations (email, analytics) async via RabbitMQ
   - Don't block main request

Architecture becomes:
  Load Balancer → [Server1, Server2, Server3...]
                ↓
             Redis (queue, adapter, cache)
                ↓
          Database + Read Replicas
```

**Interview Answer:**

"Great question. Currently we're single server, which works fine for hundreds of users. But for 100k concurrent, we need major scaling changes.

The first issue is our waitingQueue is in memory on one server. If we have 5 servers, each has its own queue. User searching on Server1 can't match with user on Server2.

Solution: Move queue to Redis. Redis is fast, in-memory store that all servers can access:
```javascript
// Instead of: waitingQueue.push(user)
// Do: await redis.rpush('queue:waiting', JSON.stringify(user))
// And: const nextUser = await redis.blpop('queue:waiting')
```

All servers read from same queue. Matching works globally.

Next issue: Socket.IO connections. Single server can handle ~10k connections. With 5 servers, we can handle 50k. But Socket.IO data is server-specific. If User A's socket on Server1 sends message to sessionId, User B's socket on Server2 won't receive it.

Solution: Socket.IO Redis adapter:
```javascript
io.adapter(createAdapter(redis));
```

Now when we do io.to(sessionId).emit(), it reaches users on ANY server. Redis pub/sub handles the broadcasting across servers.

For database:
- Add Redis cache layer for frequently accessed data
- Add read replicas so reads can scale independently
- Connection pooling to reuse connections

For frontend assets:
- Use CDN for static files (JavaScript, CSS, images)
- Serve from edge servers closer to users

Heavy operations like sending emails or analytics:
- Move to message queue (RabbitMQ, Kafka)
- Don't block main request handler

The architecture becomes:
- Multiple app servers behind load balancer
- Redis for queue, caching, Socket.IO adapter
- Database with read replicas
- CDN for static files
- Message queue for async jobs

This can scale to millions of users."

---

## **Question 15: How do you handle session timeout and cleanup?**

**Flow:**
```
Session lifecycle:

Created: User matched
  status = 'active'
  createdAt = now
  participants = [user1, user2]

During interview:
  Code updates
  Timer running
  Notes being taken

Interview ends (normal):
  User clicks "End Interview"
  status = 'ended'
  Both users see feedback modal
  
Interview ends (disconnect):
  User loses connection
  disconnect event fires
  status = 'ended'
  Partner gets 'partner-left' notification

Timeout cleanup:
  Session inactive for 2 hours?
  Cron job: Find sessions where (now - updatedAt) > 2 hours
  Delete or archive old sessions
  
Database cleanup:
  Keep last 100 session revisions (for history)
  Archive very old sessions to separate collection
  Prevents DB from growing infinitely
```

**Interview Answer:**

"Good thinking about cleanup. Right now we don't have explicit timeout, but we should.

When user ends interview normally:
```javascript
socket.on('end-interview', async ({sessionId}) => {
  io.to(sessionId).emit('interview-ended');
  await Session.findByIdAndUpdate(sessionId, {status: 'ended'});
});
```

When user disconnects:
```javascript
socket.on('disconnect', async () => {
  const roomId = socket.data.activeSessionId;
  if (roomId) {
    socket.to(roomId).emit('partner-left');
    await Session.findByIdAndUpdate(roomId, {status: 'ended'});
  }
});
```

So session marked as 'ended'. But we don't delete it - keep it for history and replay.

For automatic timeout, we should add:
```javascript
// Cron job runs every hour
cron.schedule('0 * * * *', async () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  await Session.deleteMany({
    status: 'active',
    updatedAt: {$lt: twoHoursAgo}
  });
});
```

This finds sessions that are still 'active' but haven't been updated in 2 hours. Means both users are gone. Delete them.

For database growth:
- Archive very old sessions (> 1 year) to separate 'sessions_archive' collection
- Keep recent sessions for quick access
- Add indexes on createdAt for efficient queries

We should also track:
- Session duration
- Number of code updates (activity level)
- If interview completed normally vs disconnected
- For analytics: average interview length, completion rate, etc.

The key is: Don't keep orphaned sessions forever. Clean up regularly."

---

## **Question 16: How do you prevent users from cheating or gaming the system?**

**Flow:**
```
Possible cheating:
  1. User upvotes their own experience 100 times
  2. User creates multiple accounts to match with self
  3. User gives fake feedback (rate 5 stars without attending)
  4. User writes inappropriate content

Prevention:

1. Upvote limits:
   Check: hasUpvoted(experience)
   If user already in upvotes array: Already voted
   Can't vote twice - toggle removes it
   
   Additional: Could rate limit per user (max 10 upvotes per hour)

2. Matching verification:
   Only users in same session can give feedback
   Session stores both participants
   When submitting feedback:
   Check: Is current user a participant in this session?
   If no: Return error
   
   Can't give feedback for session you weren't in

3. Reputation system (future):
   New users: Can only post 5 experiences in first day
   After 1 month: Unlimited
   If many people flag content: User restricted
   
4. Content moderation:
   Filter inappropriate words
   Users can flag content as inappropriate
   Admin reviews flagged content
   Severe violations: Ban user account
```

**Interview Answer:**

"Good question about integrity. We have some protections, could add more.

For upvoting, we track who upvoted:
```javascript
const alreadyUpvoted = experience.upvotes.some(
  id => id.toString() === userId
);
if (alreadyUpvoted) {
  // Toggle off
} else {
  // Toggle on
}
```

User can vote once. If they vote again, it toggles off. Simple toggle prevents abuse - they can't upvote 100 times.

For matching and feedback:
```javascript
router.post('/', auth, async (req, res) => {
  const {sessionId, communication, technical, overall, note} = req.body;
  
  const session = await Session.findById(sessionId);
  const participant = session.participants.find(
    p => p.user.toString() === req.user.id
  );
  if (!participant) return res.status(403).json({msg: 'Not a participant'});
});
```

We verify: Are you actually a participant in this session? Can't give feedback for session you weren't in.

Database also has:
```javascript
feedbackSchema.index({session: 1, fromUser: 1}, {unique: true});
```

Unique index prevents submitting feedback twice for same session. Tries to submit twice? MongoDB rejects with duplicate key error.

Things we could add:
- Rate limiting: Max 1 upvote per minute per user
- Reputation system: New users limited, trusted users unlimited
- Content moderation: Flag inappropriate posts
- User blocking: Block spam users
- Analytics: Detect if user always gives 5-star ratings (suspicious)

The principle is: Make cheating either impossible (unique index) or detectable (analytics for suspicious patterns)."

---

## **Question 17: How do you handle the rich text content when users share malicious code?**

**Flow:**
```
User shares experience with code block containing:
  <img src=x onerror='alert("XSS")'>
  OR
  <script>stealCookies();</script>

Bad approach: Store raw HTML
  Store: "<img src=x onerror=...>"
  When displaying: Browser executes script!
  Cookies stolen, account hacked

Our approach: Store JSON
  User types in Tiptap editor
  Content stored as: {
    type: "codeBlock",
    language: "javascript",
    content: [{type: "text", text: "<img src=x...>"}]
  }
  
  When displaying:
  generateHTML converts to:
  <pre><code class="language-javascript">
    &lt;img src=x onerror='alert("XSS")'&gt;
  </code></pre>
  
  HTML entities! <img becomes &lt;img&gt;
  Script doesn't execute - just text!

Additional safety:
  1. Sanitize on output: Use DOMPurify library
     Removes dangerous attributes
  
  2. Content Security Policy (CSP) header
     Tells browser: Don't execute inline scripts
     Only execute scripts from specific domains
  
  3. Never use dangerouslySetInnerHTML
     React warns about this for security reason
```

**Interview Answer:**

"Excellent security question. We're careful about this.

First, we store content as JSON, not HTML. This is actually great for security:
```javascript
const json = editor.getJSON();
// Returns: {type: 'codeBlock', content: [{type: 'text', text: '<img src=...>'}]}
```

When displaying, we convert JSON to HTML:
```javascript
const htmlContent = generateHTML(parsed, [StarterKit, CodeBlockLowlight]);
```

Tiptap's generateHTML sanitizes the output. If content has `<img src=x onerror='alert()'>`, it renders as:
```html
<pre><code>&lt;img src=x onerror='alert()'&gt;</code></pre>
```

HTML entities! The dangerous parts are escaped. Browser renders it as text, doesn't execute.

Additional protections:
1. Rate limiting on input: content field has maxlength: 20000
2. Use DOMPurify to sanitize on frontend before displaying
3. Content Security Policy header on backend prevents inline scripts

We should NOT do:
```javascript
<div dangerouslySetInnerHTML={{__html: userContent}} />
```

This would execute any JavaScript in the content. Big security hole.

Instead, we use:
```javascript
<div>{sanitizedContent}</div>
```

Or if we must use HTML:
```javascript
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(htmlContent);
<div dangerouslySetInnerHTML={{__html: clean}} />
```

DOMPurify removes dangerous elements while keeping safe formatting.

The bottom line: Never trust user input. Store safely (JSON), sanitize on output, use libraries designed for security."

---

## **Question 18: How does the code editor sync work in real-time?**

**Flow:**
```
User A types in Monaco editor:
  const add = (a, b) => a + b;
  
MonacoEditor onChange event fires:
  const newCode = "const add = (a, b) => a + b;";
  socket.emit('code-change', {sessionId, code: newCode});
  
Backend receives:
  socket.on('code-change', ({sessionId, code}) => {
    // Broadcast to other user
    socket.to(sessionId).emit('code-update', code);
    
    // Save to database
    await Session.findByIdAndUpdate(sessionId, {code});
  });

User B's browser:
  socket.on('code-update', (code) => {
    editorRef.current.setValue(code);
    // Monaco editor updates with new code
  });

What if both type simultaneously?
  User A types: "const a"
  User B types: "const b"
  Both emit at ~same time
  
  Backend receives A's emit:
    socket.to(sessionId).emit('code-update', "const a");
    Save to DB
    
  Backend receives B's emit:
    socket.to(sessionId).emit('code-update', "const b");
    Save to DB
  
  Problem: Last update wins!
  If A's update arrives first, B sees "const a"
  Then B's update arrives, B sees "const b"
  A sees "const b"
  Result: Diverged! They're working on different code

Solutions:
  1. Last write wins (current - simple, acceptable for our use case)
  2. Operational Transformation: Track operations, merge conflicts
  3. CRDTs: Conflict-free replicated data structures (complex)
```

**Interview Answer:**

"Good question about real-time sync. Let me break it down.

When user types code in Monaco editor, onChange fires:
```javascript
editorRef.current.onDidChangeModelContent((event) => {
  const newCode = editorRef.current.getValue();
  socket.emit('code-change', {sessionId, code: newCode});
});
```

Backend receives:
```javascript
socket.on('code-change', ({sessionId, code}) => {
  socket.to(sessionId).emit('code-update', code);  // Instant
  await Session.findByIdAndUpdate(sessionId, {code});  // Persist
});
```

Other user's browser listens:
```javascript
socket.on('code-update', (code) => {
  editorRef.current.setValue(code);  // Update editor
});
```

So edits are synced instantly to other user.

Now, what if both type at same time?
- User A: Adds `console.log`
- User B: Adds `// comment`
- Both emit simultaneously

Backend processes both, but they overwrite each other. Last one saved wins.

Example:
- Database has: `const x = 5;`
- A emits: `const x = 5; console.log(x);`
- B emits: `const x = 5; // check`
- If A processed first, B's update overwrites it
- Final: `const x = 5; // check`

This is the 'last write wins' conflict strategy. Simple but can lose data.

For enterprise collaboration (like Google Docs), they use Operational Transformation or CRDTs to merge changes intelligently. But those are complex.

For our use case (two users, one is interviewer, one is candidate), last write wins is acceptable because:
- Interviewer usually in control of code
- Candidate mostly answers
- Full conflict is rare

We could improve by:
1. Storing version numbers
2. If version mismatch detected: Fetch latest from DB
3. Show warning: 'Code changed by your partner'

But for now, simple approach works well."

---

## **Question 19: How do you track interview analytics and improvement?**

**Flow:**
```
Data collected:

Per session:
  - Interview type (DSA, HR, etc)
  - Difficulty level
  - Duration (createdAt, endedAt)
  - Outcome (selected, rejected, no decision)
  - Status (completed, abandoned)

Per user:
  - Total interviews
  - Average duration
  - Success rate
  - Average rating (communication, technical, overall)
  - Interview types practiced
  - Companies interviewed

Analytics queries:

1. User dashboard:
   GET /api/stats
   - Communication avg: 4.2 (out of 5)
   - Technical avg: 3.8
   - Total interviews: 15
   
2. Platform stats:
   - Total sessions: 10,000
   - Completion rate: 85%
   - Average rating: 3.9
   - Most popular interview type: DSA
   - Most popular company: Amazon
   
3. Improvement over time:
   - First 5 interviews avg rating: 2.5
   - Last 5 interviews avg rating: 4.1
   - Shows user improving!

Database queries:

User's recent sessions:
  db.sessions.find({participants.user: userId, endedAt: {$gt: oneMonthAgo}})
  
User's average rating:
  db.feedback.aggregate([
    {$match: {toUser: userId}},
    {$group: {_id: null, avgRating: {$avg: '$overall'}}}
  ])

Company-wise statistics:
  db.experiences.aggregate([
    {$group: {_id: '$company', count: {$sum: 1}, avgRating: ...}}
  ])
```

**Interview Answer:**

"Great question. Analytics is crucial for improvement.

We track multiple things:

For individual user:
```javascript
GET /api/feedback/stats
```

Returns average ratings:
```javascript
const stats = await Feedback.aggregate([
  {$match: {toUser: userId}},
  {$group: {
    _id: null,
    avgCommunication: {$avg: '$communication'},
    avgTechnical: {$avg: '$technical'},
    avgOverall: {$avg: '$overall'},
    count: {$sum: 1}
  }}
]);
```

So user knows: 'I scored 4.2/5 on communication across 10 interviews. I can improve technical skills.'

For sessions, we track:
- Duration: How long did interview last?
- Interview type: DSA, HR, System Design?
- Outcome: Selected, rejected, no decision
- When ended: Abandoned (crashed) or completed?

This shows improvement over time:
```javascript
// Get user's sessions from last month
const sessions = await Session.find({
  'participants.user': userId,
  endedAt: {$gt: oneMonthAgo}
}).sort({createdAt: -1});
```

Then calculate trends:
```javascript
// First 5: avg rating 2.5
// Last 5: avg rating 4.1
```

Shows user improving! Very motivating.

For platform:
- Total interviews: 10,000
- Completion rate: 85% (1500 abandoned?)
- Most popular type: DSA (60%), HR (20%), etc
- Most practiced company: Amazon (1000 interviews)

This helps us understand:
- Which features work (high completion = good)
- What users need (DSA most popular = add more DSA content)
- Where to improve (85% completion = why 15% abandoned?)

We could add:
- Time-series graphs: Show improvement over months
- Leaderboards: Top 10 users by rating (motivates)
- Recommendations: 'You're weak in system design, try more SD interviews'
- Badges: 'Complete 10 interviews', '5-star rating', etc

Analytics driving user engagement and improvement!"

---

## **Question 20: How would you add video recording and playback of interviews?**

**Flow:**
```
Current state:
  Real-time video via WebRTC
  Data not persisted

With recording:

Option 1: Client-side recording (bad for large files)
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.start();
  // Record local streams to memory
  mediaRecorder.stop();
  // Get blob of recorded video
  Upload to server (10MB file = slow)
  Problem: Large files, bandwidth intensive

Option 2: Server-side recording (better)
  Use FFmpeg server
  Receive video streams from both users
  Record directly on server
  Save to disk or S3
  Return URL to frontend
  
Architecture:

1. When session starts:
   POST /api/sessions/{id}/start-recording
   Backend: ffmpeg -i rtmp://user1 -i rtmp://user2 output.mp4
   
2. During interview:
   Both users stream to server via RTMP
   FFmpeg muxes both streams into single video
   
3. When session ends:
   POST /api/sessions/{id}/stop-recording
   FFmpeg stops recording
   Video saved: /recordings/session-63a2ce6d.mp4
   
4. Store recording metadata:
   Recording {
     sessionId: '63a2ce6d',
     filePath: 's3://bucket/recording-123.mp4',
     duration: 1200,  // 20 minutes
     uploadedAt: now,
     fileSize: 50000000,  // 50MB
     status: 'processing', 'ready', 'error'
   }

5. Playback:
   User navigates to session
   GET /api/sessions/{id}/recording
   Returns URL to video
   Frontend displays <video src={url} />
   User can watch/download

Technical considerations:

Storage:
  - Local disk: 1000 interviews × 20 min avg = 20,000 hours
  - 5GB per hour compressed = 100TB!
  - Solution: Cloud storage (S3, Google Cloud) with auto-delete after 30 days
  
Privacy:
  - Only allow user to view their own recordings
  - Check: Is sessionId owned by currentUser?
  
Compression:
  - Process video with FFmpeg compression
  - H.264 codec, lower bitrate = smaller file
  - Run async: Don't block main request
  
Transcoding:
  - Different quality versions: 720p, 480p, 240p
  - User chooses based on connection
  - Takes time - use message queue
```

**Interview Answer:**

"Great feature idea! Video recording would really help users review their performance.

Currently we stream video in real-time via WebRTC, but don't persist. Recording adds complexity but high value.

Basic approach:
```
Session starts → Start recording
During interview → Capture both users' streams
Session ends → Stop recording and save
User views session → Can watch recording
```

For implementation, I'd use server-side recording with FFmpeg:

When interview starts:
```javascript
router.post('/sessions/:id/start-recording', auth, async (req, res) => {
  const session = await Session.findById(req.params.id);
  
  // Check user is participant
  const participant = session.participants.find(
    p => p.user.toString() === req.user.id
  );
  if (!participant) return res.status(403).json({msg: 'Not allowed'});
  
  // Start FFmpeg recording
  const recordingId = generateId();
  startRecording(req.params.id, recordingId);
  
  res.json({recordingId});
});
```

During interview, both video streams go to server. FFmpeg captures both and muxes into single video file.

When interview ends:
```javascript
stopRecording(req.params.id);
// Save metadata
await Recording.create({
  sessionId: req.params.id,
  filePath: `s3://bucket/${recordingId}.mp4`,
  duration: 1200,
  status: 'processing'
});
```

To view:
```javascript
router.get('/sessions/:id/recording', auth, async (req, res) => {
  const session = await Session.findById(req.params.id);
  
  // Verify user is participant
  const isParticipant = session.participants.some(
    p => p.user.toString() === req.user.id
  );
  if (!isParticipant) return res.status(403).json({msg: 'Not allowed'});
  
  const recording = await Recording.findOne({sessionId: req.params.id});
  res.json({url: recording.filePath});
});
```

Frontend then displays:
```javascript
<video src={recording.url} controls />
```

Challenges:
- Storage: 1000 interviews × 20 min = HUGE. Solution: S3 + auto-delete after 30 days
- Privacy: Only allow participant to view. Check ownership.
- Compression: Use FFmpeg to compress H.264 format
- Processing time: Run async via message queue so doesn't block

This adds value but complexity. Worth it for serious platform!"

---

## **Summary Table**

| Question | Topic | Key Concept |
|----------|-------|------------|
| 1 | Matching Algorithm | O(n) loop through queue, find opposite role |
| 2 | Socket.IO vs HTTP | Persistent connection vs polling |
| 3 | Persistence vs Real-time | Broadcast + save to DB |
| 4 | Race Conditions | MongoDB atomic operations |
| 5 | JWT vs Sessions | Stateless vs stateful |
| 6 | JSON vs HTML | Flexibility, structured data |
| 7 | Aggregation | MongoDB pipeline, database calculation |
| 8 | Pagination | LIMIT/OFFSET for large datasets |
| 9 | Security | JWT, bcrypt, auth middleware, validation |
| 10 | WebRTC & STUN | P2P connection through firewalls |
| 11 | Duplicate Prevention | Queue removal, session tracking |
| 12 | Timer Sync | Endpoint timestamp vs duration |
| 13 | Anonymous Users | Privacy control, internal tracking |
| 14 | Scaling | Redis, load balancing, read replicas |
| 15 | Cleanup | Timeout, archive, cron jobs |
| 16 | Anti-cheating | Unique indexes, verification, rate limits |
| 17 | XSS Prevention | JSON storage, HTML sanitization |
| 18 | Code Sync | Last write wins, conflict handling |
| 19 | Analytics | Aggregation, user improvement tracking |
| 20 | Recording | Server-side FFmpeg, S3 storage |

---

**Perfect for interviews!** Use these to practice explaining your project to senior engineers. 💼
