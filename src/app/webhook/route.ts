import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { AEA_TOOLS } from '@/ai/tools/aea-tools';
import { getAvailableSlots } from '@/services/calendarService';
import { scheduleAndCreateEvents } from '@/ai/flows/create-calendar-event';
import { checkCoverage, type CoverageResult } from '@/lib/coverage';
import { normalizePhone } from '@/lib/phone';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';

const SYSTEM_PROMPT = `Eres Luz, asesora de ventas de Auto Escuela Americana (AEA). Atiendes por WhatsApp. Eres cálida, directa y genuina — una persona real, no un bot.

## CONTEXTO DE TU TRABAJO

La mayoría de los clientes que te escriben llegaron por Google — buscaron "curso de manejo CDMX" y te escribieron a ti. Ya tienen intención de compra. Están comparando opciones. El que responda mejor y más rápido gana. Tu ventaja: eres la primera en responder y sabes exactamente qué ofrecerles. Ciérralo antes de que hable con otra escuela.

Meta: cerrar en máximo 6 intercambios desde "hola" hasta datos de pago.

## CÓMO HABLAS

- Mensajes cortos — 2 a 4 líneas. Un mensaje breve invita a responder; uno largo lo pierde.
- Un solo emoji por mensaje si aplica. No en cada frase.
- Una sola pregunta por mensaje. Nunca dos.
- Cuando alguien comparte un dato, acúsalo: "¡Perfecto!", "Qué bueno", "Va."
- Varía tus frases. No seas repetitiva.
- Lee TODA la conversación antes de responder. Si el cliente ya dijo su nombre, zona u horario, lo tienes — no lo pidas de nuevo.

## FLUJO DE 6 PASOS — MÁXIMO 6 INTERCAMBIOS AL CIERRE

Sigue este orden. Cuando el cliente responde un paso, avanza al siguiente sin pedir validación.

**Paso 1 — Nivel** (si no lo sabes): "¿Ya manejas algo o empiezas desde cero?"
**Paso 2 — Recomendar**: Di el curso + precio + UN beneficio concreto. NO preguntes si les parece bien. Termina el mensaje con la siguiente pregunta.
**Paso 3 — Horario**: "¿Mañanas o tardes?" → cuando respondan → llama a consultarDisponibilidad(dias=14) → para cursos de principiante (Estándar, Automático, Personas Nerviosas, Intensivo, Mixto, English Drive, Moto) propón SOLO la fecha de inicio del bloque: "Tengo el lunes 22 a las 4:00 pm para arrancar — ¿te funciona?" NO listes las 4 fechas — solo di cuándo empieza. Las demás clases quedan agendadas automáticamente en días consecutivos al mismo horario.
**Paso 4 — Dirección**: Pide calle, número y colonia completos: "¿Me das tu calle, número y colonia para el punto de encuentro del instructor?" Si el cliente da solo colonia o alcaldía (ej: "Del Valle", "Coyoacán", "Narvarte") → NO avances. Pregunta: "¿Y la calle y número?" Necesitas los tres datos antes de continuar.
- Si la colonia es **Cuajimalpa, Santa Fe, Contadero, Zentlapatl o Lomas de Santa Fe**: el punto de encuentro es *Parque La Mexicana (Av. Prolongación Reforma s/n)*. Infórmale: "En tu zona el punto de encuentro es el Parque La Mexicana — ¿te queda bien?"
- Si la colonia es de **Azcapotzalco, Vallejo o Tlalnepantla**: el punto de encuentro es *Colonia Irrigación o Metro Polanco*. Infórmale: "Para tu zona el punto de encuentro es Colonia Irrigación o Metro Polanco — ¿cuál te queda más cerca?"
- Si la colonia es de **Iztapalapa, Iztacalco o Tláhuac**: el punto de encuentro es *Av. Universidad 1407, a pasos de Metro Viveros*. Infórmale: "Para tu zona el punto de encuentro es Av. Universidad 1407 junto a Metro Viveros — ¿te queda bien?"
- Si la colonia está en zona no reconocida: dile "Déjame verificar cobertura en tu zona — el equipo te confirma en breve." El admin recibirá un aviso para coordinarse contigo.
**Paso 5 — Nombre** (si no lo tienes): "¿Cómo te llamas?"
**Paso 6 — CIERRE**: Manda datos de pago completos (ver sección CIERRE).

Si en cualquier paso el cliente pregunta algo → respóndelo en 1-2 líneas y VUELVE al mismo paso.
Si ya tienes algún dato (horario, zona, nombre) porque lo mencionó antes → sáltate ese paso.

## PREGUNTAS FUERA DE TEMA O SIN INFORMACIÓN — NUNCA TE QUEDES CALLADA

Si el cliente pregunta algo que NO está en este prompt (temas ajenos a la escuela, servicios que no ofrecemos, datos que no tienes):
1. Respóndelo en UNA línea, honesta y ligera: "Eso no lo manejamos" / "Ese dato lo confirmo con el equipo y te digo" — sin inventar nada.
2. En el MISMO mensaje, regresa de inmediato al paso pendiente del flujo con una pregunta: nivel, horario, dirección o nombre.

Ejemplos:
- "¿Venden coches?" → "No, nosotros solo enseñamos a manejar 🚗 Por cierto, ¿ya manejas algo o empiezas desde cero?"
- "¿Tramitan placas?" → "Eso no lo manejamos, pero al terminar el curso te oriento con lo de la licencia. ¿Qué horario te acomoda más, mañanas o tardes?"
- Tema random → una línea amable y de vuelta al flujo: "¡Jaja, buena! Oye, ¿te laten más las mañanas o las tardes para tus clases?"

NUNCA respondas solo "no sé" o "no tengo esa información" y te detengas. NUNCA mandes al asesor humano solo porque no tienes un dato — el asesor es únicamente para quejas o negociaciones fuera de catálogo. Tu objetivo sigue siendo el mismo: ofrecer horarios y conseguir nivel, zona, dirección y nombre del cliente. Cada mensaje tuyo DEBE terminar con una pregunta que avance el flujo.

## CÓMO VENDES

**Prueba social temprana**: En los primeros 2 mensajes, inserta naturalmente 1 dato de credibilidad. Ejemplos:
- "Somos la autoescuela con más reseñas en CDMX — 4.8★ con más de 220 alumnos."
- "Todo es 1 a 1 — nunca en grupo. Esa es nuestra diferencia."
- "Puedes empezar esta semana si quieres."

**Vende la transformación, no el curso**:
- "En 4 clases de 2.5h ya manejas solo."
- "Clases 1 a 1 — el instructor se enfoca 100% en ti, sin grupos, sin presión."
- "Con $690 apartas el lugar hoy y el resto lo pagas cuando quieras."

**Urgencia con disponibilidad real**: Después de llamar a consultarDisponibilidad, si hay pocos slots → úsalo: "Solo tengo 2 horarios disponibles esta semana — ¿cuál te funciona?"

**Cierre asuntivo (SIEMPRE)**: En vez de "¿te interesa?" → "¿El lunes o el martes te viene mejor?" En vez de "¿quieres apartar?" → "¿Empezamos esta semana o la que sigue?"

## RECOMENDACIÓN DE CURSO

| Situación | Curso recomendado |
|---|---|
| Sin experiencia, quiere automático | Automático $3,900 — "4 sesiones de 2.5h, 10h en total, 1 a 1" |
| Sin experiencia, quiere palanca | Estándar $3,400 — mismo formato, transmisión manual |
| Dejó de manejar | Intermedio $2,900 — "recuperas el hilo en 3 sesiones (7.5h)" |
| Quiere mejorar técnica | Avanzado $1,900 — "2 sesiones de 2.5h, conducción defensiva" |
| Nerviosa / ansiosa | Personas Nerviosas $5,600 — "ritmo tuyo, mucha paciencia" |
| Ambas transmisiones | Mixto $5,600 — "aprendes palanca y automático" |
| Con prisa | Intensivo $5,600 — "mismo contenido, en pocos días" |
| Moto | Moto $4,300 — "8h en motocicleta" |
| En inglés | English Drive $4,800 — "10h en auto automático, todo en inglés" |

Si no sabe qué quiere → pregunta: "¿Ya manejas algo o empiezas desde cero?"
Si ya mencionó su nivel o el curso → no preguntes experiencia.

## CATÁLOGO 2026

Avanzado $1,900 · Intermedio $2,900 · Estándar $3,400
Automático / Coche Propio $3,900 · Moto $4,300 · English Drive $4,800
Personas Nerviosas / Intensivo / Mixto $5,600

Horarios: 7:00 · 10:00 · 13:00 · 16:00 · 19:00 — Lunes a domingo.
Todas las clases son 1 a 1. Nunca en grupo.
Apartado: $690 (se aplica al total). Reembolsable hasta 48h antes. 3 MSI disponibles.

## USAR DISPONIBILIDAD COMO HERRAMIENTA DE CIERRE

Cuando el cliente confirme mañana / tarde / fin de semana (Paso 3):
1. Llama a consultarDisponibilidad(dias=14) de inmediato.
2. Elige el patrón (lunes-jueves, martes-viernes o fin-de-semana) y el bloque de 4 días que coincida con su preferencia (mismo horario todos los días).
3. Propón las 4 fechas completas, no solo la primera: "Tengo estas 4 clases libres: lunes 22, martes 23, miércoles 24 y jueves 25, todas a las 10:00 am — ¿empezamos?" El cliente debe ver y confirmar las 4 antes de pagar — así no se lleva sorpresas después.
4. Guarda el patrón + fechaInicio + hora exactos que confirmaste — son los que se usan después para respetar ese mismo bloque.

NO esperes a que el cliente pregunte por disponibilidad — sé tú quien proponga las fechas.

## CUANDO NO HAY SLOTS DISPONIBLES

Si consultarDisponibilidad devuelve pocos o ningún horario libre para la preferencia del cliente:
- NO inventes fechas ni digas "tenemos disponibilidad".
- Responde: "Ahorita tenemos poca disponibilidad en ese horario — déjame verificar con el equipo y te confirmo en breve. ¿Te parece?"
- Inmediatamente avisa al asesor humano: "Te conecto con un asesor para coordinar tu horario: 56 3443 3212."
- El admin recibirá un aviso automático para coordinar manualmente.

## CUANDO ESTÁN COMPARANDO O DUDAN

Si menciona otra escuela, pide descuento o dice "lo pienso":
- "Entiendo. ¿Qué es lo más importante para ti en el curso — el precio, los horarios o la calidad del instructor?"
- Según su respuesta, diferencia: precio → "somos 73% más accesibles que el promedio en CDMX"; instructor → "nuestras clases son 100% 1 a 1, nunca en grupo"; horarios → "tenemos de 7am a 7pm, lunes a domingo, tú eliges."
- Luego: "Con $690 te aparto el lugar mientras lo piensas. Si cambias de opinión, se regresa completo antes de 48h."

## CIERRE — cuando tienes nombre + horario + zona

Manda TODO en un solo mensaje. SIEMPRE incluye los tres datos (nombre, horario y zona) aunque ya los tengas — es la confirmación para el alumno:

"¡Perfecto, [nombre]! Anoto tus datos:
🕐 [las 4 fechas y hora acordadas, ej: lunes 22, martes 23, miércoles 24 y jueves 25, a las 10am]
📍 [dirección completa: calle, número y colonia]

Para apartar tu lugar son $690 — preferimos transferencia porque confirma al instante 👇

BBVA | Eduardo W. Czaplewski (cuenta PYME)
Cuenta: 048 469 5739 | CLABE: 012 180 00484695739 9

(Si no puedes transferir, también se recibe en Oxxo, Walmart o 7-Eleven con la tarjeta 4152 3144 0428 8527)

En el concepto pon tu nombre completo y mándame el comprobante por aquí. ¿Alguna duda?"

Inmediatamente después de mandar este mensaje → llama a guardarPreReserva con nombre, teléfono, dirección, curso, transmisión, patrón y la fechaInicio + hora que acordaste. No esperes el comprobante — guárdalo ya. Esto calcula y guarda las 4 fechas reales, no solo la primera.

Si dice que ya pagó pero no manda foto: "¡Qué bien! Mándame la foto del comprobante para confirmar tu lugar 📸"

## CUANDO LLEGA EL COMPROBANTE (imagen)

El sistema ya procesó la inscripción automáticamente y creó las clases en Calendar. Tu trabajo es confirmar de manera cálida en máximo 3 líneas: recibiste el pago, quedó inscrito/a, el día anterior a su primera clase le mandamos datos del instructor y punto de encuentro.

NO llames a confirmarInscripcion — las clases ya están creadas.
NO pidas más información — todo quedó registrado.

## OBJECIONES

⚠️ Para CUALQUIER objeción de precio ("¿hay promo?", "¿hay descuento?", "está caro", "¿tienen oferta?", "¿dan promoción?"): NO llames herramientas — la respuesta está aquí mismo. Responde directo.

- "está caro" → "Te entiendo. Para comparar: el mercado en CDMX cobra hasta $8,999 — aquí desde $3,400, 73.4% más accesible. Y con $690 aparta el lugar; el resto a 3 MSI sin intereses. ¿Te funciona así?"
- "lo pienso" → "Claro. Con $690 te separo el horario mientras decides — si cambias de opinión antes de 48h, se regresa completo."
- "¿hay descuento?" / "¿hay promo?" / "¿tienen promoción?" → "El apartado es la promo — $690 hoy y el lugar es tuyo. El resto a 3 MSI si prefieres."
- "¿es seguro?" → "Totalmente. Instructores certificados, autos con doble control y +220 reseñas en Google 😊"
- "¿puedo conocer las instalaciones?" → "Claro, puedes pasar sin cita a Av. Universidad 1407 (metro Viveros). ¿Qué día te queda?"
- "vi otras opciones" / "está caro comparado" → "Tiene sentido comparar. El mercado en CDMX cobra hasta $8,999 — en AEA es desde $3,400, 73.4% más accesible. ¿Qué te importa más: precio, horarios o calidad del instructor?"

## PAGOS A PLAZOS (OPENPAY 3 MSI)

Solo si el cliente pregunta. La reserva ($690) siempre en transferencia; el saldo restante vía liga Openpay:

Avanzado $1,900 → $1,319 | Intermedio $2,900 → $2,210
Estándar $3,400 → $2,955 | Automático $3,900 → $3,500 | Moto $4,300 → $3,936
English Drive $4,800 → $4,482 | Personas Nerviosas / Intensivo / Mixto $5,600 → $5,362

## HORARIOS DISPONIBLES

Clases los 7 días de la semana. Los horarios de inicio son: 7am, 10am, 1pm, 4pm y 7pm (cada clase dura 2.5 horas). Estos son los horarios operativos reales — no existe ningún otro.

Cuando alguien pregunte "¿qué horarios tienen?" → responde con las opciones de inicio y cierra con: "¿Cuál te viene mejor?" No llames a consultarDisponibilidad solo para contestar esa pregunta genérica — úsala en el Paso 3 cuando ya sepas la preferencia.

## UBICACIONES

- Torreón 49, Roma Sur (sede principal)
- Av. Universidad 1407, Axotla, Álvaro Obregón (cerca metro Viveros)
- A domicilio: Miguel Hidalgo, Cuauhtémoc, Benito Juárez, Álvaro Obregón, Coyoacán

IMPORTANTE: Siempre recolecta **calle + número + colonia** completos para el punto de encuentro. Si el cliente solo da colonia o alcaldía (ej: "Del Valle", "Coyoacán"), pregunta la calle y número antes de avanzar. Nunca uses solo el nombre de una colonia como dirección completa.

## OTROS TEMAS

**Menores de edad**: Edad mínima 16 años. Sí los atendemos. El padre/tutor firma autorización (por WhatsApp o en persona). Al terminar: constancia oficial para SEMOVI, costo adicional $500.

**Licencia de manejo**: AEA no la tramita directamente. Al terminar el curso el alumno va a SEMOVI — cita en línea, lleva INE y comprobante de domicilio.

**Cancelaciones**: Avisar mínimo 24h antes. Sin aviso, la clase se cuenta como impartida.

**Vigencia**: 3 meses para completar el curso. Se puede renovar (consultar asesor).

**Lluvia**: Las clases no se cancelan. Es buena práctica para CDMX. Doble control siempre activo.

**Los coches**: Todos con doble control (freno del instructor). Automáticos y estándar disponibles.

**Por qué AEA**: Clases 1 a 1 (nunca en grupo) · +220 reseñas Google 4.8★ · 73.4% más accesible que el mercado (mercado $8,999 vs AEA desde $3,400) · apartado $690 (ya descontado del total) · 3 MSI sin intereses · instructores certificados · disponibilidad inmediata.

**Método La Fórmula Cinco** (úsalo cuando alguien dice que tiene miedo, que ya intentó y no pudo, o pregunta qué hace diferente a AEA):
El instructor trabaja 5 factores físicos — no solo teoría: cómo agarras el volante (firme pero relajado), hombros bajos, respiración, barrido visual y pie derecho en abanico. Cuando el cuerpo aprende a relajarse, el manejo se vuelve intuitivo. Hay un momento — el "clic" — en que el alumno deja de luchar contra el coche y empieza a fluir con él. Nuestros instructores están entrenados para llevarte a ese punto.
Frases útiles: "No es cuestión de talento, es de técnica física — y eso se enseña." · "Si ya intentaste antes y se sentía forzado, lo más probable es que nadie te enseñó cómo relajar el cuerpo al manejar."

**Reseña Google**: Solo si el cliente expresa satisfacción → "Me alegra mucho 😊 Si tienes un momento, una reseña nos ayuda un montón: https://g.page/r/CXb43zwsdca7EBE/review"

**Asesor humano**: ÚNICAMENTE para quejas serias o negociaciones fuera de catálogo → "Te conecto con un asesor: 56 3443 3212." Solo una vez por conversación. ⚠️ NUNCA des este número por no tener información, por preguntas fuera de tema ni como salida fácil — al darlo TÚ dejas de atender la conversación, así que es el último recurso.

**Qué sigue después de inscribirse**: El día anterior a su primera clase recibe datos del instructor, punto de encuentro y saldo pendiente.

**Si escribe en inglés**: Responde en inglés con el mismo estilo.

## RECURSOS ADICIONALES — USA PARA APORTAR VALOR Y ENGANCHAR

**Evaluación de nivel** (app.autoescuelaamericana.com/evaluacion):
13 preguntas que diagnostican el nivel de manejo — principiante, intermedio o avanzado — y recomiendan el curso ideal. Úsala cuando alguien no sabe qué curso le conviene o duda entre opciones:
"Si no sabes qué nivel eres, tenemos una evaluación rápida gratuita — en 2 minutos te dice exactamente qué curso te queda mejor: app.autoescuelaamericana.com/evaluacion"

**Examen teórico del reglamento** (app.autoescuelaamericana.com/examen-teorico):
10 preguntas del Reglamento de Tránsito CDMX. Preparación para el examen teórico de SEMOVI. Úsalo como valor añadido al cerrar o cuando alguien pregunta por la licencia:
"También tenemos un simulacro del examen teórico de tránsito — gratis, lo haces desde el celular: app.autoescuelaamericana.com/examen-teorico"

**Programa del curso — 14 temas que se cubren** (usa consultarProgramaCurso cuando pidan el detalle completo):
Posición al sentarse · Ajuste de espejos y puntos ciegos · Cambio de marchas (manual y automático) · Distancias de frenado · Estacionamiento en paralelo · Límites de velocidad CDMX · Señales de tránsito · Manejo en lluvia · Manejo en tráfico · Manejo en carretera · Ahorro de gasolina · Testigos del tablero · Mecánica básica · Trámite de licencia SEMOVI y verificación vehicular.

**Reglamento de Tránsito CDMX — puntos clave para responder dudas directamente (sin herramientas):**
- Prioridad en vía pública: peatón (esp. con discapacidad) > ciclista > transporte público > transporte particular
- Velocidades máximas: 80 km/h (Periférico/vías acceso controlado) · 50 km/h (vías primarias) · 40 km/h (secundarias) · 30 km/h (tránsito calmado) · 20 km/h (escuelas/hospitales) · 10 km/h (estacionamientos)
- Cinturón: obligatorio para TODOS los ocupantes. Menores de 12 años o menos de 1.45 m → asiento trasero con silla porta infante.
- Prohibido en movimiento: celular o cualquier distractor; alcohol >0.25 mg/L en aire espirado.
- Estacionamiento prohibido: banquetas, cruces peatonales, doble fila, frente a entradas ajenas.
- Motociclistas: casco obligatorio (conductor y pasajero), un carril completo, luces siempre encendidas.
- Accidente: detener vehículo, auxiliar lesionados, notificar aseguradora, mover el vehículo solo cuando la autoridad o aseguradora lo indique.
- Infracciones: sanción económica en UMAs + posible resta de puntos a licencia.

## HERRAMIENTAS

- **consultarDisponibilidad**: Úsala en el Paso 3 (cuando sepas mañana/tarde/fin de semana) para proponer fechas reales. También cuando pregunten "¿hay lugar?" o "¿cuándo puedo empezar?". Nunca inventes horarios.
- **consultarCatalogoCursos**: Para confirmar precios exactos.
- **consultarProgramaCurso**: Si preguntan qué aprenden.
- **confirmarInscripcion**: Solo si el alumno confirma patrón y fecha de forma conversacional (no aplica cuando llega comprobante — ese caso ya está procesado).
- **guardarPreReserva**: Llámala siempre al final del CIERRE (Paso 6), justo después de mandar los datos de pago. No esperes el comprobante. Pasa: nombre, teléfono (el número de WhatsApp del cliente), dirección completa, curso, transmisión, patrón (lunes-jueves / martes-viernes / fin-de-semana) y la fechaInicio + hora que acordaste. Esto calcula y reserva las 4 fechas reales, no solo la primera.

## REGLAS ABSOLUTAS

- NUNCA más de una pregunta por mensaje
- NUNCA preguntes algo ya respondido en la conversación
- NUNCA digas que eres IA o bot
- NUNCA inventes precios, horarios o servicios
- NUNCA mandes el link /agenda — el cierre siempre es aquí, con datos de pago
- NUNCA repitas la oferta de asesor humano si ya la hiciste
- SIEMPRE usa consultarDisponibilidad antes de proponer fechas concretas
- NUNCA avances al CIERRE con solo colonia o alcaldía — necesitas calle + número + colonia completos
- SIEMPRE llama a guardarPreReserva al terminar el Paso 6 (CIERRE)
- NUNCA te quedes callada ni respondas vacío — si no tienes la información, dilo en una línea y regresa al paso pendiente del flujo con una pregunta
- SIEMPRE termina tu mensaje con una pregunta que avance hacia el cierre (salvo el mensaje de datos de pago, que termina con "¿Alguna duda?")`;

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const MSG_FALLBACK = 'Perdón, ¿me repites tu último mensaje? Quiero anotar bien tus datos 📝';
const GEMINI_TIMEOUT_MS = 90_000;

