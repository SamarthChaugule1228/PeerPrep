# PeerPrep: System Design Diagrams

---

## **Diagram 1: User Matching Flow**

```mermaid
graph TD
    A["User A: Candidate<br/>Clicks 'Find Peer'"] -->|Socket.IO| B["Backend Server"]
    C["User B: Interviewer<br/>Clicks 'Find Peer'"] -->|Socket.IO| B
    
    B --> D["waitingQueue<br/>[User A, User B]"]
    D --> E["findMatch()"]
    E -->|Role check| F{A.role != B.role?}
    F -->|Yes| G["Match Found!"]
    F -->|No| H["Keep waiting"]
    
    G --> I["Create Session<br/>in MongoDB"]
    I --> J["Remove from queue<br/>waitingQueue = []"]
    
    J -->|Socket.IO| K["Emit 'matched'<br/>to User A"]
    J -->|Socket.IO| L["Emit 'matched'<br/>to User B"]
    
    K --> M["User A navigates<br/>to /match/sessionId"]
    L --> N["User B navigates<br/>to /match/sessionId"]
    
    M --> O["Interview Room"]
    N --> O
    
    O --> P["WebRTC: Establish P2P Video"]
    O --> Q["Socket.IO: Code Sync"]
    O --> R["Collaborative Editor"]
    
    style A fill:#e1f5ff
    style C fill:#e1f5ff
    style G fill:#c8e6c9
    style O fill:#fff9c4
```

---

## **Diagram 2: Real-time Code Synchronization**

```mermaid
graph LR
    A["User A<br/>Types code"] -->|onChange event| B["Monaco Editor<br/>getValue()"]
    B -->|socket.emit| C["Backend<br/>Socket.IO"]
    
    C -->|BROADCAST| D["socket.to<br/>sessionId<br/>emit code-update"]
    C -->|PERSIST| E["findByIdAndUpdate<br/>Session"]
    
    D -->|Instant update| F["User B<br/>Receives event"]
    E -->|Save| G["MongoDB"]
    
    F -->|editorRef.setValue| H["Monaco Editor<br/>Updates"]
    
    H -->|User sees<br/>code change<br/>in real-time| I["Both users<br/>synced"]
    
    style A fill:#bbdefb
    style I fill:#c8e6c9
    style C fill:#ffe0b2
    style E fill:#f8bbd0
    style G fill:#d1c4e9
```

---

## **Diagram 3: Authentication & JWT Flow**

```mermaid
graph TD
    A["User enters<br/>email & password"] -->|POST /register| B["Backend"]
    
    B -->|Check email exists| C{"Unique?"}
    C -->|No| D["Error: Email taken"]
    C -->|Yes| E["bcrypt.hash<br/>salt factor: 10"]
    
    E -->|Hash password| F["Save User<br/>pwd: hashed_value"]
    
    F --> G["Generate JWT"]
    G -->|jwt.sign<br/>payload: userId<br/>secret: process.env.JWT_SECRET<br/>expires: 7d| H["Token created"]
    
    H -->|Return to frontend| I["localStorage.setItem<br/>token: JWT_TOKEN"]
    
    J["User makes request<br/>GET /api/profile"] -->|With token| K["Axios Interceptor"]
    
    K -->|Auto-adds header| L["x-auth-token: JWT_TOKEN"]
    L -->|Send to backend| M["Backend receives"]
    
    M -->|Pass to auth middleware| N["jwt.verify<br/>token, SECRET"]
    
    N -->|Signature valid?| O{"✓ Valid"}
    O -->|Yes| P["Extract user ID<br/>Set req.user.id"]
    O -->|No| Q["Return 401<br/>Unauthorized"]
    
    P -->|Continue| R["Route handler<br/>executes"]
    R -->|Return data| S["Frontend receives<br/>authenticated response"]
    
    style A fill:#c8e6c9
    style B fill:#ffe0b2
    style E fill:#f8bbd0
    style H fill:#bbdefb
    style O fill:#c8e6c9
    style S fill:#c8e6c9
```

