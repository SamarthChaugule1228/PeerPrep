# PeerPrep

A modern real-time mock interview platform for candidates who want to practice, improve, and get matched with interview partners instantly.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real-time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Video%20%26%20Audio-4A90E2)](https://webrtc.org/)

PeerPrep helps users:
- book or start live interview practice sessions
- get matched with peers or interviewers in real time
- collaborate in a shared coding environment
- review feedback analytics and interview performance
- share interview experiences with the community
- manage their profile and interview schedule in one place

---

## Highlights

### Practice Interview Flow
- Dedicated Practice Interview page for instant matching
- Match by type, difficulty, company focus, preferred language, and identity preference
- Live waiting timer and redirect to the interview room when a match is found
- Scheduled interview booking with validation and confirmation flow

### Interview Room Experience
- Real-time peer matching using Socket.IO
- Shared coding environment for live interview sessions
- Candidate and interviewer flow with session-based room routing
- Interview timer and match status handling

### Feedback & Performance Tracking
- Post-session feedback form with communication, technical, and overall ratings
- Feedback statistics page for the logged-in user
- Better separation between experience sharing and analytics

### Community Experience Board
- Read and publish interview stories
- Rich text editing for detailed experience posts
- Filtering and reading experience detail pages
- Upvote support for useful experiences

### Profile & Dashboard
- Personal dashboard with upcoming interviews and schedule visibility
- Profile section with clean, modern card-based UI
- Theme toggle with dark mode support across the app

---

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Socket.IO Client
- WebRTC support via custom hook

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT-based authentication
- Socket.IO server
- Nodemailer for email notifications

### Core Features
- Real-time matching
- Interview scheduling logic
- Feedback analytics
- Experience publishing
- Responsive dashboard and routing

---

## Project Structure

```text
peerprep/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Experience.js
│   │   ├── Feedback.js
│   │   ├── MatchingRequest.js
│   │   ├── Session.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── experiences.js
│   │   ├── feedback.js
│   │   └── matching.js
│   ├── services/
│   │   ├── EmailService.js
│   │   └── MatchingService.js
│   ├── socket/
│   │   └── socket.js
│   ├── .env
│   ├── package.json
│   ├── server.js
│   └── test-scheduled-flow.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PreferenceForm.jsx
│   │   │   ├── ProfileForm.jsx
│   │   │   ├── RichTextEditor.jsx
│   │   │   ├── ScheduleInterviewModal.jsx
│   │   │   └── StarRating.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   └── useWebRTC.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ExperienceDetail.jsx
│   │   │   ├── FeedbackPage.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── InterviewExperiences.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MatchRoom.jsx
│   │   │   ├── PracticeInterview.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ScheduledInterviews.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── config.js
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json
│   └── vite.config.js
│
├── EMAIL_SETUP.md
├── INTERVIEW_GUIDE/
├── AUTO_JOIN_FEATURE.md
├── FALLBACK_MATCHING_IMPLEMENTATION.md
├── INTERVIEW_CONNECTION_FLOW.md
├── INTERVIEW_NOTES.md
├── SCHEDULED_INTERVIEWS_IMPLEMENTATION.md
├── package.json
├── README.md
└── .gitignore
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB instance or MongoDB Atlas connection
- Git

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create a `.env` file inside `backend/` with:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

> For Gmail, use a 16-character app password, not your normal account password.

### 3. Start the backend

```bash
npm run dev
```

### 4. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

Open the app in your browser at:

```text
http://localhost:5173
```

---

## Main App Routes

- `/` — landing page
- `/login` — login
- `/register` — signup
- `/dashboard` — overview and interview status
- `/profile` — user profile management
- `/find-interview` — instant practice interview matching
- `/my-interviews` — scheduled interview list
- `/feedback` — feedback analytics
- `/experiences` — interview experiences board
- `/matchroom/:sessionId` — live interview room

---

## Email Setup

The app includes automatic email notifications for:
- schedule confirmation
- match notification when a peer/interviewer is found

For details, see [EMAIL_SETUP.md](EMAIL_SETUP.md).

---

## Notes

- The frontend has been designed with a cleaner route structure and dedicated pages for Practice Interview, Feedback, and Experiences.
- Dark mode support is built into the global theme context.
- The app is ready for local development and deployment with Vercel + backend hosting.

---

## Build Status

The frontend production build has been verified successfully with Vite.

```bash
cd frontend
npm run build
```

---

## License

This project is currently licensed as a private project for the team and is not intended for public redistribution unless explicitly approved.

---

## Acknowledgements

- React
- Vite
- Tailwind CSS
- Node.js
- Socket.IO
- MongoDB
- WebRTC
- Nodemailer
