import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChampionshipDetail } from '../../components/championships/ChampionshipDetail';
import { ChampionshipForm } from '../../components/championships/ChampionshipForm';
import * as championshipService from '../../services/championship.service';
import type { Championship } from '../../services/championship.service';

/**
 * ChampionshipDetailPage Component
 * From 004-simracing-series feature
 * Detail view for a single championship
 */

export function ChampionshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (id) {
      loadChampionship(Number.parseInt(id, 10));
    }
  }, [id]);

  const loadChampionship = async (championshipId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await championshipService.getChampionshipById(championshipId);
      setChampionship(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load championship');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!championship) return;
    try {
      await championshipService.updateChampionship(championship.id, data);
      setEditing(false);
      loadChampionship(championship.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update championship');
    }
  };

  const handleDelete = async () => {
    if (!championship) return;
    try {
      await championshipService.deleteChampionship(championship.id);
      navigate('/championships');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete championship');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading championship...</div>
      </div>
    );
  }

  if (error || !championship) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            padding: '1rem',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            border: '1px solid #ef5350',
          }}
        >
          {error || 'Championship not found'}
        </div>
        <button
          onClick={() => navigate('/championships')}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Back to Championships
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {editing ? (
        <div
          style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff8e1',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Edit Championship</h2>
          <ChampionshipForm
            championship={championship}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <ChampionshipDetail
            championship={championship}
            onEdit={() => setEditing(true)}
            onDelete={handleDelete}
            onBack={() => navigate('/championships')}
          />
        </div>
      )}
    </div>
  );
}
