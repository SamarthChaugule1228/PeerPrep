# PeerPrep

PeerPrep is a full-stack mock interview platform for matching with peers or interviewers, running live practice sessions, sharing interview experiences, and tracking feedback.

The application has a React/Vite frontend and an Express, MongoDB, and Socket.IO backend. Live sessions use WebRTC for audio, video, and screen sharing, while Socket.IO synchronizes the interview room and matching updates.

## Features

- Register, sign in, and manage a profile and interview preferences.
- Start an instant interview search with preferences for interview type, difficulty, company, language, identity, and role.
- Schedule an interview with a preferred time window.
- Match candidates with interviewers when available, with peer-practice fallback for unmatched requests.
- Join a live interview room with synchronized questions, code, language, timer, private notes, video, audio, and screen sharing.
- Submit post-interview ratings and view feedback averages.
- Create, browse, filter, read, and upvote community interview experiences.
- Use light or dark theme preferences in the frontend.

## Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Axios, Socket.IO Client, Monaco Editor, Tiptap |
| Backend | Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs, Nodemailer |
| Live media | WebRTC browser APIs |

## Repository Layout

```text
peerprep/
|-- backend/                 # Express API, Socket.IO server, MongoDB models, matching services
|-- frontend/                # React/Vite single-page application
|   |-- src/assets/          # Images imported and fingerprinted by Vite builds
|   |-- src/components/      # Reusable UI and feature components
|   |-- src/pages/           # Application route views
|   |-- src/services/        # HTTP client configuration
|   `-- vercel.json          # SPA rewrite configuration for Vercel
|-- EMAIL_SETUP.md           # Gmail App Password email configuration details
`-- README.md
```

## Prerequisites

- Node.js 18 or later
- npm
- A MongoDB database, local or Atlas
- A modern browser with camera, microphone, and screen-sharing permissions for live sessions

## Local Development

Install and run the backend and frontend in separate terminals.

### 1. Configure the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb_connection_string
JWT_SECRET=long_random_secret
FRONTEND_URL=http://localhost:5173

# Optional: enables welcome, scheduling, and match notification emails.
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_16_character_gmail_app_password
```

`MONGO_URI` and `JWT_SECRET` are required. Email credentials are optional; without them the server continues to run and email notifications are skipped. See [EMAIL_SETUP.md](EMAIL_SETUP.md) for Gmail configuration details.

Start the API and Socket.IO server:

```bash
npm run dev
```

The backend listens on `http://localhost:5000` by default. `GET /` returns `API running` as a basic health check.

### 2. Configure the frontend

```bash
cd ../frontend
npm install
```

For local development, no frontend environment file is required because the app defaults to `http://localhost:5000` and Vite proxies `/api` there. To target a different backend, create `frontend/.env.local`:

```env
VITE_BACKEND_URL=https://your-backend.example.com
```

Start Vite:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Production Build

```bash
cd frontend
npm run build
```

Vite writes the production application to `frontend/dist`. Image URLs in `src/config/assets.js` are ES module imports, so Vite emits their hashed production files to `dist/assets` and rewrites their references during the build.

Preview a completed build locally with:

```bash
npm run preview
```

## Deployment

Deploy the frontend as a static Vite site and set `VITE_BACKEND_URL` to the public URL of the backend. The supplied `frontend/vercel.json` handles single-page-app route rewrites on Vercel.

Deploy the backend to a host that supports a persistent Node.js process and WebSocket connections. The backend runs Socket.IO and in-process matching jobs: scheduled fallback checks run every minute and expired instant requests are cleaned up every five minutes. A purely serverless deployment is not suitable without moving those responsibilities to durable external services.

Set these backend environment variables in the host:

```env
PORT=5000
MONGO_URI=mongodb_connection_string
JWT_SECRET=long_random_secret
FRONTEND_URL=https://your-frontend.example.com
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

Use HTTPS in production. Browser camera, microphone, screen sharing, and WebRTC behavior depend on a secure context.

## Application Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Home page |
| `/login` | Public | Sign in |
| `/register` | Public | Create an account |
| `/dashboard` | Authenticated | Interview overview |
| `/find-interview` | Authenticated | Instant and scheduled matching flow |
| `/my-interviews`, `/scheduled-interviews` | Authenticated | Upcoming scheduled interviews |
| `/matchroom/:sessionId` | Authenticated | Live interview room |
| `/feedback` | Authenticated | Feedback analytics |
| `/profile`, `/settings` | Authenticated | Profile management |
| `/experiences`, `/interview-experiences` | Public | Community interview experiences |
| `/experiences/:id` | Public | Experience detail |

## API Overview

All protected API requests require the JWT in the `x-auth-token` header. The frontend adds this header from local storage automatically.

| Group | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/user`, `PUT /api/auth/preferences`, `PUT /api/auth/profile` |
| Matching | `POST /api/matching/instant`, `POST /api/matching/scheduled`, `POST /api/matching/try-match/:requestId`, `GET /api/matching/request/:requestId`, `POST /api/matching/cancel/:requestId`, `GET /api/matching/active`, `GET /api/matching/scheduled-list` |
| Feedback | `POST /api/feedback`, `GET /api/feedback/stats` |
| Experiences | `POST /api/experiences`, `GET /api/experiences`, `GET /api/experiences/:id`, `POST /api/experiences/:id/upvote` |

## Matching Behavior

- Instant searches attempt an immediate compatible match. If no direct match is found, the Socket.IO flow performs a peer fallback attempt after 30 seconds. Old instant requests expire after one hour.
- Scheduled searches first look for an interviewer. Two hours before the scheduled start, unmatched requests become eligible for peer fallback.
- The backend broadcasts matching and fallback updates through Socket.IO. A signed-in user must connect with their JWT in the Socket.IO handshake.

## Verification

The frontend build can be checked with:

```bash
cd frontend
npm run build
```

There is no automated test command configured in `package.json`. `backend/test-scheduled-flow.js` is a manual database exercise that creates and changes matching records; do not run it against production data.

## Additional Documentation

- [EMAIL_SETUP.md](EMAIL_SETUP.md): Configure Gmail App Password notifications.
- [AUTO_JOIN_FEATURE.md](AUTO_JOIN_FEATURE.md): Match-room auto-join behavior.
- [FALLBACK_MATCHING_IMPLEMENTATION.md](FALLBACK_MATCHING_IMPLEMENTATION.md): Scheduled matching fallback design.
- [INTERVIEW_CONNECTION_FLOW.md](INTERVIEW_CONNECTION_FLOW.md): Interview connection flow.
- [SCHEDULED_INTERVIEWS_IMPLEMENTATION.md](SCHEDULED_INTERVIEWS_IMPLEMENTATION.md): Scheduled interview implementation notes.

## License

This repository does not declare an open-source license. Treat it as private unless the project owners provide one.
