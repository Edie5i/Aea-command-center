import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, GOOGLE_AUTH_TOKEN_COOKIE_KEY } from '@/lib/google-auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // The refresh_token is only sent on the first authorization.
    // We need to make sure we store it.
    if (tokens) {
       cookies().set(GOOGLE_AUTH_TOKEN_COOKIE_KEY, JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
       });
    }

    const redirectUrl = new URL('/agenda', process.env.NEXT_PUBLIC_APP_URL);
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error exchanging code for tokens', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
  }
}
