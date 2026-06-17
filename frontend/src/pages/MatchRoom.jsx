import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { useWebRTC } from '../hooks/useWebRTC';
import BACKEND_URL from '../config';

const MatchRoom = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const partner = location.state?.partner;
  const role = location.state?.role || 'candidate';

  const socketRef = useRef(null);

  // Room state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [timerEnd, setTimerEnd] = useState(null);
  const [timerDisplay, setTimerDisplay] = useState('');

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
    if (window.confirm('End the interview?')) socketRef.current?.emit('end-interview', { sessionId });
  };
  const leaveRoom = () => {
    socketRef.current?.emit('leave-room', sessionId);
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col transition-colors">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">← Dashboard</Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Interview Room
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {role === 'interviewer' ? 'Interviewer' : 'Candidate'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {timerDisplay && (
            <div className={`font-mono text-xl font-bold px-3 py-1 rounded-lg ${
              status === 'active'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {timerDisplay}
            </div>
          )}
          {role === 'interviewer' && status === 'active' && (
            <div className="flex items-center gap-2">
              <button onClick={() => startTimer(15)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">15m</button>
              <button onClick={() => startTimer(30)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">30m</button>
              <button onClick={() => startTimer(45)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">45m</button>
              <button onClick={stopTimer} className="text-xs bg-gray-500 dark:bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-600 dark:hover:bg-gray-700">Stop</button>
            </div>
          )}
          <button onClick={endInterview} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">
            End Interview
          </button>
        </div>
      </header>

      {/* Main content: three columns on large screens */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Left: Question + Notes */}
        <div className="lg:w-1/4 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col h-56 border border-gray-100 dark:border-gray-800 transition-colors">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📋 Question</h2>
            {role === 'interviewer' ? (
              <textarea
                value={question}
                onChange={(e) => { setQuestion(e.target.value); emitQuestion(e.target.value); }}
                placeholder="Type the question..."
                className="w-full flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-400 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            ) : (
              <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-y-auto bg-gray-50 dark:bg-gray-800 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                {question || 'Waiting for the interviewer to set a question...'}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col h-56 border border-gray-100 dark:border-gray-800 transition-colors">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">📝 Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); emitNotes(e.target.value); }}
              placeholder="Write your thoughts..."
              className="w-full flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-400 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Center: Code Editor */}
        <div className="lg:w-2/4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); emitLang(e.target.value); }}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-3 py-1 text-sm text-gray-800 dark:text-white"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Partner: {partner?.anonymous ? 'Anonymous' : partner?.name || 'Unknown'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow flex-1 overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors">
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
              <div className="flex items-center justify-center h-full bg-gray-900 text-white text-xl">
                Interview ended.
              </div>
            )}
          </div>
        </div>

        {/* Right: Video panels and controls */}
        <div className="lg:w-1/4 flex flex-col gap-4">
          {/* Video panels */}
          <div className="grid grid-cols-1 gap-2 flex-1 relative">
            {/* Local video – always small */}
            <div className="relative bg-black rounded-xl shadow overflow-hidden aspect-video">
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-0.5 rounded">You</span>
            </div>

            {/* Remote video – grows when screen is shared */}
            <div
              className={`relative bg-black rounded-xl shadow overflow-hidden transition-all duration-300 ${
                isRemoteScreen ? 'aspect-auto h-full max-h-[500px]' : 'aspect-video'
              }`}
              ref={remoteContainerRef}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                onClick={toggleFullscreen}
                style={{ cursor: 'pointer' }}
                title="Click to view full screen"
              />
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-0.5 rounded">
                {partner?.anonymous ? 'Partner' : partner?.name || 'Partner'}
                {isRemoteScreen && ' (screen)'}
              </span>
              <button
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-black/70"
                title="Full screen"
              >
                ⛶
              </button>
            </div>
          </div>

          {/* Call controls */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-3 flex flex-wrap items-center justify-center gap-3 border border-gray-100 dark:border-gray-800 transition-colors">
            <button
              onClick={toggleMic}
              className={`p-2 rounded-full ${micOn ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}
              title={micOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micOn ? '🎤' : '🔇'}
            </button>
            <button
              onClick={toggleCam}
              className={`p-2 rounded-full ${camOn ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}
              title={camOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {camOn ? '📹' : '📷'}
            </button>
            <button
              onClick={screenSharing ? stopScreenShare : startScreenShare}
              className={`p-2 rounded-full ${screenSharing ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
              title={screenSharing ? 'Stop screen share' : 'Share screen'}
            >
              {screenSharing ? '🖥️' : '📺'}
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {connectionStatus === 'connected' ? '🟢 Connected' : connectionStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 transition-colors">
        Session: {sessionId} | {status === 'active' ? '🟢 In Progress' : '🔴 Ended'}
        <button onClick={leaveRoom} className="ml-4 text-indigo-600 dark:text-indigo-400 hover:underline">Leave Room</button>
      </div>
    </div>
  );
};

export default MatchRoom;