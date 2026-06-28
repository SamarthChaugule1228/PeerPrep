import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MatchRoom from './pages/MatchRoom';
import InterviewExperiences from './pages/InterviewExperiences';
import ExperienceDetail from './pages/ExperienceDetail';
import Profile from './pages/Profile';            // <-- new import

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
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />   {/* new protected route */}
          <Route path="/matchroom/:sessionId" element={user ? <MatchRoom /> : <Navigate to="/login" />} />
          <Route path="/experiences" element={<InterviewExperiences />} />
          <Route path="/experiences/:id" element={<ExperienceDetail />} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} />} />
        </Routes>
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
};

export default App;