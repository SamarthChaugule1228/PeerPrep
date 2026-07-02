````markdown
# PeerPrep 🚀

[![MERN](https://img.shields.io/badge/Stack-MERN-brightgreen)](https://www.mongodb.com/mern-stack)
[![Vite](https://img.shields.io/badge/Vite-4.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Realtime-blue)](https://webrtc.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?logo=socket.io&logoColor=white)](https://socket.io/)

**Real-time Peer-to-Peer Mock Interview Platform**

Practice technical interviews with real partners instantly.  
Match, code together, video-chat, share feedback, and read community interview experiences — all in one place.

🌐 **Live App:** [https://peer-prep-gules.vercel.app](https://peer-prep-gules.vercel.app)  
🐙 **GitHub Repo:** [SamarthChaugule1228/PeerPrep](https://github.com/SamarthChaugule1228/PeerPrep)

---

## ✨ Features

### 🔍 Smart Peer Matching
- Match based on interview type, difficulty, target company, and preferred language
- Real-time matching engine powered by Socket.IO
- Anonymous or named identity preference

### 💻 Shared Coding Interview Room
- Collaborative Monaco Editor (Python, Java, C++)
- Live code syncing between participants
- Question panel (interviewer editable, candidate read-only)
- Shared notes / whiteboard
- Server-driven interview timer (15/30/45 min)

### 🎥 Voice & Video Calls
- WebRTC peer-to-peer audio and video
- Screen sharing with dynamic full-screen expansion
- Mute/unmute microphone and toggle camera controls
- Connection status indicator

### ⭐ Post-Session Feedback
- Rate your partner on Communication, Technical, and Overall skills
- Optional written note
- Average ratings displayed on your dashboard

### 📚 Public Interview Experience Board
- Community-shared real interview stories
- Rich-text editor (Tiptap) with bold, headings, lists, links, code blocks with syntax highlighting
- Filter by company, college (IITs, NITs, etc.), interview type, difficulty
- Upvote helpful posts, read counts
- Dedicated detail page with rendered formatted content

### 👤 User Profile
- College selection (popular IITs, NITs + custom)
- Degree, branch, year, graduation year
- Dedicated profile page with edit toggle

### 🌗 Dark Mode
- Full dark mode support across all pages with toggle

### 🏠 Homepage & Navigation
- Modern landing page with feature highlights
- Global header and footer

---

## 🛠️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Monaco Editor, Socket.IO Client, WebRTC, Tiptap  
**Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT (jsonwebtoken + bcryptjs)  
**Real-time:** WebRTC (peer-to-peer), Socket.IO (signalling & code sync)  
**Database:** MongoDB Atlas  
**Deployment:** Vercel (frontend), Railway (backend)

---

## 📁 Project Structure

```text
peerprep/
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── models/
│   │   ├── User.js              # User schema (with preferences & profile)
│   │   ├── Session.js           # Interview session schema
│   │   ├── Feedback.js          # Post-session feedback schema
│   │   └── Experience.js        # Interview experience board schema
│   ├── routes/
│   │   ├── auth.js              # Auth (register, login, profile/preferences update)
│   │   ├── feedback.js          # Feedback CRUD + stats
│   │   └── experiences.js       # Experience board CRUD, upvote, reads
│   ├── socket/
│   │   └── socket.js            # Socket.IO server (matching, code sync, WebRTC signalling)
│   ├── .env
│   ├── package.json
│   └── server.js                # Express app entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── StarRating.jsx
│   │   │   ├── FeedbackModal.jsx
│   │   │   ├── ProfileForm.jsx
│   │   │   └── RichTextEditor.jsx   # Tiptap editor
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/
│   │   │   └── useWebRTC.js         # WebRTC custom hook
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MatchRoom.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── InterviewExperiences.jsx
│   │   │   └── ExperienceDetail.jsx
│   │   ├── services/
│   │   │   └── api.js               # Axios instance
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── config.js                # Backend URL config
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vercel.json                # Vercel SPA rewrite rules
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas connection string (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/SamarthChaugule1228/PeerPrep.git
cd PeerPrep
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `src/config.js` file with the backend URL (or set `VITE_BACKEND_URL` env variable):

```js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export default BACKEND_URL;
```

Start the development server:

```bash
npm run dev
```

### 4. Access the app

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚀 Deployment

### Backend (Railway)

1. Push your code to GitHub.
2. On [Railway](https://railway.app), deploy a new service from your repo.
3. Set Root Directory to `backend`.
4. Add environment variables: `MONGO_URI`, `JWT_SECRET`.
5. Get your public Railway URL.

### Frontend (Vercel)

1. Push your code to GitHub.
2. On [Vercel](https://vercel.com), import the repo.
3. Set Root Directory to `frontend`, Framework to `Vite`.
4. Add environment variable: `VITE_BACKEND_URL` = your Railway URL.
5. Deploy!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/SamarthChaugule1228/PeerPrep/issues).

---

## 📜 License

This project is [MIT](LICENSE) licensed.

---

## 🙏 Acknowledgements

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tiptap](https://tiptap.dev/)
- [Socket.IO](https://socket.io/)
- [WebRTC](https://webrtc.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Render](https://render.com) / [Railway](https://railway.app) / [Vercel](https://vercel.com)

---

Made with ❤️ by [Samarth Chaugule](https://github.com/SamarthChaugule1228)
````
