
'use server';
import { NextRequest, NextResponse } from 'next/server';
import { chatWithBot } from '@/ai/flows/chatbot-flow';
import axios from 'axios';

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
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log('Incoming webhook body:', JSON.stringify(body, null, 2));

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.error("WhatsApp environment variables (ACCESS_TOKEN or PHONE_NUMBER_ID) are missing!");
    return new NextResponse('Configuration Error', { status: 500 });
  }

  try {
    await processWhatsappMessage(body, accessToken, phoneNumberId);
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    // Still return 200 to prevent Meta from disabling the webhook
    return new NextResponse('EVENT_RECEIVED_BUT_PROCESSING_FAILED', { status: 200 });
  }
}

async function processWhatsappMessage(body: any, accessToken: string, phoneNumberId: string) {
    if (body.object !== 'whatsapp_business_account') {
        console.log('Not a WhatsApp Business Account event.');
        return;
    }

    if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
        console.log('No valid message entry in webhook body.');
        return;
    }
    
    const messageData = body.entry[0].changes[0].value.messages[0];
    const from = messageData.from; // Sender's phone number
    const messageType = messageData.type;

    let replyText = '';

    if (messageType === 'text') {
        const textMessage = messageData.text.body;
        console.log(`Processing message from ${from}: "${textMessage}"`);

        try {
            const aiResult = await chatWithBot({ message: textMessage });
            if (aiResult && aiResult.response) {
                replyText = aiResult.response;
            } else {
                replyText = 'Lo siento, no pude procesar tu solicitud en este momento. Un asesor se pondrá en contacto contigo.';
                console.error("AI did not return a valid response object.", aiResult);
            }
        } catch (aiError) {
            console.error("Error calling Genkit AI flow:", aiError);
            replyText = 'Tuvimos un problema con nuestro asistente de IA. Un humano te atenderá pronto.';
        }

    } else {
        replyText = 'Gracias por tu mensaje. Actualmente, nuestro asistente solo puede procesar mensajes de texto. Por favor, describe tu consulta.';
    }

    if (replyText) {
        await sendWhatsappMessage(from, replyText, accessToken, phoneNumberId);
    }
}

async function sendWhatsappMessage(to: string, text: string, accessToken: string, phoneNumberId: string) {
    const whatsappApiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    
    try {
        const response = await axios.post(whatsappApiUrl, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: text
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const messageId = response.data?.messages?.[0]?.id;
        console.log(`Reply sent successfully to ${to}. Message ID: ${messageId}`);

    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}
