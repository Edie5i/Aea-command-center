
'use server';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { chatWithBot } from '@/ai/flows/chatbot-flow';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const chatsCollection = collection(db, 'whatsappChats');

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

  // It's crucial to respond 200 OK quickly to avoid re-delivery.
  // We process the message asynchronously after responding.
  
  // Read environment variables here to pass them down
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
      console.error("WhatsApp environment variables (ACCESS_TOKEN or PHONE_NUMBER_ID) are missing!");
      // We still return 200 OK to Meta to prevent webhook disabling.
      return new NextResponse('EVENT_RECEIVED_BUT_CONFIGURATION_ERROR', { status: 200 });
  }

  processWhatsappMessage(body, accessToken, phoneNumberId).catch(error => {
    console.error("Error processing WhatsApp message asynchronously:", error);
  });

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}


async function processWhatsappMessage(body: any, accessToken: string, phoneNumberId: string) {
    if (body.object !== 'whatsapp_business_account') {
        console.log('Not a WhatsApp Business Account event.');
        return;
    }

    if (!body.entry || !body.entry[0].changes) {
        console.log('No valid entry or changes in webhook body.');
        return;
    }

    for (const entry of body.entry) {
        for (const change of entry.changes) {
            if (change.field === 'messages' && change.value.messages) {
                const messageData = change.value.messages[0];
                const from = messageData.from; // Sender's phone number
                const messageType = messageData.type;

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
                    // 3. Handle non-text messages with a fallback
                    replyText = 'Gracias por tu mensaje. Actualmente, nuestro asistente solo puede procesar mensajes de texto. Por favor, describe tu consulta.';
                }

                // 4. Send the reply via WhatsApp API
                if (replyText) {
                    await sendWhatsappMessage(from, replyText, accessToken, phoneNumberId);
                }
            } else {
                // Log other types of events for debugging (e.g., delivery receipts)
                console.log("Received a non-message event:", change.field, change.value);
            }
        }
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

        // 5. Save outgoing message to Firestore
        await addDoc(chatsCollection, {
            from: phoneNumberId,
            to: to,
            type: 'text',
            timestamp: serverTimestamp(),
            direction: 'outbound',
            status: 'sent',
            body: text,
            isAutomated: true,
            outboundMessageId: messageId || 'N/A'
        }).catch(error => console.error("Error saving outbound message to Firestore:", error));

    } catch (error: any) {
        console.error('Error sending WhatsApp message:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}
