import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { AEA_TOOLS } from '@/ai/tools/aea-tools';
import { checkCoverage, type CoverageResult } from '@/lib/coverage';
// Sólo TIENDAS: la cuenta y la tarjeta ya no se dictan en el chat, van en la ficha.
import { TIENDAS } from '@/lib/cuenta';
import { APARTADO } from '@/lib/ficha-reglas';
import { celularLocal, normalizePhone } from '@/lib/phone';
import { notificarAdmin } from '@/lib/adminNotify';
import { revisarFirma } from '@/lib/meta-firma';

const TOKEN = process.env.META_VERIFY_TOKEN ?? 'aea_webhook_2026';
const WA_TOKEN = process.env.META_WHATSAPP_TOKEN ?? '';
const PHONE_ID = process.env.META_PHONE_NUMBER_ID ?? '';
const APP_SECRET = (process.env.META_APP_SECRET ?? '').trim();

const SYSTEM_PROMPT = `Eres Luz, asesora de ventas de Auto Escuela Americana (AEA). Atiendes por WhatsApp. Eres cálida, directa y genuina — una persona real, no un bot.

## CONTEXTO DE TU TRABAJO

La mayoría de los clientes que te escriben llegaron por Google — buscaron "curso de manejo CDMX" y te escribieron a ti. Ya tienen intención de compra. Están comparando opciones. El que responda mejor y más rápido gana. Tu ventaja: eres la primera en responder y sabes exactamente qué ofrecerles. Ciérralo antes de que hable con otra escuela.

Meta: cerrar en máximo 6 intercambios desde "hola" hasta datos de pago.

## CÓMO HABLAS

- Mensajes cortos — 2 a 4 líneas. Un mensaje breve invita a responder; uno largo lo pierde.
- Un solo emoji por mensaje si aplica. No en cada frase.
- Una sola pregunta por mensaje. Nunca dos.
- Cuando alguien comparte un dato, acúsalo — pero rota entre varias, nunca la misma dos veces seguidas: "¡Perfecto!", "Qué bueno", "Va", "Ah, va", "Oye, qué bien", "Sale", o de plano sin muletilla, entrando directo a la respuesta. Si en tus últimos 2-3 mensajes ya usaste una, usa otra.
- Varía tus frases. No seas repetitiva.
- Muy ocasionalmente (1 de cada 15-20 mensajes, nunca dos seguidos) dejá pasar una imperfección chiquita y natural, como cuando alguien teclea rápido desde el cel: una tilde que falta, un "q" en vez de "que", "xq" en vez de "porque". Nunca en cifras, fechas, horarios, direcciones ni datos de pago — ahí siempre exacto. Es solo para que no suene perfecta, no para que se vea descuidada.
- Lee TODA la conversación antes de responder. Si el cliente ya dijo su nombre, zona u horario, lo tienes — no lo pidas de nuevo.

## FLUJO DE 6 PASOS — MÁXIMO 6 INTERCAMBIOS AL CIERRE

Sigue este orden. Cuando el cliente responde un paso, avanza al siguiente sin pedir validación.

**Paso 1 — Nivel** (si no lo sabes): "¿Ya manejas algo o empiezas desde cero?"
**Paso 2 — Recomendar**: Di el curso + precio + UN beneficio concreto. NO preguntes si les parece bien. Termina el mensaje con la siguiente pregunta.
**Paso 2b — Transmisión** (solo si el curso recomendado NO es Estándar, Automático, Mixto o Moto — es decir: Intermedio, Avanzado, Personas Nerviosas, Intensivo, Coche Propio o English Drive): pregunta "¿Tu coche es estándar o automático?" antes de seguir al horario. NUNCA asumas "estándar" por default — el instructor necesita saber qué coche llevar, y sin este dato no se puede agendar la clase.
**Paso 3 — Horario**: "¿Mañanas o tardes?" → cuando respondan → llama a consultarDisponibilidad(dias=14) → propón las 4 fechas completas del bloque que coincida con su preferencia (ver sección USAR DISPONIBILIDAD COMO HERRAMIENTA DE CIERRE): "Tengo estas 4 clases libres: lunes 22, martes 23, miércoles 24 y jueves 25, todas a las 4:00 pm — ¿empezamos?" El cliente debe ver y confirmar las 4 antes de pagar.
**Paso 4 — Dirección**: Pide calle, número y colonia completos: "¿Me das tu calle, número y colonia para el punto de encuentro del instructor?" Si el cliente da solo colonia o alcaldía (ej: "Del Valle", "Coyoacán", "Narvarte") → NO avances. Pregunta: "¿Y la calle y número?" Necesitas los tres datos antes de continuar.
- Si la colonia es **Cuajimalpa, Santa Fe, Contadero, Zentlapatl o Lomas de Santa Fe**: el punto de encuentro es *Parque La Mexicana (Av. Prolongación Reforma s/n)*. Infórmale: "En tu zona el punto de encuentro es el Parque La Mexicana — ¿te queda bien?"
- Si la colonia es de **Azcapotzalco, Vallejo o Tlalnepantla**: el punto de encuentro es *Colonia Irrigación o Metro Polanco*. Infórmale: "Para tu zona el punto de encuentro es Colonia Irrigación o Metro Polanco — ¿cuál te queda más cerca?"
- Si la colonia es de **Iztapalapa, Iztacalco o Tláhuac**: el punto de encuentro es *Av. Universidad 1407, a pasos de Metro Viveros*. Infórmale: "Para tu zona el punto de encuentro es Av. Universidad 1407 junto a Metro Viveros — ¿te queda bien?"
- Si el cliente quiere hablar con un humano ANTES de decidir (consultar, negociar, sin comprometerse aún): NOTIFICA AL ADMIN PRIMERO con los datos del lead, luego di al cliente "Te conecto con el equipo — ¿quieres que te llamen o prefieres llamar al 56 3443 3212?" NO sigas con flujo de venta automático.
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

## SI DUDAN QUE SEAS HUMANA

Si preguntan "¿eres un bot/chatbot/IA?": respóndelo en UNA línea, ligera, sin jurarlo ni insistir ("¡Aquí para ayudarte! 😊"), y en el MISMO mensaje regresa al paso pendiente con una pregunta — igual que cualquier otro tema fuera de flujo. NUNCA lo repitas ni te defiendas de nuevo si insisten en el mismo tema — ignóralo y sigue con el flujo normal. Quedarte discutiendo si eres o no un bot es lo que más delata que lo eres.

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

**EXTRAS con costo** (no son cursos, se suman al precio):
| Extra | Precio |
|---|---|
| Constancia para permiso de menor de edad (trámite SEMOVI) | **$500** adicionales |

Si preguntan "¿cuánto cuesta la constancia?" la respuesta es **$500**. Nunca digas que no sabes el precio de un extra que está en esta tabla.

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

Para apartar tu lugar son $690 — al hacer la transferencia aceptas nuestros términos de contratación.

Aquí mismo te llega tu ficha en un segundo: ahí están tus fechas, tu horario y los datos para depositar (transferencia, o en ${TIENDAS} si te queda más cerca). Se actualiza sola en cuanto entre tu apartado.

Cuando deposites, pon tu nombre completo en el concepto y mándame el comprobante por aquí. ¿Alguna duda?"

NO dictes la cuenta, la CLABE ni la tarjeta en el chat. Van en la ficha, que se manda sola al guardar la pre-reserva: un solo lugar, siempre al día, y el alumno acaba en la página donde va a reservar en vez de quedarse en la conversación. Si te los pide explícitamente, mándale la liga de la ficha otra vez.

Inmediatamente después de mandar este mensaje → llama a guardarPreReserva con nombre (el del ALUMNO), dirección, curso, transmisión, patrón, la fechaInicio + hora que acordaste, y edadAlumno si la mencionaron. No esperes el comprobante — guárdalo ya. Esto calcula y guarda las 4 fechas reales, no solo la primera.

La transmisión que mandas a guardarPreReserva es la que el cliente confirmó en el Paso 2 (Estándar/Automático) o en el Paso 2b (para el resto de los cursos) — nunca mandes "Estándar" por default si nunca lo confirmó explícitamente.

Llama a guardarPreReserva UNA SOLA VEZ por conversación. Si el cliente después reitera que va a pagar, pregunta algo más, o repite que ya confirmó — NO la vuelvas a llamar; ya quedó guardado. Solo vuelve a llamarla si el patrón, horario o fecha acordados CAMBIAN de lo que ya guardaste.

Si dice que ya pagó pero no manda foto: "¡Qué bien! Mándame la foto del comprobante para confirmar tu lugar 📸"

Después del CIERRE, si el cliente sigue escribiendo sin mandar el comprobante (dudas, plática, "te aviso al rato", "pago en la tarde"): respóndele su punto normalmente y sigue la conversación. NO repitas "sigo al pendiente de tu comprobante" ni variantes de eso en cada mensaje — mencionarlo solo si el cliente pregunta directo por su pago o su reserva. Repetirlo delata que eres un bot y genera desconfianza.

## CUANDO LLEGA EL COMPROBANTE (imagen)

Tú no ves la imagen y NO inscribes a nadie: el comprobante lo revisa una persona del equipo. Cuando confirma el depósito, las clases se agendan solas y la ficha del alumno se actualiza.

Tu trabajo es acusar de recibido de manera cálida en máximo 3 líneas: lo recibiste, el equipo lo está revisando y en cuanto quede confirmado su ficha se actualiza sola con sus clases.

NUNCA digas que ya quedó inscrito ni que sus clases ya están agendadas por haber mandado el comprobante.
Si después del comprobante el alumno quiere cambiar fechas u horario: consultarDisponibilidad y vuelve a llamar a guardarPreReserva con el patrón, fechaInicio y hora nuevos.

## OBJECIONES

⚠️ Para CUALQUIER objeción de precio ("¿hay promo?", "¿hay descuento?", "está caro", "¿tienen oferta?", "¿dan promoción?"): NO llames herramientas — la respuesta está aquí mismo. Responde directo.

- "está caro" → "Te entiendo. Para comparar: el mercado en CDMX cobra hasta $8,999 — aquí desde $3,400, 73.4% más accesible. Y con $690 aparta el lugar; el resto a 3 MSI sin intereses. ¿Te funciona así?"
- "lo pienso" → "Claro. Con $690 te separo el horario mientras decides — si cambias de opinión antes de 48h, se regresa completo."
- "¿hay descuento?" / "¿hay promo?" / "¿tienen promoción?" → "El apartado es la promo — $690 hoy y el lugar es tuyo. El resto a 3 MSI si prefieres."
- "¿es seguro?" → "Totalmente. Instructores certificados, autos con doble control y +220 reseñas en Google 😊"
- "¿puedo conocer las instalaciones?" → "Claro, puedes pasar sin cita a Av. Universidad 1407 (metro Viveros). ¿Qué día te queda?"
- "vi otras opciones" / "está caro comparado" → "Tiene sentido comparar. El mercado en CDMX cobra hasta $8,999 — en AEA es desde $3,400, 73.4% más accesible. ¿Qué te importa más: precio, horarios o calidad del instructor?"

⚠️ **Negociación de un monto fuera de catálogo** — esto es DISTINTO a una objeción de precio. Pasa cuando el cliente propone o pide un número específico que tú no tienes autorizado: "¿me lo dejas en $X?", "¿si pago junto/en efectivo me haces un precio?", "te doy $X y ya", "bájale tantito y cerramos ahorita". NUNCA inventes, aceptes ni niegues un monto por tu cuenta — no tienes autoridad para negociar precio, solo para explicar el catálogo. Responde exactamente: "Eso ya no lo manejo yo, te conecto con un asesor: 56 3443 3212." y detente ahí, sin ofrecer nada más.

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

Cuando quien escribe contrata para otra persona —muy común: "es para mi hijo", "mi hija va a tomar el curso"— el nombre que mandas a guardarPreReserva es SIEMPRE el del ALUMNO, no el de quien te está escribiendo. Y si mencionan la edad del alumno ("tiene 16", "va a cumplir 18"), pásala en edadAlumno. No la preguntes de más: si no sale sola en la conversación, déjala vacía. Sirve para saber por adelantado quién va a necesitar la constancia de SEMOVI.

**Licencia de manejo**: AEA no la tramita directamente. Al terminar el curso el alumno va a SEMOVI — cita en línea, lleva INE y comprobante de domicilio.

**Cancelaciones**: Avisar mínimo 24h antes. Sin aviso, la clase se cuenta como impartida. Si el cliente pide cancelar su clase agendada (o te dice que ya llamó a cancelar), llama a cancelarClaseAlumno (no lleva datos: cancela la de quien te escribe) — avisa sola al instructor y al equipo, no hace falta que tú les escribas. Si te devuelve ok=false, dile al cliente lo que diga "mensaje" y ofrece conectarlo con un asesor.

**Vigencia**: 3 meses para completar el curso. Se puede renovar (consultar asesor).

**Lluvia**: Las clases no se cancelan. Es buena práctica para CDMX. Doble control siempre activo.

**¿Instructoras mujeres?**: NO tenemos instructoras mujeres — todo el equipo de instructores es masculino. NUNCA digas que sí las hay ni que "puedes revisar" o "coordinar" una — es mentira y genera una mala experiencia cuando llega el instructor. Si preguntan por esto, sé honesta y ofrece la alternativa real: "Por ahora todos nuestros instructores son hombres, pero para tu primera clase puede acompañarte alguien de confianza para que conozcan juntos al instructor antes de sentirte cómoda sola con él." Nunca prometas una instructora ni digas "déjame verificar" sobre esto — no hay nada que verificar.

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
- **guardarPreReserva**: Llámala UNA SOLA VEZ al final del CIERRE (Paso 6), justo después de mandar los datos de pago. No esperes el comprobante. Pasa: nombre, dirección completa, curso, transmisión, patrón (lunes-jueves / martes-viernes / fin-de-semana) y la fechaInicio + hora que acordaste. Esto calcula y reserva las 4 fechas reales, no solo la primera. NO la vuelvas a llamar en el resto de la conversación salvo que el patrón, horario o fecha cambien.

## REGLAS ABSOLUTAS

- NUNCA más de una pregunta por mensaje
- NUNCA preguntes algo ya respondido en la conversación
- NUNCA digas que eres IA o bot, pero tampoco insistas o discutas si te lo preguntan más de una vez — respóndelo una sola vez, ligero, y sigue con el flujo
- NUNCA inventes precios, horarios o servicios
- NUNCA mandes el link /agenda — el cierre siempre es aquí, con datos de pago
- NUNCA repitas la oferta de asesor humano si ya la hiciste
- NUNCA repitas el recordatorio del comprobante en mensajes seguidos — solo si el cliente pregunta directo por su pago o reserva
- SIEMPRE usa consultarDisponibilidad antes de proponer fechas concretas
- NUNCA avances al CIERRE con solo colonia o alcaldía — necesitas calle + número + colonia completos
- SIEMPRE llama a guardarPreReserva al terminar el Paso 6 (CIERRE) — pero NUNCA más de una vez por conversación salvo que el patrón/horario/fecha cambien
- NUNCA te quedes callada ni respondas vacío — si no tienes la información, dilo en una línea y regresa al paso pendiente del flujo con una pregunta
- SIEMPRE termina tu mensaje con una pregunta que avance hacia el cierre (salvo el mensaje de datos de pago, que termina con "¿Alguna duda?")`;

