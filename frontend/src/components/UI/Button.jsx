import React from 'react';

/**
 * Reusable Button Component
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/50 text-white',
    secondary: 'border-2 border-white text-white hover:bg-white/10',
    ghost: 'text-white hover:bg-white/10',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Reusable Card Component
 */
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white/10 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/15 dark:hover:bg-gray-800/60 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Reusable Container Component
 */
export const Container = ({ children, className = '', ...props }) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Gradient Text Component
 */
export const GradientText = ({ children, className = '' }) => {
  return (
    <span className={`bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
};

/**
 * Badge Component
 */
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    error: 'bg-red-500/20 text-red-300 border border-red-500/40',
  };

  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
