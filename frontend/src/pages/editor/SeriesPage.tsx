import React, { useState } from 'react';
import { SeriesList } from '../../components/series/SeriesList';
import { SeriesForm } from '../../components/series/SeriesForm';
import { useSeries } from '../../hooks/useSeries';
import * as seriesService from '../../services/series.service';
import type { Series } from '../../services/series.service';

/**
 * T027: SeriesPage Component
 * Integrates SeriesList and SeriesForm for series management
 */

export function SeriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const { series, loading, error, refetch } = useSeries({ status: 'active' });

  const handleCreate = async (data: { title: string; description?: string }) => {
    await seriesService.createSeries(data);
    setShowForm(false);
    refetch();
  };

  const handleUpdate = async (data: { title: string; description?: string }) => {
    if (!editingSeries) return;
    await seriesService.updateSeries(editingSeries.id, data);
    setEditingSeries(null);
    refetch();
  };

  const handleDelete = async (s: Series) => {
    await seriesService.deleteSeries(s.id);
    refetch();
  };

  const handleEdit = (s: Series) => {
    setEditingSeries(s);
    setShowForm(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Series Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingSeries(null);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            background: '#1976d2',
            color: 'white',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ New Series'}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#f9f9f9',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Create New Series</h2>
          <SeriesForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingSeries && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff8e1',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Edit Series: {editingSeries.title}</h2>
          <SeriesForm
            series={editingSeries}
            onSubmit={handleUpdate}
            onCancel={() => setEditingSeries(null)}
          />
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '1rem',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading series...
        </div>
      )}

      {!loading && !error && (
        <SeriesList
          series={series}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