const ADMIN_PHONE = (process.env.ADMIN_NOTIFICATION_PHONE ?? '525634433212').trim();
const MSG_FALLBACK = 'Perdón, ¿me repites tu último mensaje? Quiero anotar bien tus datos 📝';

/**
 * Cuando pedir que repita ya falló una vez.
 *
 * El 2026-09-19 un lead real contestó "En las mañanas", Luz devolvió vacío y
 * le pidió repetir; el lead repitió —"Si en las mañanas me acomoda muy bien"—
 * y recibió el MISMO mensaje. Ahí se acabó la conversación. Pedirle tres
 * veces lo mismo a alguien que ya contestó bien no es un tropiezo, es una
 * puerta cerrada: mejor pasarlo con una persona, que es lo único que de
 * verdad lo destraba.
 */
const MSG_ESCALA =
  'Perdón, se me trabó el sistema. Te paso con un asesor para no hacerte perder tiempo: 56 3443 3212 📞';
/** Acuse de una imagen cuando no toca (o no se pudo) contestar con el modelo. */
const MSG_ACUSE_IMAGEN = '¡Recibido! 🙌 Lo revisa el equipo y te confirmamos por aquí.';
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
    const tel = celularLocal(phone);
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
    const tel = celularLocal(phone);
    return { nombre: 'Alumno', zona: 'Por confirmar', calle: null, numero: null, colonia: null, curso: 'Estándar', transmision: 'Estándar', horario: 'mañana' as const, telefono: tel };
  }
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
  const displayPhone = celularLocal(phone);
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
    const dp = celularLocal(phone);
    const coverage = checkCoverage(leadInfo.zona, leadInfo.colonia);
    const dirCompleta = leadInfo.zona +
      (!leadInfo.colonia ? ' ⚠️ *falta colonia*' : '') +
      (!leadInfo.calle ? ' ⚠️ *falta calle/número*' : '');

    const emoji = coverage.tipo === 'domicilio' ? '🔥' : coverage.tipo === 'punto_fijo' ? '📍' : '❓';
    const urgencia = coverage.tipo === 'dudosa'
      ? '\n\n*Zona no identificada — coordinar punto de encuentro con el lead antes de cerrar.*'
      : '';
    await notificarAdmin(
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

function buildTurnContext(): string {
  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Mexico_City',
  });
  // El teléfono del cliente ya no viaja aquí: las herramientas lo reciben del
  // servidor, así que el modelo no tiene nada que copiar ni que equivocar.
  return `[Fecha actual: ${hoy}. Usa este año para calcular cualquier fecha futura.]`;
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
    model: 'googleai/gemini-2.5-flash',
    system: SYSTEM_PROMPT,
    tools: AEA_TOOLS,
    // El teléfono lo pone el servidor, no el modelo: ver telefonoDelTurno.
    ...(clientPhone ? { context: { telefono: clientPhone } } : {}),
    messages: history.map((h) => ({
      role: h.role === 'bot' ? ('model' as const) : ('user' as const),
      content: [{ text: h.text }],
    })),
    prompt: `${buildTurnContext()}\n\n${userMessage}`,
  }));

  if (!result) {
    console.error('[WEBHOOK] Gemini timeout after', GEMINI_TIMEOUT_MS, 'ms');
    notificarAdmin(
      `⚠️ *Luz se congeló* — timeout ${GEMINI_TIMEOUT_MS / 1000}s\n\n📱 +${clientPhone ?? 'desconocido'}\n💬 "${userMessage.slice(0, 120)}"\n\nRevisa y responde tú.`
    ).catch(e => console.error('[WEBHOOK] Error notificando timeout:', e));
    return MSG_FALLBACK;
  }
  console.log('[WEBHOOK] Gemini usage:', JSON.stringify(result.usage));
  let text: string | undefined = result.text?.trim();

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
        model: 'googleai/gemini-2.5-flash',
        tools: AEA_TOOLS,
        ...(clientPhone ? { context: { telefono: clientPhone } } : {}),
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

  /**
   * Un tercer intento SIN herramientas se probó y se descartó: al replayar el
   * turno que falló el 2026-09-19, el modelo escribió la llamada como texto
   * —"consultarDisponibilidad(dias=14)"— y se inventó cuatro fechas con hora
   * que no existían en el calendario. Eso se le habría mandado tal cual al
   * cliente. Quedarse callada es malo; ofrecerle horarios falsos es peor.
   *
   * Por eso el último recurso es una persona, no otro intento del modelo.
   */

  // Red de seguridad para lo mismo por otra vía: si en la respuesta viene el
  // nombre de una herramienta escrito como si fuera código, el modelo está
  // narrando lo que debió ejecutar. Lo que siga es inventado.
  if (text && /\b(consultarDisponibilidad|confirmarInscripcion|guardarPreReserva|cancelarClaseAlumno|consultarCatalogoCursos|consultarProgramaCurso)\s*\(/.test(text)) {
    console.error('[WEBHOOK] La respuesta narra una llamada a herramienta — se descarta:', text.slice(0, 160));
    text = undefined;
  }

  if (!text) {
    // ¿Ya le habíamos pedido que repitiera? Entonces repetir no es el camino.
    const ultimoDeLuz = [...history].reverse().find(h => h.role === 'bot')?.text;
    const yaPedimosRepetir = ultimoDeLuz === MSG_FALLBACK;

    console.error(
      `[WEBHOOK] Sin respuesta utilizable tras el reintento — ${yaPedimosRepetir ? 'pasando a asesor' : 'pidiendo que repita'}`
    );
    notificarAdmin(
      `⚠️ *Luz respondió vacío (2 intentos)*\n\n📱 +${clientPhone ?? 'desconocido'}\n💬 "${userMessage.slice(0, 120)}"\n\n${yaPedimosRepetir ? 'Es la SEGUNDA vez seguida: se le pasó el número del asesor. Contéstale tú.' : 'Se le pidió al lead repetir su mensaje. Revisa por si acaso.'}`
    ).catch(e => console.error('[WEBHOOK] Error notificando respuesta vacía:', e));

    return yaPedimosRepetir ? MSG_ESCALA : MSG_FALLBACK;
  }
  return text;
}

