import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ScheduledInterviews = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [upcomingNotification, setUpcomingNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const autoJoinTimeoutRef = useRef(null);

  useEffect(() => {
    fetchScheduledInterviews();
    const interval = setInterval(fetchScheduledInterviews, 10000); // Refresh every 10 seconds for better responsiveness
    return () => clearInterval(interval);
  }, []);

  // Check for upcoming interviews (within 5 minutes) and schedule auto-join
  useEffect(() => {
    if (scheduledInterviews.length === 0) return;

    scheduledInterviews.forEach((interview) => {
      const now = new Date();
      const startTime = new Date(interview.scheduledStartTime);
      const timeUntilStart = startTime - now;
      
      // Time for notification (5 minutes before)
      const notificationTime = 5 * 60 * 1000;
      
      // If interview is within 5 minutes and is matched, show notification
      if (timeUntilStart <= notificationTime && timeUntilStart > 0 && interview.status === 'matched') {
        if (!upcomingNotification || upcomingNotification._id !== interview._id) {
          setUpcomingNotification(interview);
        }
      }

      // If interview time has arrived (within 30 seconds), auto-join
      if (timeUntilStart <= 30000 && timeUntilStart > -60000 && interview.status === 'matched' && !interview.sessionId) {
        // Only auto-join if sessionId is available (meaning they're matched)
        if (interview.sessionId) {
          autoJoinInterview(interview);
        }
      }
    });

    return () => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      if (autoJoinTimeoutRef.current) clearTimeout(autoJoinTimeoutRef.current);
    };
  }, [scheduledInterviews]);

  const autoJoinInterview = (interview) => {
    if (interview.sessionId) {
      console.log('Auto-joining interview:', interview.sessionId);
      navigate(`/matchroom/${interview.sessionId}`, {
        state: {
          partner: { name: 'Partner', anonymous: interview.anonymousMode },
          role: interview.role || 'candidate',
          partnerUserId: interview.matchedWith,
          matchType: interview.matchType,
          message: 'Interview starting now...',
          autoJoined: true,
          autoStartTimer: true
        }
      });
    }
  };

  const handleJoinInterview = (interview) => {
    if (interview.sessionId) {
      navigate(`/matchroom/${interview.sessionId}`, {
        state: {
          partner: { name: 'Partner', anonymous: interview.anonymousMode },
          role: interview.role || 'candidate',
          partnerUserId: interview.matchedWith,
          matchType: interview.matchType,
          message: 'Interview joined'
        }
      });
    }
  };

  const isInterviewStarting = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const timeUntil = start - now;
    // Interview is starting if within 5 minutes and not yet started
    return timeUntil <= 5 * 60 * 1000 && timeUntil > 0;
  };

  const isInterviewInProgress = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    return now >= start && now < end;
  };

  const fetchScheduledInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/matching/scheduled-list');
      setScheduledInterviews(res.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch scheduled interviews:', err);
      setError('Failed to load scheduled interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInterview = async (requestId) => {
    try {
      await api.post(`/matching/cancel/${requestId}`);
      setScheduledInterviews(prev => prev.filter(req => req._id !== requestId));
      setConfirmCancel(null);
    } catch (err) {
      console.error('Failed to cancel interview:', err);
      setError('Failed to cancel interview');
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start - now;

    if (diff < 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'waiting':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>
            Waiting for Match
          </span>
        );
      case 'matched':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
            Matched
          </span>
        );
      case 'expired':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`}>
            Expired
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
            Cancelled
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Scheduled Interviews</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Scheduled Interviews</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {scheduledInterviews.length} interview{scheduledInterviews.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        {/* Upcoming Interview Notification */}
        {upcomingNotification && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 border-l-4 border-orange-500 rounded-lg shadow-md animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⏰</div>
                <div>
                  <p className="font-bold text-orange-900 dark:text-orange-100">Interview Starting Soon!</p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Your interview "{upcomingNotification.interviewType}" starts at {new Date(upcomingNotification.scheduledStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleJoinInterview(upcomingNotification)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition whitespace-nowrap"
              >
                Join Now →
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {scheduledInterviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No scheduled interviews</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't scheduled any interviews yet.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
            >
              Schedule an Interview
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {scheduledInterviews.map((interview) => (
              <div
                key={interview._id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition p-6 border-l-4 border-blue-500"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Main Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {interview.interviewType}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {getStatusBadge(interview.status)}
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {interview.difficulty}
                          </span>
                          {interview.matchType && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              {interview.matchType === 'interviewer' ? '🧑‍💼 Interview' : '👥 Peer'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Interview Details */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                        </svg>
                        <span><strong>Category:</strong> {interview.targetCompany || 'General Practice'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v2H4a2 2 0 00-2 2v2h16V7a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v2H7V3a1 1 0 00-1-1zm0 5a2 2 0 002 2h8a2 2 0 002-2H6z" clipRule="evenodd" />
                        </svg>
                        <span><strong>Date & Time:</strong> {formatDateTime(interview.scheduledStartTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                        <span><strong>Duration:</strong> {new Date(interview.scheduledEndTime).getHours() - new Date(interview.scheduledStartTime).getHours()}h</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        <span><strong>Language:</strong> {interview.preferredLanguage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Side Info & Actions */}
                  <div className="md:col-span-1">
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time Remaining</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {getTimeRemaining(interview.scheduledStartTime)}
                      </p>
                    </div>

                    {interview.status === 'matched' && interview.matchedWith && (
                      <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 mb-4">
                        <p className="text-sm text-green-600 dark:text-green-300 mb-1">Matched Partner</p>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                          User ID: {interview.matchedWith.substring(0, 8)}...
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {interview.status === 'matched' && (
                        <>
                          {(isInterviewStarting(interview.scheduledStartTime) || isInterviewInProgress(interview.scheduledStartTime, interview.scheduledEndTime)) && (
                            <button
                              onClick={() => handleJoinInterview(interview)}
                              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition text-sm animate-pulse"
                            >
                              🚀 Join Interview
                            </button>
                          )}
                        </>
                      )}

                      {interview.status === 'waiting' && (
                        <button
                          onClick={() => setConfirmCancel(interview._id)}
                          className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:text-red-300 dark:bg-red-900 dark:hover:bg-red-800 rounded-lg font-medium transition text-sm"
                        >
                          Cancel Interview
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cancel Interview?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel this scheduled interview? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-lg font-medium transition"
              >
                Keep It
              </button>
              <button
                onClick={() => handleCancelInterview(confirmCancel)}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
              >
                Cancel Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledInterviews;
