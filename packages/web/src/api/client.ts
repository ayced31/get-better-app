// ─── API Client ──────────────────────────────────────────────────
// Fetch wrapper for all API requests with auth & error handling

import type { ApiResponse } from '@get-better/shared';
import { useAuthStore } from '../stores/auth';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError('Request failed', response.status);
    }
    return {} as T;
  }

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    const errorMessage = !data.success ? data.error : 'Request failed';
    const details = !data.success ? data.details : undefined;

    // If unauthorized, clear auth state
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    throw new ApiError(errorMessage, response.status, details);
  }

  return data.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
