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
      setForm({ ...form, college: '' }); // clear to allow custom input
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
      setMessage('Profile updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-6 border border-gray-100 dark:border-slate-800 transition-colors">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Edit Profile</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* College - dropdown + custom input */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">College</label>
            <select
              value={popularColleges.includes(form.college) ? form.college : 'Other'}
              onChange={handleCollegeSelect}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
            >
              {popularColleges.map((c) => (
                <option key={c} value={c}>{c || 'Select College'}</option>
              ))}
            </select>
          </div>
          {(!popularColleges.includes(form.college) || form.college === '') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">College Name</label>
              <input
                name="college"
                value={form.college}
                onChange={handleChange}
                placeholder="Type your college"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Degree */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Degree</label>
          <input name="degree" value={form.degree} onChange={handleChange} placeholder="Degree" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white" />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
          <input name="branch" value={form.branch} onChange={handleChange} placeholder="Branch" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white" />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
          <select name="year" value={form.year} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white">
            <option value="">Select Year</option>
            <option value="TE">TE</option>
            <option value="BE">BE</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Graduation Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Graduation Year</label>
          <input name="graduationYear" type="number" value={form.graduationYear} onChange={handleChange} placeholder="Graduation Year" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white" />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex items-center justify-between">
          <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;