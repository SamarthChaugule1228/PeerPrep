import React, { useState } from 'react';
import StarRating from './StarRating';
import api from '../services/api';

const FeedbackModal = ({ sessionId, partnerUserId, onClose }) => {
  const [communication, setCommunication] = useState(0);
  const [technical, setTechnical] = useState(0);
  const [overall, setOverall] = useState(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!communication || !technical || !overall) {
      setError('Please rate all three categories');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        sessionId,
        communication,
        technical,
        overall,
        note,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-100 dark:border-gray-800 transition-colors">
        {!submitted ? (
          <>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              Session Feedback
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              How was your partner?
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-around mb-6">
              <StarRating label="Communication" value={communication} onChange={setCommunication} />
              <StarRating label="Technical" value={technical} onChange={setTechnical} />
              <StarRating label="Overall" value={overall} onChange={setOverall} />
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional thoughts? (optional)"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm mb-6 resize-none focus:ring-2 focus:ring-indigo-400 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows="2"
              maxLength="300"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl">🎉</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mt-4">Thank you!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Your feedback has been submitted.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;