/**
 * Frontend Series Service
 * T028: API calls for series management
 */

export interface Series {
  id: number;
  title: string;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  status: 'active' | 'deleted';
  content_count: number;
}

export interface CreateSeriesRequest {
  title: string;
  description?: string;
}

export interface UpdateSeriesRequest {
  title?: string;
  description?: string | null;
}

export interface SeriesListResponse {
  data: Series[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const API_BASE = '/api';

/**
 * Create a new series
 */
export async function createSeries(data: CreateSeriesRequest): Promise<Series> {
  const response = await fetch(`${API_BASE}/series`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create series');
  }

  return response.json();
}

/**
 * Get series list with pagination and filters
 */
export async function getSeries(params: {
  status?: 'active' | 'deleted';
  created_by?: number;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<SeriesListResponse> {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append('status', params.status);
  if (params.created_by) queryParams.append('created_by', params.created_by.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE}/series?${queryParams}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch series');
  }

  return response.json();
}

/**
 * Get single series by ID
 */
export async function getSeriesById(id: number): Promise<Series> {
  const response = await fetch(`${API_BASE}/series/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch series');
  }

  return response.json();
}

/**
 * Update series
 */
export async function updateSeries(id: number, data: UpdateSeriesRequest): Promise<Series> {
  const response = await fetch(`${API_BASE}/series/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update series');
  }

  return response.json();
}

/**
 * Delete series (soft-delete)
 */
export async function deleteSeries(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/series/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete series');
  }
}
