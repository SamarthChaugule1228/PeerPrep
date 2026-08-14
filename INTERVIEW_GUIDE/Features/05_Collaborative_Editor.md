# Collaborative Code Editor

---

### Feature Overview

**What is it?**
Real-time code editor where both users see code changes instantly. Both can edit (depending on permissions).

**Why?**
- During interview, both see same code
- Candidate writes solution
- Interviewer can comment/suggest
- Code shared in real-time via Socket.IO
- Saved to database (survives page refresh)

**How it works:**
User types code → Frontend emits change → Backend broadcasts → Other user sees update instantly → Also saved to DB

---

### Working Flow

```
CODE TYPING FLOW:

1. User opens MatchRoom
   - Frontend fetches current session data via 'join-room'
   - Gets: code, language, question, notes, timer
   - Monaco Editor populated with current code

2. User types in code editor
   - onChange event fires
   - setCode(newCode) updates React state

3. emitCode(newCode) called:
   - Frontend sends: socket.emit('code-change', { sessionId, code })

4. Backend receives 'code-change' event:
   socket.on('code-change', async ({ sessionId, code }) => {
     socket.to(sessionId).emit('code-update', code);
     await Session.findByIdAndUpdate(sessionId, { code });
   })

5. Backend broadcasts to room:
   - socket.to(sessionId) sends to all in room except sender
   - Event name: 'code-update'
   - Data: new code

6. Other user's frontend receives 'code-update':
   socketRef.current.on('code-update', setCode);
   - Updates their code state
   - Monaco Editor re-renders with new code

7. Backend saves to database:
   - Session.code updated with new value
   - Persisted in MongoDB

8. If page refreshes:
   - Frontend calls 'join-room' again
   - Backend sends current session state
   - Code restored from database

LANGUAGE SELECTION FLOW (Similar):
1. User changes language dropdown: Python → JavaScript
2. emitLang('javascript') called
3. Backend receives 'language-change' event
4. Broadcasts 'language-update' to room
5. Other user's editor switches language (syntax highlighting)
6. Saved to database

QUESTION SHARING (Interviewer only):
1. Interviewer types question in textarea
2. emitQuestion(question) called
3. Backend broadcasts 'question-update' to room
4. Candidate sees question appear in their panel
5. Candidate sees text "Shared" label

NOTES (Candidate only - Private):
1. Candidate types notes in textarea
2. emitNotes(notes) called
3. Backend saves to Session.notes
4. ONLY sent to candidate (not broadcasted)
5. Candidate's private thoughts
6. Interviewer can't see

TIMER SYNCHRONIZATION:
1. Interviewer clicks "Start 45m"
2. startTimer(45) called
3. Backend calculates: timerEnd = now + 45 minutes
4. Broadcasts 'timer-update' to room with timerEnd timestamp
5. Both users' frontends receive same timerEnd
6. Both calculate remaining time from same point
7. Both see exactly same countdown (no drift)
8. When timer reaches 00:00, session ends
```

---

### Files Used

| File | Purpose |
|------|---------|
| `frontend/pages/MatchRoom.jsx` | Code editor UI, language select, question/notes panels |
| `frontend/services/api.js` | Initial data fetch |
| `backend/socket/socket.js` | Broadcasts code/language/question/notes/timer changes |
| `backend/models/Session.js` | Stores code, language, question, notes, timer |

---

### Important Code

#### **1. Code Change Handler**

**File:** `backend/socket/socket.js` → `socket.on('code-change')` event

**What it does:**
Receives code update, broadcasts to room, saves to DB.

**Why important:**
Core of real-time collaboration - both users see changes instantly.

**Interview point:**
"We use socket.to() to broadcast to room except sender. Sender already updated their local state. We also save to database so if user refreshes, code isn't lost."

```javascript
socket.on('code-change', async ({ sessionId, code }) => {
  socket.to(sessionId).emit('code-update', code);
  await Session.findByIdAndUpdate(sessionId, { code });
});
```

---

#### **2. Language Selection Sync**

**File:** `backend/socket/socket.js` → `socket.on('language-change')` event

**What it does:**
When one user changes language, both editors switch language.

**Why important:**
If candidate codes in Python but interviewer wants Java, they need to sync.

