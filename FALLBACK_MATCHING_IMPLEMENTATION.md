# PeerPrep Fallback Matching System - Implementation Summary

## Overview
A complete fallback matching system has been implemented for PeerPrep that supports both **Instant Interviews** and **Scheduled Interviews** with automatic candidate-to-candidate (peer) fallback when interviewers are unavailable.

## Architecture Changes

### 1. Database Models

#### MatchingRequest Model (`models/MatchingRequest.js`)
- **Purpose**: Stores all interview matching requests (instant and scheduled)
- **Key Fields**:
  - `type`: 'instant' or 'scheduled'
  - `status`: 'waiting', 'matched', 'expired', 'cancelled'
  - `rolePreference`, `interviewType`, `difficulty`, `preferredLanguage`
  - `scheduledDate`, `scheduledStartTime`, `scheduledEndTime`
  - `fallbackEligibleAt`: Auto-calculated as (startTime - 120 minutes)
  - `matchType`: 'interviewer' or 'peer'
  - `matchedWith`: Reference to matched user
  - `fallbackAppliedAt`: Timestamp when fallback was applied
- **Indexes**: For efficient querying by status, type, and fallback timing

#### Session Model Updates
- Added `matchType` field to track if session is interviewer-candidate or peer-peer
- Added interview metadata: `interviewType`, `difficulty`, `isScheduled`, `scheduledStartTime`, `scheduledEndTime`

### 2. Matching Service (`services/MatchingService.js`)

A reusable service with the following methods:

**Core Matching:**
- `findInterviewerMatch(request)` - Find available interviewer with opposite role
- `findCandidateMatch(request)` - Find compatible candidate for peer matching
- `matchInstantInterview(requestId)` - Instant flow: Try interviewer, fallback to candidate
- `applyScheduledFallback(requestId)` - Scheduled flow: Apply peer match after 120-min mark

**Atomic Operations:**
- `matchRequests(id1, id2, matchType)` - Uses MongoDB transactions to prevent double-booking
- `createSessionForMatch(req1, req2, matchType)` - Creates session with correct roles

**Maintenance:**
- `cancelRequest(requestId)` - Mark request as cancelled
- `expireOldRequests(maxWaitSeconds)` - Expire instant requests after timeout

**Helper:**
- `getOppositeRole(role)` - Get opposite of candidate/interviewer

### 3. Backend Routes (`routes/matching.js`)

**Endpoints:**
- `POST /api/matching/instant` - Create instant interview request
- `POST /api/matching/scheduled` - Create scheduled interview request
- `POST /api/matching/try-match/:requestId` - Try to find match (polling)
- `GET /api/matching/request/:requestId` - Get request details
- `POST /api/matching/cancel/:requestId` - Cancel request
- `GET /api/matching/active` - Get user's active requests

### 4. Socket.IO Events (`socket/socket.js`)

**New Instant Interview Flow:**
- Client emits: `instant-interview-start` with preferences
- Server creates MatchingRequest, tries to match immediately
- Server emits: `matched` with sessionId, partner details, matchType
- Client emits: `try-find-match` for polling if no immediate match

**New Scheduled Interview Flow:**
- Client emits: `scheduled-interview-start` with date/time/preferences
- Server calculates `fallbackEligibleAt` (120 min before start)
- Server tries interviewer match first (before 120-min mark)
- Server applies peer fallback after 120-min mark
- Server emits: `scheduled-interview-request-created` with timing info

**Cancellation:**
- Client emits: `cancel-interview-request`
- Server updates request status to 'cancelled'
- Server emits: `interview-request-cancelled`

**Backward Compatibility:**
- Existing `find-peer` event continues to work for old clients

### 5. Background Jobs (`server.js`)

**Scheduled Fallback Job (Every 60 seconds):**
```javascript
Find all scheduled requests where:
  - status = 'waiting'
  - fallbackEligibleAt <= now
  - fallbackAppliedAt = null
Then: Apply fallback (find candidate match) and notify users
```

**Expiration Job (Every 5 minutes):**
```javascript
Find all instant requests where:
  - status = 'waiting'
  - createdAt < (now - 1 hour)
Then: Mark as 'expired' (prevents infinite waiting)
```

### 6. Frontend Updates

#### Dashboard (`frontend/Dashboard.jsx`)
- **New UI**: Two buttons instead of one:
  - `⚡ Instant Interview` - Start matching immediately
  - `📅 Schedule Interview` - Open scheduling modal
- **Interview Mode Tracking**: Displays different waiting messages for instant vs scheduled
- **Socket Events**: Handles `interview-request-created`, `scheduled-interview-request-created`, `match-not-found`
- **Cancellation**: Sends `cancel-interview-request` when user cancels search

#### Schedule Interview Modal (`frontend/ScheduleInterviewModal.jsx`)
- **Input Fields**: Date picker, start time, end time
- **Validation**: 
  - Date must be in future
  - Start time < end time
  - Duration check