/**
 * Guarda qué le mandamos a un lead, indexado por el id de Meta.
 *
 * Un 200 al enviar no garantiza entrega: Meta puede descartar el mensaje después
 * y sólo avisa por callback, que llega con el id y nada más. Sin esta memoria no
 * hay forma de saber QUÉ mensaje se perdió ni de reintentarlo.
 *
 * Sólo para leads: los avisos al admin ya viajan duplicados por plantilla.
 */
async function recordarEnvio(wamid: string, to: string, text: string, phoneId: string, yaReintentado = false): Promise<void> {
  if (!wamid || to === ADMIN_PHONE) return;
  try {
    const { db } = await import('@/lib/firestore');
    await db.collection('mensajes_enviados').doc(wamid).set({
      to, text, phoneId, at: Date.now(), reintentado: yaReintentado,
    });
  } catch (e) {
    console.error('[WEBHOOK] No se pudo recordar el envío (se continúa):', e);
  }
}


/** Extrae el wamid de la respuesta de Meta y lo registra. Sin esto, el eco de un
 *  envío que no es de texto se confundiría con una respuesta humana. */
function recordarEnvioDesdeRespuesta(responseText: string, to: string, etiqueta: string, phoneId: string): void {
  try {
    const wamid = JSON.parse(responseText)?.messages?.[0]?.id;
    if (wamid) void recordarEnvio(wamid, to, etiqueta, phoneId);
  } catch {
    /* respuesta no-JSON: el envío ya se registró en el log */
  }
}

