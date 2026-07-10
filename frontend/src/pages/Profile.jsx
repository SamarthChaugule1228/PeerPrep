import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileForm from '../components/ProfileForm';

const Profile = () => {
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);

  const profileItems = [
    { label: 'College', value: user?.college || 'Not set', accent: 'from-indigo-500 to-violet-500' },
    { label: 'Degree', value: user?.degree || 'Not set', accent: 'from-emerald-500 to-teal-500' },
    { label: 'Branch', value: user?.branch || 'Not set', accent: 'from-amber-500 to-orange-500' },
    { label: 'Year', value: user?.year || 'Not set', accent: 'from-sky-500 to-cyan-500' },
    { label: 'Graduation', value: user?.graduationYear || 'Not set', accent: 'from-rose-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.2),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)]">
        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <section className="rounded-[30px] border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-indigo-100/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">Profile</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">Your professional profile</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                  Keep your academic and career details updated so your mock interview experience feels more personal and relevant.
                </p>
              </div>
              <button
                onClick={() => setShowEdit((prev) => !prev)}
                className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {showEdit ? 'Cancel edit' : 'Edit profile'}
              </button>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Profile overview</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A quick snapshot of the details you share for interviews.</p>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                {user?.name ? `Welcome, ${user.name}` : 'Welcome'}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profileItems.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/70">
                  <div className={`mb-3 h-2 w-16 rounded-full bg-gradient-to-r ${item.accent}`} />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {showEdit && (
            <div className="transition-all duration-300">
              <ProfileForm />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;