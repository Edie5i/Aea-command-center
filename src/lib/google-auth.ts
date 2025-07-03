'use server';

import { google } from 'googleapis';
import { cookies } from 'next/headers';

export const OAUTH2_CALLBACK_PATH = '/api/auth/google/callback';
export const GOOGLE_AUTH_TOKEN_COOKIE_KEY = 'google-auth-token';

export function getOAuth2Client() {
  const redirectURI = new URL(OAUTH2_CALLBACK_PATH, process.env.NEXT_PUBLIC_APP_URL!).toString();
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURI
  );
}

export async function getAuthenticatedCalendarClient() {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get(GOOGLE_AUTH_TOKEN_COOKIE_KEY);

  if (!tokenCookie) {
    return null;
  }

  try {
    const tokens = JSON.parse(tokenCookie.value);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // If the access token is expired, the library will automatically use the refresh token.
    // We can make a simple API call to test/refresh the credentials if needed.
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.calendarList.get({ calendarId: 'primary' });

    return calendar;
  } catch (error) {
    console.error('Error getting authenticated calendar client:', error);
    // If tokens are invalid (e.g., revoked), clear the cookie to allow re-authentication.
    cookieStore.delete(GOOGLE_AUTH_TOKEN_COOKIE_KEY);
    return null;
  }
}
