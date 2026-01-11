import { useState, useEffect } from 'react';
import * as seriesService from '../services/series.service';
import type { Series, SeriesListResponse } from '../services/series.service';

/**
 * T029: React hook for managing series state and fetching
 */

export function useSeries(params?: {
  status?: 'active' | 'deleted';
  created_by?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<SeriesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await seriesService.getSeries(params);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, [JSON.stringify(params)]);

  return {
    series: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.total_pages || 0,
    loading,
    error,
    refetch: fetchSeries,
  };
}

export function useSeriesById(id: number | null) {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await seriesService.getSeriesById(id);
        setSeries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch series');
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [id]);

  return { series, loading, error };
}