---

## **Diagram 4: WebRTC Connection Establishment**

```mermaid
graph TD
    A["User A & B<br/>in interview room"]
    
    A -->|socket.emit| B["Initiator: User A"]
    A -->|socket.on| C["Receiver: User B"]
    
    B -->|Create| D["RTCPeerConnection<br/>iceServers: STUN"]
    C -->|Create| E["RTCPeerConnection<br/>iceServers: STUN"]
    
    D -->|getUserMedia| F["Get local stream<br/>audio + video"]
    E -->|getUserMedia| G["Get local stream<br/>audio + video"]
    
    F -->|addTrack| H["Add to peer connection"]
    G -->|addTrack| I["Add to peer connection"]
    
    H -->|createOffer| J["Generate offer"]
    J -->|setLocalDescription| K["Set own SDP"]
    
    K -->|socket.emit| L["Send offer<br/>via Socket.IO"]
    
    L -->|Receive| C
    
    C -->|setRemoteDescription| M["Set remote SDP"]
    M -->|createAnswer| N["Generate answer"]
    N -->|setLocalDescription| O["Set own SDP"]
    
    O -->|socket.emit| P["Send answer<br/>back to User A"]
    
    P -->|Receive| B
    B -->|setRemoteDescription| Q["Set remote SDP"]
    
    H -->|onicecandidate| R["Gather ICE candidates"]
    I -->|onicecandidate| S["Gather ICE candidates"]
    
    R -->|socket.emit| T["Send ICE candidates"]
    S -->|socket.emit| U["Send ICE candidates"]
    
    T -->|Receive| I
    U -->|Receive| H
    
    I -->|addIceCandidate| V["Add remote candidates"]
    H -->|addIceCandidate| W["Add remote candidates"]
    
    V -->|Connection established| X["P2P Video Stream"]
    W -->|Connection established| X
    
    X -->|Low latency<br/>High quality| Y["Both users see<br/>video in real-time"]
    
    style B fill:#c8e6c9
    style C fill:#bbdefb
    style X fill:#ffeb3b
    style Y fill:#ffeb3b
```

---

## **Diagram 5: Scalable Architecture - Load Balancing**

```mermaid
graph TB
    A["Internet<br/>Users"]
    
    A -->|HTTPS<br/>Port 443| B["Load Balancer<br/>ALB/Nginx"]
    
    B -->|Route to available| C["App Server 1<br/>Node.js"]
    B -->|Route to available| D["App Server 2<br/>Node.js"]
    B -->|Route to available| E["App Server 3<br/>Node.js"]
    B -->|Route to available| F["App Server 4<br/>Node.js"]
    
    C -->|HTTP Routes| G["Express Routes<br/>- /api/auth<br/>- /api/experiences<br/>- /api/feedback"]
    D -->|HTTP Routes| G
    E -->|HTTP Routes| G
    F -->|HTTP Routes| G
    
    C -->|Socket.IO with<br/>Redis adapter| H["Redis Cluster<br/>Pub/Sub"]
    D -->|Socket.IO with<br/>Redis adapter| H
    E -->|Socket.IO with<br/>Redis adapter| H
    F -->|Socket.IO with<br/>Redis adapter| H
    
    G -->|Mongoose| I["MongoDB Cluster<br/>Primary + Replicas"]
    
    H -->|Cache<br/>Queue<br/>Sessions| J["Redis<br/>Cache Layer"]
    
    I -->|Write| K["Primary<br/>Write operations"]
    I -->|Read| L["Secondary 1<br/>Read-only"]
    I -->|Read| M["Secondary 2<br/>Read-only"]
    
    K -->|Replicate| L
    K -->|Replicate| M
    
    I -->|Backup| N["S3 Backup<br/>Daily snapshots"]
    
    B -->|Monitor CPU<br/>If > 80%| O["Auto-scaling"]
    O -->|Launch| P["New App Servers"]
    
    style B fill:#ffe0b2
    style C fill:#bbdefb
    style D fill:#bbdefb
    style E fill:#bbdefb
    style F fill:#bbdefb
    style H fill:#f8bbd0
    style I fill:#c8e6c9
    style N fill:#d1c4e9
```

