import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

export const { signIn, signOut, useSession } = authClient;

/**
 * Server-side helper to retrieve the current session in Next.js Middleware or Server Components.
 */
export async function getSession(requestHeaders?: Headers) {
  try {
    const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const headers = new Headers();
    if (requestHeaders) {
      requestHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const response = await fetch(`${apiURL}/auth/get-session`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching session on server side:', error);
    return null;
  }
}
