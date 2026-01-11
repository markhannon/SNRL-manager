import React from 'react';
import type { Event } from '../../services/event.service';

/**
 * EventList Component
 * From 004-simracing-series feature - User Story 2
 * Displays chronological list of events
 */

interface EventListProps {
  events: Event[];
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onSelect?: (event: Event) => void;
}

export function EventList({ events, onEdit, onDelete, onSelect }: EventListProps) {
  if (events.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No events found. Create your first event to get started.
      </div>
    );
  }

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

  const formatRaceLength = (value: number, unit: string) => {
    return `${value} ${unit.toLowerCase()}`;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: '1rem' }}>Date</th>
            <th style={{ padding: '1rem' }}>Event</th>
            <th style={{ padding: '1rem' }}>Track</th>
            <th style={{ padding: '1rem' }}>Race Length</th>
            <th style={{ padding: '1rem' }}>Status</th>
            <th style={{ padding: '1rem', textAlign: 'center' }}>Sessions</th>
            <th style={{ padding: '1rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const statusColors = getStatusColor(event.status);
            return (
              <tr
                key={event.id}
                style={{
                  borderBottom: '1px solid #eee',
                  cursor: onSelect ? 'pointer' : 'default',
                }}
                onClick={() => onSelect?.(event)}
              >
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  {new Date(event.eventDate).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{event.name}</div>
                </td>
                <td style={{ padding: '1rem', color: '#666' }}>{event.track}</td>
                <td style={{ padding: '1rem', color: '#666' }}>
                  {formatRaceLength(event.raceLengthValue, event.raceLengthUnit)}
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
                    {event.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      background:
                        event.sessionCount && event.sessionCount > 0 ? '#e3f2fd' : '#f5f5f5',
                      color: event.sessionCount && event.sessionCount > 0 ? '#1976d2' : '#999',
                      fontWeight: 'bold',
                    }}
                  >
                    {event.sessionCount || 0}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(event);
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
                          if (window.confirm(`Are you sure you want to delete "${event.name}"?`)) {
                            onDelete(event);
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
