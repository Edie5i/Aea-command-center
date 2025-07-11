'use server';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { chatWithBot } from '@/ai/flows/chatbot-flow';

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

const chatsCollection = collection(db, 'whatsappChats');

/**
 * Handles the webhook verification GET request from Meta.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Webhook verification failed.');
    return new NextResponse(null, { status: 403 });
  }
}

/**
 * Handles incoming WhatsApp messages via POST request from Meta.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  // It's crucial to respond 200 OK quickly to avoid re-delivery.
  // We process the message asynchronously after responding.
  processWhatsappMessage(body).catch(error => {
    console.error("Error processing WhatsApp message:", error);
  });

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}


async function processWhatsappMessage(body: any) {
    if (body.object !== 'whatsapp_business_account') {
        console.log('Not a WhatsApp Business Account event.');
        return;
    }

    for (const entry of body.entry) {
        for (const change of entry.changes) {
            if (change.field === 'messages' && change.value.messages) {
                const messageData = change.value.messages[0];
                const from = messageData.from; // Sender's phone number
                const messageType = messageData.type; // 'text', 'image', etc.

                // 1. Save incoming message to Firestore
                await addDoc(chatsCollection, {
                    from: from,
                    type: messageType,
                    messageId: messageData.id,
                    timestamp: serverTimestamp(),
                    direction: 'inbound',
                    status: 'received',
                    body: messageType === 'text' ? messageData.text.body : messageData,
                }).catch(error => console.error("Error saving inbound message to Firestore:", error));

                let replyText = '';

                // 2. Process message with Genkit AI if it's a text message
                if (messageType === 'text') {
                    const textMessage = messageData.text.body;
                    console.log(`Message from ${from}: "${textMessage}"`);

                    const aiResult = await chatWithBot({ message: textMessage });

                    if (aiResult.response) {
                        replyText = aiResult.response;
                    } else {
                        replyText = 'Lo siento, no pude procesar tu solicitud en este momento. Inténtalo de nuevo más tarde.';
                        console.error("AI did not return a response.", aiResult);
                    }
                } else {
                    // 3. Handle non-text messages with a fallback
                    replyText = 'Gracias por tu mensaje. Actualmente, nuestro asistente solo puede procesar mensajes de texto. Por favor, describe tu consulta.';
                }

                // 4. Send the reply via WhatsApp API
                await sendWhatsappMessage(from, replyText);
            } else {
                console.log("Received a non-message event:", change);
            }
        }
    }
}

async function sendWhatsappMessage(to: string, text: string) {
    try {
        const response = await axios.post(WHATSAPP_API_URL, {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: {
                body: text
            }
        }, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        // 5. Save outgoing message to Firestore
        await addDoc(chatsCollection, {
            from: WHATSAPP_PHONE_NUMBER_ID,
            to: to,
            type: 'text',
            timestamp: serverTimestamp(),
            direction: 'outbound',
            status: 'sent',
            body: text,
            isAutomated: true
        }).catch(error => console.error("Error saving outbound message to Firestore:", error));

        console.log('Reply sent successfully:', response.data.messages[0].id);

    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
    }
}
