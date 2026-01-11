import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EventList } from '../../components/events/EventList';
import { EventForm } from '../../components/events/EventForm';
import * as eventService from '../../services/event.service';
import * as championshipService from '../../services/championship.service';
import type { Event } from '../../services/event.service';
import type { Championship } from '../../services/championship.service';

/**
 * EventsPage Component
 * From 004-simracing-series feature - User Story 2
 * Main page for event management within a championship
 */

export function EventsPage() {
  const { championshipId } = useParams<{ championshipId: string }>();
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (championshipId) {
      loadData(Number.parseInt(championshipId, 10));
    }
  }, [championshipId]);

  const loadData = async (champId: number) => {
    try {
      setLoading(true);
      setError(null);
      const [champData, eventsData] = await Promise.all([
        championshipService.getChampionshipById(champId),
        eventService.getEventsByChampionship(champId),
      ]);
      setChampionship(champData);
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    if (!championshipId) return;
    await eventService.createEvent(Number.parseInt(championshipId, 10), data);
    setShowForm(false);
    loadData(Number.parseInt(championshipId, 10));
  };

  const handleUpdate = async (data: any) => {
    if (!editingEvent) return;
    await eventService.updateEvent(editingEvent.id, data);
    setEditingEvent(null);
    if (championshipId) {
      loadData(Number.parseInt(championshipId, 10));
    }
  };

  const handleDelete = async (event: Event) => {
    try {
      await eventService.deleteEvent(event.id);
      if (championshipId) {
        loadData(Number.parseInt(championshipId, 10));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading events...</div>
      </div>
    );
  }

  if (!championship) {
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
          Championship not found
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>{championship.name}</h1>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {championship.simulator} | {new Date(championship.seasonStart).toLocaleDateString()} -{' '}
          {new Date(championship.seasonEnd).toLocaleDateString()}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ margin: 0 }}>Events Calendar</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingEvent(null);
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
          {showForm ? 'Cancel' : '+ New Event'}
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
          <h3 style={{ marginTop: 0 }}>Create New Event</h3>
          <EventForm
            championshipSeasonStart={championship.seasonStart}
            championshipSeasonEnd={championship.seasonEnd}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingEvent && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff8e1',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Edit Event: {editingEvent.name}</h3>
          <EventForm
            event={editingEvent}
            championshipSeasonStart={championship.seasonStart}
            championshipSeasonEnd={championship.seasonEnd}
            onSubmit={handleUpdate}
            onCancel={() => setEditingEvent(null)}
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
        <EventList events={events} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}
