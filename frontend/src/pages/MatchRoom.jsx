import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';

const languages = ['python', 'java', 'cpp'];

const MatchRoom = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const partner = location.state?.partner;
  const role = location.state?.role || 'candidate'; // interviewer or candidate

  const socketRef = useRef(null);

  // Room state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [timerEnd, setTimerEnd] = useState(null);
  const [timerDisplay, setTimerDisplay] = useState('');

  const editorRef = useRef(null);
  const notesRef = useRef(null);

  // Connect to socket & join room
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io('http://localhost:5000', { auth: { token } });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join-room', sessionId);
    });

    // Listen for initial session data
    socketRef.current.on('session-data', (data) => {
      setCode(data.code);
      setLanguage(data.language);
      setQuestion(data.question);
      setNotes(data.notes);
      setStatus(data.status);
      if (data.timerEnd) setTimerEnd(data.timerEnd);
    });

    // Real‑time updates from partner
    socketRef.current.on('code-update', (newCode) => setCode(newCode));
    socketRef.current.on('language-update', (newLang) => setLanguage(newLang));
    socketRef.current.on('question-update', (newQ) => setQuestion(newQ));
    socketRef.current.on('notes-update', (newNotes) => setNotes(newNotes));
    socketRef.current.on('timer-update', ({ timerEnd: end }) => setTimerEnd(end));
    socketRef.current.on('interview-ended', () => setStatus('ended'));

    return () => socketRef.current?.disconnect();
  }, [sessionId]);

  // Timer countdown
  useEffect(() => {
    if (!timerEnd) {
      setTimerDisplay('');
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      const diff = new Date(timerEnd).getTime() - now;
      if (diff <= 0) {
        setTimerDisplay('00:00');
        setStatus('ended');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimerDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timerEnd]);

  // Emit code changes (debounce-like via editor onChange)
  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current?.emit('code-change', { sessionId, code: value });
  };

  // Emit language change
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    socketRef.current?.emit('language-change', { sessionId, language: newLang });
  };

  // Emit question change (only interviewer can change)
  const handleQuestionChange = (e) => {
    const val = e.target.value;
    setQuestion(val);
    socketRef.current?.emit('question-change', { sessionId, question: val });
  };

  // Notes change
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    socketRef.current?.emit('notes-change', { sessionId, notes: val });
  };

  // Timer controls (interviewer only)
  const startTimer = (mins) => {
    const duration = mins * 60;
    socketRef.current?.emit('timer-start', { sessionId, duration });
  };
  const stopTimer = () => {
    socketRef.current?.emit('timer-stop', { sessionId });
  };

  // End interview (either participant can end)
  const endInterview = () => {
    if (window.confirm('End the interview?')) {
      socketRef.current?.emit('end-interview', { sessionId });
    }
  };

  const leaveRoom = () => {
    socketRef.current?.emit('leave-room', sessionId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Interview Room
          </h1>
          <span className="text-sm text-gray-500">
            {role === 'interviewer' ? 'You are the interviewer' : 'You are the candidate'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer display & controls */}
          {timerDisplay && (
            <div className={`font-mono text-xl font-bold px-3 py-1 rounded-lg ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {timerDisplay}
            </div>
          )}
          {role === 'interviewer' && status === 'active' && (
            <div className="flex items-center gap-2">
              <button onClick={() => startTimer(15)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">15 min</button>
              <button onClick={() => startTimer(30)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">30 min</button>
              <button onClick={() => startTimer(45)} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600">45 min</button>
              <button onClick={stopTimer} className="text-xs bg-gray-500 text-white px-3 py-1 rounded-full hover:bg-gray-600">Stop</button>
            </div>
          )}
          <button onClick={endInterview} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">
            End Interview
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Left: Question + Notes/Whiteboard */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          {/* Question Panel */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col h-64 lg:h-1/2">
            <h2 className="font-semibold text-gray-700 mb-2">📋 Question</h2>
            {role === 'interviewer' ? (
              <textarea
                value={question}
                onChange={handleQuestionChange}
                placeholder="Type or paste the interview question..."
                className="w-full flex-1 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            ) : (
              <div className="flex-1 border border-gray-200 rounded-lg p-3 overflow-y-auto bg-gray-50 whitespace-pre-wrap">
                {question || 'Waiting for interviewer to set a question...'}
              </div>
            )}
          </div>

          {/* Whiteboard/Notes */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-col h-64 lg:h-1/2">
            <h2 className="font-semibold text-gray-700 mb-2">📝 Notes / Whiteboard</h2>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Jot down your thoughts, hints, or solutions..."
              className="w-full flex-1 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-400 outline-none"
            />
          </div>
        </div>

        {/* Right: Code Editor */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          {/* Language selector & partner info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Language:</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Partner: {partner?.anonymous ? 'Anonymous' : partner?.name || 'Unknown'}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white rounded-xl shadow flex-1 overflow-hidden">
            {status === 'active' ? (
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  automaticLayout: true,
                }}
                onMount={(editor) => (editorRef.current = editor)}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-900 text-white text-xl">
                Interview has ended. Thank you!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer / status */}
      <div className="bg-white px-4 py-2 text-sm text-gray-500 border-t">
        Session ID: {sessionId} | Status: {status === 'active' ? '🟢 In Progress' : '🔴 Ended'}
        {!timerDisplay && status === 'active' && role === 'interviewer' && (
          <span className="ml-4 text-blue-600">You can start the timer above.</span>
        )}
        <button onClick={leaveRoom} className="ml-4 text-indigo-600 hover:underline">Leave Room</button>
      </div>
    </div>
  );
};

export default MatchRoom;