export const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const API_VERSION = '/api/v1';

export const BACKEND_API_URL = `${BACKEND_URL}${API_VERSION}`;

export function getBackendUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${BACKEND_API_URL}/${cleanEndpoint}`;
}