```javascript
socket.on('language-change', async ({ sessionId, language }) => {
  socket.to(sessionId).emit('language-update', language);
  await Session.findByIdAndUpdate(sessionId, { language });
});
```

---

#### **3. Fetch Session Data on Join**

**File:** `backend/socket/socket.js` → `socket.on('join-room')` event

**What it does:**
When user joins room, send current code/notes/question/language from database.

**Why important:**
If user refreshes, gets current state instead of blank editor.

```javascript
socket.on('join-room', async (sessionId) => {
  socket.join(sessionId);
  const session = await Session.findById(sessionId);
  socket.emit('session-data', {
    question: session.question,
    code: session.code,
    language: session.language,
    notes: session.notes,
    timerEnd: session.timerEnd,
    status: session.status
  });
});
```

---

#### **4. Question Panel (Interviewer Only)**

**File:** `frontend/pages/MatchRoom.jsx`

**What it does:**
Interviewer can type question. Updates real-time for candidate.

**Why important:**
Interview question centralized. Candidate doesn't miss it.

```javascript
{role === 'interviewer' ? (
  <textarea
    value={question}
    onChange={(e) => { 
      setQuestion(e.target.value); 
      emitQuestion(e.target.value);  // Real-time broadcast
    }}
    placeholder="Type the interview question..."
  />
) : (
  <div>Question appears here as shared from interviewer</div>
)}
```

---

#### **5. Notes Panel (Candidate Only)**

**File:** `frontend/pages/MatchRoom.jsx`

**What it does:**
Candidate has private notes (not visible to interviewer).

**Why important:**
Candidate can jot quick thoughts without interviewer seeing.

```javascript
{role === 'candidate' ? (
  <textarea
    value={notes}
    onChange={(e) => { 
      setNotes(e.target.value); 
      emitNotes(e.target.value);  // Saved but NOT broadcasted
    }}
    placeholder="Write your thoughts..."
  />
) : (
  <div>Notes are candidate only</div>
)}
```

---

### Key Methods

| Method | What it does |
|--------|-------------|
| `socket.emit('code-change')` | Send code to backend |
| `socket.on('code-update')` | Receive code from other user |
| `socket.emit('timer-start')` | Start timer with duration |
| `socket.to(sessionId).emit()` | Broadcast to room (others) |
| `Session.findByIdAndUpdate()` | Save changes to database |
| `session.getTracks()` | Get media tracks |

---

### Interview Q&A

**Q: What if two users edit code at same time?**
A: Last update wins. User A types, sends update. User B types, sends update. Both clients show User B's code. Not ideal (Google Docs uses Operational Transformation for better conflict resolution).

**Q: Why save to database if Socket.IO syncs?**
A: Socket.IO data is in memory. If server restarts, all lost. Database persists. Plus if user refresh page, needs to restore from DB.

**Q: Can candidate edit code?**
A: Yes, in your current code both can edit. Interviewer types question in one box, code is shared box. Better design: only candidate edits code, interviewer watches. Can be improved.

**Q: How does timer work?**
A: Interviewer sends duration (45 minutes). Backend calculates: timerEnd = now + 45*60000 ms. Sends timerEnd timestamp to both. Both calculate remaining time from same point. Guarantees sync.

**Q: What if user toggles between code editor and question panel?**
A: Both panels stay synced. If away from code editor but question changes, code still updates in background. When switch back, code is already current.

**Q: What happens to notes if candidate disconnects?**
A: Notes saved to database in Session.notes. If candidate returns to same session, notes restored. If session ended, notes still in database (can be added to feedback later).

**Q: Why emitQuestion() vs emitCode()?**
A: Same logic, just different event names and database fields. Both broadcast to room and save to DB.

**Q: Can you see language syntax highlighting in real-time?**
A: Yes. User A switches to Python, Monaco Editor switches syntax highlighting for User B. Both see same syntax highlighting.

---

### Summary

| Concept | Key Point |
|---------|-----------|
| **Code Sync** | Socket.IO broadcasts code instantly to other user |
| **Database Persistence** | Saved to DB so survives page refresh |
| **Language Sync** | Both editors switch language together |
| **Question Panel** | Interviewer-only, shared with candidate in real-time |
| **Notes Panel** | Candidate-only, private (not shared) |
| **Timer Sync** | Same timestamp sent to both, no drift |
| **Conflict Resolution** | Last update wins (not ideal, could use OT) |
