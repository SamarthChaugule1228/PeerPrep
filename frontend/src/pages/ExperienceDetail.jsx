import React, { useState, useEffect } from 'react';             // ← added React, useState, useEffect
import { useParams, Link } from 'react-router-dom';              // ← added useParams
import api from '../services/api';                               // ← added api
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

const ExperienceDetail = () => {
  const { id } = useParams();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const res = await api.get(`/experiences/${id}`);
        setExperience(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExperience();
  }, [id]);

  // Convert JSON content to HTML – only uses extensions that exist in the editor
  const renderContent = (jsonContent) => {
    if (!jsonContent) return '<p>No content</p>';
    try {
      const parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
      return generateHTML(parsed, [
        StarterKit.configure({ codeBlock: false }),
        LinkExt,
        CodeBlockLowlight.configure({ lowlight }),
      ]);
    } catch (e) {
      // fallback for plain text
      return `<div class="whitespace-pre-wrap">${jsonContent}</div>`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 dark:text-gray-400">Experience not found.</p>
      </div>
    );
  }

  const htmlContent = renderContent(experience.content);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <main className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/experiences" className="text-indigo-600 dark:text-indigo-400 hover:underline mb-4 inline-block">
          ← Back to Experiences
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 md:p-8 border border-gray-100 dark:border-gray-800 transition-colors">
          {/* Author */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {experience.user?.name || 'Anonymous'}
            </h3>
            {experience.user?.college && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {experience.user.college}
                {experience.user.degree && ` • ${experience.user.degree}`}
                {experience.user.branch && ` • ${experience.user.branch}`}
                {experience.user.graduationYear && ` • Batch ${experience.user.graduationYear}`}
              </p>
            )}
          </div>

          {/* Company & Role */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-2xl">🏢</span>
            <span className="font-semibold text-lg text-gray-800 dark:text-white">
              {experience.company}
            </span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span className="text-gray-700 dark:text-gray-300">💼 {experience.role}</span>
            {experience.location && (
              <>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="text-gray-500 dark:text-gray-400">📍 {experience.location}</span>
              </>
            )}
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {experience.outcome && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  experience.outcome === 'Selected'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : experience.outcome === 'Rejected'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {experience.outcome === 'Selected'
                  ? '⭐ Selected'
                  : experience.outcome === 'Rejected'
                  ? '❌ Rejected'
                  : experience.outcome}
              </span>
            )}
            {experience.mode && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                🎯 {experience.mode}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              📅 {new Date(experience.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              📖 {experience.reads || 0} Reads
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              ▲ {experience.upvotes?.length || 0}
            </span>
          </div>

          {/* Full Content rendered as rich HTML */}
          <div
            className="prose dark:prose-invert max-w-none mt-6"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* LinkedIn follow */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Found this helpful? Follow us on LinkedIn for more.
            </p>
            <a
              href="https://www.linkedin.com/company/peerprep"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              PeerPrep on LinkedIn
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExperienceDetail;