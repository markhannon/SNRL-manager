import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import type { User } from '../services/auth.service';

/**
 * T047: LoginPage Component
 * Full login page with branding and form
 */

export function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: User) => {
    // Redirect based on role
    if (user.role === 'admin') {
      navigate('/admin/users');
    } else {
      navigate('/editor/series');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '500px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '2rem' }}>SNRL Manager</h1>
          <p style={{ margin: 0, color: '#666' }}>Simracing North Regional League</p>
        </div>

        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>Admin Login</h2>

        <LoginForm onSuccess={handleLoginSuccess} />

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px', fontSize: '0.875rem', color: '#666' }}>
          <strong>Test Credentials:</strong>
          <br />
          Email: admin@example.com
          <br />
          Password: admin123
        </div>
      </div>
    </div>
  );
}
