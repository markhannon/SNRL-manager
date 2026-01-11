import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ResultEntryForm } from '../../components/results/ResultEntryForm';
import { ResultsList } from '../../components/results/ResultsList';
import * as resultService from '../../services/result.service';
import * as eventService from '../../services/event.service';
import type { Event } from '../../services/event.service';
import type { EventResult, EnterResultInput } from '../../services/result.service';

/**
 * EnterResultsPage Component
 * From 004-simracing-series feature - User Story 4
 * Page for entering and managing race results
 */

export function EnterResultsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Mock driver emails - in real app, these would come from championship registrations
  const mockDriverEmails = [
    'driver1@example.com',
    'driver2@example.com',
    'driver3@example.com',
    'driver4@example.com',
    'driver5@example.com',
  ];

  useEffect(() => {
    if (eventId) {
      loadData(Number.parseInt(eventId, 10));
    }
  }, [eventId]);

  const loadData = async (evId: number) => {
    try {
      setLoading(true);
      setError(null);
      const [eventData, resultsData] = await Promise.all([
        eventService.getEventById(evId),
        resultService.getResultsByEvent(evId).catch(() => []),
      ]);
      setEvent(eventData);
      setResults(resultsData);
      setShowForm(resultsData.length === 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterResults = async (resultInputs: EnterResultInput[]) => {
    if (!eventId) return;
    try {
      const entered = await resultService.enterResults(Number.parseInt(eventId, 10), {
        results: resultInputs,
      });
      setResults(entered);
      setShowForm(false);
    } catch (err) {
      throw err;
    }
  };

  const handlePublish = async () => {
    if (!eventId) return;
    if (!window.confirm('Are you sure you want to publish these results? This will update championship standings.')) {
      return;
    }

    try {
      const published = await resultService.publishResults(Number.parseInt(eventId, 10));
      setResults(published);
      alert('Results published successfully! Championship standings have been updated.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish results');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!event) {
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
          Event not found
        </div>
      </div>
    );
  }

  const isDraft = results.length > 0 && results[0].isDraft;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: 'white',
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        ← Back
      </button>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0' }}>{event.name}</h1>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {event.track} | {new Date(event.eventDate).toLocaleDateString()}
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
        <h2 style={{ margin: 0 }}>Race Results</h2>
        {results.length === 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
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
            Enter Results
          </button>
        )}
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

      {showForm && results.length === 0 && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#f9f9f9',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Enter Race Results</h3>
          <ResultEntryForm
            driverEmails={mockDriverEmails}
            onSubmit={handleEnterResults}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {results.length > 0 && (
        <div
          style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
          }}
        >
          <ResultsList results={results} isDraft={isDraft} onPublish={isDraft ? handlePublish : undefined} />
        </div>
      )}
    </div>
  );
}
