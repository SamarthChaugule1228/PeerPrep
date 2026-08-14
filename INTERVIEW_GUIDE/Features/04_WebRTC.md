# WebRTC Video Call

---

### Feature Overview

**What is it?**
Direct peer-to-peer video/audio connection between two users. No video sent through backend server.

**Why?**
- Lower latency (direct connection)
- Lower bandwidth cost (not through your server)
- Doesn't overwhelm server with video streams
- Works globally (better than server relay)

**How it works:**
User A ↔ ICE servers (find each other) ↔ User B → Establish direct P2P connection → Video streams directly

---

### Working Flow

```
ESTABLISHING VIDEO CALL:

1. Both users join MatchRoom with sessionId

2. Initiator (usually interviewer) starts WebRTC:
   - Calls getUserMedia() to get camera/microphone
   - Creates RTCPeerConnection
   - Adds local tracks (audio/video) to peer connection
   - Creates offer: `peer.createOffer()`
   - Sets own description: `peer.setLocalDescription(offer)`
   - Sends offer through Socket.IO to other user

3. Non-initiator receives offer:
   - Sets remote description: `peer.setRemoteDescription(offer)`
   - Creates answer: `peer.createAnswer()`
   - Sets own description: `peer.setLocalDescription(answer)`
   - Sends answer back through Socket.IO

4. Initiator receives answer:
   - Sets remote description: `peer.setRemoteDescription(answer)`

5. ICE candidates exchange:
   - Both users' browsers find network paths (STUN servers)
   - Send ICE candidates to each other via Socket.IO
   - Each side adds received candidates: `peer.addIceCandidate()`

6. Connection established:
   - 'ontrack' event fires when remote video arrives
   - Both users see each other's video

7. User can toggle:
   - Microphone on/off
   - Camera on/off
   - Screen sharing on/off
   - Screen sharing replaces camera track
```

---

### Files Used

| File | Purpose |
|------|---------|
| `frontend/hooks/useWebRTC.js` | WebRTC logic (offer/answer, ICE candidates, tracks) |
| `frontend/pages/MatchRoom.jsx` | Shows video elements, calls useWebRTC |
| `backend/socket/socket.js` | Relays offer/answer/ICE candidates via Socket.IO |

---

### Important Code

#### **1. Initialize WebRTC Connection**

**File:** `frontend/hooks/useWebRTC.js` → `createPeer()` function

**What it does:**
Creates RTCPeerConnection object, adds local camera/microphone tracks, listens when remote video arrives.

**How it works:**
```
RTCPeerConnection = Object that manages connection
  ↓
If we have camera/mic stream: add each track (audio + video) to connection
  ↓
peer.addTrack() = "I will send this audio/video to other side"
  ↓
peer.ontrack = listener that fires when OTHER SIDE SENDS video/audio
  ↓
setRemoteStream() = Store other user's video so we can display it
```

**Why important:**
Core of WebRTC - creates the connection object and prepares to send/receive media.

```javascript
const createPeer = useCallback((stream) => {
  // Create connection object
  const peer = new RTCPeerConnection(iceServers);
  peerRef.current = peer;

  // Add my audio/video tracks if I have them
  if (stream) {
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    // track = audio track or video track
    // addTrack = "send this to other side"
  }

  // Ensure video transceiver exists (for screen sharing later)
  if (!stream || !stream.getVideoTracks().length) {
    peer.addTransceiver('video', { direction: 'sendonly' });
  }

  // LISTENER: When other user's video arrives
  peer.ontrack = (event) => {
    setRemoteStream(event.streams[0]);  // Got remote video!
  };

  // LISTENER: When browser finds network path (ICE candidate)
  peer.onicecandidate = (event) => {
    if (event.candidate && socketRef.current) {
      socketRef.current.emit('ice-candidate', { sessionId, candidate: event.candidate });
    }
  };

  // LISTENER: Connection status changes
  peer.onconnectionstatechange = () => {
    setConnectionStatus(peer.connectionState);
  };

  return peer;
}, [sessionId, socketRef]);
```

---

#### **2. Create and Send Offer (Initiator)**

**File:** `frontend/hooks/useWebRTC.js` → `initiateCall()` function

**What it does:**
Interviewer (initiator) creates offer describing their media capabilities and sends to candidate.

**How it works:**
```
Initiator = Person starting the call (usually interviewer)
  ↓
peer.createOffer() = Create SDP describing:
  - "I have audio codec X and video codec Y"
  - "My resolution is 1280x720"
  - "I'm ready to receive data"
  ↓
peer.setLocalDescription(offer) = Tell my connection "This is what I'm sending"
  ↓
socket.emit('offer', {...}) = Send offer to other user via Socket.IO
  ↓
Other user receives offer and creates answer
```

**Why important:**
Starts the WebRTC handshake. Without offer, connection can't begin.