---

## **Diagram 6: Data Flow - Complete Request**

```mermaid
graph LR
    A["Frontend<br/>React Component"] -->|1. Click 'Share'| B["Form Data"]
    
    B -->|2. POST /experiences<br/>+ JWT Token| C["Axios"]
    
    C -->|3. HTTP Request| D["Load Balancer"]
    
    D -->|4. Route to Server| E["Express Server"]
    
    E -->|5. Verify JWT<br/>auth middleware| F["Extract userId"]
    
    F -->|6. Create Experience| G["Mongoose Model"]
    
    G -->|7. Save to DB| H["MongoDB"]
    
    H -->|8. Generate _id| I["Experience Created"]
    
    I -->|9. Populate user| J["Query User collection<br/>.populate"]
    
    J -->|10. Return full data| K["Response object<br/>with author details"]
    
    K -->|11. Send response| L["Frontend receives<br/>JSON"]
    
    L -->|12. Update state| M["setExperiences"]
    
    M -->|13. Re-render| N["Experience appears<br/>in list"]
    
    style A fill:#c8e6c9
    style N fill:#c8e6c9
    style H fill:#d1c4e9
    style E fill:#ffe0b2
```

---

## **Diagram 7: Feedback Rating & Aggregation**

```mermaid
graph TD
    A["User submits feedback<br/>after interview"]
    
    A -->|communication: 4<br/>technical: 3<br/>overall: 3.5| B["POST /feedback<br/>with sessionId"]
    
    B -->|Validate<br/>User is participant| C{"Participant?"}
    C -->|No| D["403: Forbidden"]
    C -->|Yes| E["Check unique index<br/>session + fromUser"]
    
    E -->|Duplicate?| F{"Already submitted?"}
    F -->|Yes| G["409: Conflict<br/>Can't submit twice"]
    F -->|No| H["Create Feedback doc<br/>in MongoDB"]
    
    H -->|Save| I["Feedback stored"]
    
    I -->|User views profile| J["GET /feedback/stats/{userId}"]
    
    J -->|Aggregation Pipeline| K["db.aggregate"]
    
    K -->|$match| L["Filter: toUser = userId"]
    K -->|$group| M["Group all feedback"]
    K -->|$avg| N["Calculate averages"]
    
    M -->|communication scores| O["Average: 4.2"]
    M -->|technical scores| P["Average: 3.8"]
    M -->|overall scores| Q["Average: 4.0"]
    
    O -->|Return| R["Frontend displays<br/>User ratings"]
    P -->|Return| R
    Q -->|Return| R
    
    R -->|Card shows| S["Communication: 4.2/5<br/>Technical: 3.8/5<br/>Overall: 4.0/5"]
    
    style A fill:#c8e6c9
    style I fill:#bbdefb
    style R fill:#ffeb3b
    style S fill:#ffeb3b
```

---

## **Diagram 8: Interview Experience Lifecycle**

```mermaid
graph TD
    A["Session Created<br/>User A & B matched"]
    
    A -->|Interview starts| B["Active Session<br/>status = active"]
    
    B -->|Real-time updates| C["Code changes<br/>Timer running<br/>Notes being taken"]
    
    C -->|Save to DB| D["Session.findByIdAndUpdate<br/>All changes persisted"]
    
    B -->|Both users done| E["Click 'End Interview'<br/>socket.emit end-interview"]
    
    E -->|Backend receives| F["Mark session ended<br/>status = ended"]
    
    F -->|Both receive| G["FeedbackModal appears<br/>Star rating UI"]
    
    G -->|User A rates User B| H["Submit feedback<br/>communication, technical, overall"]
    G -->|User B rates User A| I["Submit feedback<br/>communication, technical, overall"]
    
    H -->|Save to Feedback collection| J["Feedback: A→B stored"]
    I -->|Save to Feedback collection| K["Feedback: B→A stored"]
    
    J -->|Navigate to| L["Profile page"]
    K -->|Navigate to| L
    
    L -->|View stats| M["GET /feedback/stats/{userId}"]
    
    M -->|Aggregation| N["Average ratings calculated"]
    
    N -->|Display| O["Profile shows:<br/>Avg communication<br/>Avg technical<br/>Total interviews<br/>Improvement trend"]
    
    O -->|Later: Share experience| P["POST /experiences<br/>Log what they learned"]
    
    P -->|Rich text content| Q["Tiptap JSON stored"]
    
    Q -->|Community sees| R["Experience card<br/>Company, role, outcome<br/>Author, ratings<br/>Upvote button"]
    
    style A fill:#c8e6c9
    style B fill:#fff9c4
    style G fill:#f8bbd0
    style O fill:#bbdefb
    style R fill:#c8e6c9
```

