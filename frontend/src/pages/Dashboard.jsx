import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import api from '../services/api';
// import ProfileForm from '../components/ProfileForm';    // <-- added
import BACKEND_URL from '../config';

const interviewTypes = ['DSA', 'HR', 'CS Fundamentals', 'System Design', 'Resume Discussion'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const companies = ['Cisco', 'Barclays', 'Mastercard', 'Amazon', 'Deloitte'];
const languages = ['Java', 'C++', 'Python'];
const identityOptions = ['Named', 'Anonymous'];
const roleOptions = [
  { value: 'candidate', label: 'As a Candidate' },
  { value: 'interviewer', label: 'As an Interviewer' },
];

const Dashboard = () => {
  const { user, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [prefs, setPrefs] = useState({
    interviewType: 'DSA',
    difficulty: 'Intermediate',
    targetCompany: '',
    preferredLanguage: 'Python',
    identityPreference: 'Named',
    rolePreference: 'candidate',
  });

  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchElapsed, setSearchElapsed] = useState(0);

  // Load user preferences when available
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

  // Fetch feedback stats when user is available
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/feedback/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (!isSearching) {
      setSearchElapsed(0);
      return;
    }

    const startedAt = Date.now();
    const interval = setInterval(() => {
      setSearchElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching]);

  // Socket connection setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(BACKEND_URL, {   // using BACKEND_URL from config
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('matched', (data) => {
      setIsSearching(false);
      setMatchResult(data);
      setTimeout(() => {
        navigate(`/matchroom/${data.sessionId}`, {
          state: {
            partner: data.partner,
            role: data.role,
            partnerUserId: data.partnerUserId
          },
        });
      }, 1500);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setPrefs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSavePreferences = async () => {
    try {
      await updatePreferences(prefs);
      alert('Preferences saved!');
    } catch (err) {
      alert('Failed to save preferences');
    }
  };

  const handleFindPeer = () => {
    if (!socketRef.current?.connected) {
      alert('Connection lost. Please refresh.');
      return;
    }
    setIsSearching(true);
    setMatchResult(null);
    setSearchElapsed(0);
    socketRef.current.emit('find-peer', prefs);
  };

  const handleCancelSearch = () => {
    if (socketRef.current) {
      socketRef.current.emit('cancel-search');
    }
    setIsSearching(false);
    setSearchElapsed(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 transition-colors duration-300 dark:bg-slate-950 dark:text-gray-100">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)]">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-indigo-100/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-indigo-600">Practice Dashboard</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Find your next mock interview partner
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                Set your ideal interview profile and jump into a live match whenever you are ready.
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              {user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
            </div>
          </div>
        </section>

        {stats && stats.count > 0 && (
          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Communication', value: stats.avgCommunication, accent: 'text-amber-500' },
              { label: 'Technical', value: stats.avgTechnical, accent: 'text-emerald-500' },
              { label: 'Overall', value: stats.avgOverall, accent: 'text-indigo-500' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xl font-semibold ${item.accent}`}>★</span>
                  <span className="text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {matchResult && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-500 to-green-500 p-5 text-white shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">Match found!</p>
                <p className="text-sm opacity-90">
                  Partner: {matchResult.partner.anonymous ? 'Anonymous' : matchResult.partner.name}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                  {matchResult.role === 'candidate' ? 'Matched as Candidate' : 'Matched as Interviewer'}
                </span>
                <span className="text-sm opacity-90">Redirecting you to the room…</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Interview preferences</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose the kind of practice that fits your goals.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Interview type</label>
                <select value={prefs.interviewType} onChange={(e) => handleInputChange('interviewType', e.target.value)} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {interviewTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                <select value={prefs.difficulty} onChange={(e) => handleInputChange('difficulty', e.target.value)} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {difficulties.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Target company</label>
                <select value={prefs.targetCompany} onChange={(e) => handleInputChange('targetCompany', e.target.value)} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  <option value="">Any company</option>
                  {companies.map((comp) => <option key={comp} value={comp}>{comp}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred language</label>
                <select value={prefs.preferredLanguage} onChange={(e) => handleInputChange('preferredLanguage', e.target.value)} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {languages.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Join as</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {roleOptions.map((option) => (
                  <label key={option.value} className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-medium transition ${prefs.rolePreference === option.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200'}`}>
                    <input type="radio" name="rolePreference" value={option.value} checked={prefs.rolePreference === option.value} onChange={(e) => handleInputChange('rolePreference', e.target.value)} className="sr-only" />
                    <span>{option.value === 'candidate' ? '🧑‍💻' : '🧑‍🏫'}</span>
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">We automatically match candidates with interviewers for a peer-to-peer session.</p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Identity preference</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {identityOptions.map((option) => (
                  <label key={option} className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border p-3 text-sm font-medium transition ${prefs.identityPreference === option ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200'}`}>
                    <input type="radio" name="identity" value={option} checked={prefs.identityPreference === option} onChange={(e) => handleInputChange('identityPreference', e.target.value)} className="sr-only" />
                    <span>{option === 'Named' ? '👤' : '🕶️'}</span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleSavePreferences} className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700">
                Save preferences
              </button>
              {!isSearching ? (
                <button onClick={handleFindPeer} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">
                  Find peer
                </button>
              ) : (
                <button onClick={handleCancelSearch} className="flex-1 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600">
                  Cancel search
                </button>
              )}
            </div>

            {isSearching && (
              <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent dark:border-indigo-300"></div>
                    <div>
                      <p className="font-semibold text-indigo-700 dark:text-indigo-300">Matching you with a peer…</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        {searchElapsed < 15
                          ? `Estimated wait: about ${Math.max(15, 30 - searchElapsed)} seconds`
                          : 'We are still looking for the right match. Please hold on.'}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-slate-800/70 dark:text-indigo-300">
                    {searchElapsed}s
                  </span>
                </div>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick tips</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="rounded-2xl bg-gray-50 p-3 dark:bg-slate-800">Match quality improves when your interview type and difficulty line up with your partner.</li>
                <li className="rounded-2xl bg-gray-50 p-3 dark:bg-slate-800">Anonymous mode is great if you want to focus on the interview experience rather than identity.</li>
                <li className="rounded-2xl bg-gray-50 p-3 dark:bg-slate-800">Once matched, you will be taken directly to a shared interview room.</li>
              </ul>
            </section>

          </aside>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Dashboard;