// Dedup de mensajes recibidos
const seen = new Map<string, number>();
const DEDUP_TTL = 5 * 60 * 1000;

// Historial de conversación por número (en memoria, TTL 2 horas)
type HistoryItem = { role: 'user' | 'bot'; text: string };
const conversations = new Map<string, { messages: HistoryItem[]; lastActivity: number }>();
const HISTORY_TTL = 2 * 60 * 60 * 1000;

async function getHistory(phone: string): Promise<HistoryItem[]> {
  const now = Date.now();
  for (const [p, data] of conversations) {
    if (now - data.lastActivity > HISTORY_TTL) conversations.delete(p);
  }
  const cached = conversations.get(phone);
  if (cached) return cached.messages;

  // Memoria expirada o primera vez — restaurar desde Firestore
  try {
    const { getConversationMessages } = await import('@/lib/firestore');
    const msgs = await getConversationMessages(phone);
    if (msgs.length > 0) {
      const recent = msgs.slice(-60);
      const messages: HistoryItem[] = recent.map(m => ({ role: m.role, text: m.text }));
      conversations.set(phone, { messages, lastActivity: now });
      console.log(`[WEBHOOK] Historial restaurado desde Firestore: ${messages.length} msgs para ${phone}`);
      return messages;
    }
  } catch (e) {
    console.error('[WEBHOOK] Error cargando historial desde Firestore:', e);
  }

  return [];
}

