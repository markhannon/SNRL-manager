import React, { useState } from 'react';
import type { Series } from '../../services/series.service';

/**
 * T025: SeriesForm Component
 * Form with title and description fields for create/edit
 */

interface SeriesFormProps {
  series?: Series | null;
  onSubmit: (data: { title: string; description?: string }) => Promise<void>;
  onCancel?: () => void;
}

export function SeriesForm({ series, onSubmit, onCancel }: SeriesFormProps) {
  const [title, setTitle] = useState(series?.title || '');
  const [description, setDescription] = useState(series?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (title.length > 200) {
      setError('Title cannot exceed 200 characters');
      return;
    }

    if (description.length > 5000) {
      setError('Description cannot exceed 5000 characters');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save series');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
          placeholder="Enter series title"
        />
        <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
          {title.length}/200 characters
        </small>
      </div>

      <div>
        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
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
          placeholder="Enter series description (optional)"
        />
        <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
          {description.length}/5000 characters
        </small>
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
          {loading ? 'Saving...' : series ? 'Update Series' : 'Create Series'}
        </button>
      </div>
    </form>
  );
}
