import React from 'react';
import type { EventResult } from '../../services/result.service';

/**
 * ResultsList Component
 * From 004-simracing-series feature - User Story 4
 * Displays race results
 */

interface ResultsListProps {
  results: EventResult[];
  isDraft?: boolean;
  onPublish?: () => void;
}

export function ResultsList({ results, isDraft = false, onPublish }: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No results entered yet.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLASSIFIED':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'DNF':
        return { bg: '#ffebee', text: '#c62828' };
      case 'DNS':
        return { bg: '#f5f5f5', text: '#666' };
      case 'DSQ':
        return { bg: '#ffebee', text: '#c62828' };
      default:
        return { bg: '#f5f5f5', text: '#666' };
    }
  };

  return (
    <div>
      {isDraft && onPublish && (
        <div
          style={{
            padding: '1rem',
            background: '#fff3e0',
            border: '1px solid #ffb74d',
            borderRadius: '4px',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Draft Results</strong>
            <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              These results are not yet published. Publish them to update championship standings.
            </div>
          </div>
          <button
            onClick={onPublish}
            style={{
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              background: '#2e7d32',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Publish Results
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Position</th>
              <th style={{ padding: '1rem' }}>Driver</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Penalties</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const statusColors = getStatusColor(result.resultStatus);
              return (
                <tr key={result.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {result.finishingPosition || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>{result.driverEmail || `Driver #${result.driverId}`}</td>
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
                      {result.resultStatus}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {result.penalties && result.penalties.length > 0 ? (
                      <div style={{ fontSize: '0.9rem' }}>
                        {result.penalties.map((p: any, i: number) => (
                          <div key={i} style={{ color: '#c62828' }}>
                            {p.type}: {p.value} ({p.reason})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>None</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                    }}
                  >
                    {result.pointsAwarded}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isDraft && results[0]?.publishedAt && (
        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
          Published on {new Date(results[0].publishedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