---

## **Diagram 9: Scalability Growth Path**

```mermaid
graph LR
    A["Stage 1: MVP<br/>100 users"] 
    -->|1-10K users| B["Stage 2: Early<br/>Growth"]
    -->|10-100K users| C["Stage 3: Scale"]
    -->|100K-1M users| D["Stage 4:<br/>Enterprise"]
    
    A -->|Setup| A1["Single Node.js<br/>Single MongoDB<br/>In-memory queue<br/>No caching"]
    
    B -->|Add| B1["Read Replica<br/>Redis cache<br/>Pagination<br/>CDN"]
    
    C -->|Add| C1["10-20 servers<br/>Load balancer<br/>Redis cluster<br/>MongoDB replica<br/>Read replicas<br/>Message queue<br/>Auto-scaling"]
    
    D -->|Add| D1["Database sharding<br/>Multi-region<br/>Global LB<br/>Data warehouse<br/>ML matching"]
    
    style A fill:#ffccbc
    style B fill:#ffe0b2
    style C fill:#fff9c4
    style D fill:#c8e6c9
```

---

## **Diagram 10: Current vs Scaled Database**

```mermaid
graph TB
    subgraph current["Current: Single Server"]
        A1["Single MongoDB<br/>All collections"] -->|Write| B1["All requests block"]
        A1 -->|Read| B1
        B1 -->|High latency<br/>at scale| C1["❌ Not scalable<br/>10K users = slow"]
    end
    
    subgraph scaled["Scaled: Distributed"]
        A2["Primary DB<br/>- Writes<br/>- Hot data"] 
        B2["Secondary 1<br/>- Read-only<br/>- Analytics"]
        C2["Secondary 2<br/>- Read-only<br/>- Backups"]
        D2["Redis Cache<br/>- Hot queries<br/>- Sessions<br/>- Queue"]
        
        A2 -->|Replicate| B2
        A2 -->|Replicate| C2
        
        E2["Read from<br/>Secondary"] -.->|Fast| B2
        F2["Cache hit<br/>1ms"] -.->|Instant| D2
        G2["Write to<br/>Primary"] -.->|Atomic| A2
        
        H2["✓ Scales to<br/>100K+ users"]
    end
    
    current -.->|Evolution| scaled
    
    style current fill:#ffccbc
    style scaled fill:#c8e6c9
```

---

## **Diagram 11: Socket.IO with Redis Adapter**

```mermaid
graph TB
    A["Server 1<br/>User A connected"]
    B["Server 2<br/>User B connected"]
    C["Server 3<br/>No users"]
    
    A -->|socket.to<br/>sessionId<br/>emit event| D["Redis Pub/Sub"]
    
    D -->|Broadcast to<br/>all servers| E["Receive on<br/>all servers"]
    
    E -->|Match room<br/>sessionId| F["Server 1:<br/>Has User A ✓"]
    E -->|Match room<br/>sessionId| G["Server 2:<br/>Has User B ✓"]
    E -->|Match room<br/>sessionId| H["Server 3:<br/>No match"]
    
    F -->|Local delivery| I["User A receives<br/>event"]
    G -->|Local delivery| J["User B receives<br/>event"]
    H -->|Skip| K["Event not sent"]
    
    style D fill:#f8bbd0
    style I fill:#c8e6c9
    style J fill:#c8e6c9
```

