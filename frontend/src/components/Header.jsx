import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings, User, Bell, Moon, SunMedium } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ASSETS } from '../config/assets';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navLinks = isAuthenticated
    ? [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Practice Interview', href: '/find-interview' },
        { name: 'My Interviews', href: '/my-interviews' },
        { name: 'Experiences', href: '/experiences' },
        { name: 'Feedback', href: '/feedback' },
      ]
    : [
        { name: 'Home', href: '/' },
        { name: 'Features', href: '/#features' },
        { name: 'How It Works', href: '/#how-it-works' },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900/80 to-transparent backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img
              src={ASSETS.logos.icon}
              alt="PeerPrep"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg"
            />
            <span className="hidden sm:inline font-bold text-xl text-white">
              PeerPrep
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-wrap items-center justify-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm lg:text-base font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'text-purple-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <SunMedium size={18} className="text-yellow-300" /> : <Moon size={18} className="text-white" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  aria-label="Notifications"
                >
                  <Bell size={20} className="text-white" />
                </button>

                <div className="group relative">
                  <button className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-white/10 transition">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-white">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </button>

                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10"
                    >
                      <User size={16} />
                      View Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-purple-400 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-white" />
              ) : (
                <Menu size={24} className="text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg transition ${
                  location.pathname === link.href
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 px-4 pt-2">
                <Link
                  to="/login"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex-1 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;