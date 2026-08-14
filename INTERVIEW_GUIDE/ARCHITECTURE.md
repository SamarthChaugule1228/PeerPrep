# PeerPrep: System Architecture & Scalability

---

## **Part 1: Current Architecture (Single Server)**

### Diagram: Current Setup

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                     (React 18 + Vite)                        │
│                                                               │
│  ├─ Components: Navbar, FeedbackModal, RichTextEditor        │
│  ├─ Pages: Home, Login, Dashboard, MatchRoom, Profile        │
│  ├─ Services: api.js (Axios interceptor)                     │
│  ├─ Context: AuthContext, ThemeContext                       │
│  └─ Hooks: useWebRTC, useAuth                                │
│                                                               │
│  Styling: Tailwind CSS 3.4.17                                │
│  Build: Vite 4.2.0                                           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP + Socket.IO
                     │ (Axios + Socket.IO-client)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                       │
│                    (Single Express Server)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware                                          │   │
│  │  ├─ auth.js: JWT verification                        │   │
│  │  └─ cors: Cross-origin requests                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes (Express)                                    │   │
│  │  ├─ /api/auth: Login, Register, Profile             │   │
│  │  ├─ /api/experiences: CRUD operations               │   │
│  │  ├─ /api/feedback: Ratings & aggregation            │   │
│  │  └─ /api/match: Pairing logic                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Socket.IO (Real-time, In-memory)                   │   │
│  │  ├─ Namespaces: /                                    │   │
│  │  ├─ Rooms: sessionId                                 │   │
│  │  ├─ Events:                                          │   │
│  │  │  ├─ find-peer: Add to waitingQueue[]              │   │
│  │  │  ├─ matched: Notify both users                    │   │
│  │  │  ├─ code-change: Broadcast code updates           │   │
│  │  │  ├─ ice-candidate: WebRTC signaling               │   │
│  │  │  └─ end-interview: Mark session ended             │   │
│  │  └─                                                  │   │
│  │  State (In-memory):                                 │   │
│  │  └─ waitingQueue = [{userId, rolePreference, ...}]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Models (Mongoose)                                   │   │
│  │  ├─ User: name, email, password (hashed)             │   │
│  │  ├─ Session: code, participants, timer, feedback     │   │
│  │  ├─ Experience: company, content, upvotes            │   │
│  │  ├─ Feedback: communication, technical, overall      │   │
│  │  └─ (No auth tokens table - stateless JWT)           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ TCP Connection
                     │ (Mongoose + MongoDB Driver)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                           │
│                                                               │
│  Collections:                                                │
│  ├─ users                                                    │
│  ├─ sessions                                                 │
│  ├─ experiences                                              │
│  ├─ feedback                                                 │
│  └─ (No sessions table - JWT is stateless)                  │
│                                                               │
│  Indexes:                                                    │
│  ├─ users: {email: 1} UNIQUE                                │
│  ├─ sessions: {participants.user: 1}                        │
│  ├─ experiences: {user: 1, company: 1, createdAt: -1}      │
│  └─ feedback: {session: 1, fromUser: 1} UNIQUE             │
└─────────────────────────────────────────────────────────────┘
```

---

## **Part 2: Architecture Components**

### **Component Breakdown:**

#### **Frontend Layer:**
```
React Components
├─ Pages
│  ├─ Home: Landing page
│  ├─ Login: Authentication
│  ├─ Dashboard: User hub
│  ├─ MatchRoom: Interview room with video/code/timer
│  ├─ Profile: User settings
│  ├─ InterviewExperiences: Community experiences
│  └─ ExperienceDetail: View single experience
│
├─ Components
│  ├─ Navbar: Navigation
│  ├─ Header: Page headers
│  ├─ Footer: Footer
│  ├─ FeedbackModal: 5-star rating modal
│  ├─ PreferenceForm: Interview preferences
│  ├─ ProfileForm: Profile edit form
│  ├─ RichTextEditor: Tiptap editor
│  └─ StarRating: Rating component
│
├─ Context
│  ├─ AuthContext: User login state, token
│  └─ ThemeContext: Light/dark mode
│
├─ Hooks
│  ├─ useWebRTC: Manage WebRTC connections
│  ├─ useAuth: Access auth context
│  └─ Custom hooks for state management
│
├─ Services
│  └─ api.js
│     ├─ Axios instance with interceptors
│     ├─ Auto-adds JWT token to headers
│     └─ Base URL: http://localhost:5000
│
└─ Styling
   └─ Tailwind CSS + postcss-config
