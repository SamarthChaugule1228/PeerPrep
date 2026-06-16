import React from 'react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">PeerPrep</div>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="user-name">{user.username}</span>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/login">Login</a>
            <a href="/register">Register</a>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