function saveHistory(phone: string, userText: string, botText: string) {
  const now = Date.now();
  const existing = conversations.get(phone) ?? { messages: [], lastActivity: now };
  existing.messages.push({ role: 'user', text: userText });
  existing.messages.push({ role: 'bot', text: botText });
  if (existing.messages.length > 60) existing.messages = existing.messages.slice(-60);
  existing.lastActivity = now;
  conversations.set(phone, existing);
}

function isValidName(val: unknown): boolean {
  if (!val || typeof val !== 'string') return false;
  const v = val.trim().toLowerCase();
  if (v.length < 2) return false;
  const invalid = ['alumno', 'cliente', 'usuario', 'null', 'none', 'no sé', 'no se', 'n/a', 'na', 'desconocido', 'sin nombre', 'no dio'];
  return !invalid.includes(v);
}

async function extractLeadInfo(history: HistoryItem[], phone: string) {
  const conversation = history.map(h => `${h.role === 'user' ? 'Cliente' : 'Luz'}: ${h.text}`).join('\n');
  const result = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `De esta conversación extrae en JSON plano los datos del cliente. Si un dato no está claro, devuelve null — no inventes ni uses valores genéricos.

- "nombre": nombre o apodo que mencionó el cliente. Apodos cortos como "Ale", "Fer", "Santi" son válidos. Si no dio nombre, null.
- "calle": nombre de la calle del punto de encuentro. Solo el nombre de la calle, sin número. Si no dio calle, null.
- "numero": número exterior de la dirección (ej: "23", "1407 Int. 5"). Si no dio número, null.
- "colonia": nombre de la colonia o alcaldía (ej: "Narvarte", "Roma Norte", "Del Valle"). Si no dio colonia, null.
- "zona": dirección completa tal como la dio el cliente (calle + número + colonia juntos). Si solo dio colonia, ponla. Si no dio ninguna, null.
- "curso": uno exactamente de: Estándar | Automático | Avanzado | Intermedio | Personas Nerviosas | Intensivo | Mixto | Moto | English Drive. Si no queda claro, null.
- "transmision": "Estándar" para palanca (Estándar, Avanzado, Intermedio, Intensivo, Moto), "Automático" para automático (Automático, Personas Nerviosas, Mixto, English Drive, Coche Propio). Si no queda claro, null.
- "horario":
  * "mañana" → mañana, temprano, antes del mediodía, 7am, 10am, por la mañana
  * "tarde" → tarde, después del mediodía, noche, 1pm, 4pm, 7pm, 13:00, 16:00, 19:00, por la tarde, por la noche
  * "fin-de-semana" → sábado, domingo, fin de semana, finde, weekend
  * null → ambiguo o no especificó (cualquier hora, me da igual, cuando haya lugar)
Solo JSON sin texto extra ni bloques de código.

${conversation}`,
  });
  try {
    const raw = result.text?.trim() ?? '{}';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const json = JSON.parse(cleaned);
    const tel = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
    const validHorarios = ['mañana', 'tarde', 'fin-de-semana'];
    const calle   = json.calle  ? String(json.calle).trim()  : null;
    const numero  = json.numero ? String(json.numero).trim() : null;
    const colonia = json.colonia ? String(json.colonia).trim() : null;
    // Zona completa: usar lo que el cliente dio; si tenemos las partes estructuradas, reconstruirla
    const zonaCompleta = calle && numero && colonia
      ? `${calle} ${numero}, ${colonia}`
      : (json.zona ? String(json.zona).trim() : (colonia ?? 'Por confirmar'));
    return {
      nombre: isValidName(json.nombre) ? String(json.nombre).trim() : 'Alumno',
      zona: zonaCompleta,
      calle,
      numero,
      colonia,
      curso: json.curso ? String(json.curso).trim() : 'Estándar',
      transmision: json.transmision ? String(json.transmision).trim() : 'Estándar',
      horario: (validHorarios.includes(json.horario) ? json.horario : 'mañana') as 'mañana' | 'tarde' | 'fin-de-semana',
      telefono: tel,
    };
  } catch {
    const tel = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
    return { nombre: 'Alumno', zona: 'Por confirmar', calle: null, numero: null, colonia: null, curso: 'Estándar', transmision: 'Estándar', horario: 'mañana' as const, telefono: tel };
  }
}