```

#### **Backend Layer:**
```
Express Server (Node.js)
├─ Middleware
│  ├─ auth.js: JWT verification
│  │  ├─ Verify token signature
│  │  ├─ Check expiration
│  │  └─ Extract user ID
│  │
│  └─ cors: CORS configuration
│     └─ Allow requests from frontend
│
├─ Routes
│  ├─ /api/auth
│  │  ├─ POST /register: Create user, hash password
│  │  ├─ POST /login: Verify password, return JWT
│  │  └─ PUT /profile: Update user details
│  │
│  ├─ /api/experiences
│  │  ├─ POST /: Create experience
│  │  ├─ GET /: List with filters & sorting
│  │  ├─ GET /:id: Single experience detail
│  │  └─ POST /:id/upvote: Toggle upvote
│  │
│  ├─ /api/feedback
│  │  ├─ POST /: Submit feedback
│  │  ├─ GET /stats/:userId: Aggregated ratings
│  │  └─ GET /:sessionId: Get session feedback
│  │
│  └─ /api/match
│     ├─ POST /find-peer: Add to queue
│     ├─ GET /stats: Leaderboard
│     └─ POST /cancel: Remove from queue
│
├─ Socket.IO Server
│  ├─ Authentication: Verify JWT on connection
│  ├─ Namespace: / (default)
│  ├─ Rooms: sessionId (per interview)
│  ├─ Events
│  │  ├─ 'find-peer': Add user to waitingQueue
│  │  ├─ 'matched': Send sessionId to both users
│  │  ├─ 'code-change': Broadcast code update
│  │  ├─ 'ice-candidate': WebRTC signal exchange
│  │  ├─ 'timer-update': Sync timer state
│  │  ├─ 'end-interview': Mark session ended
│  │  └─ 'disconnect': Clean up on logout
│  │
│  └─ In-Memory State: waitingQueue array
│     └─ Cleared on server restart
│
└─ Models & Database Queries
   ├─ User.js
   │  └─ Schema: name, email, password(hashed), profile fields
   │
   ├─ Session.js
   │  └─ Schema: participants, code, timer, status, feedback
   │
   ├─ Experience.js
   │  └─ Schema: user, company, content(JSON), upvotes, reads
   │
   └─ Feedback.js
      └─ Schema: session, fromUser, toUser, ratings, note
```

#### **Database Layer (MongoDB):**
```
MongoDB Collections & Indexes

users
├─ _id: ObjectId
├─ name: String
├─ email: String (UNIQUE INDEX)
├─ password: String (bcrypt hashed)
├─ college: String
├─ degree: String
├─ branch: String
├─ year: String (enum: TE/BE/Other)
├─ graduationYear: Number
├─ rolePreference: String (candidate/interviewer)
├─ identityPreference: String (anonymous/named)
└─ createdAt: Date

sessions
├─ _id: ObjectId
├─ participants: [{user: ObjectId, role: String}]
├─ code: String
├─ language: String
├─ notes: String
├─ timer: {duration: Number, timerEnd: Date}
├─ status: String (active/ended)
├─ feedback: {toUser: {communication, technical, overall, note}}
├─ createdAt: Date
└─ updatedAt: Date

experiences
├─ _id: ObjectId
├─ user: ObjectId (ref to User)
├─ company: String
├─ role: String
├─ interviewType: String
├─ difficulty: String
├─ outcome: String
├─ mode: String
├─ location: String
├─ content: String (JSON from Tiptap)
├─ upvotes: [ObjectId] (array of user IDs)
├─ reads: Number
├─ createdAt: Date
└─ updatedAt: Date

