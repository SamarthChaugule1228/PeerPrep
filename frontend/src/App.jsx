import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PracticeInterview from './pages/PracticeInterview';
import MatchRoom from './pages/MatchRoom';
import InterviewExperiences from './pages/InterviewExperiences';
import FeedbackPage from './pages/FeedbackPage';
import ExperienceDetail from './pages/ExperienceDetail';
import Profile from './pages/Profile';
import ScheduledInterviews from './pages/ScheduledInterviews';

const App = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const hideLayout = location.pathname.startsWith('/matchroom');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {!hideLayout && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/my-interviews" element={user ? <ScheduledInterviews /> : <Navigate to="/login" />} />
          <Route path="/find-interview" element={user ? <PracticeInterview /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/feedback" element={user ? <FeedbackPage /> : <Navigate to="/login" />} />
          <Route path="/scheduled-interviews" element={user ? <ScheduledInterviews /> : <Navigate to="/login" />} />
          <Route path="/matchroom/:sessionId" element={user ? <MatchRoom /> : <Navigate to="/login" />} />
          <Route path="/experiences" element={<InterviewExperiences />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="/interview-experiences" element={<InterviewExperiences />} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
};

export default App;