import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const popularColleges = [
  '', 'IIT Bombay', 'IIT Delhi', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Madras',
  'IIT Roorkee', 'IIT Guwahati', 'NIT Trichy', 'NIT Warangal', 'NIT Surathkal',
  'NIT Calicut', 'NIT Allahabad', 'NIT Rourkela', 'BITS Pilani', 'DTU', 'NSUT',
  'IIIT Hyderabad', 'Other'
];

const ProfileForm = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    college: user?.college || '',
    degree: user?.degree || '',
    branch: user?.branch || '',
    year: user?.year || '',
    graduationYear: user?.graduationYear || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCollegeSelect = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      setForm({ ...form, college: '' });
    } else {
      setForm({ ...form, college: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', {
        ...form,
        graduationYear: form.graduationYear ? Number(form.graduationYear) : null
      });
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Edit profile</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Share the details that will help personalize your interview practice.</p>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
          {saving ? 'Saving…' : 'Ready'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">College</label>
            <select
              value={popularColleges.includes(form.college) ? form.college : 'Other'}
              onChange={handleCollegeSelect}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {popularColleges.map((c) => (
                <option key={c} value={c}>{c || 'Select College'}</option>
              ))}
            </select>
          </div>
          {(!popularColleges.includes(form.college) || form.college === '') && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">College name</label>
              <input
                name="college"
                value={form.college}
                onChange={handleChange}
                placeholder="Type your college"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Degree</label>
          <input name="degree" value={form.degree} onChange={handleChange} placeholder="Bachelor of Technology" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Branch</label>
          <input name="branch" value={form.branch} onChange={handleChange} placeholder="Computer Science" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
          <select name="year" value={form.year} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <option value="">Select Year</option>
            <option value="TE">TE</option>
            <option value="BE">BE</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Graduation year</label>
          <input name="graduationYear" type="number" value={form.graduationYear} onChange={handleChange} placeholder="2026" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={saving} className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          {message && <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>}
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;