feedback
├─ _id: ObjectId
├─ session: ObjectId (ref to Session) (UNIQUE with fromUser)
├─ fromUser: ObjectId (ref to User)
├─ toUser: ObjectId (ref to User)
├─ communication: Number (1-5)
├─ technical: Number (1-5)
├─ overall: Number (1-5)
├─ note: String
└─ createdAt: Date
```

---

## **Part 3: Scalable Architecture (100K+ Concurrent Users)**

### **Scalability Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN                                     │
│          (CloudFlare, AWS CloudFront)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Static Assets                                          │   │
│  │  ├─ index.html, main.jsx, bundle.js                    │   │
│  │  ├─ CSS, images                                         │   │
│  │  └─ Cached at edge servers globally                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LOAD BALANCER                                 │
│         (AWS ALB, Nginx, HAProxy)                               │
│                                                                 │
│  ├─ SSL/TLS termination                                        │
│  ├─ Route HTTP/HTTPS to app servers                            │
│  ├─ Route WebSocket to Socket.IO servers                       │
│  ├─ Session stickiness for WebSocket                           │
│  └─ Health checks on app servers                               │
│                                                                 │
│  Routing:                                                       │
│  ├─ /api/* → App Server Cluster                                │
│  ├─ /socket.io → Socket.IO Server Cluster                      │
│  └─ / → CDN or App Server                                      │
└────────────────────┬────────────────────────────────────────────┘
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
   ┌────────┐    ┌────────┐    ┌────────┐
   │ Server │    │ Server │    │ Server │
   │  1-5   │    │  6-10  │    │ 11-15  │
   │(Node.js│    │(Node.js│    │(Node.js│
   │ App)   │    │ App)   │    │ App)   │
   └────────┘    └────────┘    └────────┘
   (auto-scale)   (auto-scale)  (auto-scale)
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
   ┌─────────────────────────────────────────┐
   │     Redis Cluster                       │
   │  (Shared State & Caching)               │
   │                                         │
   │  ├─ Queue: waiting-peer-queue          │
   │  ├─ Cache: session:{id}, user:{id}     │
   │  ├─ Pub/Sub: Message broadcasting      │
   │  └─ Socket.IO Adapter: room data       │
   └────────┬────────────────────────────────┘
            │ TCP (Replication)
            ↓
   ┌──────────────────────────────────────┐
   │  Database Cluster                    │
   │  (MongoDB with Replication)          │
   │                                      │
   │  Primary                             │
   │  ├─ Write operations                │
   │  ├─ Read operations                 │
   │  └─ Replicates to Secondaries       │
   │                                      │
   │  Secondary 1, 2, 3                   │
   │  ├─ Read-only replicas              │
   │  ├─ Automatic failover              │
   │  └─ Backup data                     │
   │                                      │
   │  Backup                              │
   │  ├─ Daily snapshots                 │
   │  └─ Archive to S3                   │
   └──────────────────────────────────────┘

Message Queue (RabbitMQ / Kafka)
├─ Async jobs: Send emails, analytics
├─ Video recording: Process in background
└─ Decouples from main request flow

S3 / Cloud Storage
├─ Video recordings
├─ User uploads
├─ Database backups
└─ Experience attachments
```

---

## **Part 4: Data Flow in Scalable System**

### **User Matching Flow (Scaled)**

```
┌──────────────┐
│ User A clicks│
│"Find Peer"   │
└──────┬───────┘
       │ Socket.IO connect to Server1
       ↓
┌──────────────────────────────────────┐
│ Server1 (Node.js App)                │
├──────────────────────────────────────┤
│ socket.on('find-peer', ({role}) => {│
│   // Add to Redis queue              │
│   redis.rpush('queue:waiting',       │
│     {userId, rolePreference, ...}    │
│   );                                 │
│ });                                  │
└──────────┬───────────────────────────┘
           │ Store in Redis (not in-memory!)
           ↓
   ┌──────────────────┐
   │  Redis Queue     │
   │                  │
   │ queue:waiting [] │
   │ User A: candidate│
   │ User B: [vacant] │
   │ User C: interviewer
   └──────┬───────────┘
          │
          │ Matching happens on ANY server
          ↓
      ┌────────────────────────────┐
      │ Matching Service           │
      │ (Can run on any server)    │
      │                            │
      │ findMatch() {              │
      │  user1 = pop from queue    │
      │  for user2 in queue:       │
      │    if opposite role: match!│
      │ }                          │
      └────────┬───────────────────┘
               │
               ↓
         ┌──────────────────────────────┐
         │ Create Session in DB         │
         │ Session {                    │
         │   participants: [A, B],      │
         │   code: '',                  │
         │   status: 'active',          │
         │   createdAt: now             │
         │ }                            │
         └────────┬─────────────────────┘
                  │ Save to MongoDB
                  ↓
           ┌──────────────────┐
           │ MongoDB Primary  │
           │ Save Session     │
           │ Returns _id      │
           └────────┬─────────┘
                    │
                    ↓
         ┌────────────────────────────────────┐
         │ Broadcast via Redis Pub/Sub        │
         │ Topic: 'user-matched'              │
         │ Message: {user1, user2, sessionId} │
         └──────┬─────────────────────────────┘
                │
    ┌───────────┴──────────────┐
    ↓                          ↓
Server1                    Server2
(User A connected)         (User B connected)
Receives broadcast         Receives broadcast
socket.emit('matched'...)  socket.emit('matched'...)
    │                          │
    ↓                          ↓
Navigate to /match/sessionId   Navigate to /match/sessionId
Both in same room!
```