function pickSlots(
  slots: Awaited<ReturnType<typeof getAvailableSlots>>,
  horario: string,
  fechaMinima?: string
) {
  const mañana = ['07:00', '10:00'];
  const tarde = ['13:00', '16:00', '19:00'];
  const finde = ['sábado', 'domingo'];

  const preferidos = horario === 'mañana' ? mañana : horario === 'tarde' ? tarde : ['10:00', '13:00'];

  // Si hay fecha prometida, no tomar slots anteriores a ella
  const slotsBase = fechaMinima ? slots.filter(s => s.fecha >= fechaMinima) : slots;

  // Filtrar días según preferencia
  const diasFiltrados = slotsBase.filter(slot => {
    const esFinDeSemana = finde.includes(slot.diaSemana);
    if (horario === 'fin-de-semana' && !esFinDeSemana) return false;
    if (horario !== 'fin-de-semana' && esFinDeSemana) return false;
    return true;
  });

  // Buscar 4 días al MISMO horario, preferencia: 4 días literalmente corridos (diff 1 día entre cada par)
  for (const hora of preferidos) {
    const diasConEstaHora = diasFiltrados.filter(s => s.horariosLibres.includes(hora));
    if (diasConEstaHora.length < 4) continue;

    // Prioridad 1: 4 días completamente corridos (cada par con diff exacto de 1 día)
    for (let i = 0; i <= diasConEstaHora.length - 4; i++) {
      const bloque = diasConEstaHora.slice(i, i + 4);
      const corrido = bloque.every((s, idx) => {
        if (idx === 0) return true;
        const prev = new Date(bloque[idx - 1].fecha).getTime();
        const curr = new Date(s.fecha).getTime();
        return (curr - prev) === 86400000; // exactamente 1 día
      });
      if (corrido) return bloque.map(s => ({ date: s.fecha + 'T12:00:00', time: hora }));
    }

    // Prioridad 2: bloque más compacto (menor rango total de fechas)
    let mejorBloque = diasConEstaHora.slice(0, 4);
    let mejorRango = Infinity;
    for (let i = 0; i <= diasConEstaHora.length - 4; i++) {
      const bloque = diasConEstaHora.slice(i, i + 4);
      const rango = new Date(bloque[3].fecha).getTime() - new Date(bloque[0].fecha).getTime();
      if (rango < mejorRango) { mejorRango = rango; mejorBloque = bloque; }
    }
    return mejorBloque.map(s => ({ date: s.fecha + 'T12:00:00', time: hora }));
  }

  // Fallback: mezcla de horarios si ninguna hora tiene 4 días disponibles
  const result: Array<{ date: string; time: string }> = [];
  for (const slot of diasFiltrados) {
    if (result.length >= 4) break;
    const hora = preferidos.find(h => slot.horariosLibres.includes(h)) ?? slot.horariosLibres[0];
    if (hora) result.push({ date: slot.fecha + 'T12:00:00', time: hora });
  }
  return result;
}

async function extractLeadData(history: HistoryItem[], phone: string): Promise<Record<string, string>> {
  const conversation = history
    .map((h) => `${h.role === 'user' ? 'Cliente' : 'Luz'}: ${h.text}`)
    .join('\n');
  const result = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `De esta conversación extrae en JSON plano los campos: "name" (nombre completo del cliente) y "address" (calle, número, colonia y alcaldía mencionados; si falta algún dato pon lo que haya). Si no hay dato deja el campo vacío. Solo responde JSON, sin texto extra.\n\n${conversation}`,
  });
  const json = JSON.parse(result.text?.trim() || '{}');
  const params: Record<string, string> = {};
  if (json.name) params.name = String(json.name);
  if (json.address) params.address = String(json.address);
  const displayPhone = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
  params.phone = displayPhone;
  return params;
}

// checkCoverage, CoverageResult y ZONAS_PUNTO_FIJO importados de @/lib/coverage
// normalizePhone importado de @/lib/phone

async function maybeNotifyLeadCalificado(phone: string, history: HistoryItem[]): Promise<void> {
  // Mínimo 3 mensajes del cliente para que haya podido dar nombre y dirección
  if (history.filter(h => h.role === 'user').length < 3) return;
  try {
    const { getConversation, db } = await import('@/lib/firestore');
    const conv = await getConversation(phone);
    if (conv?.leadCalificadoNotificado) return; // ya notificado, no repetir
    const leadInfo = await extractLeadInfo(history, phone);
    // Solo notificar si tenemos datos reales (no defaults)
    if (leadInfo.nombre === 'Alumno' || leadInfo.zona === 'Por confirmar') return;
    const dp = phone.startsWith('52') && phone.length === 12 ? phone.slice(2) : phone;
    const coverage = checkCoverage(leadInfo.zona, leadInfo.colonia);
    const dirCompleta = leadInfo.zona +
      (!leadInfo.colonia ? ' ⚠️ *falta colonia*' : '') +
      (!leadInfo.calle ? ' ⚠️ *falta calle/número*' : '');

    const emoji = coverage.tipo === 'domicilio' ? '🔥' : coverage.tipo === 'punto_fijo' ? '📍' : '❓';
    const urgencia = coverage.tipo === 'dudosa'
      ? '\n\n*Zona no identificada — coordinar punto de encuentro con el lead antes de cerrar.*'
      : '';
    await sendMessage(ADMIN_PHONE,
      `${emoji} *Lead calificado — listo para cierre*\n\n` +
      `👤 ${leadInfo.nombre}\n` +
      `📱 +${dp}\n` +
      `📍 ${dirCompleta}\n` +
      `🚗 ${leadInfo.curso}\n\n` +
      `${coverage.nota}${urgencia}`
    );
    await db.collection('conversations').doc(phone).set(
      { leadCalificadoNotificado: true },
      { merge: true }
    );
  } catch (e) {
    console.error('[WEBHOOK] Error en maybeNotifyLeadCalificado:', e);
  }
}

function buildTurnContext(clientPhone?: string): string {
  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Mexico_City',
  });
  let ctx = `[Fecha actual: ${hoy}. Usa este año para calcular cualquier fecha futura.]`;
  if (clientPhone) {
    ctx += `\n[Número de WhatsApp del cliente en esta conversación: ${clientPhone}. Usa EXACTAMENTE este número en el campo "telefono" cuando llames a confirmarInscripcion. No uses ningún otro número.]`;
  }
  return ctx;
}

async function raceWithTimeout<T>(promise: Promise<T>): Promise<T | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), GEMINI_TIMEOUT_MS)
  );
  return Promise.race([promise, timeout]);
}

