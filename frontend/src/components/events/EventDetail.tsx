import React from 'react';
import type { Event } from '../../services/event.service';

/**
 * EventDetail Component
 * From 004-simracing-series feature - User Story 2
 * Displays detailed information about an event
 */

interface EventDetailProps {
  event: Event;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export function EventDetail({ event, onEdit, onDelete, onBack }: EventDetailProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return { bg: '#e3f2fd', text: '#1976d2' };
      case 'IN_PROGRESS':
        return { bg: '#fff3e0', text: '#f57c00' };
      case 'COMPLETED':
        return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'CANCELLED':
        return { bg: '#ffebee', text: '#c62828' };
      default:
        return { bg: '#f5f5f5', text: '#666' };
    }
  };

  const statusColors = getStatusColor(event.status);

  const formatRaceLength = (value: number, unit: string) => {
    return `${value} ${unit.toLowerCase()}`;
  };

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
          ← Back to Events
        </button>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>{event.name}</h1>
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
              {event.status}
            </span>
            <span style={{ color: '#666' }}>{event.track}</span>
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
                if (window.confirm(`Are you sure you want to delete "${event.name}"?`)) {
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
            Event Date
          </div>
          <div style={{ fontWeight: 'bold' }}>
            {new Date(event.eventDate).toLocaleDateString()}
          </div>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Track</div>
          <div style={{ fontWeight: 'bold' }}>{event.track}</div>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
            Race Length
          </div>
          <div style={{ fontWeight: 'bold' }}>
            {formatRaceLength(event.raceLengthValue, event.raceLengthUnit)}
          </div>
        </div>

        <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
            Sessions
          </div>
          <div style={{ fontWeight: 'bold' }}>{event.sessionCount || 0}</div>
        </div>
      </div>

      {event.status === 'CANCELLED' && event.cancellationReason && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#ffebee',
            borderRadius: '8px',
            border: '1px solid #ef5350',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#c62828', marginBottom: '0.5rem' }}>
            Cancellation Reason
          </div>
          <div style={{ color: '#c62828' }}>{event.cancellationReason}</div>
          {event.cancelledAt && (
            <div style={{ fontSize: '0.85rem', color: '#c62828', marginTop: '0.5rem' }}>
              Cancelled on {new Date(event.cancelledAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {event.originalEventDate && event.originalEventDate !== event.eventDate && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#fff3e0',
            borderRadius: '8px',
            border: '1px solid #ffb74d',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#f57c00', marginBottom: '0.5rem' }}>
            Rescheduled Event
          </div>
          <div style={{ color: '#f57c00' }}>
            Originally scheduled for {new Date(event.originalEventDate).toLocaleDateString()}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #ddd',
          fontSize: '0.85rem',
          color: '#999',
        }}
      >
        <div>Created: {new Date(event.createdAt).toLocaleString()}</div>
        <div>Last Updated: {new Date(event.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}
