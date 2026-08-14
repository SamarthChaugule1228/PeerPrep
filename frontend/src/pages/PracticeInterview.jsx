import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import BACKEND_URL from '../config';
import ASSETS from '../config/assets';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';

const defaultPrefs = {
  interviewType: 'DSA',
  difficulty: 'Intermediate',
  targetCompany: '',
  preferredLanguage: 'Python',
  identityPreference: 'Named',
  rolePreference: 'candidate',
};

const PracticeInterview = () => {
  const { user, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [prefs, setPrefs] = useState(defaultPrefs);
  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledSummary, setScheduledSummary] = useState(null);
  const [matchTransition, setMatchTransition] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchModalStage, setMatchModalStage] = useState('matching');
  const redirectAttemptedRef = useRef(false);
  const noMatchTimeoutRef = useRef(null);

  useEffect(() => {
    if (user?.preferences) {
      setPrefs({
        interviewType: user.preferences.interviewType || 'DSA',
        difficulty: user.preferences.difficulty || 'Intermediate',
        targetCompany: user.preferences.targetCompany || '',
        preferredLanguage: user.preferences.preferredLanguage || 'Python',
        identityPreference: user.preferences.identityPreference || 'Named',
        rolePreference: user.preferences.rolePreference || 'candidate',
      });
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(BACKEND_URL, { auth: { token } });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('matched', (data) => {
      if (!data?.sessionId) return;

      setMatchModalOpen(true);
      setMatchModalStage('found');
      setIsSearching(true);
      setMatchTransition(true);
      setMatchResult(data);

      if (redirectAttemptedRef.current) return;
      redirectAttemptedRef.current = false;

      setTimeout(() => {
        if (redirectAttemptedRef.current) return;
        redirectAttemptedRef.current = true;
        navigate(`/matchroom/${data.sessionId}`, {
          state: {
            partner: data.partner,
            role: data.role,
            partnerUserId: data.partnerUserId,
            matchType: data.matchType,
            message: 'Interview starting now...',
          },
        });
      }, 10000);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate, user]);

  useEffect(() => {
    if (!isSearching) {
      setSearchElapsed(0);
      if (noMatchTimeoutRef.current) {
        clearTimeout(noMatchTimeoutRef.current);
        noMatchTimeoutRef.current = null;
      }
      return;
    }

    const startedAt = Date.now();
    const interval = setInterval(() => {
      setSearchElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    if (noMatchTimeoutRef.current) clearTimeout(noMatchTimeoutRef.current);
    noMatchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
      setMatchModalOpen(false);
      setMatchModalStage('matching');
      setMatchTransition(false);
      setError('No online peer available right now. Please schedule an interview.');
      setShowScheduleModal(true);
    }, 60000);

    return () => {
      clearInterval(interval);
      if (noMatchTimeoutRef.current) {
        clearTimeout(noMatchTimeoutRef.current);
        noMatchTimeoutRef.current = null;
      }
    };
  }, [isSearching]);

  const handleSavePreferences = async () => {
    try {
      setError('');
      setSaveMessage('');
      await updatePreferences(prefs);
      setSaveMessage('Preferences saved successfully.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Unable to save preferences.');
    }
  };

  const handleInstantInterview = () => {
    if (!socketRef.current?.connected) {
      setError('Connection lost. Please refresh the page and try again.');
      return;
    }

    redirectAttemptedRef.current = false;
    setIsSearching(true);
    setMatchModalOpen(true);
    setMatchModalStage('matching');
    setMatchResult(null);
    setMatchTransition(false);
    setSearchElapsed(0);
    setError('');
    socketRef.current.emit('find-peer', prefs);
  };

  const handleCancelSearch = () => {
    socketRef.current?.emit('cancel-search');
    setIsSearching(false);
    setMatchModalOpen(false);
    setMatchModalStage('matching');
    setMatchTransition(false);
    setSearchElapsed(0);
    setError('');
  };

  const handleCloseMatchModal = () => {
    setMatchModalOpen(false);
    setMatchModalStage('matching');
    setMatchTransition(false);
    setIsSearching(false);
    setSearchElapsed(0);
    setMatchResult(null);
  };

  const handleJoinInterviewRoom = () => {
    if (!matchResult?.sessionId) return;
    if (redirectAttemptedRef.current) return;
    redirectAttemptedRef.current = true;

    navigate(`/matchroom/${matchResult.sessionId}`, {
      state: {
        partner: matchResult.partner,
        role: matchResult.role,
        partnerUserId: matchResult.partnerUserId,
        matchType: matchResult.matchType,
        message: 'Interview starting now...',
      },
    });
  };

  const handleScheduleInterview = async (scheduledData) => {
    try {
      setError('');
      const payload = {
        ...prefs,
        ...scheduledData,
      };

      const res = await api.post('/matching/scheduled', payload);
      const scheduledStart = new Date(res.data.scheduledStartTime || payload.scheduledDate);
      const scheduledEnd = new Date(res.data.scheduledEndTime || payload.scheduledDate);
      const duration = Math.max(30, Math.round((scheduledEnd - scheduledStart) / 60000));

      setScheduledSummary({
        date: scheduledStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: `${scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        duration: `${duration} mins`,
        technology: payload.preferredLanguage || prefs.preferredLanguage,
        difficulty: payload.difficulty || prefs.difficulty,
      });
      setMatchResult(null);
      setIsSearching(false);
      setShowScheduleModal(false);
      setSaveMessage('Interview scheduled successfully.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Unable to schedule this interview.');
    }
  };

  const getMatchState = () => {
    if (matchTransition || isSearching) return 'matching';
    if (matchResult) return 'found';
    if (scheduledSummary) return 'waiting';
    return 'matching';
  };

  const matchState = getMatchState();

  const renderMatchingModal = () => {
    const candidateAvatar = ASSETS.avatars.femalePlaceholder1;
    const interviewerAvatar = ASSETS.avatars.malePlaceholder1;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-lg rounded-[32px] border border-slate-700/80 bg-slate-900/95 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.8)] sm:p-7">
          <button
            type="button"
            onClick={handleCloseMatchModal}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-lg text-slate-200 transition hover:bg-slate-700"
          >
            ×
          </button>

          {matchModalStage === 'matching' ? (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">Finding a match</p>
                <h3 className="mt-3 text-3xl font-black text-white">Finding your best match…</h3>
              </div>

              <div className="mt-7 flex items-center justify-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-28 w-28 animate-ping rounded-full border border-indigo-400/40 bg-indigo-500/10"></div>
                  <img src={candidateAvatar} alt="Candidate avatar" className="relative z-10 h-20 w-20 rounded-full border-4 border-indigo-400 object-cover shadow-[0_0_20px_rgba(99,102,241,0.35)]" />
                </div>

                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-violet-300 bg-gradient-to-br from-violet-500 to-indigo-500 text-xl font-bold text-white shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                  <span className="animate-spin">↻</span>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="absolute h-28 w-28 animate-ping rounded-full border border-violet-400/40 bg-violet-500/10 [animation-delay:200ms]"></div>
                  <img src={interviewerAvatar} alt="Interviewer avatar" className="relative z-10 h-20 w-20 rounded-full border-4 border-violet-400 object-cover shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
                </div>
              </div>

              <div className="mt-7 flex justify-center">
                <img
                  src={ASSETS.illustrations.matchingAvatars}
                  alt="Matching illustration"
                  className="h-40 w-full max-w-sm object-contain"
                />
              </div>

              <div className="mt-6 text-center">
                <p className="text-base text-slate-200">Finding the best peer for you</p>
                <div className="mt-3 text-3xl font-black text-white">{searchElapsed}s</div>
                <div className="mt-4 flex items-center justify-center gap-2 text-indigo-200">
                  <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]"></span>
                  <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]"></span>
                  <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:240ms]"></span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Match confirmed</p>
                <h3 className="mt-3 text-3xl font-black text-white">Match Found!</h3>
              </div>

              <div className="mt-7 flex items-center justify-center gap-4">
                <div className="relative">
                  <img src={candidateAvatar} alt="Candidate avatar" className="h-20 w-20 rounded-full border-4 border-indigo-400 object-cover shadow-[0_0_20px_rgba(99,102,241,0.35)]" />
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-bold text-white shadow-lg">✓</div>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-500/15 text-2xl text-emerald-300 animate-pulse">✦</div>

                <div className="relative">
                  <img src={interviewerAvatar} alt="Partner avatar" className="h-20 w-20 rounded-full border-4 border-violet-400 object-cover shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-bold text-white shadow-lg">✓</div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <img
                  src={ASSETS.illustrations.celebration}
                  alt="Match found celebration illustration"
                  className="h-40 w-full max-w-sm object-contain"
                />
              </div>

              <div className="mt-5 text-center">
                <p className="text-lg font-semibold text-white">{matchResult?.partner?.anonymous ? 'Anonymous partner' : matchResult?.partner?.name || 'Matched partner'}</p>
                <p className="mt-2 text-sm text-slate-300">Role: {matchResult?.role || 'candidate'}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleJoinInterviewRoom}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-95"
                >
                  Join Interview Room
                </button>
                <button
                  type="button"
                  onClick={handleCloseMatchModal}
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-base font-semibold text-slate-200 transition hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStatusCard = () => {
    const candidateAvatar = ASSETS.avatars.femalePlaceholder1;
    const interviewerAvatar = ASSETS.avatars.malePlaceholder1;

    if (matchState === 'waiting') {
      return (
        <div className="rounded-[30px] border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 p-6 shadow-[0_18px_55px_rgba(76,90,255,0.18)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Scheduled interview</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Waiting for Interviewer</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Date</p>
                  <p className="mt-2 text-base font-semibold text-white">{scheduledSummary?.date || 'Pending'}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Time</p>
                  <p className="mt-2 text-base font-semibold text-white">{scheduledSummary?.time || 'Pending'}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Duration</p>
                  <p className="mt-2 text-base font-semibold text-white">{scheduledSummary?.duration || '45 mins'}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Difficulty</p>
                  <p className="mt-2 text-base font-semibold text-white">{scheduledSummary?.difficulty || 'Intermediate'}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-200">{scheduledSummary?.technology || 'Java'}</span>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-sm font-medium text-purple-200">{scheduledSummary?.difficulty || 'Intermediate'}</span>
              </div>
            </div>

            <div className="flex w-full max-w-md flex-col items-center justify-center rounded-[24px] border border-slate-700 bg-slate-900/70 p-5 text-center">
              <div className="relative mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent">
                <div className="absolute inset-0 animate-pulse bg-indigo-500/5"></div>
                <img
                  src={ASSETS.illustrations.waitingInterviewer}
                  alt="Waiting for interviewer illustration"
                  className="relative z-10 h-40 w-40 object-contain drop-shadow-[0_18px_24px_rgba(110,91,255,0.25)]"
                />
              </div>
              <p className="text-sm text-slate-300">We are looking for an available interviewer for your scheduled session.</p>
              <div className="mt-4 flex items-center gap-2 text-indigo-200">
                <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:0ms]"></span>
                <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:120ms]"></span>
                <span className="inline-block h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:240ms]"></span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (matchState === 'matching') {
      return (
        <div className="rounded-[30px] border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 p-6 shadow-[0_18px_55px_rgba(91,84,255,0.16)]">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
              {matchTransition ? 'Connection established' : 'Finding the best match'}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              {matchTransition ? 'Peer connected' : 'Matching…'}
            </h2>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-44 w-44 animate-ping rounded-full border border-indigo-400/40 bg-indigo-500/10"></div>
              <div className="absolute h-32 w-32 rounded-full border border-violet-300/40 bg-violet-500/10"></div>
              <div className="relative flex items-center gap-4">
                <img src={candidateAvatar} alt="Candidate avatar" className="h-20 w-20 rounded-full border-4 border-indigo-400 object-cover shadow-[0_0_20px_rgba(99,102,241,0.35)]" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-violet-300 bg-gradient-to-br from-violet-500 to-indigo-500 text-xl font-bold text-white shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                  <span className="animate-spin">↻</span>
                </div>
                <img src={interviewerAvatar} alt="Interviewer avatar" className="h-20 w-20 rounded-full border-4 border-violet-400 object-cover shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <img
              src={ASSETS.illustrations.matchingAvatars}
              alt="Matching illustration"
              className="h-44 w-full max-w-md object-contain"
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-200">
            <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 font-semibold text-indigo-100">
              {searchElapsed}s
            </span>
            <span>
              {matchTransition ? 'Redirecting to interview room...' : 'Please wait while we connect you with the right peer.'}
            </span>
          </div>
        </div>
      );
    }

    if (matchState === 'unavailable') {
      return (
        <div className="rounded-[30px] border border-slate-700/80 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/80 p-6 shadow-[0_18px_55px_rgba(147,51,234,0.14)]">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300">Interviewer unavailable</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Interviewer Unavailable</h2>
          </div>

          <div className="mt-6 flex justify-center">
            <img
              src={ASSETS.illustrations.unavailableInterviewer}
              alt="Interviewer unavailable illustration"
              className="h-44 w-full max-w-md object-contain"
            />
          </div>

          <p className="mt-5 text-center text-base text-slate-200">
            We couldn't find an interviewer for your session, so we've matched you with another candidate.
          </p>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => navigate(`/matchroom/${matchResult?.sessionId || 'session'}`)}
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:opacity-95"
            >
              Enter Session
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-[30px] border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/80 p-6 shadow-[0_18px_55px_rgba(16,185,129,0.12)]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Match confirmed</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Match Found!</h2>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="relative">
            <img src={candidateAvatar} alt="Candidate avatar" className="h-20 w-20 rounded-full border-4 border-indigo-400 object-cover shadow-[0_0_20px_rgba(99,102,241,0.35)]" />
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-bold text-white shadow-lg">✓</div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-500/15 text-2xl text-emerald-300 animate-pulse">✦</div>

          <div className="relative">
            <img src={interviewerAvatar} alt="Partner avatar" className="h-20 w-20 rounded-full border-4 border-violet-400 object-cover shadow-[0_0_20px_rgba(168,85,247,0.35)]" />
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-bold text-white shadow-lg">✓</div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <img
            src={ASSETS.illustrations.celebration}
            alt="Match found celebration illustration"
            className="h-44 w-full max-w-md object-contain"
          />
        </div>

        <div className="mt-5 text-center">
          <p className="text-base text-slate-200">You’re all set. Happy practicing!</p>
          <button
            type="button"
            onClick={() => navigate(`/matchroom/${matchResult?.sessionId}`)}
            className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-base font-semibold text-white shadow-xl shadow-indigo-500/30 transition hover:opacity-95"
          >
            Join Interview Room
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_18%),linear-gradient(180deg,_#020d1e_0%,_#071827_100%)] px-4 pb-12 pt-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-700/80 bg-slate-900/60 p-6 shadow-2xl shadow-indigo-950/20 backdrop-blur-lg sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">Practice Interview</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Find your next mock interview partner</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Back to dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {saveMessage && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {saveMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-1">
          <div className="rounded-[28px] border border-slate-700 bg-slate-950/45 p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Interview type</label>
                <select
                  value={prefs.interviewType}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, interviewType: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  {['DSA', 'HR', 'CS Fundamentals', 'System Design', 'Resume Discussion'].map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Difficulty</label>
                <select
                  value={prefs.difficulty}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Target company</label>
                <select
                  value={prefs.targetCompany}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, targetCompany: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">Any company</option>
                  {['Cisco', 'Barclays', 'Mastercard', 'Amazon', 'Deloitte'].map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Preferred language</label>
                <select
                  value={prefs.preferredLanguage}
                  onChange={(e) => setPrefs((prev) => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                >
                  {['Java', 'C++', 'Python'].map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">Join as</label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { value: 'candidate', label: 'As a Candidate', icon: '🧑‍💻' },
                  { value: 'interviewer', label: 'As an Interviewer', icon: '🧑‍🏫' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-medium transition ${
                      prefs.rolePreference === option.value
                        ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                        : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-purple-500/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rolePreference"
                      value={option.value}
                      checked={prefs.rolePreference === option.value}
                      onChange={(e) => setPrefs((prev) => ({ ...prev, rolePreference: e.target.value }))}
                      className="sr-only"
                    />
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">Identity preference</label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                {['Named', 'Anonymous'].map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-medium transition ${
                      prefs.identityPreference === option
                        ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                        : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-purple-500/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="identityPreference"
                      value={option}
                      checked={prefs.identityPreference === option}
                      onChange={(e) => setPrefs((prev) => ({ ...prev, identityPreference: e.target.value }))}
                      className="sr-only"
                    />
                    <span>{option === 'Named' ? '👤' : '🕶️'}</span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-700"
              >
                Save preferences
              </button>
              {!isSearching ? (
                <button
                  type="button"
                  onClick={handleInstantInterview}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:opacity-95"
                >
                  Find peer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelSearch}
                  className="w-full rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
                >
                  Cancel search
                </button>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="w-full rounded-2xl border border-indigo-500/50 bg-indigo-500/10 px-4 py-3 font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
              >
                Schedule Interview
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4">
              <h2 className="text-lg font-bold text-white">Quick tips</h2>
              <p className="mt-2 text-sm text-slate-300">
                Matching quality improves when your preferences closely reflect the type of interview you want to practice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {matchModalOpen && renderMatchingModal()}

      {showScheduleModal && (
        <ScheduleInterviewModal
          onSchedule={handleScheduleInterview}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};

export default PracticeInterview;
