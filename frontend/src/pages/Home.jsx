import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Smart Peer Matching',
    desc: 'Find peers that match your interview type, level, and target company in seconds.',
    icon: '🔍',
  },
  {
    title: 'Shared Code Editor',
    desc: 'Collaborate in real time with a polished coding workspace for Python, Java, and C++.',
    icon: '⌨️',
  },
  {
    title: 'Voice & Video Calls',
    desc: 'Practice with live audio, video, and screen sharing for a realistic mock interview experience.',
    icon: '📹',
  },
  {
    title: 'Interview Timer',
    desc: 'Stay on track with synchronized timers and a clear session flow for both participants.',
    icon: '⏱️',
  },
];

const steps = [
  'Create your profile and share your target role.',
  'Find a practicing partner and join a live room.',
  'Run the mock interview, review feedback, and improve.',
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-gray-900 transition-colors dark:from-gray-950 dark:via-gray-950 dark:to-slate-900 dark:text-white">
      <main className="mx-auto flex max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="grid items-center gap-8 rounded-[32px] border border-gray-200/80 bg-white/80 p-6 shadow-xl shadow-indigo-100/70 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-none lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              Live mock interviews, built for better practice
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Practice interviews with{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                real peers
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              PeerPrep helps you sharpen your DSA, system design, and HR interview skills in a calm, connected, real-time environment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to="/dashboard" className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="rounded-2xl border border-gray-300 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-indigo-400 dark:hover:text-indigo-300">
                    Sign In
                  </Link>
                </>
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-900/70">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">24/7</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Practice anytime</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-900/70">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">Live</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Realtime coding room</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-800 dark:bg-gray-900/70">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">Feedback</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Actionable insights</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-5 text-white shadow-2xl shadow-indigo-200/70 dark:border-indigo-900/50 dark:shadow-none">
            <div className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-100">Upcoming session</p>
                  <p className="text-xl font-semibold">System Design Mock</p>
                </div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm">Live</span>
              </div>
              <div className="space-y-3 rounded-2xl bg-white/90 p-4 text-gray-700 dark:bg-gray-900/80 dark:text-gray-200">
                <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
                  <span className="text-sm">Peer partner</span>
                  <span className="font-semibold">Matched instantly</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
                  <span className="text-sm">Environment</span>
                  <span className="font-semibold">Editor + Video + Audio</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
                  <span className="text-sm">Focus</span>
                  <span className="font-semibold">Problem solving</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 px-2 pb-12 sm:px-0">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Why PeerPrep</p>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything you need to feel interview-ready</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-gray-200 bg-white/80 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">How it works</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">A smoother path to confidence</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Start small, practice consistently, and build the comfort you need for real interviews.
              </p>
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/70">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-gray-700 dark:text-gray-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;