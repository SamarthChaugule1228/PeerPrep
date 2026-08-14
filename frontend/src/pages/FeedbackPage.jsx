import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const FeedbackPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    avgCommunication: 0,
    avgTechnical: 0,
    avgOverall: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const res = await api.get('/feedback/stats');
        setStats(res.data || { avgCommunication: 0, avgTechnical: 0, avgOverall: 0, count: 0 });
      } catch (err) {
        console.error('Failed to fetch feedback stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const metrics = [
    { label: 'Communication', value: stats.avgCommunication, accent: 'text-amber-500', bg: 'from-amber-500/20 to-amber-600/5' },
    { label: 'Technical', value: stats.avgTechnical, accent: 'text-emerald-500', bg: 'from-emerald-500/20 to-emerald-600/5' },
    { label: 'Overall', value: stats.avgOverall, accent: 'text-indigo-500', bg: 'from-indigo-500/20 to-indigo-600/5' },
    { label: 'Feedbacks', value: stats.count, accent: 'text-sky-500', bg: 'from-sky-500/20 to-sky-600/5' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.16),_transparent_24%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)]">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="rounded-[30px] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-indigo-100/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">Feedback</p>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">Your analytics</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Review how your interview performance is being rated across communication, technical skill, and overall impact.
              </p>
            </div>
          </section>

          {!user ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400">
              Please log in to view your feedback analytics.
            </div>
          ) : loading ? (
            <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading feedback analytics...
            </div>
          ) : (
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-[24px] border border-slate-200 bg-gradient-to-br ${item.bg} p-5 shadow-sm dark:border-slate-800`}
                >
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-2xl font-semibold ${item.accent}`}>★</span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default FeedbackPage;