- **Help Text**: Explains 120-minute fallback window
- **Styling**: Matches PeerPrep dark/light theme

#### Match Room (`frontend/MatchRoom.jsx`)
- **Match Type Display**: 
  - Shows "Interview matched successfully" or "Peer matched successfully"
  - Visual badge: 👨‍💼 for interviewer match, 👥 for peer match
- **Color-coded Banner**: 
  - Emerald for interviewer matches
  - Blue for peer matches
- **Pass Through**: matchType and message from state

## Matching Flow Diagrams

### Instant Interview Flow
```
User clicks "Instant Interview"
          ↓
Create MatchingRequest (type: instant, status: waiting)
          ↓
Try to find INTERVIEWER match
    ├─ FOUND → Create session, emit matched (type: interviewer) ✓
    └─ NOT FOUND → Try to find CANDIDATE match
                    ├─ FOUND → Create session, emit matched (type: peer) ✓
                    └─ NOT FOUND → Keep request waiting (polling every few seconds)
```

### Scheduled Interview Flow
```
User clicks "Schedule Interview"
          ↓
Fill date/time → Create MatchingRequest (type: scheduled, status: waiting)
          ↓
Calculate fallbackEligibleAt = startTime - 120 minutes
          ↓
Try to find INTERVIEWER match
    ├─ FOUND → Create session, emit matched (type: interviewer) ✓
    └─ NOT FOUND → Keep waiting
                    ↓
              [Background job every 60s checks if fallbackEligibleAt reached]
              ↓
              NOW >= fallbackEligibleAt?
              ├─ NO → Keep waiting for interviewer
              └─ YES → Try to find CANDIDATE match
                      ├─ FOUND → Create session, emit matched (type: peer) ✓
                      └─ NOT FOUND → Keep request waiting
```

## Key Features

### 1. Atomic Matching
- Uses MongoDB transactions to ensure requests are matched only once
- Prevents race conditions where same request gets matched with multiple users
- Transaction rolls back if either user is no longer waiting

### 2. Candidate-to-Candidate (Peer) Matching
- No Accept/Reject UI - both users are automatically connected
- Both marked as "candidate" role in session
- Message: "Peer matched successfully. You can now practice together and decide how you want to conduct the session."

### 3. 120-Minute Fallback Window
- For scheduled interviews, system waits 120 minutes before applying peer fallback
- Gives maximum time to find an actual interviewer
- Prevents premature peer matching for planned interviews

### 4. Request Expiration
- Instant requests expire after 1 hour of waiting
- Prevents indefinite "waiting" states in database
- Users can cancel anytime before match

### 5. Identity Preference Support
- Both interviewer and peer matches respect anonymity settings
- Anonymous users don't see partner names
- Can be toggled per interview

## Database Transactions

The `matchRequests` method uses MongoDB sessions/transactions:

```javascript
1. Start transaction
2. Fetch both requests (with session lock)
3. Verify both in 'waiting' status
4. Create session document
5. Atomic update request 1: status='matched', matchedWith=userId2
6. Atomic update request 2: status='matched', matchedWith=userId1
7. Commit transaction
If any step fails: Rollback entire transaction
```

This prevents scenarios like:
- Request A matching with both B and C simultaneously
- Request getting matched after being cancelled
- Session created but request not updated

## Backward Compatibility

The old `find-peer` Socket.IO event continues to work:
- Still creates sessions with interviewer/candidate roles
- Uses in-memory waitingQueue for quick matching
- No database interaction
- Old clients/mobile apps won't break

## Testing Recommendations

1. **Instant Interview**:
   - Start two instant requests with opposite roles → should match immediately
   - Start one candidate, then another candidate → should match as peers after no interviewer found
   - Start request and cancel before match → should not be matchable again

2. **Scheduled Interview**:
   - Schedule for future date, no interviewer available → should match as peer at 120-min mark
   - Schedule with interviewer available before 120-min → should match as interviewer
   - Schedule with interviewer matching after 120-min → should remain matched as interviewer

3. **Edge Cases**:
   - Cancel right as match is happening → transaction should handle gracefully
   - Create 10 requests simultaneously → each should match to exactly one other
   - Time zones for scheduled interviews (validate all times are stored in UTC)

## Files Modified Summary

| File | Type | Changes |
|------|------|---------|
| models/MatchingRequest.js | Create | New model for storing requests |
| models/Session.js | Modify | Added matchType, interview metadata |
| services/MatchingService.js | Create | Matching logic with fallback |
| routes/matching.js | Create | API endpoints |
| routes/auth.js | None | No changes needed |
| socket/socket.js | Modify | Added instant/scheduled events + emitMatchResult |
| server.js | Modify | Added background jobs initialization |
| frontend/Dashboard.jsx | Modify | Added Instant/Schedule buttons, modal |
| frontend/MatchRoom.jsx | Modify | Display match type banner |
| frontend/ScheduleInterviewModal.jsx | Create | Scheduling form component |

All existing functionality (collaborative editor, WebRTC, feedback) remains unchanged and compatible.
