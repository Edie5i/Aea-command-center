
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
 * Sends a reply message back to the user via the WhatsApp API.
 */
async function sendWhatsappMessage(to: string, text: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error("WhatsApp environment variables (ACCESS_TOKEN, PHONE_NUMBER_ID) are not set.");
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: to,
    text: { body: text },
  });

  try {
    const response = await fetch(url, { method: 'POST', headers, body });
    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error sending WhatsApp message:', JSON.stringify(errorData, null, 2));
    } else {
        console.log('Successfully sent WhatsApp reply.');
    }
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
  }
}

async function handleMessage(messageData: any) {
    // Ignore status updates and non-text messages
    if (messageData.type !== 'text') {
        console.log('Ignoring non-text message.');
        return;
    }

    const userPhoneNumber = messageData.from;
    const replyText = "Gracias por contactar a Auto Escuela Americana. Un asesor te responderá a la brevedad.";
    
    await sendWhatsappMessage(userPhoneNumber, replyText);
}


/**
 * Handles incoming WhatsApp messages via POST request from Meta.
 * This function now acknowledges the request immediately and processes the message asynchronously.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Incoming webhook body:', JSON.stringify(body, null, 2));

    // Check if it's a valid WhatsApp message notification
    if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const messageData = body.entry[0].changes[0].value.messages[0];
      
      // Process the message asynchronously without awaiting
      handleMessage(messageData).catch(error => {
        console.error("Error in detached message handling:", error);
      });

    }
  } catch (error) {
      console.error("Error parsing webhook body:", error);
  }

  // Acknowledge the event immediately to prevent Meta from resending.
  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
