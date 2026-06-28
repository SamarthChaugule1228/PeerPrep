import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import RichTextEditor from '../components/RichTextEditor';

const interviewTypes = ['', 'DSA', 'HR', 'CS Fundamentals', 'System Design', 'Resume Discussion'];
const difficulties = ['', 'Beginner', 'Intermediate', 'Advanced'];
const companies = ['', 'Cisco', 'Barclays', 'Mastercard', 'Amazon', 'Deloitte'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'upvotes', label: 'Most Upvoted' },
  { value: 'oldest', label: 'Oldest' },
];

const popularColleges = [
  '', 'IIT Bombay', 'IIT Delhi', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Madras',
  'IIT Roorkee', 'IIT Guwahati', 'NIT Trichy', 'NIT Warangal', 'NIT Surathkal',
  'NIT Calicut', 'NIT Allahabad', 'NIT Rourkela', 'BITS Pilani', 'DTU', 'NSUT',
  'IIIT Hyderabad', 'Other'
];

const InterviewExperiences = () => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company: '',
    interviewType: '',
    difficulty: '',
    college: '',          // <-- new
    sort: 'newest',
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    interviewType: 'DSA',
    difficulty: 'Intermediate',
    outcome: '',
    mode: '',
    location: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch experiences
  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.company) params.append('company', filters.company);
      if (filters.interviewType) params.append('interviewType', filters.interviewType);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.college) params.append('college', filters.college);   // <-- new
      params.append('sort', filters.sort);
      const res = await api.get(`/experiences?${params.toString()}`);
      setExperiences(res.data);
    } catch (err) {
      console.error('Failed to fetch experiences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [filters]);

  // Handle upvote
  const handleUpvote = async (id) => {
    if (!user) {
      alert('Please log in to upvote');
      return;
    }
    try {
      const res = await api.post(`/experiences/${id}/upvote`);
      setExperiences((prev) => prev.map((exp) => (exp._id === id ? res.data : exp)));
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const hasUpvoted = (exp) => {
    return user && exp.upvotes?.some((id) => id.toString() === user._id);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to share your experience');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/experiences', formData);
      setShowForm(false);
      setFormData({
        company: '',
        role: '',
        interviewType: 'DSA',
        difficulty: 'Intermediate',
        outcome: '',
        mode: '',
        location: '',
        content: '',
      });
      setMessage('Experience shared!');
      fetchExperiences();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to share experience:', err);
      alert('Failed to share experience');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Interview Experiences</h1>
          {user && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              + Share Your Experience
            </button>
          )}
        </div>

        {message && (
          <div className="mb-6 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-8 border border-gray-100 dark:border-gray-800 transition-colors">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
              <select value={filters.company} onChange={(e) => setFilters({ ...filters, company: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm">
                <option value="">All Companies</option>
                {companies.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">College</label>
              <select value={filters.college} onChange={(e) => setFilters({ ...filters, college: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm">
                {popularColleges.map((c) => (
                  <option key={c} value={c}>{c || 'All Colleges'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Type</label>
              <select value={filters.interviewType} onChange={(e) => setFilters({ ...filters, interviewType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm">
                <option value="">All Types</option>
                {interviewTypes.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
              <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm">
                <option value="">All Difficulties</option>
                {difficulties.filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
              <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm">
                {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Experience Cards */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-xl">No experiences shared yet</p>
            {user && <p className="mt-2">Be the first to share one!</p>}
            {!user && <p className="mt-2"><Link to="/login" className="text-indigo-600 hover:underline">Log in</Link> to share yours.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {experiences.map((exp) => (
              <div key={exp._id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 border border-gray-100 dark:border-gray-800 transition-colors">
                {/* Author info */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{exp.user?.name || 'Anonymous'}</h3>
                    {exp.user?.college && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {exp.user.college}
                        {exp.user.degree && ` • ${exp.user.degree}`}
                        {exp.user.branch && ` • ${exp.user.branch}`}
                        {exp.user.graduationYear && ` • Batch ${exp.user.graduationYear}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUpvote(exp._id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition ${
                      hasUpvoted(exp)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={user ? 'Upvote' : 'Log in to upvote'}
                  >
                    ▲ {exp.upvotes?.length || 0}
                  </button>
                </div>

                {/* Company & Role */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏢</span>
                  <span className="font-medium text-gray-800 dark:text-white">{exp.company}</span>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-gray-700 dark:text-gray-300">💼 {exp.role}</span>
                </div>

                {exp.location && (
                  <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400 text-sm">
                    <span>📍</span>
                    <span>{exp.location}</span>
                  </div>
                )}

                {/* Chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {exp.outcome && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      exp.outcome === 'Selected' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      exp.outcome === 'Rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {exp.outcome === 'Selected' ? '⭐ Selected' : exp.outcome === 'Rejected' ? '❌ Rejected' : exp.outcome}
                    </span>
                  )}
                  {exp.mode && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      🎯 {exp.mode}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    📅 {new Date(exp.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    📖 {exp.reads || 0} Reads
                  </span>
                </div>

                {/* Content preview */}
                <div className="mt-4">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
                    {exp.content ? 'Rich Text Content' : 'No content'}
                  </p>
                  <Link
                    to={`/experiences/${exp._id}`}
                    className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Share Experience Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 border border-gray-100 dark:border-gray-800 transition-colors max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Share Your Interview Experience</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white" placeholder="e.g. Amazon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                  <input type="text" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white" placeholder="e.g. SDE-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interview Type *</label>
                  <select value={formData.interviewType} onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                    {interviewTypes.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty *</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                    {difficulties.filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome</label>
                  <select value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                    <option value="">Not Specified</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                    <option value="No Decision">No Decision</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                  <select value={formData.mode} onChange={(e) => setFormData({ ...formData, mode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white">
                    <option value="">Not Specified</option>
                    <option value="On Campus">On Campus</option>
                    <option value="Off Campus">Off Campus</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white" placeholder="e.g. Pune, India" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Details *</label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder="Describe the interview process, questions asked, your tips..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
                  {submitting ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewExperiences;