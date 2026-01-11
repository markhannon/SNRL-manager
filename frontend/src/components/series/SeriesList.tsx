import React from 'react';
import type { Series } from '../../services/series.service';

/**
 * T024: SeriesList Component
 * Displays table with title, description, content count, creator, created date
 */

interface SeriesListProps {
  series: Series[];
  onEdit?: (series: Series) => void;
  onDelete?: (series: Series) => void;
  onSelect?: (series: Series) => void;
}

export function SeriesList({ series, onEdit, onDelete, onSelect }: SeriesListProps) {
  if (series.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No series found. Create your first series to get started.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: '1rem' }}>Title</th>
            <th style={{ padding: '1rem' }}>Description</th>
            <th style={{ padding: '1rem', textAlign: 'center' }}>Content Count</th>
            <th style={{ padding: '1rem' }}>Created</th>
            <th style={{ padding: '1rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr
              key={s.id}
              style={{ borderBottom: '1px solid #eee', cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect?.(s)}
            >
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.title}</td>
              <td style={{ padding: '1rem', color: '#666', maxWidth: '300px' }}>
                {s.description || <em style={{ color: '#aaa' }}>No description</em>}
              </td>
              <td style={{ padding: '1rem', textAlign: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    background: s.content_count > 0 ? '#e3f2fd' : '#f5f5f5',
                    color: s.content_count > 0 ? '#1976d2' : '#999',
                    fontWeight: 'bold',
                  }}
                >
                  {s.content_count}
                </span>
              </td>
              <td style={{ padding: '1rem', color: '#666' }}>
                {new Date(s.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(s);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete series "${s.title}"?`)) {
                          onDelete(s);
                        }
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        border: '1px solid #f44336',
                        borderRadius: '4px',
                        background: 'white',
                        color: '#f44336',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