async function generateReply(userMessage: string, history: HistoryItem[], clientPhone?: string): Promise<string> {
  // SYSTEM_PROMPT se manda sin modificar (sin fecha/teléfono) para que el prefijo
  // sea idéntico en cada llamada y Gemini pueda reutilizar el implicit prompt caching
  // entre clientes y días. La fecha/teléfono viajan en el "prompt" del turno, que de
  // todos modos ya es distinto en cada llamada.
  const result = await raceWithTimeout(ai.generate({
    model: 'googleai/gemini-2.5-pro',
    system: SYSTEM_PROMPT,
    tools: AEA_TOOLS,
    messages: history.map((h) => ({
      role: h.role === 'bot' ? ('model' as const) : ('user' as const),
      content: [{ text: h.text }],
    })),
    prompt: `${buildTurnContext(clientPhone)}\n\n${userMessage}`,
  }));

  if (!result) {
    console.error('[WEBHOOK] Gemini timeout after', GEMINI_TIMEOUT_MS, 'ms');
    sendMessage(ADMIN_PHONE,
      `⚠️ *Luz se congeló* — timeout ${GEMINI_TIMEOUT_MS / 1000}s\n\n📱 +${clientPhone ?? 'desconocido'}\n💬 "${userMessage.slice(0, 120)}"\n\nRevisa y responde tú.`
    ).catch(e => console.error('[WEBHOOK] Error notificando timeout:', e));
    return MSG_FALLBACK;
  }
  console.log('[WEBHOOK] Gemini usage:', JSON.stringify(result.usage));
  let text = result.text?.trim();

  // Gemini a veces devuelve texto vacío justo después de ejecutar una herramienta
  // (sin timeout, sin error — el modelo simplemente no generó texto en ese turno).
  // En vez de repetir la llamada desde cero (lo que volvería a llamar las
  // herramientas y podría duplicar una inscripción o un pago), le pedimos al mismo
  // modelo que continúe usando result.messages, que ya incluye la llamada a la
  // herramienta y su resultado — así solo genera el texto que faltó.
  if (!text) {
    console.error('[WEBHOOK] Gemini devolvió respuesta vacía (finishReason:', result.finishReason, ') — reintentando con el mismo historial');
    try {
      // Sin `system` aquí: result.messages ya incluye el system prompt original
      // (como primer mensaje), y Gemini rechaza un segundo mensaje de rol system.
      const retryResult = await raceWithTimeout(ai.generate({
        model: 'googleai/gemini-2.5-pro',
        tools: AEA_TOOLS,
        messages: result.messages,
        prompt: 'No generaste texto en tu turno anterior. Respóndele ahora al cliente en el idioma de la conversación, siguiendo exactamente las instrucciones del system prompt para el paso en el que estás (por ejemplo, si ya tienes nombre + horario + zona, manda el mensaje de CIERRE completo con los datos de pago — no un resumen genérico). No vuelvas a llamar ninguna herramienta que ya ejecutaste arriba.',
      }));
      if (retryResult) {
        console.log('[WEBHOOK] Gemini usage (reintento):', JSON.stringify(retryResult.usage));
        text = retryResult.text?.trim();
      }
    } catch (e) {
      console.error('[WEBHOOK] Error en reintento de respuesta vacía:', e);
    }
  }

  if (!text) {
    console.error('[WEBHOOK] Gemini devolvió respuesta vacía tras reintento');
    sendMessage(ADMIN_PHONE,
      `⚠️ *Luz respondió vacío (2 intentos)*\n\n📱 +${clientPhone ?? 'desconocido'}\n💬 "${userMessage.slice(0, 120)}"\n\nSe le pidió al lead repetir su mensaje. Revisa por si acaso.`
    ).catch(e => console.error('[WEBHOOK] Error notificando respuesta vacía:', e));
    return MSG_FALLBACK;
  }
  return text;
}

async function sendMessage(to: string, text: string): Promise<void> {
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
    console.error('[WEBHOOK] WhatsApp API error:', res.status, await res.text());
  }
}

async function sendImageMessage(to: string, mediaId: string, caption?: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  const imagePayload: Record<string, string> = { id: mediaId };
  if (caption) imagePayload.caption = caption;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image: imagePayload,
  };
  console.log('[WEBHOOK] sendImageMessage →', to, '| mediaId:', mediaId);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const responseText = await res.text();
  if (!res.ok) {
    console.error('[WEBHOOK] WhatsApp image API error:', res.status, responseText);
  } else {
    console.log('[WEBHOOK] Imagen reenviada OK:', responseText.slice(0, 120));
  }
}

async function sendLocationRequest(to: string, direccionConocida: string): Promise<void> {
  const url = `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'location_request_message',
      body: {
        text: `Un último paso: comparte tu ubicación exacta para que el instructor llegue directo a tu puerta 📍\n\n_Dirección registrada: ${direccionConocida}_`,
      },
      action: { name: 'send_location' },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error('[WEBHOOK] Location request error:', res.status, await res.text());
  }
}

async function transcribeAudio(mediaId: string, mimeType = 'audio/ogg'): Promise<string> {
  const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${WA_TOKEN}` },
  });
  if (!metaRes.ok) throw new Error(`Media info error: ${metaRes.status}`);
  const metaData = (await metaRes.json()) as { url?: string };
  if (!metaData.url) throw new Error('No URL in WhatsApp media response');

  const audioRes = await fetch(metaData.url, {
    headers: { Authorization: `Bearer ${WA_TOKEN}` },
  });
  if (!audioRes.ok) throw new Error(`Audio download error: ${audioRes.status}`);
  const base64Audio = Buffer.from(await audioRes.arrayBuffer()).toString('base64');

  const result = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: [
      { media: { url: `data:${mimeType};base64,${base64Audio}`, contentType: mimeType } },
      { text: 'Transcribe este audio en español. Solo devuelve el texto transcrito, sin explicaciones ni comillas.' },
    ],
  });
  return result.text?.trim() ?? '';
}

async function resolveDocId(db: FirebaseFirestore.Firestore, phone: string): Promise<string> {
  const snap = await db.collection('conversations').doc(phone).get();
  if (snap.exists) return phone;
  const alt = phone.startsWith('52') ? phone.slice(2) : '52' + phone;
  return alt;
}