### **Real-time Code Update (Scaled)**

```
User A types in code editor
       │
       ↓
┌──────────────────────────┐
│ Server1 (User A)         │
│ socket.on('code-change') │
└──────┬───────────────────┘
       │
       ├─ Broadcast to room (instant):
       │  socket.to(sessionId).emit('code-update', code)
       │  → Reaches User B on Server2 instantly
       │
       └─ Save to cache + DB (persist):
          redis.set(`session:${sessionId}:code`, code)
          Session.findByIdAndUpdate({code})

User B (on Server2) receives broadcast
       │
       ↓
┌──────────────────────────┐
│ Server2 (User B)         │
│ socket.on('code-update') │
│ editorRef.setValue(code) │
└──────────────────────────┘
User B sees code change instantly!

Later, if User B refreshes:
       ↓
User B reconnects to Server2
       │
       ├─ Fetch from Redis cache (fast):
       │  redis.get(`session:${sessionId}:code`)
       │  OR
       ├─ Fetch from MongoDB (if cache miss):
       │  Session.findById(sessionId).select('code')
       │
       ↓
Code restored, continue from same point!
```

---

## **Part 5: Component Interactions Diagram**

```
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AuthContext ──────────────────┬─────────────────── useAuth    │
│  (Login state, JWT token)      │                  (Custom hook)│
│                                │                               │
│  Pages                         │      Components               │
│  ├─ Home ────────────────────→ │      ├─ Navbar              │
│  ├─ Login ───────────────────→ │      ├─ Header              │
│  ├─ Dashboard ────────────────→ │      ├─ FeedbackModal       │
│  ├─ MatchRoom ────────────────→ │  (Reusable components)     │
│  ├─ Profile ────────────────→  │      ├─ PreferenceForm      │
│  └─ Experiences ────────────→  │      └─ RichTextEditor      │
│                                │                               │
│  All use api.js ────────────────┴──────────────────            │
│  (Axios with JWT auto-inject)                                  │
│                                                                 │
│  WebRTC ────────────────────→ useWebRTC hook                   │
│  RTCPeerConnection,              (Manage P2P video)            │
│  ICE Candidates                                                │
│                                                                 │
│  Socket.IO client ───────────→ Real-time updates              │
│  socket.on/emit                  from backend                 │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP + WebSocket
                         │ api.post('/api/auth/login')
                         │ socket.emit('find-peer')
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HTTP Routes          │    Socket.IO Events                    │
│  ├─ POST /auth/login  │    ├─ find-peer                       │
│  ├─ GET /experiences  │    ├─ matched                         │
│  ├─ POST /feedback    │    ├─ code-change                     │
│  └─ PUT /profile      │    └─ end-interview                   │
│                       │                                        │
│  Authentication: JWT verification middleware                  │
│                       │                                        │
│  Business Logic       │    Real-time Logic                    │
│  ├─ matchmaking       │    ├─ Broadcast updates               │
│  ├─ Aggregation       │    ├─ WebRTC signaling               │
│  └─ Validation        │    └─ Sync state across users         │
│                       │                                        │
│  Models               │    In-memory / Redis                  │
│  ├─ User              │    ├─ waitingQueue                    │
│  ├─ Session           │    ├─ Room membership                 │
│  ├─ Experience        │    └─ Temporary session state         │
│  └─ Feedback          │                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ MongoDB Driver
                         │ Mongoose ORM
                         ↓
┌────────────────────────────────────────────────────────────────┐
│                   DATABASE (MongoDB)                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Collections:                                                   │
│  ├─ users (User accounts, hashed passwords)                   │
│  ├─ sessions (Interview records, code, timer)                 │
│  ├─ experiences (Community posts, ratings)                    │
│  └─ feedback (Post-interview feedback)                        │
│                                                                 │
│  Indexes optimized for queries:                                │
│  ├─ Unique: email, (session, fromUser)                        │
│  ├─ Performance: createdAt, user, company                      │
│  └─ Aggregation: Used in feedback stats                        │
└────────────────────────────────────────────────────────────────┘
```

