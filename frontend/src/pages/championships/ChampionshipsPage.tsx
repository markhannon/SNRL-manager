import React, { useState, useEffect } from 'react';
import { ChampionshipList } from '../../components/championships/ChampionshipList';
import { ChampionshipForm } from '../../components/championships/ChampionshipForm';
import * as championshipService from '../../services/championship.service';
import type { Championship } from '../../services/championship.service';

/**
 * ChampionshipsPage Component
 * From 004-simracing-series feature
 * Main page for championship management
 */

export function ChampionshipsPage() {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);

  useEffect(() => {
    loadChampionships();
  }, []);

  const loadChampionships = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await championshipService.getChampionships();
      setChampionships(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load championships');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    await championshipService.createChampionship(data);
    setShowForm(false);
    loadChampionships();
  };

  const handleUpdate = async (data: any) => {
    if (!editingChampionship) return;
    await championshipService.updateChampionship(editingChampionship.id, data);
    setEditingChampionship(null);
    loadChampionships();
  };

  const handleDelete = async (championship: Championship) => {
    try {
      await championshipService.deleteChampionship(championship.id);
      loadChampionships();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete championship');
    }
  };

  const handleEdit = (championship: Championship) => {
    setEditingChampionship(championship);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading championships...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0 }}>Championships</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingChampionship(null);
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
          {showForm ? 'Cancel' : '+ New Championship'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            border: '1px solid #ef5350',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

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
          <h2 style={{ marginTop: 0 }}>Create New Championship</h2>
          <ChampionshipForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {editingChampionship && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff8e1',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Edit Championship: {editingChampionship.name}</h2>
          <ChampionshipForm
            championship={editingChampionship}
            onSubmit={handleUpdate}
            onCancel={() => setEditingChampionship(null)}
          />
        </div>
      )}

      <div
        style={{
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <ChampionshipList
          championships={championships}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
