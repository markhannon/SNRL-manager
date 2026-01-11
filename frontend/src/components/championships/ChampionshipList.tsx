import React from 'react';
import type { Championship } from '../../services/championship.service';

/**
 * ChampionshipList Component
 * From 004-simracing-series feature
 * Displays list of championships with key information
 */

interface ChampionshipListProps {
  championships: Championship[];
  onEdit?: (championship: Championship) => void;
  onDelete?: (championship: Championship) => void;
  onSelect?: (championship: Championship) => void;
}

export function ChampionshipList({ championships, onEdit, onDelete, onSelect }: ChampionshipListProps) {
  if (championships.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No championships found. Create your first championship to get started.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { bg: '#f5f5f5', text: '#666' };
      case 'UPCOMING':
        return { bg: '#e3f2fd', text: '#1976d2' };
      case 'ACTIVE':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'COMPLETED':
        return { bg: '#ede7f6', text: '#5e35b1' };
      case 'CANCELLED':
        return { bg: '#ffebee', text: '#c62828' };
      default:
        return { bg: '#f5f5f5', text: '#666' };
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: '1rem' }}>Name</th>
            <th style={{ padding: '1rem' }}>Simulator</th>
            <th style={{ padding: '1rem' }}>Season</th>
            <th style={{ padding: '1rem' }}>Status</th>
            <th style={{ padding: '1rem', textAlign: 'center' }}>Events</th>
            <th style={{ padding: '1rem' }}>Points Scheme</th>
            <th style={{ padding: '1rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {championships.map((championship) => {
            const statusColors = getStatusColor(championship.status);
            return (
              <tr
                key={championship.id}
                style={{
                  borderBottom: '1px solid #eee',
                  cursor: onSelect ? 'pointer' : 'default',
                }}
                onClick={() => onSelect?.(championship)}
              >
                <td style={{ padding: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{championship.name}</div>
                    {championship.description && (
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                        {championship.description.length > 60
                          ? `${championship.description.substring(0, 60)}...`
                          : championship.description}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem', color: '#666' }}>{championship.simulator}</td>
                <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
                  <div>{new Date(championship.seasonStart).toLocaleDateString()}</div>
                  <div style={{ marginTop: '0.25rem' }}>
                    to {new Date(championship.seasonEnd).toLocaleDateString()}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      background: statusColors.bg,
                      color: statusColors.text,
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                    }}
                  >
                    {championship.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      background: championship.eventCount && championship.eventCount > 0 ? '#e3f2fd' : '#f5f5f5',
                      color: championship.eventCount && championship.eventCount > 0 ? '#1976d2' : '#999',
                      fontWeight: 'bold',
                    }}
                  >
                    {championship.eventCount || 0}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#666' }}>
                  {championship.pointsScheme?.name || 'N/A'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(championship);
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
                          if (
                            window.confirm(
                              `Are you sure you want to delete "${championship.name}"?`
                            )
                          ) {
                            onDelete(championship);
                          }
                        }}
                        style={{
                          padding: '0.375rem 0.75rem',
                          border: '1px solid #ef5350',
                          borderRadius: '4px',
                          background: 'white',
                          color: '#c62828',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