```javascript
const initiateCall = useCallback(async () => {
  if (!socketRef.current) return;
  
  const stream = localStreamRef.current;  // My camera/mic
  const peer = createPeer(stream);        // Create connection with my media
  
  // Step 1: Create offer
  const offer = await peer.createOffer();
  // offer = { type: "offer", sdp: "v=0\no=- ... many details ..." }
  
  // Step 2: Tell my connection "I'm sending this offer"
  await peer.setLocalDescription(offer);
  // Now MY connection knows what I promised to send
  
  // Step 3: Send offer to other user
  socketRef.current.emit('offer', { sessionId, offer });
  // Other user receives this offer and creates answer
}, [createPeer, sessionId, socketRef]);
```

---

#### **3. Handle Remote Offer and Send Answer (Responder)**

**File:** `frontend/hooks/useWebRTC.js` (in useEffect listening to 'offer' event)

**What it does:**
Candidate (responder) receives interviewer's offer, creates answer describing their media, sends back.

**How it works:**
```
Responder receives offer from initiator
  ↓
peer.setRemoteDescription(offer) = "OK, I understand what initiator is sending"
  ↓
peer.createAnswer() = Create response:
  - "I accept your codec choice"
  - "I also have audio/video ready"
  - "I'm ready to receive"
  ↓
peer.setLocalDescription(answer) = Tell MY connection "This is my answer"
  ↓
socket.emit('answer', {...}) = Send answer back to initiator
  ↓
Initiator receives answer and connection can now establish
```

**Why important:**
Completes handshake. Both sides now understand each other's media capabilities.

```javascript
const handleOffer = async (offer) => {
  console.log('Received offer from other user');
  
  // Make sure I have camera/mic
  await startMedia();
  
  // Close old connection if exists
  if (peerRef.current) peerRef.current.close();
  
  // Create new connection with my media
  const stream = localStreamRef.current;
  const peer = createPeer(stream);
  
  // Step 1: Understand what other user is sending
  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  // Now I know: "Initiator has audio codec X, video codec Y, etc"
  
  // Step 2: Create my response
  const answer = await peer.createAnswer();
  // answer = { type: "answer", sdp: "v=0\no=- ... my details ..." }
  
  // Step 3: Tell my connection "This is my answer"
  await peer.setLocalDescription(answer);
  
  // Step 4: Send answer back
  socket.emit('answer', { sessionId, answer });
};

socketRef.current.on('offer', handleOffer);
```

---

#### **4. Exchange ICE Candidates (Network Paths)**

**File:** `frontend/hooks/useWebRTC.js` → ICE candidate handling

**What it does:**
Both browsers discover network paths to reach each other and exchange them.

**How it works:**
```
Browser A behind home WiFi router (NAT)
  ↓
STUN server tells Browser A: "Your public IP is 203.45.67.89:54321"
  ↓
Browser A emits 'ice-candidate' with this IP to Browser B
  ↓
Browser B receives candidate and tries to connect to 203.45.67.89:54321
  ↓
If connection works: Direct P2P established!
  ↓
Both browsers now send video/audio directly (not through server)
```

**Why important:**
Enables direct P2P connection despite NAT (home router) firewalls.

```javascript
// SENDING ice candidates
peer.onicecandidate = (event) => {
  if (event.candidate && socketRef.current) {
    // Browser found a network path (IP:port combination)
    console.log('Found ICE candidate:', event.candidate.candidate);
    // Send to other user
    socketRef.current.emit('ice-candidate', { sessionId, candidate: event.candidate });
  }
};

// RECEIVING ice candidates
const handleIceCandidate = async (candidate) => {
  if (peerRef.current) {
    try {
      // Try to connect to this IP:port
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('Added ICE candidate, trying to connect...');
    } catch (err) {
      console.error('ICE add error:', err);
    }
  }
};

socketRef.current.on('ice-candidate', handleIceCandidate);
```

---

#### **5. Toggle Camera/Microphone (Media Tracks)**

**File:** `frontend/hooks/useWebRTC.js` → `toggleCam()` / `toggleMic()` functions

**What it does:**
Enable/disable audio and video tracks on the fly without dropping connection.

**How it works:**
```
localStreamRef.current = MediaStream with audio + video tracks
  ↓
getVideoTracks()[0] = First (and usually only) video track
  ↓
track.enabled = true/false = Send video (true) or don't send (false)
  ↓
Other user still receives connection, but sees black screen
  ↓
No lag, no reconnection needed
```

**Why important:**
Users can mute/unmute, turn camera off/on instantly without dropping call.

```javascript
const toggleMic = () => {
  const stream = localStreamRef.current;
  if (stream) {
    const audioTrack = stream.getAudioTracks()[0];
    // getAudioTracks() = Get all audio tracks (usually 1)
    
    if (audioTrack) {
      // Toggle: if enabled, disable; if disabled, enable
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
      
      console.log(audioTrack.enabled ? 'Mic ON' : 'Mic OFF');
      // Other user still connected, but doesn't receive audio
    }
  }
};

const toggleCam = () => {
  const stream = localStreamRef.current;
  if (stream) {
    const videoTrack = stream.getVideoTracks()[0];
    
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
      
      console.log(videoTrack.enabled ? 'Camera ON' : 'Camera OFF');
      // Other user sees either video or black screen
    }
  }
};
```

