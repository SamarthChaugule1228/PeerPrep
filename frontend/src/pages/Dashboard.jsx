import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import BACKEND_URL from '../config';

const interviewTypes = ['DSA', 'HR', 'CS Fundamentals', 'System Design', 'Resume Discussion'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const companies = ['Cisco', 'Barclays', 'Mastercard', 'Amazon', 'Deloitte'];
const languages = ['Java', 'C++', 'Python'];
const identityOptions = ['Named', 'Anonymous'];

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
  });

  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // Load user preferences when available
  useEffect(() => {
    if (user?.preferences) {
      setPrefs({
        interviewType: user.preferences.interviewType || 'DSA',
        difficulty: user.preferences.difficulty || 'Intermediate',
        targetCompany: user.preferences.targetCompany || '',
        preferredLanguage: user.preferences.preferredLanguage || 'Python',
        identityPreference: user.preferences.identityPreference || 'Named',
      });
    }
  }, [user]);

  // Socket connection setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(BACKEND_URL, {   // <-- using BACKEND_URL from config
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
          state: { partner: data.partner, role: data.role },
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
    socketRef.current.emit('find-peer', prefs);
  };

  const handleCancelSearch = () => {
    if (socketRef.current) {
      socketRef.current.emit('cancel-search');
    }
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Find Your Practice Partner
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Set your preferences and get matched instantly
          </p>
        </div>

        {/* Match Result Popup */}
        {matchResult && (
          <div className="mb-8 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl p-6 shadow-lg animate-bounce">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className="font-bold text-lg">Match Found!</p>
                <p className="text-sm opacity-90">
                  Partner: {matchResult.partner.anonymous ? 'Anonymous' : matchResult.partner.name}
                </p>
              </div>
            </div>
            <p className="text-sm mt-2 opacity-80">Redirecting to interview room...</p>
          </div>
        )}

        {/* Preferences Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 transition-colors">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <span>⚙️</span> Your Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview Type
              </label>
              <select
                value={prefs.interviewType}
                onChange={(e) => handleInputChange('interviewType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-slate-800 dark:text-white"
              >
                {interviewTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <select
                value={prefs.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-slate-800 dark:text-white"
              >
                {difficulties.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Company (optional)
              </label>
              <select
                value={prefs.targetCompany}
                onChange={(e) => handleInputChange('targetCompany', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-slate-800 dark:text-white"
              >
                <option value="">Any company</option>
                {companies.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Language
              </label>
              <select
                value={prefs.preferredLanguage}
                onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white dark:bg-slate-800 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Identity Preference */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Identity Preference
              </label>
              <div className="flex gap-4">
                {identityOptions.map((option) => (
                  <label
                    key={option}
                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition ${
                      prefs.identityPreference === option
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="identity"
                      value={option}
                      checked={prefs.identityPreference === option}
                      onChange={(e) => handleInputChange('identityPreference', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-lg">{option === 'Named' ? '👤' : '🕶️'}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleSavePreferences}
              className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            >
              💾 Save Preferences
            </button>

            {!isSearching ? (
              <button
                onClick={handleFindPeer}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>🔍</span> Find Peer
              </button>
            ) : (
              <button
                onClick={handleCancelSearch}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 dark:hover:bg-red-400 transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>⏹️</span> Cancel Search
              </button>
            )}
          </div>

          {/* Searching Indicator */}
          {isSearching && (
            <div className="mt-6 flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Searching for a partner...</span>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-slate-800 transition-colors">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
            💡 Tips for a great session
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• Choose the same interview type as your partner for a faster match</li>
            <li>• You can stay anonymous if you prefer</li>
            <li>• Once matched, you'll be taken to a shared coding room</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;