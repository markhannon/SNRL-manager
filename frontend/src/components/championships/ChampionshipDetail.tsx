import React from 'react';
import type { Championship } from '../../services/championship.service';

/**
 * ChampionshipDetail Component
 * From 004-simracing-series feature
 * Displays detailed information about a championship
 */

interface ChampionshipDetailProps {
  championship: Championship;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export function ChampionshipDetail({ championship, onEdit, onDelete, onBack }: ChampionshipDetailProps) {
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

  const statusColors = getStatusColor(championship.status);

  return (
    <div style={{ padding: '1rem' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          ← Back to Championships
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>{championship.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                background: statusColors.bg,
                color: statusColors.text,
                fontWeight: 'bold',
                fontSize: '0.9rem',
              }}
            >
              {championship.status}
            </span>
            <span style={{ color: '#666' }}>{championship.simulator}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onEdit && (
            <button
              onClick={onEdit}
              style={{
                padding: '0.5rem 1rem',
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
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${championship.name}"?`)) {
                  onDelete();
                }
              }}
              style={{
                padding: '0.5rem 1rem',
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
      </div>

      {championship.description && (
        <div style={{ marginBottom: '1.5rem', color: '#666' }}>
          {championship.description}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Season Start</div>
          <div style={{ fontWeight: 'bold' }}>
            {new Date(championship.seasonStart).toLocaleDateString()}
          </div>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Season End</div>
          <div style={{ fontWeight: 'bold' }}>
            {new Date(championship.seasonEnd).toLocaleDateString()}
          </div>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Events</div>
          <div style={{ fontWeight: 'bold' }}>{championship.eventCount || 0}</div>
        </div>

        {championship.maxParticipants && (
          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
              Max Participants
            </div>
            <div style={{ fontWeight: 'bold' }}>{championship.maxParticipants}</div>
          </div>
        )}
      </div>

      {championship.pointsScheme && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Points Scheme</div>
          <div style={{ fontWeight: 'bold' }}>{championship.pointsScheme.name}</div>
        </div>
      )}

      {championship.allowedCars && championship.allowedCars.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Allowed Cars</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {championship.allowedCars.map((car, index) => (
              <span
                key={index}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#e3f2fd',
                  color: '#1976d2',
                  borderRadius: '16px',
                  fontSize: '0.9rem',
                }}
              >
                {car.carName}
                {car.carClass && <span style={{ opacity: 0.7 }}> ({car.carClass})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {championship.rulesText && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Rules</h3>
          <div
            style={{
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            }}
          >
            {championship.rulesText}
          </div>
        </div>
      )}

      {championship.rulesDocumentUrl && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Rules Document</h3>
          <a
            href={championship.rulesDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1976d2',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {championship.rulesDocumentUrl} ↗
          </a>
        </div>
      )}

      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ddd', fontSize: '0.85rem', color: '#999' }}>
        <div>Created: {new Date(championship.createdAt).toLocaleString()}</div>
        <div>Last Updated: {new Date(championship.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}
