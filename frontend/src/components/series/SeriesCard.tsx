import React from 'react';
import type { Series } from '../../services/series.service';

/**
 * T026: SeriesCard Component
 * Card display for series with content count badge
 */

interface SeriesCardProps {
  series: Series;
  onClick?: () => void;
}

export function SeriesCard({ series, onClick }: SeriesCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.2s',
        background: 'white',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#333' }}>
          {series.title}
        </h3>
        <span
          style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '16px',
            background: series.content_count > 0 ? '#e3f2fd' : '#f5f5f5',
            color: series.content_count > 0 ? '#1976d2' : '#999',
            fontSize: '0.875rem',
            fontWeight: 'bold',
          }}
        >
          {series.content_count} {series.content_count === 1 ? 'item' : 'items'}
        </span>
      </div>

      {series.description && (
        <p
          style={{
            margin: '0 0 1rem 0',
            color: '#666',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {series.description}
        </p>
      )}

      <div style={{ fontSize: '0.875rem', color: '#999' }}>
        Created {new Date(series.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
