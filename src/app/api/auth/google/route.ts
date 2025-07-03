
import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-auth';

export async function GET() {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Important to get a refresh token
    prompt: 'consent', // Force consent screen to ensure refresh token is sent
    scope: scopes,
  });

  return NextResponse.redirect(url);
}