/** Códigos de Meta que significan "no hay forma de entregarlo": reintentar es inútil. */
const ERRORES_SIN_REMEDIO = [131047, 131051, 131026, 131052];

/**
 * Un mensaje a un lead que Meta descartó. Ningún camino puede dejar a un lead
 * sin respuesta, así que se intenta una vez más y, si no hay remedio, se te
 * avisa con el teléfono y el texto para que lo retomes a mano.
 *
 * Un solo reintento: si el segundo también falla, insistir sólo quema cuota.
 */
async function rescatarMensajePerdido(
  wamid: string,
  codigos: (number | undefined)[],
  detalle: string,
): Promise<void> {
  if (!wamid) return;
  const { db } = await import('@/lib/firestore');
  const ref = db.collection('mensajes_enviados').doc(wamid);
  const snap = await ref.get();
  if (!snap.exists) return; // no era un mensaje a lead, o ya se limpió

  const { to, text, phoneId: pid, reintentado } = snap.data() as {
    to: string; text: string; phoneId: string; reintentado: boolean;
  };

  const sinRemedio = codigos.some(c => c !== undefined && ERRORES_SIN_REMEDIO.includes(c));

  if (!reintentado && !sinRemedio) {
    await ref.set({ reintentado: true }, { merge: true });
    console.log('[WA-STATUS] ↻ reintentando envío a', to);
    const ok = await sendMessage(to, text, pid, true);
    if (ok) return; // el reintento salió; su propio callback dirá si llegó
  }

  // Si el lead tiene una ficha sin pagar, la plantilla prereserva_pendiente sí
  // lo alcanza fuera de la ventana de 24h. Sólo aplica a quien de verdad apartó:
  // mandarle "tu pre-reserva sigue apartada" a quien nunca apartó sería mentirle.
  const rescatado = await avisarPreReservaPorPlantilla(to, pid);

  const { notificarAdmin } = await import('@/lib/adminNotify');
  await notificarAdmin(
    `🚨 *Lead sin respuesta* — WhatsApp rechazó el mensaje\n` +
    `📱 +${to}\n` +
    `❌ ${detalle || 'sin detalle'}\n` +
    `💬 "${text.slice(0, 160)}"\n` +
    (rescatado
      ? `\n✅ Se le mandó la plantilla de pre-reserva pendiente.`
      : `\nSin ficha pendiente — contáctalo tú: wa.me/${to}`)
  );
}

/**
 * Alcanza a un lead con ficha sin pagar usando la plantilla aprobada, que no
 * depende de la ventana de 24h. Devuelve si se pudo mandar.
 */
async function avisarPreReservaPorPlantilla(to: string, phoneId: string): Promise<boolean> {
  try {
    const { db } = await import('@/lib/firestore');
    const ficha = await db.collection('fichas').doc(to).get();
    if (!ficha.exists) return false;

    const f = ficha.data() as { studentName?: string; curso?: string; depositoMonto?: number; estado?: string; comprobanteURL?: string | null };
    // Ya pagó, o mandó comprobante y está en revisión: en los dos casos pedirle
    // el apartado otra vez es perseguir a quien ya depositó.
    if (f.estado === 'reservada' || f.comprobanteURL) return false;

    const nombre = (f.studentName || '').split(' ')[0] || 'Hola';
    const curso = f.curso || 'de manejo';
    const monto = `$${(f.depositoMonto ?? APARTADO).toLocaleString('es-MX')}`;

    const ok = await sendTemplateMessage(to, 'prereserva_pendiente', 'es_MX', [nombre, curso, monto], phoneId);
    if (ok) console.log('[WA-STATUS] 📨 plantilla de pre-reserva enviada a', to);
    return ok;
  } catch (e) {
    console.error('[WA-STATUS] Error mandando plantilla de pre-reserva:', e);
    return false;
  }
}

async function sendMessage(to: string, text: string, phoneId?: string, esReintento = false): Promise<boolean> {
  const actualPhoneId = phoneId || PHONE_ID;
  const url = `https://graph.facebook.com/v21.0/${actualPhoneId}/messages`;
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
  if (res.ok) {
    const wamid = await res.clone().json()
      .then((j: { messages?: { id?: string }[] }) => j?.messages?.[0]?.id ?? '')
      .catch(() => '');
    // El reintento se marca como ya reintentado: si no, su propio fallo lo
    // volvería a disparar y el mensaje se reenviaría en bucle quemando cuota.
    await recordarEnvio(wamid, to, text, actualPhoneId, esReintento);
  }
  if (!res.ok) {
    console.error('[WEBHOOK] WhatsApp API error:', res.status, await res.text());
    // Si la alerta era para el admin y falló (típicamente ventana de 24h cerrada, #131047),
    // cae a la plantilla aprobada — se entrega sin importar la ventana, así el admin nunca
    // se pierde un aviso de "necesita humano" o de que Luz falló. El texto libre normal
    // sigue funcionando dentro de la ventana; esto es solo la red de seguridad.
    if (to === ADMIN_PHONE) {
      const tipo =
        (text.split('\n')[0] || '').replace(/[*_~`>#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) ||
        'Alerta AEA';
      const phoneMatch = text.match(/\+?\d[\d\s]{8,}\d/);
      const contacto = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : 'N/D';
      await sendTemplateMessage(ADMIN_PHONE, 'alerta_aea', 'es_MX', [tipo, contacto], actualPhoneId).catch(
        (e) => console.error('[WEBHOOK] Fallback plantilla admin falló:', e)
      );
    }
    return false;
  }
  return true;
}

// Envía una plantilla aprobada por Meta (no depende de la ventana de 24h).
async function sendTemplateMessage(
  to: string,
  templateName: string,
  lang: string,
  bodyParams: string[],
  phoneId?: string,
): Promise<boolean> {
  const actualPhoneId = phoneId || PHONE_ID;
  const url = `https://graph.facebook.com/v21.0/${actualPhoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: lang },
        components: [
          { type: 'body', parameters: bodyParams.map((t) => ({ type: 'text', text: t })) },
        ],
      },
    }),
  });
  if (!res.ok) {
    console.error('[WEBHOOK] WhatsApp template error:', res.status, await res.text());
    return false;
  }
  console.log('[WEBHOOK] 📨 Plantilla admin entregada:', templateName);
  return true;
}

async function sendImageMessage(to: string, mediaId: string, caption?: string, phoneId?: string): Promise<void> {
  const actualPhoneId = phoneId || PHONE_ID;
  const url = `https://graph.facebook.com/v21.0/${actualPhoneId}/messages`;
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
    recordarEnvioDesdeRespuesta(responseText, to, '[imagen]', actualPhoneId);
  }
}

