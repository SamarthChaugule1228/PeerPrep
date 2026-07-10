import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useWebRTC } from '../hooks/useWebRTC';
import FeedbackModal from '../components/FeedbackModal';   // <-- added
import BACKEND_URL from '../config';

const MatchRoom = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const partner = location.state?.partner;
  const role = location.state?.role || 'candidate';
  const partnerUserId = location.state?.partnerUserId;   // <-- added

  const socketRef = useRef(null);

  // Room state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [timerEnd, setTimerEnd] = useState(null);
  const [timerDisplay, setTimerDisplay] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showVideoPanel, setShowVideoPanel] = useState(true);

  // Feedback modal state
  const [showFeedback, setShowFeedback] = useState(false);   // <-- added
  const [partnerLeft, setPartnerLeft] = useState(false);

  // Connect socket and join room
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(BACKEND_URL, { auth: { token } });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-room', sessionId);
    });

    socketRef.current.on('session-data', (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setQuestion(data.question);
      setNotes(data.notes);
      setStatus(data.status);
      if (data.timerEnd) setTimerEnd(new Date(data.timerEnd));
    });

    socketRef.current.on('code-update', setCode);
    socketRef.current.on('language-update', setLanguage);
    socketRef.current.on('question-update', setQuestion);
    socketRef.current.on('notes-update', setNotes);
    socketRef.current.on('timer-update', ({ timerEnd: end }) => setTimerEnd(end ? new Date(end) : null));
    socketRef.current.on('interview-ended', () => setStatus('ended'));
    socketRef.current.on('partner-left', () => {
      setPartnerLeft(true);
      setStatus('ended');
      setShowFeedback(false);
    });

    // Listen for show-feedback event from the server
    socketRef.current.on('show-feedback', () => {
      setShowFeedback(true);   // <-- added
    });

    return () => socketRef.current?.disconnect();
  }, [sessionId]);

  // Timer countdown
  useEffect(() => {
    if (!timerEnd) { setTimerDisplay(''); return; }
    const update = () => {
      const diff = timerEnd.getTime() - Date.now();
      if (diff <= 0) {
        setTimerDisplay('00:00');
        setStatus('ended');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimerDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerEnd]);

  // Emitters
  const emitCode = (val) => socketRef.current?.emit('code-change', { sessionId, code: val });
  const emitLang = (lang) => socketRef.current?.emit('language-change', { sessionId, language: lang });
  const emitQuestion = (q) => socketRef.current?.emit('question-change', { sessionId, question: q });
  const emitNotes = (n) => socketRef.current?.emit('notes-change', { sessionId, notes: n });
  const startTimer = (mins) => socketRef.current?.emit('timer-start', { sessionId, duration: mins * 60 });
  const stopTimer = () => socketRef.current?.emit('timer-stop', { sessionId });
  const endInterview = () => {
    if (window.confirm('End the interview?')) {
      stopAllMedia();
      socketRef.current?.emit('end-interview', { sessionId });
    }
  };
  const leaveRoom = () => {
    stopAllMedia();
    socketRef.current?.emit('leave-room', { sessionId });
    navigate('/dashboard');
  };

  // Feedback modal close handler
  const handleFeedbackClose = () => {   // <-- added
    setShowFeedback(false);
    navigate('/dashboard');
  };

  // WebRTC
  const {
    localStream,
    remoteStream,
    connectionStatus,
    micOn,
    camOn,
    screenSharing,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    stopAllMedia,
  } = useWebRTC(socketRef, sessionId, role === 'interviewer');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteContainerRef = useRef(null);

  const [isRemoteScreen, setIsRemoteScreen] = useState(false);
  useEffect(() => {
    if (remoteStream) {
      const videoTrack = remoteStream.getVideoTracks()[0];
      if (videoTrack) {
        const label = videoTrack.label || '';
        setIsRemoteScreen(label.includes('screen') || label.includes('window'));
      }
    } else {
      setIsRemoteScreen(false);
    }
  }, [remoteStream]);

  const toggleFullscreen = () => {
    if (!remoteContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      remoteContainerRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (!partnerLeft) return;
    const timeout = setTimeout(() => navigate('/dashboard'), 3000);
    return () => clearTimeout(timeout);
  }, [partnerLeft, navigate]);

  useEffect(() => {
    if (status === 'ended') {
      stopAllMedia();
    }
  }, [status, stopAllMedia]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)]">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                ← Dashboard
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Interview room</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {role === 'interviewer' ? 'Interviewer' : 'Candidate'} • Session {sessionId?.slice(0, 8)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {timerDisplay && (
                <div className={`rounded-full px-3 py-1.5 font-mono text-sm font-semibold ${status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                  {timerDisplay}
                </div>
              )}
              {role === 'interviewer' && status === 'active' && (
                <div className="flex flex-wrap items-center gap-2">
                  {[15, 30, 45].map((minutes) => (
                    <button key={minutes} onClick={() => startTimer(minutes)} className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700">
                      {minutes}m
                    </button>
                  ))}
                  <button onClick={stopTimer} className="rounded-full bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">
                    Stop
                  </button>
                </div>
              )}
              <button onClick={endInterview} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600">
                End interview
              </button>
            </div>
          </div>
        </header>

        {partnerLeft && (
          <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Your partner has left the room. You will be returned to the dashboard shortly.</span>
              <button onClick={() => navigate('/dashboard')} className="font-semibold underline">
                Go now
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto flex max-w-7xl flex-col gap-4 p-4 xl:p-6">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 lg:hidden">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Room panels</span>
            <div className="flex gap-2">
              <button onClick={() => setShowInfoPanel((prev) => !prev)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {showInfoPanel ? 'Hide session' : 'Show session'}
              </button>
              <button onClick={() => setShowVideoPanel((prev) => !prev)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {showVideoPanel ? 'Hide video' : 'Show video'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            <div className={`flex flex-col gap-4 ${showInfoPanel ? 'block' : 'hidden'} lg:block`}>
              {role === 'interviewer' ? (
                <section className="flex min-h-[220px] flex-col rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Question</h2>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">Prompt</span>
                  </div>
                  <textarea
                    value={question}
                    onChange={(e) => { setQuestion(e.target.value); emitQuestion(e.target.value); }}
                    placeholder="Type the interview question..."
                    className="min-h-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </section>
              ) : (
                <section className="flex min-h-[220px] flex-col rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Question</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Shared</span>
                  </div>
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    The interviewer will share the question here during the session.
                  </div>
                </section>
              )}

              {role === 'candidate' ? (
                <section className="flex min-h-[220px] flex-col rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Notes</h2>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">Private</span>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); emitNotes(e.target.value); }}
                    placeholder="Write your thoughts, hints, or follow-up points..."
                    className="min-h-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </section>
              ) : (
                <section className="flex min-h-[220px] flex-col rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Notes</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Candidate only</span>
                  </div>
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Notes are kept private to the candidate for their own preparation.
                  </div>
                </section>
              )}
            </div>

            <section className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">
                <select
                  value={language}
                  onChange={(e) => { setLanguage(e.target.value); emitLang(e.target.value); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Partner: {partner?.anonymous ? 'Anonymous' : partner?.name || 'Unknown'}
                </div>
              </div>

              <div className="min-h-[540px] flex-1 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-950">
                {status === 'active' ? (
                  <Editor
                    height="100%"
                    language={language === 'cpp' ? 'cpp' : language}
                    value={code}
                    onChange={(val) => { setCode(val); emitCode(val); }}
                    theme="vs-dark"
                    options={{ fontSize: 14, minimap: { enabled: false }, lineNumbers: 'on', automaticLayout: true }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-950 text-xl font-semibold text-white">
                    Interview ended.
                  </div>
                )}
              </div>
            </section>

            <div className={`flex flex-col gap-4 ${showVideoPanel ? 'block' : 'hidden'} lg:block`}>
              <section className="grid gap-3">
                <div className="relative aspect-video overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-800">
                  <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">You</span>
                </div>
                <div className={`relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-sm transition-all duration-300 dark:border-slate-800 ${isRemoteScreen ? 'aspect-auto max-h-[420px]' : 'aspect-video'}`} ref={remoteContainerRef}>
                  <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-contain" onClick={toggleFullscreen} style={{ cursor: 'pointer' }} title="Click to view full screen" />
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                    {partner?.anonymous ? 'Partner' : partner?.name || 'Partner'}{isRemoteScreen && ' (screen)'}
                  </span>
                  <button onClick={toggleFullscreen} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/70" title="Full screen">
                    ⛶
                  </button>
                </div>
              </section>

              <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={toggleMic} className={`rounded-full p-2.5 ${micOn ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`} title={micOn ? 'Mute microphone' : 'Unmute microphone'}>
                    {micOn ? '🎤' : '🔇'}
                  </button>
                  <button onClick={toggleCam} className={`rounded-full p-2.5 ${camOn ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'}`} title={camOn ? 'Turn off camera' : 'Turn on camera'}>
                    {camOn ? '📹' : '📷'}
                  </button>
                  <button onClick={screenSharing ? stopScreenShare : startScreenShare} className={`rounded-full p-2.5 ${screenSharing ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`} title={screenSharing ? 'Stop screen share' : 'Share screen'}>
                    {screenSharing ? '🖥️' : '📺'}
                  </button>
                  <div className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                    {connectionStatus === 'connected' ? '🟢 Connected' : connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <span>Status: {status === 'active' ? '🟢 In progress' : '🔴 Ended'}</span>
            <button onClick={leaveRoom} className="font-medium text-indigo-600 transition hover:underline dark:text-indigo-400">
              Leave room
            </button>
          </div>
        </footer>

        {showFeedback && <FeedbackModal sessionId={sessionId} partnerUserId={partnerUserId} onClose={handleFeedbackClose} />}
      </div>
    </div>
  );
};

export default MatchRoom;