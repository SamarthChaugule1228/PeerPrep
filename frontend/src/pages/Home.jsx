import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Smart Peer Matching',
    desc: 'Find the perfect practice partner based on interview type, difficulty, target company, and language.',
    icon: '🔍',
  },
  {
    title: 'Shared Code Editor',
    desc: 'Real‑time collaborative Monaco editor with Python, Java, and C++ support.',
    icon: '⌨️',
  },
  {
    title: 'Voice & Video Calls',
    desc: 'Simulate real interviews with WebRTC audio, video, and screen sharing.',
    icon: '📹',
  },
  {
    title: 'Interview Timer',
    desc: 'Keep sessions on track with a server‑driven timer that syncs for both participants.',
    icon: '⏱️',
  },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gray-50 dark:bg-gray-950 transition-colors min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6 leading-tight">
            Master Your Interviews with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              PeerPrep
            </span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Connect with real peers for mock interviews in DSA, System Design, HR, and more.
            Practice in a real‑time shared coding room with video & audio.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {user ? (
              <Link to="/dashboard" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg">
                  Get Started Free
                </Link>
                <Link to="/login" className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-700 transition">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features grid */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
            Everything you need to ace your interviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-lg transition border border-gray-100 dark:border-gray-800">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;