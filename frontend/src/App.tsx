import React from 'react';
import { SeriesPage } from './pages/editor/SeriesPage';

/**
 * Main App Component
 * MVP: Currently just showing SeriesPage for testing
 */

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #ddd',
          padding: '1rem 2rem',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>SNRL Manager</h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
          Content and Series Management System
        </p>
      </header>
      <main>
        <SeriesPage />
      </main>
    </div>
  );
}

export default App;
