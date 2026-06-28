import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileForm from '../components/ProfileForm';

const Profile = () => {
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Your Profile</h1>

        {/* Saved Profile Info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 transition-colors mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Profile Details</h2>
            <button
              onClick={() => setShowEdit(!showEdit)}
              className="text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
            >
              {showEdit ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-800 dark:text-white">College:</span>{' '}
              {user?.college || 'Not set'}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-white">Degree:</span>{' '}
              {user?.degree || 'Not set'}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-white">Branch:</span>{' '}
              {user?.branch || 'Not set'}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-white">Year:</span>{' '}
              {user?.year || 'Not set'}
            </div>
            <div>
              <span className="font-medium text-gray-800 dark:text-white">Graduation Year:</span>{' '}
              {user?.graduationYear || 'Not set'}
            </div>
          </div>
        </div>

        {/* Edit Form (togglable) */}
        {showEdit && (
          <div className="transition-all duration-300">
            <ProfileForm />
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;