---

## **Diagram 12: Security Layers**

```mermaid
graph TD
    A["User Request"]
    
    A -->|HTTPS| B["TLS/SSL<br/>Encrypted"]
    
    B -->|Reaches| C["Load Balancer<br/>DDoS protection"]
    
    C -->|Routes to| D["App Server"]
    
    D -->|Rate limiting<br/>middleware| E["Max 100 req/min<br/>per IP"]
    
    E -->|Verify JWT| F["auth middleware<br/>jwt.verify"]
    
    F -->|Token valid?| G{"✓ Signature<br/>✓ Expiry"}
    
    G -->|No| H["401: Unauthorized<br/>Reject request"]
    
    G -->|Yes| I["Extract userId<br/>Set req.user.id"]
    
    I -->|Database query| J["Access control<br/>Is user owner?<br/>Is user participant?"]
    
    J -->|No| K["403: Forbidden<br/>Reject request"]
    
    J -->|Yes| L["Allow access<br/>to resource"]
    
    L -->|Validate input| M["Schema validation<br/>Sanitize content"]
    
    M -->|No XSS/Injection| N["Store securely<br/>in database"]
    
    N -->|Passwords hashed| O["bcrypt hash<br/>Never plain text"]
    
    style B fill:#81c784
    style F fill:#81c784
    style J fill:#81c784
    style N fill:#81c784
    style H fill:#e53935
    style K fill:#e53935
```

---

## **Diagram 13: Message Queue - Async Processing**

```mermaid
graph LR
    A["User submits<br/>experience"]
    
    A -->|Fast: Save to DB| B["Experience saved<br/>return 200 OK"]
    
    B -->|User happy!| C["Response in 100ms"]
    
    A -->|Queue job:<br/>Send email| D["RabbitMQ"]
    
    A -->|Queue job:<br/>Increment stats| E["RabbitMQ"]
    
    D -->|Background worker| F["Send email<br/>notification"]
    
    E -->|Background worker| G["Update analytics<br/>increment counter"]
    
    F -->|Takes 2 seconds| H["Email sent"]
    
    G -->|Takes 500ms| I["Stats updated"]
    
    H -->|No impact| C
    I -->|No impact| C
    
    style C fill:#c8e6c9
    style D fill:#f8bbd0
    style E fill:#f8bbd0
    style H fill:#bbdefb
    style I fill:#bbdefb
```

---

## **Diagram 14: Interview Experience Filters**

```mermaid
graph TD
    A["User on Experiences page"]
    
    A -->|Select filters| B["Company dropdown<br/>Type dropdown<br/>Difficulty dropdown"]
    
    B -->|Build filter object| C["filter = {<br/>company: 'Amazon',<br/>interviewType: 'DSA',<br/>difficulty: 'Intermediate'<br/>}"]
    
    C -->|GET /api/experiences| D["Backend"]
    
    D -->|Experience.find| E["MongoDB Query<br/>Match all filters"]
    
    E -->|Populate user| F["Get author details<br/>name, college, batch"]
    
    F -->|Sort by date| G["createdAt: -1<br/>Newest first"]
    
    G -->|Return array| H["Filtered results"]
    
    H -->|Frontend receives| I["Render cards"]
    
    I -->|Each card shows| J["Company: Amazon<br/>Role: SDE-1<br/>Type: DSA<br/>Difficulty: Intermediate<br/>Author: Alice (IIT Bombay)<br/>Upvotes: 42<br/>Outcome: Selected"]
    
    style C fill:#bbdefb
    style E fill:#ffe0b2
    style J fill:#c8e6c9
```

---

**Complete system design visualized with 14 comprehensive diagrams!** 🎨

Use these diagrams in:
- System design interviews 🎤
- Team documentation 📚
- Architecture reviews 👥
- Scaling discussions 📈
