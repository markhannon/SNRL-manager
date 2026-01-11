import React, { useState, useEffect } from 'react';
import {
  getPointsSchemes,
  getPredefinedSchemes,
  createPointsScheme,
  type PointsScheme,
  type PredefinedSchemes,
} from '../../services/championship.service';

/**
 * PointsSchemeSelector Component
 * From 004-simracing-series feature
 * Select or create points schemes
 */

interface PointsSchemeSelectorProps {
  selectedSchemeId: number | null;
  onSchemeSelect: (schemeId: number) => void;
}

export function PointsSchemeSelector({ selectedSchemeId, onSchemeSelect }: PointsSchemeSelectorProps) {
  const [schemes, setSchemes] = useState<PointsScheme[]>([]);
  const [predefined, setPredefined] = useState<PredefinedSchemes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPredefined, setShowPredefined] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const [schemesData, predefinedData] = await Promise.all([
        getPointsSchemes(),
        getPredefinedSchemes(),
      ]);
      setSchemes(schemesData);
      setPredefined(predefinedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load points schemes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromPredefined = async (key: keyof PredefinedSchemes) => {
    if (!predefined) return;

    try {
      setCreating(true);
      setError(null);
      const scheme = predefined[key];
      const created = await createPointsScheme({
        name: scheme.name,
        description: scheme.description,
        pointsMapping: scheme.pointsMapping,
        bonusPoints: scheme.bonusPoints,
        dropScores: scheme.dropScores,
      });
      setSchemes([...schemes, created]);
      onSchemeSelect(created.id);
      setShowPredefined(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create points scheme');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        Loading points schemes...
      </div>
    );
  }

  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        Points Scheme *
      </label>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            border: '1px solid #ef5350',
            marginBottom: '0.5rem',
          }}
        >
          {error}
        </div>
      )}

      <select
        value={selectedSchemeId || ''}
        onChange={(e) => onSchemeSelect(Number.parseInt(e.target.value, 10))}
        required
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '1rem',
          marginBottom: '0.5rem',
        }}
      >
        <option value="">Select a points scheme...</option>
        {schemes.map((scheme) => (
          <option key={scheme.id} value={scheme.id}>
            {scheme.name}
            {scheme.description && ` - ${scheme.description}`}
          </option>
        ))}
      </select>

      <div>
        <button
          type="button"
          onClick={() => setShowPredefined(!showPredefined)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {showPredefined ? 'Hide' : 'Create from'} Predefined Schemes
        </button>
      </div>

      {showPredefined && predefined && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#f5f5f5',
          }}
        >
          <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Predefined Schemes</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(predefined).map(([key, scheme]) => (
              <div
                key={key}
                style={{
                  padding: '0.75rem',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{scheme.name}</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#666' }}>
                    {scheme.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateFromPredefined(key as keyof PredefinedSchemes)}
                  disabled={creating}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#1976d2',
                    color: 'white',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {creating ? 'Creating...' : 'Use This'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSchemeId && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
          Selected: {schemes.find((s) => s.id === selectedSchemeId)?.name}
        </div>
      )}
    </div>
  );
}
