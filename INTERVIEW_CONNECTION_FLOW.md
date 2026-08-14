# Interview Flow: From Matching to Conducting Interview

## Flow Diagram

```
User Dashboard
     ↓
Click "Start Instant Interview" or "Schedule Interview"
     ↓
Socket sends: 'instant-interview-start' / 'scheduled-interview-start'
with preferences → Backend
     ↓
Backend MatchingService:
  - Searches for compatible user
  - Creates Session document
  - Updates both MatchingRequest docs with status='matched'
     ↓
Backend emits 'matched' event to BOTH users with:
  {
    sessionId: "session_id",
    partner: { name: "Alice", anonymous: false },  // or { anonymous: true }
    role: "candidate" or "interviewer",
    partnerUserId: "partner_id",
    matchType: "interviewer" or "peer",
    message: "Interview matched successfully..."
  }
     ↓
Dashboard receives 'matched' event
     ├─ Shows match popup (1.5 seconds)
     ├─ Displays partner name & role
     └─ Auto-navigates to `/matchroom/{sessionId}`
        with state containing partner info
     ↓
MatchRoom Component Loads
     ↓
1. Connect Socket (with auth token)
2. Emit 'join-room' with sessionId
3. Backend joins both sockets to room: `sessionId`
     ↓
4. Initialize WebRTC (useWebRTC hook)
   - Create PeerConnection
   - Get local media (camera + microphone)
   - Add tracks to connection
   - Create & send offer (candidate)
   - Receive & send answer (interviewer)
   - Exchange ICE candidates
     ↓
5. Users see:
   ✓ Local video feed (top-left)
   ✓ Remote video feed (right side or fullscreen)
   ✓ Code editor (shared)
   ✓ Notes panel (shared)
   ✓ Question panel
   ✓ Timer controls
     ↓
During Interview:
  - Code changes broadcast via socket to partner
  - Notes update in real-time
  - Timer can be started/stopped by either user
  - Video/audio transmitted peer-to-peer (WebRTC)
  - Screen sharing available
     ↓
End Interview:
  - Click "End Interview" button
  - Emit 'end-interview' event
  - Both users see feedback modal
  - Navigate back to dashboard
```

## Key Socket Events in MatchRoom

### Connection Phase
```javascript
// User connects to socket
socketRef.current = io(BACKEND_URL, { auth: { token } });

// User joins room
socketRef.current.emit('join-room', sessionId);

// Backend sends room data to user
socketRef.current.on('session-data', (data) => {
  // data contains: code, language, question, notes, status, timerEnd
  setCode(data.code);
  setLanguage(data.language);
  // ...
});
```

### Real-time Collaboration
```javascript
// When one user changes code
socketRef.current.emit('code-change', { sessionId, code: newCode });

// Other user receives it
socketRef.current.on('code-update', (newCode) => {
  setCode(newCode);
});

// Same for: language, question, notes, timer
```

### WebRTC Signaling
```javascript
// Offer (from candidate to interviewer)
socketRef.current.emit('offer', { sessionId, offer: peerConnection.localDescription });

// Answer (from interviewer to candidate)
socketRef.current.emit('answer', { sessionId, answer: peerConnection.localDescription });

// ICE Candidates (connection optimization)
socketRef.current.emit('ice-candidate', { sessionId, candidate });

socketRef.current.on('offer', (offer) => {
  // Handle offer
});

socketRef.current.on('answer', (answer) => {
  // Handle answer
});

socketRef.current.on('ice-candidate', (candidate) => {
  // Add candidate to peer connection
});
```

### Interview Control
```javascript
// Start a timer (60 minutes)
socketRef.current.emit('timer-start', { sessionId, duration: 60 * 60 });

// Stop timer
socketRef.current.emit('timer-stop', { sessionId });

// End interview (shows feedback modal)
socketRef.current.emit('end-interview', { sessionId });

// Leave room
socketRef.current.emit('leave-room', { sessionId });

// Backend notifies if partner left
socketRef.current.on('partner-left', () => {
  setPartnerLeft(true);
  setStatus('ended');
});
```

## Component Structure (MatchRoom)

```
MatchRoom.jsx
├── Header
│   ├── Back to Dashboard button
│   ├── Role (Candidate/Interviewer)
│   ├── Session ID
│   └── Timer display (if running)
│
├── Main Grid (2 columns on desktop)
│   ├── Left Column (Video + Info)
│   │   ├── Local Video Panel
│   │   │   ├── Your video feed
│   │   │   ├── Microphone toggle
│   │   │   ├── Camera toggle
│   │   │   └── Screen share button
│   │   │
│   │   └── Info Panel (togglable)
│   │       ├── Match Info
│   │       │   ├── Partner name/anonymous
│   │       │   ├── Role (Interviewer/Candidate)
│   │       │   └── Match type (Professional/Peer)
│   │       │
│   │       └── Timer Controls
│   │           ├── Start timer dropdown (15/30/45/60 min)
│   │           ├── Stop timer button
│   │           └── Timer display (MM:SS)
│   │
│   └── Right Column
│       ├── Remote Video Panel (fullscreenable)
│       │   └── Partner's video feed
│       │
│       ├── Editor Panel
│       │   ├── Language selector (Python/Java/C++)
│       │   └── Monaco Editor (shared code)
│       │
│       ├── Question Panel
│       │   └── Interview question (editable)
│       │
│       └── Notes Panel
│           └── Shared notes (both can edit)
│
└── Footer
    ├── End Interview button
    ├── Leave Room button
    └── Connection Status indicator
```

