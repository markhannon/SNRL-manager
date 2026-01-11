import React, { useState, useEffect } from 'react';
import type { Championship } from '../../services/championship.service';
import { PointsSchemeSelector } from './PointsSchemeSelector';

/**
 * ChampionshipForm Component
 * From 004-simracing-series feature
 * Form for creating/editing championships
 */

interface ChampionshipFormProps {
  championship?: Championship | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    simulator: string;
    seasonStart: string;
    seasonEnd: string;
    rulesText?: string;
    rulesDocumentUrl?: string;
    maxParticipants?: number;
    pointsSchemeId: number;
    allowedCars?: Array<{ carName: string; carClass?: string }>;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function ChampionshipForm({ championship, onSubmit, onCancel }: ChampionshipFormProps) {
  const [name, setName] = useState(championship?.name || '');
  const [description, setDescription] = useState(championship?.description || '');
  const [simulator, setSimulator] = useState(championship?.simulator || '');
  const [seasonStart, setSeasonStart] = useState(championship?.seasonStart || '');
  const [seasonEnd, setSeasonEnd] = useState(championship?.seasonEnd || '');
  const [rulesText, setRulesText] = useState(championship?.rulesText || '');
  const [rulesDocumentUrl, setRulesDocumentUrl] = useState(championship?.rulesDocumentUrl || '');
  const [maxParticipants, setMaxParticipants] = useState<string>(
    championship?.maxParticipants?.toString() || ''
  );
  const [pointsSchemeId, setPointsSchemeId] = useState<number | null>(
    championship?.pointsScheme?.id || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Championship name is required');
      return;
    }

    if (!simulator.trim()) {
      setError('Simulator is required');
      return;
    }

    if (!seasonStart) {
      setError('Season start date is required');
      return;
    }

    if (!seasonEnd) {
      setError('Season end date is required');
      return;
    }

    if (new Date(seasonEnd) <= new Date(seasonStart)) {
      setError('Season end date must be after season start date');
      return;
    }

    if (!pointsSchemeId) {
      setError('Points scheme is required');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        simulator: simulator.trim(),
        seasonStart,
        seasonEnd,
        rulesText: rulesText.trim() || undefined,
        rulesDocumentUrl: rulesDocumentUrl.trim() || undefined,
        maxParticipants: maxParticipants ? Number.parseInt(maxParticipants, 10) : undefined,
        pointsSchemeId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save championship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Championship Name *
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
          placeholder="e.g., SNRL F1 2024 Championship"
        />
      </div>

      <div>
        <label htmlFor="simulator" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Simulator *
        </label>
        <input
          id="simulator"
          type="text"
          value={simulator}
          onChange={(e) => setSimulator(e.target.value)}
          required
          maxLength={100}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          placeholder="e.g., Assetto Corsa Competizione, iRacing"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label htmlFor="seasonStart" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Season Start *
          </label>
          <input
            id="seasonStart"
            type="date"
            value={seasonStart}
            onChange={(e) => setSeasonStart(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div>
          <label htmlFor="seasonEnd" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Season End *
          </label>
          <input
            id="seasonEnd"
            type="date"
            value={seasonEnd}
            onChange={(e) => setSeasonEnd(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
          placeholder="Brief description of the championship"
        />
      </div>

      <div>
        <label htmlFor="maxParticipants" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Max Participants
        </label>
        <input
          id="maxParticipants"
          type="number"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(e.target.value)}
          min="1"
          style={{
            width: '150px',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          placeholder="Optional"
        />
      </div>

      <PointsSchemeSelector
        selectedSchemeId={pointsSchemeId}
        onSchemeSelect={setPointsSchemeId}
      />

      <div>
        <label htmlFor="rulesText" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Rules
        </label>
        <textarea
          id="rulesText"
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
          placeholder="Championship rules and regulations"
        />
      </div>

      <div>
        <label htmlFor="rulesDocumentUrl" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Rules Document URL
        </label>
        <input
          id="rulesDocumentUrl"
          type="url"
          value={rulesDocumentUrl}
          onChange={(e) => setRulesDocumentUrl(e.target.value)}
          maxLength={500}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          placeholder="https://example.com/rules.pdf"
        />
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
          {loading ? 'Saving...' : championship ? 'Update Championship' : 'Create Championship'}
        </button>
      </div>
    </form>
  );
}
