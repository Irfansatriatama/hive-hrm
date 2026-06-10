/**
 * Core API Client Wrapper for HIVE HRM.
 * Communicates with the NestJS backend on http://localhost:4000 (or NEXT_PUBLIC_API_URL).
 * Passes credentials (cookies) automatically for session validation.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchAPI<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Critical: shares Better Auth session cookies with NestJS
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = 'API Request failed';
    try {
      const parsed = JSON.parse(text);
      errorMsg = parsed.message || errorMsg;
    } catch {
      errorMsg = text || errorMsg;
    }
    throw new Error(errorMsg);
  }

  // Handle empty or 204 response
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