## WebRTC Connection Details

The useWebRTC hook handles:

```javascript
// 1. Get local media (camera + microphone)
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// 2. Create peer connection
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
});

// 3. Add local tracks
stream.getTracks().forEach(track => {
  peerConnection.addTrack(track, stream);
});

// 4. Listen for remote tracks
peerConnection.ontrack = (event) => {
  remoteStream = event.streams[0];  // Display in video element
};

// 5. Exchange SDP offers/answers via socket
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', { sessionId, candidate: event.candidate });
  }
};

// 6. Establish connection
// Candidate: Create offer → Send to Interviewer
// Interviewer: Receive offer → Create answer → Send back
// Both: Exchange ICE candidates until connected
```

## Real Example Session Flow (at 8:55)

**T=0: Match happens**
```
User1 (Alice, Candidate)     ←  Match Event  →     User2 (Bob, Interviewer)
├─ Sees popup: "Matched with Bob!"                ├─ Sees popup: "Matched with Alice!"
├─ 1.5s delay...                                   ├─ 1.5s delay...
└─ Navigate to /matchroom/[sessionId]              └─ Navigate to /matchroom/[sessionId]
   (with Alice's socket)                           (with Bob's socket)
```

**T=1.5s: Both enter MatchRoom**
```
Alice's Browser                              Bob's Browser
├─ Connect socket                           ├─ Connect socket
├─ Emit: join-room [sessionId]             ├─ Emit: join-room [sessionId]
├─ Receive: session-data (empty code)      ├─ Receive: session-data (empty code)
└─ Start WebRTC: send offer                 └─ Start WebRTC: receive offer, send answer
   (candidate initiates)                      (interviewer responds)
```

**T=3s: WebRTC connected**
```
Alice ──── STUN Server ──── [ICE candidates exchanged] ──── STUN Server ──── Bob
   └────────── P2P Connection Established ──────────┘
      (video/audio flowing directly peer-to-peer)
```

**T=3-60min: Interview Session**
```
Screen 1: Local video (Alice)                Screen 2: Remote video (Bob - full)
Screen 3: Shared Code Editor
   Alice: writes code → emitted via socket → Bob sees it update
   Bob: "that's wrong, try X" → Types comment in Question panel

Timer running: 45:32 ← Both can see
```

**T=60min or manual end:**
```
Interview ends → emit: end-interview
↓
Both see: "Interview Complete" feedback form
↓
Rate partner → Submit feedback
↓
Navigate to /dashboard
```

## Technical Details

### Session Document (MongoDB)
```javascript
{
  _id: ObjectId("6a7dd0abe7eb9aaa5c55670d"),
  participants: [
    { user: ObjectId("alice_id"), role: "candidate" },
    { user: ObjectId("bob_id"), role: "interviewer" }
  ],
  language: "Python",
  code: "def solve():\n    pass",
  question: "Find two sum...",
  notes: "Important: watch edge cases",
  timerEnd: ISODate("2026-08-13T13:55:00Z"),
  status: "active",  // or 'ended'
  createdAt: ISODate("2026-08-13T12:55:00Z"),
  updatedAt: ISODate("2026-08-13T12:57:30Z")
}
```

### Network Flow
```
User1 Action (e.g., code change)
     ↓
Emit to socket: 'code-change'
     ↓
Backend socket room broadcasts
     ↓
User2 receives: 'code-update'
     ↓
User2 state updates
     ↓
UI re-renders

Video/Audio (peer-to-peer):
User1 Camera
     ↓
WebRTC PeerConnection
     ↓
Direct P2P tunnel to User2
     ↓
User2 sees live video
```

## Interview Controls Available

| Control | Who | Effect |
|---------|-----|--------|
| Start Timer | Either user | 15/30/45/60 min countdown |
| Stop Timer | Either user | Pauses timer |
| Mute/Unmute Mic | Self | Local track disabled/enabled |
| Enable/Disable Cam | Self | Local video stopped/started |
| Share Screen | Either user | Share desktop to partner |
| Type Code | Both simultaneously | Synced to both editors |
| Edit Notes | Both simultaneously | Synced notes panel |
| Edit Question | Either user | Question updates both sides |
| End Interview | Either user | Triggers feedback modal |
| Leave Room | Either user | Disconnect and go to dashboard |

## Post-Interview

After clicking "End Interview":
1. Feedback modal appears asking:
   - How was the interview? (rating 1-5 stars)
   - Communication skills rating
   - Technical knowledge rating
   - Feedback text (optional)

2. Feedback is saved to database
3. Both users navigate back to Dashboard
4. Interview recorded in their experience history