---

## **Part 6: Scalability Checklist**

### **For 100K Concurrent Users:**

| Component | Current | Scaled | Changes |
|-----------|---------|--------|---------|
| **App Servers** | 1 Node.js | 15-20 nodes | Auto-scaling group, load balancer |
| **Waiting Queue** | In-memory array | Redis list | `redis.rpush()` instead of array push |
| **Session State** | Memory (lost on restart) | Redis cache | `redis.get()` for recovery |
| **Socket.IO** | Single server | Redis adapter | `io.adapter(redis.adapter())` |
| **Database** | Single MongoDB | Replica set (3 nodes) | Primary + 2 secondaries |
| **Read Replicas** | None | 2-3 read replicas | Separate read nodes |
| **Caching** | None | Redis cache | Cache user profiles, experiences |
| **CDN** | None | CloudFront/Cloudflare | Serve static assets from edge |
| **Message Queue** | None | RabbitMQ | Async email, analytics |
| **Monitoring** | None | CloudWatch/ELK | Track server health |
| **Rate Limiting** | None | Redis + middleware | Prevent brute force |
| **Video Storage** | None | S3 + CDN | Record and serve videos |

---

## **Part 7: Deployment Architecture**

### **Infrastructure Setup**

```
┌────────────────────────────────────────────────────────────┐
│                     AWS / GCP / Azure                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  VPC (Virtual Private Cloud)                        │  │
│  │  ├─ Public Subnet (Load Balancer, NAT)              │  │
│  │  ├─ Private Subnet (App Servers, Databases)         │  │
│  │  └─ Security Groups (Firewall rules)                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   ALB        │  │    NAT       │  │  CloudFront  │    │
│  │ (Port 443)   │  │   Gateway    │  │   (CDN)      │    │
│  └──────┬───────┘  └──────────────┘  └──────────────┘    │
│         │                                                  │
│    ┌────┴─────┬──────────┬──────────┐                    │
│    ↓          ↓          ↓          ↓                    │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                │
│  │ EC2  │  │ EC2  │  │ EC2  │  │ EC2  │ (Auto-scaling)│
│  │ App1 │  │ App2 │  │ App3 │  │ App4 │                │
│  └──────┘  └──────┘  └──────┘  └──────┘                │
│    │          │          │          │                    │
│    └──────────┼──────────┼──────────┘                    │
│               │          │                                │
│               ↓          ↓                                │
│           ┌─────────────────────┐                        │
│           │  RDS / DocumentDB   │                        │
│           │  (Managed MongoDB)  │                        │
│           │  - Primary          │                        │
│           │  - Secondary 1      │                        │
│           │  - Secondary 2      │                        │
│           └─────────────────────┘                        │
│                   ↓                                        │
│           ┌──────────────────┐                           │
│           │ Backup to S3     │                           │
│           │ (Automated daily)│                           │
│           └──────────────────┘                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  ElastiCache (Redis)                                │ │
│  │  - Replication: Primary + Replicas                  │ │
│  │  - Automatic failover                               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  SQS / RabbitMQ (Message Queue)                      │ │
│  │  - Async job processing                             │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  S3 (Object Storage)                                │ │
│  │  - Video recordings                                 │ │
│  │  - User uploads                                     │ │
│  │  - Backups                                          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  CloudWatch / ELK (Monitoring & Logging)            │ │
│  │  - Server metrics: CPU, memory, network             │ │
│  │  - Application logs: Errors, performance            │ │
│  │  - Alerts: Auto-scale if CPU > 80%                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## **Part 8: Database Scaling Strategies**

### **Horizontal Scaling (Multiple Databases)**

```
┌───────────────────────────────────────────────────────────┐
│            Current: Single MongoDB                        │
│                                                           │
│  ├─ works for 1000 concurrent users                      │
│  ├─ all collections in one database                      │
│  └─ write bottleneck at scale                            │
└───────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────────┐
        │ Strategy 1: Database Replication       │
        ├────────────────────────────────────────┤
        │                                        │
        │  ┌──────────┐  ┌──────────┐          │
        │  │ Primary  │← │Secondary │          │
        │  │ (writes) │  │ (reads)  │          │
        │  └──────────┘  └──────────┘          │
        │                                        │
        │  All writes go to Primary             │
        │  Reads can go to Secondary            │
        │  Automatic failover if Primary down   │
        └────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────────┐
        │ Strategy 2: Database Sharding         │
        ├────────────────────────────────────────┤
        │                                        │
        │  User ID: 1-5M → DB1 (Shard 1)       │
        │  User ID: 5-10M → DB2 (Shard 2)      │
        │  User ID: 10-15M → DB3 (Shard 3)     │
        │                                        │
        │  Each shard handles subset of data     │
        │  Scale linearly with shards added     │
        │  (Complex: need shard routing logic)   │
        └────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────────┐
        │ Strategy 3: Hybrid Approach           │
        ├────────────────────────────────────────┤
        │                                        │
        │  ┌─────────────────────────────────┐  │
        │  │ Primary DB (write-heavy)        │  │
        │  │ ├─ sessions (current active)    │  │
        │  │ ├─ feedback (recent)            │  │
        │  │ └─ users (hot accounts)         │  │
        │  └─────────────────────────────────┘  │
        │                                        │
        │  ┌─────────────────────────────────┐  │
        │  │ Secondary DB (read-heavy)       │  │
        │  │ ├─ experiences (archive)        │  │
        │  │ ├─ old sessions                 │  │
        │  │ └─ analytics                    │  │
        │  └─────────────────────────────────┘  │
        │                                        │
        │  ┌─────────────────────────────────┐  │
        │  │ Cache Layer (Redis)             │  │
        │  │ ├─ user sessions (hot data)     │  │
        │  │ ├─ queue (waiting users)        │  │
        │  │ └─ recent experiences           │  │
        │  └─────────────────────────────────┘  │
        └────────────────────────────────────────┘
