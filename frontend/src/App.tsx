import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { SeriesPage } from './pages/editor/SeriesPage';
import { UsersPage } from './pages/admin/UsersPage';
import * as authService from './services/auth.service';

/**
 * Main App Component
 * Handles routing and authentication
 */

function App() {
  const [user, setUser] = useState<authService.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout on client side anyway
      authService.logout();
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        {user && (
          <header
            style={{
              background: 'white',
              borderBottom: '1px solid #ddd',
              padding: '1rem 2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>SNRL Manager</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
                Content and Series Management System
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <nav style={{ display: 'flex', gap: '1rem' }}>
                {user.role === 'admin' && (
                  <Link to="/admin/users" style={{ color: '#1976d2', textDecoration: 'none' }}>
                    Users
                  </Link>
                )}
                <Link to="/editor/series" style={{ color: '#1976d2', textDecoration: 'none' }}>
                  Series
                </Link>
              </nav>
              <div style={{ color: '#666' }}>
                {user.email} ({user.role})
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </header>
        )}

        <main>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/editor/series" /> : <LoginPage />}
            />
            <Route
              path="/admin/users"
              element={
                user && user.role === 'admin' ? <UsersPage /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/editor/series"
              element={user ? <SeriesPage /> : <Navigate to="/login" />}
            />
            <Route path="/" element={<Navigate to={user ? '/editor/series' : '/login'} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