---

#### **6. Screen Sharing (Replace Video Track)**

**File:** `frontend/hooks/useWebRTC.js` → `startScreenShare()` and `stopScreenShare()` functions

**What it does:**
Replace camera video track with screen capture. Other user sees your screen instead of face.

**How it works:**
```
User clicks "Share Screen"
  ↓
navigator.mediaDevices.getDisplayMedia() = Ask OS: "Let me capture screen"
  ↓
User selects which monitor to share
  ↓
Get screen video track
  ↓
peerRef.current.getSenders() = Get all media senders (audio, video)
  ↓
Find the video sender
  ↓
sender.replaceTrack(screenTrack) = Replace camera track with screen track
  ↓
Other user receives screen instead of face
  ↓
Connection STAYS OPEN (just different video)
```

**Why important:**
Screen sharing doesn't require reconnection. Just swap the video track.

```javascript
const startScreenShare = async () => {
  try {
    // Step 1: Ask user to select screen/window
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true 
    });
    
    const screenTrack = screenStream.getVideoTracks()[0];
    screenTrackRef.current = screenTrack;  // Remember it so we can stop later

    // Step 2: Find the video sender in the connection
    if (peerRef.current) {
      const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
      // getSenders() returns [audioSender, videoSender]
      // Find the videoSender
      
      if (sender) {
        // Step 3: Replace camera track with screen track
        await sender.replaceTrack(screenTrack);
        // Other user now receives screen instead of camera
        // Connection stays open, just different video!
      }
    }
    
    setScreenSharing(true);
    
    // If user stops screen share via browser, stop it
    screenTrack.onended = () => {
      stopScreenShare();
    };
  } catch (err) {
    console.error('Screen share error:', err);
  }
};

const stopScreenShare = () => {
  if (screenTrackRef.current) {
    screenTrackRef.current.stop();  // Stop capturing screen
    screenTrackRef.current = null;
  }

  // Step 2: Restore camera video track
  if (peerRef.current) {
    const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      const stream = localStreamRef.current;
      const videoTrack = stream ? stream.getVideoTracks()[0] : null;
      
      if (videoTrack) {
        // Restore camera
        sender.replaceTrack(videoTrack).catch(console.error);
      } else {
        // No camera available, send null (no video)
        sender.replaceTrack(null).catch(console.error);
      }
    }
  }
  
  setScreenSharing(false);
};
```

---

### Key Methods

| Method | Purpose |
|--------|---------|
| `RTCPeerConnection()` | Create peer connection object |
| `getUserMedia()` | Request camera/microphone permission |
| `createOffer()` | Create offer for initiator |
| `createAnswer()` | Create answer for non-initiator |
| `setLocalDescription()` | Tell peer connection what I'm sending |
| `setRemoteDescription()` | Tell peer connection what other side is sending |
| `addTrack()` | Add audio/video to be sent |
| `addIceCandidate()` | Add network path info |
| `getVideoTracks()` | Get all video tracks to toggle |
| `getAudioTracks()` | Get all audio tracks to toggle |

---

### Interview Q&A

**Q: Why use Socket.IO to relay offer/answer?**
A: Offer/answer contain SDP (Session Description Protocol) which describes what codec, resolution, etc. Both must exchange this before connection. After connection, media flows P2P.

**Q: What are ICE candidates?**
A: Network paths to reach you. Could be direct IP, could be through NAT translation. Browser finds all possible paths and sends to other side. Other side tries each until one works.

**Q: Why STUN servers?**
A: To find your public IP if behind NAT (home router). Tells your browser "your public IP is X.X.X.X:port". Other side connects to that IP.

**Q: What if direct connection fails?**
A: Normally would use TURN server (relay). Your code has only STUN. If NAT prevents direct connection, video won't work. Production should have TURN.

**Q: Can both users be initiator?**
A: No, creates conflict. One must be initiator (creates offer) and one responder (creates answer). Usually server decides based on role.

**Q: What happens if user toggles camera mid-call?**
A: Camera track disabled/enabled. Other user sees video stop/start but connection stays open.

**Q: How do you handle screen sharing?**
A: Get screen track: `navigator.mediaDevices.getDisplayMedia()`. Add as track. Replaces camera track. Other user receives screen stream instead of camera.

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Offer/Answer** | Handshake to establish connection |
| **ICE Candidates** | Network paths for P2P connection |
| **STUN** | Finds your public IP |
| **P2P** | Direct connection, not through server |
| **MediaStream** | Local camera/microphone |
| **ontrack** | Event fired when remote video arrives |
