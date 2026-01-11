import React, { useState } from 'react';
import type { Event, RaceLengthUnit } from '../../services/event.service';

/**
 * EventForm Component
 * From 004-simracing-series feature - User Story 2
 * Form for creating/editing events
 */

interface EventFormProps {
  event?: Event | null;
  championshipSeasonStart?: string;
  championshipSeasonEnd?: string;
  onSubmit: (data: {
    name: string;
    track: string;
    eventDate: string;
    raceLengthValue: number;
    raceLengthUnit: RaceLengthUnit;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function EventForm({
  event,
  championshipSeasonStart,
  championshipSeasonEnd,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [name, setName] = useState(event?.name || '');
  const [track, setTrack] = useState(event?.track || '');
  const [eventDate, setEventDate] = useState(event?.eventDate || '');
  const [raceLengthValue, setRaceLengthValue] = useState<string>(
    event?.raceLengthValue?.toString() || ''
  );
  const [raceLengthUnit, setRaceLengthUnit] = useState<RaceLengthUnit>(
    event?.raceLengthUnit || 'LAPS'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Event name is required');
      return;
    }

    if (!track.trim()) {
      setError('Track is required');
      return;
    }

    if (!eventDate) {
      setError('Event date is required');
      return;
    }

    const raceLength = Number.parseInt(raceLengthValue, 10);
    if (!raceLengthValue || Number.isNaN(raceLength) || raceLength <= 0) {
      setError('Race length must be a positive number');
      return;
    }

    // Validate date is within championship season
    if (championshipSeasonStart && eventDate < championshipSeasonStart) {
      setError(`Event date must be after championship season start (${championshipSeasonStart})`);
      return;
    }

    if (championshipSeasonEnd && eventDate > championshipSeasonEnd) {
      setError(`Event date must be before championship season end (${championshipSeasonEnd})`);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        track: track.trim(),
        eventDate,
        raceLengthValue: raceLength,
        raceLengthUnit,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Event Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          placeholder="e.g., Round 1: Monza"
        />
      </div>

      <div>
        <label htmlFor="track" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Track *
        </label>
        <input
          id="track"
          type="text"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          required
          maxLength={255}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          placeholder="e.g., Monza, Spa-Francorchamps"
        />
      </div>

      <div>
        <label htmlFor="eventDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Event Date *
        </label>
        <input
          id="eventDate"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          min={championshipSeasonStart}
          max={championshipSeasonEnd}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
        />
        {championshipSeasonStart && championshipSeasonEnd && (
          <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
            Must be between {championshipSeasonStart} and {championshipSeasonEnd}
          </small>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label
            htmlFor="raceLengthValue"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
          >
            Race Length *
          </label>
          <input
            id="raceLengthValue"
            type="number"
            value={raceLengthValue}
            onChange={(e) => setRaceLengthValue(e.target.value)}
            required
            min="1"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
            placeholder="e.g., 30"
          />
        </div>

        <div>
          <label
            htmlFor="raceLengthUnit"
            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}
          >
            Unit *
          </label>
          <select
            id="raceLengthUnit"
            value={raceLengthUnit}
            onChange={(e) => setRaceLengthUnit(e.target.value as RaceLengthUnit)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          >
            <option value="LAPS">Laps</option>
            <option value="MINUTES">Minutes</option>
            <option value="HOURS">Hours</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            border: '1px solid #ef5350',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            background: '#1976d2',
            color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
