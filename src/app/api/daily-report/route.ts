import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firestore';

const NOTIF_PHONE = '525563206338'; // Luz

export async function GET(req: NextRequest) {
  // Verificar token para Cloud Scheduler
  const authHeader = req.headers.get('authorization') || '';
  const expectedToken = process.env.CLOUD_SCHEDULER_TOKEN || 'secret-token';

  if (!authHeader.includes(expectedToken)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Obtener todas las conversaciones del día
    const conversationsRef = db.collection('conversations');
    const snapshot = await conversationsRef
      .where('lastActivityAt', '>=', today)
      .where('lastActivityAt', '<', tomorrow)
      .get();

    // Compilar estadísticas
    let totalLeads = 0;
    let calificados = 0;
    let ganados = 0; // ventas cerradas
    const leads: string[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      totalLeads++;

      if (data.chatState === 'cerrado') ganados++;

      const nombre = data.contactName || `+${doc.id}`;
      const estado = data.chatState || 'desconocido';
      const curso = data.courseInterest || '—';

      if (estado === 'cerrado') {
        leads.push(`✅ ${nombre} (${curso})`);
      } else if (data.leadCalificadoNotificado) {
        calificados++;
        leads.push(`📋 ${nombre} (${curso})`);
      }
    });

    // Formatear reporte
    const timestamp = today.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const reporteLineas = [
      `📊 *REPORTE DIARIO — ${timestamp.toUpperCase()}*`,
      '',
      `👥 Leads del día: *${totalLeads}*`,
      `📋 Calificados: *${calificados}*`,
      `🎉 Ventas cerradas: *${ganados}*`,
    ];

    if (leads.length > 0) {
      reporteLineas.push('');
      reporteLineas.push('*Movimiento del día:*');
      reporteLineas.push(...leads.slice(0, 10));
      if (leads.length > 10) {
        reporteLineas.push(`_...y ${leads.length - 10} más_`);
      }
    }

    const reporte = reporteLineas.join('\n');

    // Enviar a Luz
    await sendMessage(NOTIF_PHONE, reporte);

    return NextResponse.json({ success: true, leads: totalLeads, sales: ganados });
  } catch (error) {
    console.error('[DAILY-REPORT] Error:', error);
    // Notificar error
    await sendMessage(NOTIF_PHONE, `⚠️ *Error en reporte diario*\n\n${String(error).slice(0, 200)}`).catch(() => {});
    return new NextResponse('Error', { status: 500 });
  }
}

async function sendMessage(to: string, text: string): Promise<void> {
  const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!PHONE_ID || !WA_TOKEN) {
    throw new Error('Missing WhatsApp credentials');
  }

  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    throw new Error(`WhatsApp API error: ${res.status}`);
  }
}
