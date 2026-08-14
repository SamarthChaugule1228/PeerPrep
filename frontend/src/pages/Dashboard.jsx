import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import { Calendar, CheckCircle, ChevronRight, Clock, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLinkedInPrompt, setShowLinkedInPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ upcoming: 0, waiting: 0, completed: 0 });
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();

    const hasSeenLinkedInPrompt = sessionStorage.getItem('peerprep-linkedin-prompt-seen');
    if (!hasSeenLinkedInPrompt) {
      setShowLinkedInPrompt(true);
      sessionStorage.setItem('peerprep-linkedin-prompt-seen', 'true');
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [activeRes, scheduledRes, feedbackRes] = await Promise.all([
        api.get('/matching/active'),
        api.get('/matching/scheduled-list'),
        api.get('/feedback/stats'),
      ]);

      const active = activeRes.data || [];
      const scheduled = scheduledRes.data || [];
      const feedback = feedbackRes.data || { count: 0 };

      setStats({
        upcoming: scheduled.length,
        waiting: active.filter((request) => request.status === 'waiting').length,
        completed: feedback.count || 0,
      });
      setUpcomingInterviews(scheduled);
      setError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Unable to load dashboard information right now.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInFollow = () => {
    window.open('https://www.linkedin.com/company/peerprep-tech/?viewAsMember=true', '_blank', 'noopener,noreferrer');
    setShowLinkedInPrompt(false);
  };

  const handleScheduleInterview = async (scheduledData) => {
    try {
      setError('');
      const prefs = {
        interviewType: user?.preferences?.interviewType || 'DSA',
        difficulty: user?.preferences?.difficulty || 'Intermediate',
        targetCompany: user?.preferences?.targetCompany || '',
        preferredLanguage: user?.preferences?.preferredLanguage || 'Python',
        identityPreference: user?.preferences?.identityPreference || 'Named',
        rolePreference: user?.preferences?.rolePreference || 'candidate',
      };

      await api.post('/matching/scheduled', {
        ...prefs,
        ...scheduledData,
      });
      setShowScheduleModal(false);
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Unable to schedule this interview.');
    }
  };

  const handleJoinInterview = (interview) => {
    if (interview.sessionId) {
      navigate(`/matchroom/${interview.sessionId}`, {
        state: {
          partner: { name: 'Partner', anonymous: interview.identityPreference === 'Anonymous' },
          role: interview.rolePreference || 'candidate',
          partnerUserId: interview.matchedWith,
          matchType: interview.matchType,
          message: 'Interview starting now...',
        },
      });
      return;
    }

    navigate('/scheduled-interviews');
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_18%),linear-gradient(180deg,_#020d1e_0%,_#071827_100%)] pt-20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-4 text-xl text-slate-300">Let's keep improving together.</p>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Upcoming', value: stats.upcoming, subtitle: 'Interviews', icon: Calendar, color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
              { label: 'Waiting', value: stats.waiting, subtitle: 'Match', icon: Clock, color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30' },
              { label: 'Completed', value: stats.completed, subtitle: 'Interviews', icon: CheckCircle, color: 'from-green-500/20 to-green-600/10 border-green-500/30' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className={`rounded-2xl border bg-gradient-to-br ${stat.color} p-6 backdrop-blur-lg`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{stat.label}</p>
                      <p className="mt-3 text-4xl font-bold text-white">{stat.value}</p>
                      <p className="mt-2 text-sm text-slate-300">{stat.subtitle}</p>
                    </div>
                    <Icon size={32} className="text-slate-200 opacity-80" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-slate-700/80 bg-slate-900/50 p-6 backdrop-blur-lg"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Upcoming Interviews</h2>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-purple-300 hover:text-purple-200">
                View All <ChevronRight size={16} />
              </button>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-slate-400">Loading interviews…</div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/40 p-8 text-center text-slate-300">
                No upcoming interviews yet.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div
                    key={interview._id || interview.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-800/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-1 items-center gap-4">
                      <span className="inline-flex rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200">
                        {interview.type === 'scheduled' ? 'Scheduled' : 'Instant'}
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{interview.interviewType || 'Interview'}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                          <span>👤 {interview.rolePreference || 'Candidate'}</span>
                          <span>{new Date(interview.scheduledStartTime || interview.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinInterview(interview)}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
                    >
                      {interview.sessionId ? 'Join Now' : 'View'} →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <button
              onClick={() => navigate('/find-interview')}
              className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-left transition hover:border-purple-500/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Practice Interview</h3>
                  <p className="mt-2 text-sm text-slate-300">Find a peer for instant matching and practice.</p>
                </div>
                <Play className="text-purple-300" size={24} />
              </div>
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-left transition hover:border-purple-500/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Schedule Interview</h3>
                  <p className="mt-2 text-sm text-slate-300">Book an interview at a preferred time.</p>
                </div>
                <Calendar className="text-purple-300" size={24} />
              </div>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {showLinkedInPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-700 bg-slate-900/95 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.8)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300">Follow us</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Stay connected with PeerPrep</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkedInPrompt(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xl text-slate-200 hover:bg-slate-700"
              >
                ×
              </button>
            </div>

            <p className="text-sm leading-6 text-slate-300">
              Follow our official LinkedIn page to stay updated with product news, interview tips, and community updates.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLinkedInFollow}
                className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:opacity-95"
              >
                Follow on LinkedIn
              </button>
              <button
                type="button"
                onClick={() => setShowLinkedInPrompt(false)}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <ScheduleInterviewModal
          onSchedule={handleScheduleInterview}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
