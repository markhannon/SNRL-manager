import React, { useState } from 'react';
import type { EnterResultInput, ResultStatus } from '../../services/result.service';

/**
 * ResultEntryForm Component
 * From 004-simracing-series feature - User Story 4
 * Form for entering race results
 */

interface ResultEntryFormProps {
  driverEmails: string[];
  onSubmit: (results: EnterResultInput[]) => Promise<void>;
  onCancel?: () => void;
}

export function ResultEntryForm({ driverEmails, onSubmit, onCancel }: ResultEntryFormProps) {
  const [results, setResults] = useState<Array<{
    driverId: number;
    driverEmail: string;
    finishingPosition: string;
    resultStatus: ResultStatus;
  }>>(
    driverEmails.map((email, index) => ({
      driverId: index + 1, // This should come from actual driver IDs
      driverEmail: email,
      finishingPosition: (index + 1).toString(),
      resultStatus: 'CLASSIFIED' as ResultStatus,
    }))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (index: number, status: ResultStatus) => {
    const updated = [...results];
    updated[index].resultStatus = status;
    if (status !== 'CLASSIFIED') {
      updated[index].finishingPosition = '';
    }
    setResults(updated);
  };

  const handlePositionChange = (index: number, position: string) => {
    const updated = [...results];
    updated[index].finishingPosition = position;
    setResults(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate unique positions for classified results
    const positions = results
      .filter((r) => r.resultStatus === 'CLASSIFIED' && r.finishingPosition)
      .map((r) => r.finishingPosition);

    if (new Set(positions).size !== positions.length) {
      setError('Duplicate finishing positions detected');
      return;
    }

    // Validate all classified results have positions
    const classifiedWithoutPosition = results.find(
      (r) => r.resultStatus === 'CLASSIFIED' && !r.finishingPosition
    );

    if (classifiedWithoutPosition) {
      setError('All classified drivers must have a finishing position');
      return;
    }

    try {
      setLoading(true);

      const payload: EnterResultInput[] = results.map((r) => ({
        driverId: r.driverId,
        finishingPosition:
          r.resultStatus === 'CLASSIFIED' && r.finishingPosition
            ? Number.parseInt(r.finishingPosition, 10)
            : undefined,
        resultStatus: r.resultStatus,
      }));

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Driver</th>
              <th style={{ padding: '0.75rem', width: '150px' }}>Position</th>
              <th style={{ padding: '0.75rem', width: '200px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>{result.driverEmail}</td>
                <td style={{ padding: '0.75rem' }}>
                  <input
                    type="number"
                    value={result.finishingPosition}
                    onChange={(e) => handlePositionChange(index, e.target.value)}
                    disabled={result.resultStatus !== 'CLASSIFIED'}
                    min="1"
                    style={{
                      width: '100px',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  />
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <select
                    value={result.resultStatus}
                    onChange={(e) => handleStatusChange(index, e.target.value as ResultStatus)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="CLASSIFIED">Classified</option>
                    <option value="DNF">DNF</option>
                    <option value="DNS">DNS</option>
                    <option value="DSQ">DSQ</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          {loading ? 'Saving...' : 'Save Results (Draft)'}
        </button>
      </div>
    </form>
  );
}