async function sendDocumentMessage(to: string, mediaId: string, filename: string, caption?: string, phoneId?: string): Promise<void> {
  const actualPhoneId = phoneId || PHONE_ID;
  const url = `https://graph.facebook.com/v21.0/${actualPhoneId}/messages`;
  const documentPayload: Record<string, string> = { id: mediaId, filename };
  if (caption) documentPayload.caption = caption;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: documentPayload,
  };
  console.log('[WEBHOOK] sendDocumentMessage →', to, '| mediaId:', mediaId);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const responseText = await res.text();
  if (!res.ok) {
    console.error('[WEBHOOK] WhatsApp document API error:', res.status, responseText);
  } else {
    console.log('[WEBHOOK] Documento reenviado OK:', responseText.slice(0, 120));
    recordarEnvioDesdeRespuesta(responseText, to, '[documento]', actualPhoneId);
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
      '`!cerrar <número>` — Cerrar como perdido',
      '`!inscrito <número>` — Cerrar como GANADO (ya pagó)',
      '',
      '_El número puede ser con o sin código de país (ej: 5512345678 o 525512345678)_',
    ].join('\n');
  }

  const dp = celularLocal(targetPhone);

  if (cmd === '!pausa') {
    const docId = await resolveDocId(db, targetPhone);
    await db.collection('conversations').doc(docId).set({ botPaused: true, nextFollowupAt: null }, { merge: true });
    return `⏸️ Luz pausada para +${dp}\n\nAhora puedes responderle tú directamente. Usa *!reanudar ${dp}* cuando quieras que Luz retome.`;
  }

  if (cmd === '!reanudar') {
    const docId = await resolveDocId(db, targetPhone);
    await db.collection('conversations').doc(docId).set({ botPaused: false }, { merge: true });
    return `▶️ Luz reanudada para +${dp}\n\nEl próximo mensaje del lead lo responderá Luz automáticamente.`;
  }

  if (cmd === '!estado') {
    // Era el cuerpo de resolveDocId escrito otra vez, cinco líneas más abajo
    // de la función que ya hace exactamente esto.
    const snap = await db.collection('conversations').doc(await resolveDocId(db, targetPhone)).get();
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

  // Dos comandos y no uno con parámetro: escribiéndolos desde el celular, un
  // '!cerrar 55... ganado' se presta a que se olvide la última palabra, y el
  // default silencioso era contar como perdido a alguien que sí pagó.
  if (cmd === '!cerrar' || cmd === '!inscrito') {
    const gano = cmd === '!inscrito';
    const docId = await resolveDocId(db, targetPhone);
    const { updateChatState } = await import('@/lib/firestore');
    const { Timestamp } = await import('firebase-admin/firestore');
    await updateChatState(docId, {
      chatState: 'cerrado',
      chatReason: gano ? 'Inscrito — cerrado por admin' : 'Cerrado manualmente por admin',
      chatUrgency: 'ninguna',
      closedAt: Timestamp.now(),
      closedOutcome: gano ? 'ganado' : 'perdido',
      nextFollowupAt: null,
    }, 'manual');
    return gano
      ? `✅ +${dp} marcado como *inscrito*. Cuenta como venta ganada.`
      : `✅ Conversación con +${dp} cerrada como *perdida*.\n\n_Si en realidad se inscribió, usa *!inscrito ${dp}* para que cuente en las métricas._`;
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
  let documentMediaId = '';
  let documentFilename = '';
  let audioMediaId = '';
  let audioMimeType = 'audio/ogg';
  let locationData: { latitude?: number; longitude?: number; name?: string; address?: string } = {};
  let leadSource: string | null = null;
  let waDisplayName: string | null = null;
  let phoneId = PHONE_ID;

  // Antes de leer nada: ¿lo mandó Meta? Va fuera del try de abajo, que contesta
  // 200 ante cualquier error — un POST falsificado no debe recibir un "recibido".
  const crudo = await request.text();
  const firma = revisarFirma(crudo, request.headers.get('x-hub-signature-256'), APP_SECRET);
  if (firma === 'invalida') {
    console.error('[WEBHOOK] Firma de Meta inválida — POST rechazado');
    return new NextResponse('Forbidden', { status: 403 });
  }
  if (firma === 'sin_secreto') {
    console.warn('[WEBHOOK] META_APP_SECRET no está configurado: el POST se acepta sin verificar la firma');
  }

  try {
    const body = JSON.parse(crudo);
    console.log('[WEBHOOK] POST recibido:', JSON.stringify(body).slice(0, 300));
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    // Responder SIEMPRE desde el número donde llegó el mensaje: es el que tiene la ventana
    // de 24h abierta con el cliente. Antes un guard con IDs hardcodeados descartaba números
    // no reconocidos y caía al default (PHONE_ID), causando #131030 "recipient not in allowed
    // list" cuando el número de producción cambiaba y el secret quedaba desactualizado.
    phoneId = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? PHONE_ID;
    console.log('[WEBHOOK] Mensaje recibido en:', phoneId);

    // Meta reporta aquí el estado FINAL de cada mensaje que enviamos. Es la única
    // fuente que dice si un aviso llegó: la respuesta del envío puede ser 200 con
    // id de mensaje y aun así Meta lo descarta después —típico con la ventana de
    // 24h cerrada (#131047)—. Sin esto, esos avisos desaparecían sin dejar rastro.
    const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
    if (Array.isArray(statuses) && statuses.length > 0) {
      for (const st of statuses) {
        const base = `${st.status} → +${st.recipient_id} (id ${String(st.id ?? '').slice(-12)})`;
        if (st.status === 'failed') {
          const errs = (st.errors ?? [])
            .map((e: { code?: number; title?: string; message?: string; error_data?: { details?: string } }) =>
              `#${e.code} ${e.title ?? e.message ?? ''}${e.error_data?.details ? ` — ${e.error_data.details}` : ''}`)
            .join(' | ');
          console.error('[WA-STATUS] ❌', base, '|', errs || '(sin detalle)');
          const codigos = (st.errors ?? []).map((e: { code?: number }) => e.code);
          await rescatarMensajePerdido(String(st.id ?? ''), codigos, errs).catch(e =>
            console.error('[WA-STATUS] Error en el rescate:', e));
        } else {
          console.log('[WA-STATUS]', base);
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    // Eco de lo que sale del número de la escuela. Meta lo manda solo si el campo
    // 'message_echoes' está suscrito en la app (Webhooks → WhatsApp Business
    // Account); si no lo está, este bloque simplemente nunca entra.
    //
    // El id es lo que distingue quién escribió: todo lo que envía el sistema queda
    // en 'mensajes_enviados' con su wamid. Si el eco trae un id que NO está ahí,
    // lo tecleó una persona desde el celular. Sin esa comprobación Luz se pausaría
    // a sí misma con cada respuesta que manda.
    const echoes = body?.entry?.[0]?.changes?.[0]?.value?.message_echoes;
    if (Array.isArray(echoes) && echoes.length > 0) {
      const [{ db }, { Timestamp }] = await Promise.all([
        import('@/lib/firestore'),
        import('firebase-admin/firestore'),
      ]);
      for (const eco of echoes) {
        const wamid = String(eco?.id ?? '');
        const destino = normalizePhone(String(eco?.to ?? ''));
        if (!wamid || !destino) continue;
        // Los avisos al admin no se registran en 'mensajes_enviados' a propósito,
        // así que su eco parecería escrito a mano. El admin no es un lead: fuera.
        if (destino === ADMIN_PHONE) continue;

        const nuestro = await db.collection('mensajes_enviados').doc(wamid).get()
          .then(d => d.exists)
          .catch(() => true); // ante la duda, tratarlo como nuestro y no pausar

        if (nuestro) continue;

        console.log('[ECO] Respuesta humana desde el número de la escuela a', destino, '— pausando a Luz');
        const docId = await resolveDocId(db, destino);
        await db.collection('conversations').doc(docId).set({
          botPaused: true,
          chatLastBy: 'humano',
          nextFollowupAt: null,
          pausadoPorHumanoAt: Timestamp.now(),
        }, { merge: true }).catch(e => console.error('[ECO] Error pausando:', e));
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    if (!message) {
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    const msgId: string = message.id ?? '';
    from = normalizePhone(message.from ?? '');

    // Idempotencia: WhatsApp entrega webhooks "al menos una vez"; Meta puede reenviar el mismo
    // mensaje. create() es atómico — si el doc ya existe, es duplicado y lo ignoramos. Fail-open:
    // si Firestore falla por otra razón, se continúa procesando el mensaje.
    if (msgId) {
      try {
        const { db } = await import('@/lib/firestore');
        await db.collection('mensajes_procesados').doc(msgId).create({ at: Date.now() });
      } catch (e) {
        const code = (e as { code?: number })?.code;
        if (code === 6 || /ALREADY_EXISTS/i.test(String((e as Error)?.message))) {
          console.log('[WEBHOOK] Mensaje duplicado', msgId, '— ignorado (idempotencia)');
          return new NextResponse('EVENT_RECEIVED', { status: 200 });
        }
        console.error('[WEBHOOK] Idempotencia: error no-duplicado, se continúa:', e);
      }
    }

    textBody = message?.text?.body ?? '';
    messageType = message?.type ?? 'text';
    if (messageType === 'image') {
      imageMediaId = message?.image?.id ?? '';
      console.log('[WEBHOOK] Imagen recibida — mediaId:', imageMediaId, '| mime:', message?.image?.mime_type);
    }
    if (messageType === 'document') {
      documentMediaId = message?.document?.id ?? '';
      documentFilename = message?.document?.filename ?? 'comprobante.pdf';
      console.log('[WEBHOOK] Documento recibido — mediaId:', documentMediaId, '| mime:', message?.document?.mime_type, '| filename:', documentFilename);
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

    if (!from || (messageType !== 'image' && messageType !== 'document' && messageType !== 'location' && messageType !== 'audio' && !textBody)) {
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

  // ── La hora del mensaje entrante, antes de ramificar ─────────────────────
  // La ventana de 24 h de Meta es del número de teléfono, no del bot que
  // contestó. Antes esto se apuntaba hasta el flujo de Luz, así que a quien
  // atendía Marco —los instructores— se le quedaba `lastLeadActivity` vieja y
  // Vía Urb creía que la ventana estaba cerrada: nadie podía recibir su código
  // por WhatsApp. Las ramas de ubicación, audio y comprobante también salían
  // antes de llegar ahí. Una sola escritura aquí las cubre todas.
  //
  // Con AWAIT: las ramas de abajo regresan la respuesta HTTP de inmediato y
  // Cloud Run puede suspender la instancia con la escritura a medias.
  try {
    const { updateLeadActivity } = await import('@/lib/firestore');
    await updateLeadActivity(from);
  } catch (e) {
    // Fail-open: que no se pierda el mensaje por no poder apuntar la hora.
    console.error('[WEBHOOK] Error actualizando lead activity:', e);
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

  // ── Quien ya es de la casa no entra al embudo ────────────────────────────
  // `motivoNoEsProspecto` decidía esto en los crons de recordatorio y
  // seguimiento, pero NO en la respuesta en vivo: una instructora de Vía Urb
  // que escribiera «va» recibía el saludo de ventas de Luz y un curso de
  // manejo. Y escribir es justo lo que tiene que hacer para que se le pueda
  // mandar su código —la ventana de 24 h la abre su mensaje—, así que el
  // embudo la alcanzaba precisamente cuando entraba a trabajar.
  //
  // Va DESPUÉS de Marco a propósito: `motivoNoEsProspecto` también marca a los
  // candidatos, y ponerlo antes se los tragaría a todos.
  //
  // La hora de su mensaje ya quedó apuntada arriba, que es lo único que ella
  // necesita de este webhook. Aquí solo se calla el bot y lo ve una persona:
  // una respuesta equivocada es peor que ninguna.
  {
    const { motivoNoEsProspecto, saveUserMessage } = await import('@/lib/firestore');
    const { EXPLICACION } = await import('@/lib/ventas-excluidos');
    const motivo = await motivoNoEsProspecto(from).catch(() => null);
    if (motivo) {
      console.log('[WEBHOOK] Luz no contesta a', from, '—', EXPLICACION[motivo]);

      // Lo que mandó, con nombre para lo que no es texto. La nota de voz no se
      // transcribe: esa rama va más abajo y gastar Gemini en quien no va a
      // recibir respuesta no tiene para qué.
      const loQueEscribio =
        textBody ||
        (messageType === 'image' ? '[imagen]'
          : messageType === 'document' ? `[documento] ${documentFilename}`
          : messageType === 'audio' ? '[nota de voz]'
          : messageType === 'location' ? '[ubicación]'
          : `[${messageType}]`);

      // Callar al bot no es borrar a la persona. Sin esto su mensaje no quedaba
      // en ningún lado —solo la hora— y la conversación en el panel aparecía
      // vacía: para quien la lee, nunca escribió.
      await saveUserMessage(from, loQueEscribio).catch(e =>
        console.error('[WEBHOOK] Error guardando el mensaje de un no-prospecto:', e)
      );

      // Al propio número de la escuela no se le avisa de sí mismo.
      if (motivo !== 'numero_de_la_escuela') {
        notificarAdmin(
          `💬 *Escribió alguien que no es prospecto*\n\n📱 +${from}\n${EXPLICACION[motivo]}\n\n_${loQueEscribio.slice(0, 300)}_\n\nLuz no le contestó.`
        ).catch(e => console.error('[WEBHOOK] Error avisando de un no-prospecto:', e));
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
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
        await sendMessage(from, 'No pude escuchar bien tu nota de voz — ¿me lo puedes escribir? 🙏', phoneId);
        return new NextResponse('EVENT_RECEIVED', { status: 200 });
      }
    } catch (e) {
      console.error('[WEBHOOK] Error transcribiendo audio:', e);
      await sendMessage(from, 'No pude escuchar bien tu nota de voz — ¿me lo puedes escribir? 🙏', phoneId);
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }
  }

  // Ubicación GPS compartida por el cliente
  if (messageType === 'location') {
    const { latitude, longitude, name: locName, address: locAddress } = locationData;
    const mapsUrl = latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : null;
    const resumen = [locName, locAddress].filter(Boolean).join(' — ') || 'Sin nombre';

    // Notificar al admin con el pin de Maps
    notificarAdmin(
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
    await sendMessage(from, `¡Listo! Guardé tu ubicación 📍 El instructor llegará ahí el día de tu primera clase.`, phoneId);
    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  // Imagen o PDF: casi siempre un comprobante. Se adjunta y se avisa; NO agenda.
  //
  // Antes esta rama extraía los datos del lead con el modelo y creaba las
  // cuatro clases en Calendar con sólo recibir la imagen, sin que nadie hubiera
  // mirado el monto. Y como corre antes de revisar si la conversación está
  // cerrada, un alumno ya inscrito que mandaba el comprobante de su saldo —o
  // cualquier foto— recibía OTRO bloque de cuatro clases y sus fechas
  // reescritas. Las clases se crean en un solo lugar: cuando una persona
  // confirma el apartado y la ficha pasa a 'reservada' (lib/fichaLuz.ts).
  if (messageType === 'image' || messageType === 'document') {
    const mediaId = messageType === 'document' ? documentMediaId : imageMediaId;
    const history = await getHistory(from);
    // Extraer nombre del lead del historial para la notificación inicial
    const nombreRapido = history.find(h => h.role === 'user' && h.text.length > 2 && h.text.length < 40 && !/http|#|\?/.test(h.text))?.text ?? `+${from}`;

    notificarAdmin(
      `🔴 *COMPROBANTE — ${nombreRapido}*\n📱 +${from}\n⏳ Verificar monto y banco 👇`
    ).catch((e) => console.error('[WEBHOOK] Error notificando admin (imagen):', e));

    // Corta el seguimiento automático en cuanto llega el comprobante, ANTES de
    // intentar agendar. Si la inscripción no se completa —dirección incompleta,
    // conflicto de horario, menos de 4 slots— la conversación no llega a
    // 'cerrado' y el cron la seguía tratando como lead abierto: le mandaba la
    // secuencia 2h→24h→72h→7d a alguien que ya depositó, y acababa marcándola
    // como 'frío'. Con await: en Cloud Run lo que queda en segundo plano después
    // de responder el HTTP puede no ejecutarse nunca.
    try {
      const [{ db }, { Timestamp }] = await Promise.all([
        import('@/lib/firestore'),
        import('firebase-admin/firestore'),
      ]);
      await db.collection('conversations').doc(from).set(
        { comprobanteRecibidoAt: Timestamp.now(), nextFollowupAt: null },
        { merge: true }
      );
    } catch (e) {
      console.error('[WEBHOOK] Error marcando comprobante recibido:', e);
    }

    // Reenviar el comprobante al admin para verificar monto y banco. El pie
    // lleva la liga que lo confirma: la decisión se toma mirando esta imagen, así
    // que el botón vive aquí y no al final de un viaje por el panel. Si la ficha
    // todavía no existe (mandó el comprobante antes de cerrar con Luz) no hay
    // token y el pie va sin liga.
    const tokenFicha = await import('@/lib/ficha-enlace')
      .then(({ tokenDeFicha }) => tokenDeFicha(from))
      .catch(() => null);
    let subida: Promise<void> = Promise.resolve();
    if (mediaId) {
      const pie =
        `${nombreRapido} · +${from}` +
        (tokenFicha
          ? `\n👉 Confirmar apartado: https://app.autoescuelaamericana.com/admin/confirmar/${tokenFicha}`
          : '');

      if (messageType === 'document') {
        sendDocumentMessage(ADMIN_PHONE, mediaId, documentFilename, pie, phoneId).catch(
          (e) => console.error('[WEBHOOK] Error reenviando comprobante al admin:', e)
        );
      } else {
        sendImageMessage(ADMIN_PHONE, mediaId, pie, phoneId).catch(
          (e) => console.error('[WEBHOOK] Error reenviando comprobante al admin:', e)
        );
      }

      // Copia permanente al bucket privado y se cuelga de la ficha. Lo que NO se
      // hace aquí es marcar el depósito como pagado: por aquí entra CUALQUIER
      // imagen o PDF que manden —una licencia, una identificación, una captura
      // de pantalla, una foto del coche— y con eso la ficha pasaba a 'reservada'
      // sin que nadie mirara el monto ni el banco. El alumno leía "✅ Lugar
      // confirmado — depósito recibido" en su ficha por haber mandado una foto,
      // y al admin le llegaba "Depósito PAGADO". Ahora el comprobante queda
      // adjunto y en revisión; lo confirma una persona en /admin/reservas.
      subida = import('@/lib/comprobantes')
        .then(async ({ subirComprobante }) => {
          const path = await subirComprobante(mediaId, from);
          console.log('[WEBHOOK] Comprobante en Storage:', path);
          // Se cuelga sólo si YA hay ficha: `tokenFicha` es null cuando no
          // existe. actualizarFicha crea el documento si no está, y por aquí
          // entra cualquier imagen —una licencia, una captura, la foto del
          // coche—, así que sin esta guarda una foto de alguien que nunca cerró
          // con Luz sembraba una ficha vacía, sin nombre ni teléfono, en
          // /admin/reservas. El admin ya tiene la imagen: se la reenvía el
          // bloque de arriba, con el pie sin liga.
          const comprobanteURL = `/api/admin/comprobante?path=${encodeURIComponent(path)}`;
          if (!tokenFicha) {
            // Se deja apuntado en la conversación: guardarPreReserva lo cuelga
            // cuando la ficha nazca. Sin esto la ficha nacía sin comprobante y
            // confirmar el apartado no la pasaba a 'reservada' —revisarFicha
            // pide las dos cosas—, así que no se creaba ninguna clase.
            console.log('[WEBHOOK] Comprobante sin ficha todavía, queda apuntado en la conversación:', from);
            const { db } = await import('@/lib/firestore');
            await db.collection('conversations').doc(from).set({ comprobantePendienteURL: comprobanteURL }, { merge: true });
            return;
          }
          const { actualizarFicha } = await import('@/lib/fichaLuz');
          await actualizarFicha(from, { comprobanteURL });
        })
        .catch((e) => console.error('[WEBHOOK] Error subiendo comprobante a Storage:', e));
    }

    const etiqueta = messageType === 'document' ? `[documento] ${documentFilename}` : '[imagen]';
    const { getConversation, saveImageMessage, saveUserMessage } = await import('@/lib/firestore');
    const convData = await getConversation(from).catch(() => null);

    // Una persona ya lo está atendiendo: la imagen le llegó al admin arriba, con
    // su liga. Se guarda para que se vea en el panel y Luz no se mete.
    if (convData?.botPaused) {
      await saveUserMessage(from, etiqueta).catch(e => console.error('[WEBHOOK] saveUserMessage (imagen, pausa):', e));
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    let reply: string;
    if (convData?.chatState === 'cerrado') {
      // Ya inscrito (o cerrado a mano): acuse fijo, sin modelo. Lo normal aquí
      // es el comprobante del saldo, y lo que toca es que lo vea una persona.
      reply = MSG_ACUSE_IMAGEN;
    } else if (history.length === 0) {
      // Primer mensaje de alguien nuevo y es una foto: se le saluda como a
      // cualquiera, en vez de dejarlo sin respuesta.
      reply = buildWelcomeMessage(waDisplayName, leadSource !== null);
    } else {
      // Sin ficha, Luz puede crearla en este mismo turno: el comprobante tiene
      // que estar apuntado antes, o la ficha nace sin él.
      if (!tokenFicha) await subida;
      const queMando = messageType === 'document' ? 'un documento (PDF)' : 'una imagen';
      const sobreLaFicha = tokenFicha
        ? `Ya tiene su ficha guardada: NO llames ninguna herramienta.`
        : `Todavía NO tiene ficha guardada. Si ya tienes nombre, dirección completa y las 4 fechas acordadas, llama a guardarPreReserva ahora; si te falta alguno de esos datos, pídeselo en este mismo mensaje.`;
      reply = await generateReply(
        `[El cliente acaba de mandar ${queMando}. Tú no puedes verlo; lo más probable es que sea su comprobante de pago. ` +
        `Dile que lo recibiste y que el equipo lo está revisando: en cuanto quede confirmado, su ficha se actualiza sola y ahí aparecen sus clases. ` +
        `NO le digas que ya quedó inscrito ni que sus clases ya están agendadas — eso pasa hasta que una persona confirma el depósito. ` +
        `${sobreLaFicha} Máximo 3 líneas.]`,
        history, from
      );
      // Pedirle que "repita su último mensaje" a quien mandó una foto no tiene
      // sentido, y pasarlo con un asesor tampoco: el admin ya tiene la imagen.
      if (reply === MSG_FALLBACK || reply === MSG_ESCALA) reply = MSG_ACUSE_IMAGEN;
    }

    await sendMessage(from, reply, phoneId);
    saveHistory(from, '[comprobante de pago]', reply);
    try {
      await saveImageMessage(from, mediaId || 'unknown', reply);
    } catch (e) {
      console.error('[WEBHOOK] Firestore save error:', e);
    }

    if (convData?.chatState === 'cerrado') {
      // Igual que un texto después del cierre: queda marcado en el panel.
      try {
        const [{ db }, { Timestamp }] = await Promise.all([
          import('@/lib/firestore'),
          import('firebase-admin/firestore'),
        ]);
        await db.collection('conversations').doc(from).set({
          postCierreAlerta: { texto: `(${messageType})`, tipo: messageType, at: Timestamp.now() },
        }, { merge: true });
      } catch (e) {
        console.error('[WEBHOOK] postCierreAlerta (imagen):', e);
      }
    } else {
      // Con AWAIT: si se deja en segundo plano después de regresar la respuesta
      // HTTP, Cloud Run puede suspender la instancia a medias y el recálculo
      // nunca llega a ejecutarse.
      try {
        const { recalculateChatState } = await import('@/lib/chat-state');
        await recalculateChatState(from, 'mensaje_luz');
      } catch (e) {
        console.error('[WEBHOOK] recalculate error (imagen):', e);
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  }

  const history = await getHistory(from);
  const isNewLead = history.length === 0;

  const fuente = leadSource;
  if (isNewLead && fuente) {
    import('@/lib/firestore')
      .then(({ saveLeadSource }) => saveLeadSource(from, fuente))
      .catch((e) => console.error('[WEBHOOK] Error guardando la fuente del lead:', e));
  }

  // Nuevo lead — enviar menú de bienvenida y salir
  if (isNewLead) {
    const fuenteTexto = leadSource ? `📣 Fuente: ${leadSource}` : '📣 Fuente: directa';
    const nombreTexto = waDisplayName ? `\n👤 ${waDisplayName}` : '';
    notificarAdmin(`🆕 *Nuevo lead*\n\n📱 +${from}${nombreTexto}\n${fuenteTexto}`)
      .catch((e) => console.error('[WEBHOOK] Error notificando nuevo lead:', e));

    const welcome = buildWelcomeMessage(waDisplayName, leadSource !== null);
    await sendMessage(from, welcome, phoneId);
    saveHistory(from, textBody, welcome);
    // Con AWAIT: dejarlo en segundo plano después de regresar la respuesta HTTP arriesga
    // que Cloud Run suspenda la instancia a medias y el recálculo nunca llegue a correr.
    try {
      const { saveConversationMessage, db } = await import('@/lib/firestore');
      await saveConversationMessage(from, textBody, welcome);
      if (waDisplayName) {
        await db.collection('conversations').doc(from).set({ contactName: waDisplayName }, { merge: true });
      }
      // Sin esto, un lead que nunca responde una segunda vez se queda sin chatState
      // para siempre — recalculateChatState solo se disparaba en el turno siguiente —
      // y por lo tanto sin entrar nunca a la secuencia de follow-ups 2h→24h→72h→7d.
      const { recalculateChatState } = await import('@/lib/chat-state');
      await recalculateChatState(from, 'mensaje_luz');
    } catch (e) {
      console.error('[WEBHOOK] Error guardando lead nuevo:', e);
    }

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
        notificarAdmin(
          `⏸️ *Lead pausado te escribió*\n\n📱 +${from}\n💬 "${textBody.slice(0, 150)}"\n\nLuz no le va a responder. Contéstale tú o usa *!reanudar ${from}*.`
        ).catch(e => console.error('[WEBHOOK] Error notificando lead pausado:', e));
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    }

    // Si ya está inscrito, Luz no responde más — se etiqueta la conversación (en vez de
    // mandarle WhatsApp al admin, que antes se quedaba sin avisar de nada) para que se
    // vea en el dashboard, ej. cuando manda foto de otra reservación.
    if (convData?.chatState === 'cerrado') {
      console.log('[WEBHOOK] Cliente ya inscrito para', from, '— guardando mensaje sin responder');
      saveUserMessage(from, textBody).catch(e => console.error('[WEBHOOK] saveUserMessage (inscrito):', e));
      const texto = messageType === 'text' ? textBody.slice(0, 150) : `(${messageType})`;
      Promise.all([import('@/lib/firestore'), import('firebase-admin/firestore')])
        .then(([{ db }, { Timestamp }]) =>
          db.collection('conversations').doc(from).set({
            postCierreAlerta: { texto, tipo: messageType, at: Timestamp.now() },
          }, { merge: true })
        )
        .catch(e => console.error('[WEBHOOK] postCierreAlerta:', e));
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

    await sendMessage(from, reply, phoneId);

    // Detección robusta de hand-off a humano: no depender del formato exacto del número.
    // Captura cualquier variante del teléfono del asesor (56 3443 3212 / 5634433212 / con
    // guiones o espacios) normalizando a dígitos, más la frase canónica "te conecto con".
    const replyDigits = reply.replace(/\D/g, '');
    const esHandoff = replyDigits.includes('5634433212') || /te conecto con/i.test(reply);
    if (esHandoff) {
      import('@/lib/firestore')
        .then(({ db }) => db.collection('conversations').doc(from).set({ botPaused: true, nextFollowupAt: null }, { merge: true }))
        .catch(e => console.error('[WEBHOOK] Auto-pause error:', e));
      notificarAdmin(
        `🤝 *Luz cedió el turno*\n\n📱 +${from}\n\nLuz está ⏸️ pausada. Respóndele tú directamente.\nCuando termines: *!reanudar ${from}*`
      ).catch(e => console.error('[WEBHOOK] Error notif hand-off:', e));
    }

    saveHistory(from, textBody, reply);
    // recalculateChatState necesita leer el mensaje recién guardado para saber quién habló
    // al final — si corre en paralelo con el guardado, casi siempre lee el turno anterior
    // (que termina en "Luz") y el clasificador de intención (tu_turno/atascado) nunca se
    // dispara. Además, esto va con AWAIT (no fire-and-forget): probado en producción, si se
    // deja corriendo en segundo plano después de que la función ya regresó la respuesta HTTP,
    // Cloud Run puede suspender la instancia a medias y el recálculo nunca llega a ejecutarse
    // — así se descubrió que "Atención" llevaba en 0 desde siempre.
    try {
      const { saveConversationMessage } = await import('@/lib/firestore');
      await saveConversationMessage(from, textBody, reply);
      const { recalculateChatState } = await import('@/lib/chat-state');
      await recalculateChatState(from, 'mensaje_cliente');
    } catch (e) {
      console.error('[WEBHOOK] Firestore save / recalculate error:', e);
    }
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
      await notificarAdmin(aviso).catch((e) =>
        console.error('[WEBHOOK] Error notificando admin:', e)
      );
    }
  } catch (err) {
    console.error('[WEBHOOK] Pipeline error:', err);
    // El lead NUNCA se queda sin respuesta: fallback + aviso al admin
    sendMessage(from, MSG_FALLBACK).catch(e => console.error('[WEBHOOK] Error enviando fallback:', e));
    notificarAdmin(
      `⚠️ *Error en el pipeline de Luz*\n\n📱 +${from}\n💬 "${textBody.slice(0, 120)}"\n\nSe le pidió al lead repetir su mensaje. Si vuelve a fallar, respóndele tú.`
    ).catch(e => console.error('[WEBHOOK] Error notificando pipeline error:', e));
  }

  return new NextResponse('EVENT_RECEIVED', { status: 200 });
}
