
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import type { OAuth2Client } from 'google-auth-library';

export const OAUTH2_CALLBACK_PATH = '/api/auth/google/callback';
export const GOOGLE_AUTH_TOKEN_COOKIE_KEY = 'google-auth-token';

export function getOAuth2Client(): OAuth2Client {
  const redirectURI = new URL(OAUTH2_CALLBACK_PATH, process.env.NEXT_PUBLIC_APP_URL!).toString();
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURI
  );
}

export async function getAuthenticatedCalendarClient(): Promise<OAuth2Client | null> {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get(GOOGLE_AUTH_TOKEN_COOKIE_KEY);

  if (!tokenCookie || !tokenCookie.value) {
    console.log('Google Auth token cookie not found.');
    return null;
  }

  try {
    const tokens = JSON.parse(tokenCookie.value);
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    // Check if the access token is expired. The library will refresh it automatically
    // if a refresh token is available. We can force this check by getting the access token.
    await oauth2Client.getAccessToken();

    return oauth2Client;
  } catch (error) {
    console.error('Failed to get authenticated Google client:', error);
    // If tokens are invalid (e.g., revoked), clear the cookie to allow re-authentication.
    cookieStore.delete(GOOGLE_AUTH_TOKEN_COOKIE_KEY);
    return null;
  }
}
