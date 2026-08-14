import React, { useState } from 'react';
import { X, Zap, Shield, Users, Clock, MessageSquare, Star } from 'lucide-react';

const FeaturesRulesModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('features');

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Smart Matching',
      description: 'Get paired with study partners based on your skills and interview goals'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Scheduled Interviews',
      description: 'Book and schedule mock interviews at your convenience'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Real-time Collaboration',
      description: 'Chat, share code, and collaborate during interview sessions'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Feedback System',
      description: 'Get detailed feedback after each interview session'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Live Editor',
      description: 'Write and execute code together in real-time'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Platform',
      description: 'Your data and sessions are fully encrypted and secure'
    }
  ];

  const rules = [
    {
      title: 'Be Respectful',
      description: 'Treat all users with respect and professionalism. No harassment or discriminatory behavior is tolerated.'
    },
    {
      title: 'Punctuality Matters',
      description: 'Join scheduled interviews on time. Notify your partner if you\'ll be late or need to reschedule.'
    },
    {
      title: 'Active Participation',
      description: 'Actively participate in sessions. Ask questions, provide feedback, and help your partner improve.'
    },
    {
      title: 'No Cheating or Plagiarism',
      description: 'Do not copy solutions from external sources. The goal is to learn and practice together.'
    },
    {
      title: 'Provide Constructive Feedback',
      description: 'Give honest, constructive feedback after sessions. Focus on helping your partner improve.'
    },
    {
      title: 'Maintain Confidentiality',
      description: 'Keep interview questions and discussions confidential. Do not share with others outside the platform.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-gray-100 dark:border-gray-800 transition-colors max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 px-6 py-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome to PeerPrep</h2>
            <p className="text-emerald-100 text-sm mt-1">Learn the features and rules</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('features')}
            className={`flex-1 py-4 px-6 font-medium transition ${
              activeTab === 'features'
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            ✨ Features
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-4 px-6 font-medium transition ${
              activeTab === 'rules'
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            📋 Important Rules
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'features' ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Discover what makes PeerPrep the best platform for preparing for technical interviews
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-emerald-600 dark:text-emerald-400 mt-1">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Follow these important rules to ensure a positive experience for everyone
              </p>
              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                          {rule.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
          >
            Let's Get Started! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturesRulesModal;