async function handleAdminCommand(cmd: string, targetPhone: string): Promise<string> {
  const { db } = await import('@/lib/firestore');

  if (cmd === '!ayuda' || !targetPhone) {
    return [
      '📋 *Comandos disponibles:*',
      '',
      '`!pausa <número>` — Luz deja de responder al lead',
      '`!reanudar <número>` — Luz vuelve a responder al lead',
      '`!estado <número>` — Ver estado actual del lead',
      '`!cerrar <número>` — Marcar conversación como cerrada',
      '',
      '_El número puede ser con o sin código de país (ej: 5512345678 o 525512345678)_',
    ].join('\n');
  }

  const dp = targetPhone.startsWith('52') && targetPhone.length === 12
    ? targetPhone.slice(2) : targetPhone;

  if (cmd === '!pausa') {
    const docId = await resolveDocId(db, targetPhone);
    await db.collection('conversations').doc(docId).set({ botPaused: true }, { merge: true });
    return `⏸️ Luz pausada para +${dp}\n\nAhora puedes responderle tú directamente. Usa *!reanudar ${dp}* cuando quieras que Luz retome.`;
  }

  if (cmd === '!reanudar') {
    const docId = await resolveDocId(db, targetPhone);
    await db.collection('conversations').doc(docId).set({ botPaused: false }, { merge: true });
    return `▶️ Luz reanudada para +${dp}\n\nEl próximo mensaje del lead lo responderá Luz automáticamente.`;
  }

  if (cmd === '!estado') {
    let snap = await db.collection('conversations').doc(targetPhone).get();
    if (!snap.exists) {
      const alt = targetPhone.startsWith('52') ? targetPhone.slice(2) : '52' + targetPhone;
      snap = await db.collection('conversations').doc(alt).get();
    }
    if (!snap.exists) return `❓ No encontré conversación con +${dp}`;
    const d = snap.data()!;
    const estado = d.chatState ?? 'desconocido';
    const pausa = d.botPaused ? '⏸️ Luz pausada' : '▶️ Luz activa';
    const nombre = d.contactName ? `👤 ${d.contactName}` : '';
    const curso = d.courseInterest ? `🚗 ${d.courseInterest}` : '';
    const preview = d.chatLastPreview ? `💬 "${String(d.chatLastPreview).slice(0, 100)}"` : '';
    return [
      `📊 *Estado de +${dp}*`,
      '',
      nombre, curso, `🏷️ ${estado}`, pausa, preview,
    ].filter(Boolean).join('\n');
  }

  if (cmd === '!cerrar') {
    const docId = await resolveDocId(db, targetPhone);
    const { updateChatState } = await import('@/lib/firestore');
    const { Timestamp } = await import('firebase-admin/firestore');
    await updateChatState(docId, {
      chatState: 'cerrado',
      chatReason: 'Cerrado manualmente por admin',
      chatUrgency: 'ninguna',
      closedAt: Timestamp.now(),
      closedOutcome: 'perdido',
    }, 'manual');
    return `✅ Conversación con +${dp} marcada como cerrada.`;
  }

  return `❓ Comando desconocido: *${cmd}*\n\nEscribe *!ayuda* para ver los comandos disponibles.`;
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

function buildWelcomeMessage(nombre: string | null, isAdLead: boolean): string {
  const primerNombre = nombre ? nombre.split(' ')[0] : null;
  const saludo = primerNombre ? `¡Hola ${primerNombre}!` : '¡Hola!';
  if (isAdLead) {
    return `${saludo} Soy Luz, de Auto Escuela Americana 🚗

Somos la autoescuela con más reseñas en CDMX — 4.8★ con más de 220 alumnos. Clases 1 a 1, nunca en grupo, y puedes empezar esta semana.

¿Ya manejas algo o empiezas desde cero?`;
  }
  return `${saludo} 👋 Soy Luz, de Auto Escuela Americana.

¿Ya manejas algo o empiezas desde cero?`;
}

export async function POST(request: NextRequest) {
  let from = '';
  let textBody = '';
  let messageType = 'text';
  let imageMediaId = '';
  let audioMediaId = '';
  let audioMimeType = 'audio/ogg';
  let locationData: { latitude?: number; longitude?: number; name?: string; address?: string } = {};
  let leadSource: string | null = null;
  let waDisplayName: string | null = null;

  try {
    const body = await request.json();
    console.log('[WEBHOOK] POST recibido:', JSON.stringify(body).slice(0, 300));
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const msgId: string = message.id ?? '';
    from = normalizePhone(message.from ?? '');
    textBody = message?.text?.body ?? '';
    messageType = message?.type ?? 'text';
    if (messageType === 'image') {
      imageMediaId = message?.image?.id ?? '';
      console.log('[WEBHOOK] Imagen recibida — mediaId:', imageMediaId, '| mime:', message?.image?.mime_type);
    }
    if (messageType === 'audio') {
      audioMediaId = message?.audio?.id ?? '';
      audioMimeType = message?.audio?.mime_type ?? 'audio/ogg';
      console.log('[WEBHOOK] Audio recibido — mediaId:', audioMediaId, '| mime:', audioMimeType);
    }
    if (messageType === 'location') {
      locationData = message?.location ?? {};
    }

    // Nombre del contacto de WhatsApp (si lo tiene configurado)
    waDisplayName = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ?? null;

    // Detectar fuente del lead
    const referral = message?.referral;
    if (referral?.source_type === 'ad') {
      leadSource = `Facebook Ad: ${referral.headline ?? referral.source_id ?? 'Anuncio'}`;
    } else {
      // Google Ads → WhatsApp no pasa referral metadata.
      // Los leads de anuncio típicamente mandan un mensaje corto o saludo genérico.
      const msgLower = textBody.toLowerCase().trim();
      const esApertura = msgLower.length < 40 ||
        /^(hola|hi|hello|buenas|buen[ao]s días|información|informacion|info|quiero|curso|clases|precio|cuánto|cuanto|me interesa|quisiera|necesito|tienen)/.test(msgLower);
      if (esApertura) leadSource = 'Google Ads (probable)';
    }

    if (!from || (messageType !== 'image' && messageType !== 'location' && messageType !== 'audio' && !textBody)) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const now = Date.now();
    for (const [id, ts] of seen) {
      if (now - ts > DEDUP_TTL) seen.delete(id);
    }
    if (seen.has(msgId)) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
    seen.set(msgId, now);
  } catch {
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // ── Comandos del admin ────────────────────────────────────────────────────
  // Si el mensaje viene del número admin, procesar comandos y no pasar a Luz
  if (from === ADMIN_PHONE && /^[!¡]/.test(textBody.trim())) {
    const parts = textBody.trim().replace(/^¡/, '!').split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const rawPhone = parts[1] ?? '';
    const targetPhone = rawPhone ? normalizePhone(rawPhone) : '';
    console.log('[ADMIN] Comando recibido:', cmd, '| target:', targetPhone || '(sin número)');
    const reply = await handleAdminCommand(cmd, targetPhone);
    console.log('[ADMIN] Respuesta:', reply.slice(0, 100));
    await sendMessage(ADMIN_PHONE, reply);
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // ── Routing UrbDriver / Marco ────────────────────────────────────────────
  {
    const { esIntentInstructor, esCandidatoExistente, handleMarco } = await import('./marco');
    const esCandidato = await esCandidatoExistente(from);
    const esInstructor = esCandidato || (messageType === 'text' && esIntentInstructor(textBody));
    if (esInstructor) {
      return handleMarco(from, textBody, !esCandidato);
    }
  }

  // Nota de voz — transcribir con Gemini antes de pasar al flujo normal
  if (messageType === 'audio' && audioMediaId) {
    try {
      const transcription = await transcribeAudio(audioMediaId, audioMimeType);
      if (transcription) {
        console.log('[WEBHOOK] 🎤 Transcripción:', transcription.slice(0, 200));
        textBody = transcription;
        messageType = 'text';
      } else {
        await sendMessage(from, 'No pude escuchar bien tu nota de voz — ¿me lo puedes escribir? 🙏');
        return new NextResponse('EVENT_RECEIVED', { status: 200 });
      }
    } catch (e) {
      console.error('[WEBHOOK] Error transcribiendo audio:', e);
      await sendMessage(from, 'No pude escuchar bien tu nota de voz — ¿me lo puedes escribir? 🙏');
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
  }

  // Ubicación GPS compartida por el cliente
  if (messageType === 'location') {
    const { latitude, longitude, name: locName, address: locAddress } = locationData;
    const mapsUrl = latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : null;
    const resumen = [locName, locAddress].filter(Boolean).join(' — ') || 'Sin nombre';

    // Notificar al admin con el pin de Maps
    sendMessage(ADMIN_PHONE,
      `📍 *Ubicación confirmada — +${from}*\n\n${resumen}${mapsUrl ? `\n\n🗺️ ${mapsUrl}` : ''}`
    ).catch(e => console.error('[WEBHOOK] Error enviando ubicación al admin:', e));

    // Guardar coordenadas en Firestore (zona actualizada)
    if (mapsUrl) {
      import('@/lib/firestore')
        .then(({ db }) =>
          db.collection('conversations').doc(from).set(
            { ubicacionGPS: { latitude, longitude, address: locAddress ?? resumen, mapsUrl } },
            { merge: true }
          )
        )
        .catch(e => console.error('[WEBHOOK] Error guardando ubicación:', e));
    }

    // Confirmar al cliente
    await sendMessage(from, `¡Listo! Guardé tu ubicación 📍 El instructor llegará ahí el día de tu primera clase.`);
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // Comprobante de pago (imagen) — inscripción automática
  if (messageType === 'image') {
    const history = await getHistory(from);
    let syntheticMsg: string;
    let inscriptionOk = false;
    let fichaClienteMsg: string | null = null;
    let leadNombre = '';
    let leadZona = 'Por confirmar';

    // Extraer nombre del lead del historial para la notificación inicial
    const nombreRapido = history.find(h => h.role === 'user' && h.text.length > 2 && h.text.length < 40 && !/http|#|\?/.test(h.text))?.text ?? `+${from}`;

    sendMessage(ADMIN_PHONE,
      `🔴 *COMPROBANTE — ${nombreRapido}*\n📱 +${from}\n⏳ Verificar monto y banco 👇`
    ).catch((e) => console.error('[WEBHOOK] Error notificando admin (imagen):', e));

    // Reenviar la imagen del comprobante al admin para verificar monto y banco
    if (imageMediaId) {
      sendImageMessage(ADMIN_PHONE, imageMediaId, `${nombreRapido} · +${from}`).catch(
        (e) => console.error('[WEBHOOK] Error reenviando comprobante al admin:', e)
      );

      // Copia permanente al bucket privado + marcar depósito en la ficha única.
      // Fire-and-forget: si falla, la inscripción sigue su curso normal.
      import('@/lib/comprobantes')
        .then(async ({ subirComprobante }) => {
          const path = await subirComprobante(imageMediaId, from);
          const { actualizarFicha } = await import('@/lib/fichaLuz');
          await actualizarFicha(from, {
            depositoPagado: true,
            comprobanteURL: `/api/admin/comprobante?path=${encodeURIComponent(path)}`,
          });
          console.log('[WEBHOOK] Comprobante en Storage:', path);
        })
        .catch((e) => console.error('[WEBHOOK] Error subiendo comprobante a Storage:', e));
    }

    try {
      const leadInfo = await extractLeadInfo(history, from);
      leadNombre = leadInfo.nombre;
      leadZona = leadInfo.zona;
      console.log('[WEBHOOK] Lead info extraída:', JSON.stringify(leadInfo));

      if (leadInfo.nombre === 'Alumno' || leadInfo.zona === 'Por confirmar') {
        console.warn('[WEBHOOK] Datos insuficientes para crear ficha — nombre o zona faltantes. Abortando agendamiento.');
        return new NextResponse('EVENT_RECEIVED', { status: 200 });
      }

      // Validar dirección completa: colonia es mínimo requerido para confirmar cobertura
      if (!leadInfo.colonia) {
        console.warn('[WEBHOOK] Dirección incompleta — falta colonia. Abortando agendamiento.');
        sendMessage(ADMIN_PHONE,
          `⚠️ *Dirección incompleta — ${leadInfo.nombre}*\n📱 +${from}\n\n` +
          `Tiene: "${leadInfo.zona}"\nFalta: colonia (y preferiblemente calle + número)\n\n` +
          `Luz pedirá los datos faltantes.`
        ).catch(e => console.error('[WEBHOOK] Error notificando admin dir incompleta:', e));
        // Permitir que Luz responda al cliente pidiendo los datos faltantes
        const reply = await generateReply(
          `El cliente acaba de enviar su comprobante de pago pero aún falta su dirección completa (calle, número y colonia). ` +
          `Confirma que recibiste el pago y pídele amablemente que te dé su calle, número y colonia para el punto de encuentro con el instructor.`,
          history, from
        );
        await sendMessage(from, reply);
        saveHistory(from, '[imagen: comprobante de pago]', reply);
        return new NextResponse('EVENT_RECEIVED', { status: 200 });
      }

      console.log('[WEBHOOK] Consultando slots disponibles...');
      const slots = await getAvailableSlots(21);
      console.log('[WEBHOOK] Slots totales recibidos:', slots.length);

      // Leer pre-reserva para respetar las 4 fechas exactas prometidas por Luz (no solo la primera)
      let prometidas: Array<{ date: string; time: string }> | null = null;
      try {
        const { getInscripcionData } = await import('@/lib/firestore');
        const preReserva = await getInscripcionData(from);
        if (preReserva?.status === 'pre_reserva' && preReserva.fechas?.length >= 4) {
          prometidas = preReserva.fechas.slice(0, 4);
          console.log('[WEBHOOK] Pre-reserva encontrada (4 fechas):', JSON.stringify(prometidas));
        }
      } catch (e) {
        console.error('[WEBHOOK] Error leyendo pre-reserva:', e);
      }

      let pickedSlots: Array<{ date: string; time: string }>;

      if (prometidas) {
        // Verificar que las 4 fechas prometidas SIGAN libres — si alguna ya no lo está,
        // avisar en vez de reasignar en silencio un bloque distinto al que vio el alumno.
        const conflictos = prometidas.filter(f => {
          const slot = slots.find(s => s.fecha === f.date);
          return !slot || !slot.horariosLibres.includes(f.time);
        });

        if (conflictos.length > 0) {
          console.warn('[WEBHOOK] Fechas prometidas ya no disponibles:', JSON.stringify(conflictos));
          const plural = conflictos.length > 1;
          const conflictosTexto = conflictos.map(c => `${c.date} a las ${c.time}`).join(', ');
          sendMessage(ADMIN_PHONE,
            `⚠️ *Conflicto de horario — ${leadInfo.nombre}*\n\n` +
            `📱 +${leadInfo.telefono}\n` +
            `De las 4 fechas acordadas, ya no está${plural ? 'n' : ''} disponible${plural ? 's' : ''}: *${conflictosTexto}*.\n\n` +
            `Luz le está pidiendo opciones alternativas al alumno.`
          ).catch(e => console.error('[WEBHOOK] Error notif conflicto horario:', e));

          const replyConflicto = await generateReply(
            `El alumno acaba de enviarnos su comprobante de pago — ¡gracias! Sin embargo, de las 4 fechas que habíamos acordado, ya no está${plural ? 'n' : ''} disponible${plural ? 's' : ''}: ${conflictosTexto} (se le adelantó a otro alumno). ` +
            `Confírmale la recepción del pago, discúlpate brevemente por el inconveniente, y pídele que nos comparta 2 o 3 opciones de días y horarios que le funcionen para sus clases.`,
            history, from
          );
          await sendMessage(from, replyConflicto);
          saveHistory(from, '[imagen: comprobante de pago]', replyConflicto);
          import('@/lib/firestore')
            .then(({ saveImageMessage }) => saveImageMessage(from, imageMediaId || 'unknown', replyConflicto))
            .catch(e => console.error('[WEBHOOK] Firestore save error (conflicto):', e));
          return new NextResponse('EVENT_RECEIVED', { status: 200 });
        }

        pickedSlots = prometidas.map(f => ({ date: `${f.date}T12:00:00`, time: f.time }));
      } else {
        // Sin pre-reserva completa (4 fechas) — fallback: elegir bloque según preferencia general
        pickedSlots = pickSlots(slots, leadInfo.horario);
      }
      console.log('[WEBHOOK] Slots seleccionados:', JSON.stringify(pickedSlots));

      if (pickedSlots.length >= 4) {
        console.log('[WEBHOOK] Creando 4 eventos en Calendar...');
        await scheduleAndCreateEvents({
          name: leadInfo.nombre,
          phone: leadInfo.telefono,
          address: leadInfo.zona,
          transmission: leadInfo.transmision,
          dates: pickedSlots,
        });
        console.log('[WEBHOOK] Eventos creados en Calendar');

        const fechasTexto = pickedSlots.map(s => {
          const [yyyy, mm, dd] = s.date.split('T')[0].split('-').map(Number);
          const d = new Date(yyyy, mm - 1, dd);
          return `${d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${s.time}`;
        }).join('\n  ');

        await sendMessage(ADMIN_PHONE,
          `✅ *VENTA CERRADA — Inscripción completada*\n\n` +
          `👤 ${leadInfo.nombre} | 📱 +${leadInfo.telefono}\n` +
          `📍 ${leadInfo.zona} | 🚗 ${leadInfo.curso}\n\n` +
          `📅 Clases agendadas:\n  ${fechasTexto}`
        ).catch((e) => console.error('[WEBHOOK] Error admin final:', e));

        // Persiste datos de inscripción para ficha PDF en admin panel (awaited — el E2E depende de esto)
        const { saveInscripcionData } = await import('@/lib/firestore');
        const fichaFechas = pickedSlots.map(s => ({ date: s.date.split('T')[0], time: s.time }));
        await saveInscripcionData(from, {
          nombre: leadInfo.nombre,
          telefono: from,
          zona: leadInfo.zona,
          calle: leadInfo.calle ?? undefined,
          numero: leadInfo.numero ?? undefined,
          colonia: leadInfo.colonia ?? undefined,
          curso: leadInfo.curso,
          transmision: leadInfo.transmision,
          fechas: fichaFechas,
        });

        // Enviar ficha PDF al admin y al alumno
        import('@/lib/ficha-pdf-server').then(({ enviarFichaAdminWhatsApp }) => {
          const fichaPayload = {
            nombre: leadInfo.nombre,
            telefono: from,
            zona: leadInfo.zona,
            transmision: leadInfo.transmision,
            fechas: fichaFechas,
          };
          enviarFichaAdminWhatsApp(fichaPayload)
            .catch(e => console.error('[WEBHOOK] Error enviando ficha PDF al admin:', e));
          enviarFichaAdminWhatsApp(fichaPayload, from)
            .catch(e => console.error('[WEBHOOK] Error enviando ficha PDF al alumno:', e));
        }).catch(e => console.error('[WEBHOOK] Error importando ficha-pdf-server:', e));

        // Ficha de inscripción para el cliente (WhatsApp)
        const displayTel = leadInfo.telefono.startsWith('52') && leadInfo.telefono.length === 12
          ? leadInfo.telefono.slice(2) : leadInfo.telefono;
        const fichaLineas = [
          `📋 *Tu Ficha de Inscripción — Auto Escuela Americana*`,
          ``,
          `👤 *${leadInfo.nombre}*`,
          `📱 ${displayTel}`,
          `🚗 Curso ${leadInfo.curso}`,
          `📍 ${leadInfo.zona}`,
          ``,
          `📅 *Tus clases:*`,
          ...pickedSlots.slice(0, 4).map((s, i) => {
            const [yyyy, mm, dd] = s.date.split('T')[0].split('-').map(Number);
            const d = new Date(yyyy, mm - 1, dd);
            const label = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
            return `${i + 1}. ${label} · ${s.time}`;
          }),
          ``,
          `Guarda este mensaje 📌 El día antes de tu primera clase te mandamos los datos del instructor.`,
        ];
        fichaClienteMsg = fichaLineas.join('\n');

        inscriptionOk = true;
        syntheticMsg = `El cliente (número de WhatsApp: ${from}) envió su comprobante y sus 4 clases quedaron AGENDADAS AUTOMÁTICAMENTE en Calendar:\n${fechasTexto}\n\nConfírmale esto de manera cordial. Indícale que el día anterior a su primera clase recibirá un mensaje con los datos del instructor. IMPORTANTE: NO llames a confirmarInscripcion — las clases ya están agendadas.`;
      } else {
        sendMessage(ADMIN_PHONE,
          `⚠️ *COMPROBANTE RECIBIDO — Horario pendiente*\n\n` +
          `👤 ${leadInfo.nombre} | 📱 +${leadInfo.telefono}\n` +
          `📍 ${leadInfo.zona} | 🚗 ${leadInfo.curso}\n\n` +
          `No había suficientes slots disponibles. Asigna horario manualmente.`
        ).catch((e) => console.error('[WEBHOOK] Error notificando admin (sin slots):', e));
        syntheticMsg = `El cliente (número de WhatsApp: ${from}) acaba de enviar su comprobante. No hay suficientes horarios disponibles. Propónle un patrón de 4 clases y coordina con el equipo.`;
      }
    } catch (e) {
      console.error('[WEBHOOK] Error en inscripción automática:', e);
      sendMessage(ADMIN_PHONE,
        `⚠️ *COMPROBANTE RECIBIDO — Requiere atención manual*\n\n` +
        `📱 +${from}\n\n` +
        `No se pudo procesar automáticamente. Entra al chat y coordina el horario.`
      ).catch((err) => console.error('[WEBHOOK] Error notificando admin (error path):', err));
      syntheticMsg = `El cliente (número de WhatsApp: ${from}) acaba de enviar su comprobante de pago. Confirma recepción y propónle un horario para sus 4 clases.`;
    }

    const reply = await generateReply(syntheticMsg, history, from);
    await sendMessage(from, reply);
    saveHistory(from, '[imagen: comprobante de pago]', reply);
    import('@/lib/firestore')
      .then(({ saveImageMessage }) => saveImageMessage(from, imageMediaId || 'unknown', reply))
      .catch((e) => console.error('[WEBHOOK] Firestore save error:', e));

    if (inscriptionOk) {
      // Ficha de inscripción al cliente
      if (fichaClienteMsg) {
        sendMessage(from, fichaClienteMsg).catch(e => console.error('[WEBHOOK] Error enviando ficha cliente:', e));
      }

      // Enviar términos y condiciones + aviso de privacidad al alumno
      sendMessage(from,
        `📋 *Términos y Condiciones*\nAl realizar tu pago aceptas los términos de Auto Escuela Americana:\nautoescuelaamericana.com/terminos\n\n🔒 *Aviso de Privacidad*\nTus datos son tratados conforme a nuestro aviso de privacidad:\nautoescuelaamericana.com/aviso-privacidad`
      ).catch(e => console.error('[WEBHOOK] Error enviando T&C:', e));

      // Solicitar ubicación GPS para confirmar punto de encuentro del instructor
      sendLocationRequest(from, leadZona).catch(e => console.error('[WEBHOOK] Error enviando location request:', e));

      // Clases agendadas automáticamente, pero el depósito AÚN NO está verificado por un humano.
      // No cerrar como "ganado" todavía — eso se hace manualmente desde el panel una vez
      // que el admin confirma monto y banco (ver StateActions / closeLead).
      import('@/lib/firestore')
        .then(({ updateChatState }) =>
          updateChatState(from, {
            chatState: 'tu_turno',
            chatReason: 'Comprobante recibido — verificar monto y banco antes de cerrar',
            chatUrgency: 'alta',
          }, 'manual')
        )
        .catch((e) => console.error('[WEBHOOK] Error marcando lead para revisión:', e));
    } else {
      // Sin inscripción → recalcular estado normalmente
      import('@/lib/chat-state')
        .then(({ recalculateChatState }) => recalculateChatState(from, 'mensaje_luz'))
        .catch((e) => console.error('[WEBHOOK] recalculate error (imagen):', e));
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  const history = await getHistory(from);
  const isNewLead = history.length === 0;

  import('@/lib/firestore')
    .then(({ updateLeadActivity, saveLeadSource }) =>
      Promise.all([
        updateLeadActivity(from),
        isNewLead && leadSource ? saveLeadSource(from, leadSource) : Promise.resolve(),
      ])
    )
    .catch((e) => console.error('[WEBHOOK] Error actualizando lead activity:', e));

  // Nuevo lead — enviar menú de bienvenida y salir
  if (isNewLead) {
    const fuenteTexto = leadSource ? `📣 Fuente: ${leadSource}` : '📣 Fuente: directa';
    const nombreTexto = waDisplayName ? `\n👤 ${waDisplayName}` : '';
    sendMessage(ADMIN_PHONE, `🆕 *Nuevo lead*\n\n📱 +${from}${nombreTexto}\n${fuenteTexto}`)
      .catch((e) => console.error('[WEBHOOK] Error notificando nuevo lead:', e));

    const welcome = buildWelcomeMessage(waDisplayName, leadSource !== null);
    await sendMessage(from, welcome);
    saveHistory(from, textBody, welcome);
    import('@/lib/firestore')
      .then(async ({ saveConversationMessage, db }) => {
        await saveConversationMessage(from, textBody, welcome);
        if (waDisplayName) {
          await db.collection('conversations').doc(from).set({ contactName: waDisplayName }, { merge: true });
        }
      })
      .catch((e) => console.error('[WEBHOOK] Error guardando lead nuevo:', e));

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // Si el bot está en pausa, guardar mensaje y no responder
  {
    const { getConversation, saveUserMessage } = await import('@/lib/firestore');
    const convData = await getConversation(from);
    if (convData?.botPaused) {
      console.log('[WEBHOOK] Bot en pausa para', from, '— guardando mensaje sin responder');
      saveUserMessage(from, textBody).catch(e => console.error('[WEBHOOK] saveUserMessage (paused):', e));
      // No dejar leads pausados en el limbo: avisar al admin que le escribieron
      if (from !== ADMIN_PHONE) {
        sendMessage(ADMIN_PHONE,
          `⏸️ *Lead pausado te escribió*\n\n📱 +${from}\n💬 "${textBody.slice(0, 150)}"\n\nLuz no le va a responder. Contéstale tú o usa *!reanudar ${from}*.`
        ).catch(e => console.error('[WEBHOOK] Error notificando lead pausado:', e));
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
  }

  try {
    console.log('[CHAT] 📩', from, '→ Luz:', textBody);
    let reply = await generateReply(textBody, history, from);

    if (reply.includes('autoescuelaamericana.com/agenda')) {
      try {
        const leadData = await extractLeadData(history, from);
        if (Object.keys(leadData).length > 0) {
          const params = new URLSearchParams(leadData).toString();
          reply = reply.replace(
            'https://app.autoescuelaamericana.com/agenda',
            `https://app.autoescuelaamericana.com/agenda?${params}`
          );
        }
      } catch (e) {
        console.error('[WEBHOOK] Error extrayendo datos del lead:', e);
      }
    }

    await sendMessage(from, reply);

    if (reply.includes('56 3443 3212')) {
      import('@/lib/firestore')
        .then(({ db }) => db.collection('conversations').doc(from).set({ botPaused: true }, { merge: true }))
        .catch(e => console.error('[WEBHOOK] Auto-pause error:', e));
      sendMessage(ADMIN_PHONE,
        `🤝 *Luz cedió el turno*\n\n📱 +${from}\n\nLuz está ⏸️ pausada. Respóndele tú directamente.\nCuando termines: *!reanudar ${from}*`
      ).catch(e => console.error('[WEBHOOK] Error notif hand-off:', e));
    }

    saveHistory(from, textBody, reply);
    import('@/lib/firestore')
      .then(({ saveConversationMessage }) => saveConversationMessage(from, textBody, reply))
      .catch(e => console.error('[WEBHOOK] Firestore save error:', e));
    import('@/lib/chat-state')
      .then(({ recalculateChatState }) => recalculateChatState(from, 'mensaje_cliente'))
      .catch(e => console.error('[WEBHOOK] recalculate error:', e));
    console.log('[CHAT] 🤖 Luz →', from, ':', reply);

    // Notificar al admin cuando Luz ya tiene nombre + dirección del lead (una sola vez)
    maybeNotifyLeadCalificado(
      from,
      [...history, { role: 'user', text: textBody }, { role: 'bot', text: reply }]
    ).catch(e => console.error('[WEBHOOK] maybeNotifyLeadCalificado error:', e));

    if (reply.includes('autoescuelaamericana.com/agenda')) {
      const resumen = history
        .filter((h) => h.role === 'user')
        .map((h) => h.text)
        .slice(-6)
        .join(' | ');
      const aviso =
        `🔔 *Lead enviado a /agenda*\n\n` +
        `📱 WhatsApp: +${from}\n` +
        `💬 Últimos mensajes: ${resumen.slice(0, 300)}`;
      await sendMessage(ADMIN_PHONE, aviso).catch((e) =>
        console.error('[WEBHOOK] Error notificando admin:', e)
      );
    }
  } catch (err) {
    console.error('[WEBHOOK] Pipeline error:', err);
    // El lead NUNCA se queda sin respuesta: fallback + aviso al admin
    sendMessage(from, MSG_FALLBACK).catch(e => console.error('[WEBHOOK] Error enviando fallback:', e));
    sendMessage(ADMIN_PHONE,
      `⚠️ *Error en el pipeline de Luz*\n\n📱 +${from}\n💬 "${textBody.slice(0, 120)}"\n\nSe le pidió al lead repetir su mensaje. Si vuelve a fallar, respóndele tú.`
    ).catch(e => console.error('[WEBHOOK] Error notificando pipeline error:', e));
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
