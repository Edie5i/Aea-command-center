
'use server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * The WhatsApp webhook integration has been disabled because the setup was incomplete
 * and causing errors. These handlers return a success status to prevent Meta from
 * logging errors or marking the endpoint as invalid, but no action is taken.
 */

/**
 * Handles the webhook verification GET request from Meta.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Still respond to the verification challenge to keep Meta's systems happy.
  if (mode === 'subscribe' && token && challenge) {
    console.log('Responding to webhook verification challenge (integration is disabled).');
    return new NextResponse(challenge, { status: 200 });
  }
  
  console.log('Received GET request to disabled WhatsApp webhook.');
  return new NextResponse('Webhook endpoint is active, but integration logic is disabled.', { status: 200 });
}

/**
 * Handles incoming WhatsApp messages via POST request from Meta.
 */
export async function POST(request: NextRequest) {
  console.log('Received a POST request to the disabled WhatsApp webhook. Acknowledging and ignoring.');
  // Acknowledge the event immediately to prevent Meta from resending.
  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
