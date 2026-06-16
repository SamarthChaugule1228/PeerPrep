import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';

const MatchRoom = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const partner = location.state?.partner;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Match Made!</h1>
        <p className="text-gray-500 mb-6">Your interview room is ready</p>

        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <p className="text-sm text-gray-500 mb-1">Session ID</p>
          <p className="font-mono text-indigo-600 font-semibold">{sessionId}</p>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 mb-6">
          <p className="text-sm text-gray-500 mb-1">Your Partner</p>
          {partner ? (
            <div>
              <p className="font-bold text-xl text-gray-800">
                {partner.anonymous ? 'Anonymous User' : partner.name}
              </p>
              {!partner.anonymous && (
                <p className="text-sm text-gray-500 mt-1">
                  {partner.preferences?.interviewType} • {partner.preferences?.difficulty}
                </p>
              )}
              {partner.anonymous && (
                <p className="text-sm text-gray-500 mt-1">Identity hidden</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Partner info not available</p>
          )}
        </div>

        <div className="flex gap-4">
          <Link
            to="/dashboard"
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            ← Back to Dashboard
          </Link>
          <button
            disabled
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold opacity-50 cursor-not-allowed"
            title="Coming in Feature 2"
          >
            Enter Interview Room (soon)
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">Feature 2: Shared Editor + Timer coming next</p>
      </div>
    </div>
  );
};

export default MatchRoom;