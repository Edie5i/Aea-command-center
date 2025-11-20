
'use server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles the webhook verification GET request from Meta.
 */
export async function GET(request: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error("WHATSAPP_VERIFY_TOKEN is not set in environment variables.");
    return new NextResponse("Configuration error: Verify token not set.", { status: 500 });
  }
  
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK_VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Webhook verification failed. Make sure WHATSAPP_VERIFY_TOKEN is set correctly.');
    return new NextResponse(null, { status: 403 });
  }
}

/**
 * Handles incoming WhatsApp messages via POST request from Meta.
 * This endpoint now acknowledges receipt but does not process messages.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log('Incoming webhook body:', JSON.stringify(body, null, 2));

  // Acknowledge the event immediately to prevent Meta from resending.
  // The chatbot logic has been removed for stability.
  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