```

---

## **Part 9: Performance Optimization**

### **Optimization Techniques**

```
┌────────────────────────────────────────────────────┐
│  1. CACHING LAYER (Redis)                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  User Profile:                                     │
│  GET /api/users/{id}                              │
│  ├─ Check Redis: redis.get(`user:${id}`)          │
│  ├─ If found: Return from cache (1ms)             │
│  ├─ If miss: Query MongoDB, then                  │
│  └─ Store in Redis: redis.set(..., 3600)          │
│                                                    │
│  Result: 99% hits from cache (1ms vs 50ms from DB)│
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  2. DATABASE INDEXING                              │
├────────────────────────────────────────────────────┤
│                                                    │
│  Without index:                                    │
│  SCAN 1M documents to find user with email:       │
│  ├─ 50ms per query                                │
│  └─ 1M users = 1M scans × 50ms = 50s!             │
│                                                    │
│  With index:                                       │
│  Create unique index on email:                    │
│  ├─ MongoDB uses B-tree (log N complexity)        │
│  ├─ Find email in 1M users = ~20 comparisons      │
│  └─ Result: ~5ms (10x faster!)                    │
│                                                    │
│  Indexes created:                                 │
│  ├─ users.email (unique)                         │
│  ├─ sessions.createdAt (-1)                       │
│  ├─ experiences.company                           │
│  └─ feedback.session, fromUser (unique)           │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  3. QUERY OPTIMIZATION                             │
├────────────────────────────────────────────────────┤
│                                                    │
│  Bad (N+1 Problem):                               │
│  Get 100 experiences                              │
│  for each: Get user details (100 queries!)        │
│  Total: 101 queries!                              │
│                                                    │
│  Good (Use .populate()):                           │
│  Experience.find()                                │
│    .populate('user', fields)  ← Join in DB        │
│    .lean()  ← Plain objects (faster)              │
│  Total: 1 query!                                  │
│                                                    │
│  Result: 101 queries → 1 query = 100x faster      │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  4. PAGINATION & LAZY LOADING                      │
├────────────────────────────────────────────────────┤
│                                                    │
│  Load all:                                         │
│  GET /api/experiences → 10,000 records            │
│  Transfer: 10MB                                   │
│  Time: 5 seconds                                  │
│                                                    │
│  Pagination:                                      │
│  GET /api/experiences?page=1&limit=20             │
│  Transfer: 100KB per page                         │
│  Time: 50ms                                       │
│  User scrolls → Load next page                    │
│                                                    │
│  Result: 100x faster initial load                 │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  5. ASYNCHRONOUS PROCESSING                        │
├────────────────────────────────────────────────────┤
│                                                    │
│  Synchronous (blocking):                          │
│  User submits experience                          │
│  ├─ Save to DB (50ms)                             │
│  ├─ Send email notification (2000ms) ← SLOW       │
│  ├─ Log to analytics (100ms)                      │
│  └─ Return response (after 2.2s)                  │
│  User waits 2.2 seconds! :(                       │
│                                                    │
│  Asynchronous (non-blocking):                     │
│  User submits experience                          │
│  ├─ Save to DB (50ms)                             │
│  ├─ Queue job: "send email" to RabbitMQ           │
│  ├─ Queue job: "log analytics"                    │
│  ├─ Return response immediately (50ms) ← FAST     │
│  │                                                │
│  │ Background: Email sent after 2 seconds         │
│  │ Background: Analytics logged                   │
│                                                    │
│  User sees response in 50ms! :)                   │
└────────────────────────────────────────────────────┘
```

---

## **Part 10: Network Architecture**

### **Request Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S DEVICE                            │
│                  (Browser / Mobile)                         │
│                                                             │
│  React App in browser                                       │
│  ├─ Displays UI                                            │
│  ├─ Manages local state                                    │
│  └─ Makes API calls                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ↓           ↓           ↓
    HTTPS       WebSocket    WebRTC
    Port 443    Port 80/443  UDP
         │           │           │
    ┌────┴───────┬───┴────────┬──┴──────┐
    ↓            ↓            ↓         ↓
  GET/POST    Socket.IO   ICE Candidate
  /api/*      events      Exchange
         │           │           │
         └───────────┼───────────┘
                     │
              ┌──────┴──────┐
              ↓             ↓
         ┌─────────┐  ┌─────────┐
         │ HTTP    │  │WebSocket│
         │ Server  │  │ Server  │
         │ (Node)  │  │(Socket) │
         └────┬────┘  └────┬────┘
              │            │
              └──────┬─────┘
                     ↓
            ┌────────────────┐
            │  Redis         │
            │  (Queue, cache)│
            └────────┬───────┘
                     │
                     ↓
            ┌────────────────┐
            │  MongoDB       │
            │  (Persistence) │
            └────────────────┘
```

---

## **Summary: Scalability Path**

### **Growth Stages**

```
Stage 1: MVP (100 users)
├─ Single Node.js server
├─ Single MongoDB
├─ In-memory queue
└─ No caching

        ↓ (100→1K users)

Stage 2: Early Growth (1K-10K users)
├─ 1 App Server + Read Replica
├─ Add Redis cache for frequently accessed data
├─ Implement pagination
├─ Monitor database performance
└─ Add CDN for static files

        ↓ (10K→100K users)

Stage 3: Scale (100K users)
├─ Multiple app servers (10-20)
├─ Load balancer
├─ Redis cluster (queue, cache, pub/sub)
├─ MongoDB replica set (primary + 2 secondaries)
├─ Read replicas for analytics queries
├─ Message queue for async jobs
├─ Full CDN deployment
├─ Auto-scaling groups
└─ Monitoring & alerting

        ↓ (100K→1M users)

Stage 4: Enterprise (1M+ users)
├─ Database sharding (split by user ID)
├─ Multi-region deployment
├─ Global load balancing
├─ Data warehouse for analytics
├─ Machine learning for matching
└─ Advanced caching strategies
```

---

**Complete system architecture designed for scale from 100 to 1M+ users!** 🚀
