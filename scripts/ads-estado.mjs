/**
 * Revisa la cuenta de Google Ads real de AEA (838-271-5986) sin abrir el
 * navegador: estrategia de puja de las campañas activas y señales de si la
 * cuenta se quedó sin saldo.
 *
 * Nació porque la extensión de Claude en Chrome dejó de conectar y la revisión
 * manual se repite cada pocos días siempre por lo mismo: ¿sigue en CPC manual?
 * ¿ya se apagó por saldo $0?
 *
 *   node scripts/ads-estado.mjs
 *   node scripts/ads-estado.mjs --dias 14
 *
 * Necesita credenciales en .env.local; corre sin ellas para ver la lista.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');

try {
  process.loadEnvFile(path.join(RAIZ, '.env.local'));
} catch {
  // Sin .env.local se vale: pueden venir del shell.
}

// Google Ads sube de versión cada trimestre y tumba las viejas, así que en vez
// de fijar una a mano la descubrimos: se prueba de la más nueva hacia abajo y
// nos quedamos con la primera viva. Se salta si ya viene fijada en el entorno.
const VERSION_FIJA = process.env.GOOGLE_ADS_API_VERSION || null;
const VERSION_MAX = 30;
const VERSION_MIN = 17;
let VERSION = VERSION_FIJA;

const CUENTA = (process.env.GOOGLE_ADS_CUSTOMER_ID || '8382715986').replace(/\D/g, '');
const MANAGER = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/\D/g, '');

const CREDENCIALES = {
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  clientId: process.env.GOOGLE_ADS_CLIENT_ID,
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
};

const DIAS = (() => {
  const i = process.argv.indexOf('--dias');
  const n = i === -1 ? 7 : Number(process.argv[i + 1]);
  return Number.isFinite(n) && n > 0 && n <= 90 ? Math.floor(n) : 7;
})();

function faltantes() {
  return Object.entries(CREDENCIALES)
    .filter(([, v]) => !v)
    .map(([k]) => k);
}

function instrucciones(faltan) {
  console.error('❌ Faltan credenciales en .env.local:\n');
  for (const k of faltan) {
    const env = k.replace(/[A-Z]/g, (c) => '_' + c).toUpperCase();
    console.error(`   GOOGLE_ADS_${env}=`);
  }
  console.error(`
De dónde sale cada una:

  DEVELOPER_TOKEN  ads.google.com → Herramientas → Configuración → API Center.
                   Sale en "Test account access" al instante; para pegarle a la
                   cuenta real hay que pedir "Basic access" (lo aprueban en
                   1-3 días hábiles y piden describir el uso).

  CLIENT_ID        console.cloud.google.com → APIs y servicios → Credenciales →
  CLIENT_SECRET    Crear credenciales → ID de cliente OAuth → tipo "Aplicación
                   de escritorio". Habilita antes la "Google Ads API" en la
                   biblioteca del proyecto.

  REFRESH_TOKEN    Con el client id/secret de arriba:
                   npx -y google-ads-refresh-token
                   o el flujo manual de oauth2.googleapis.com pidiendo el scope
                   https://www.googleapis.com/auth/adwords con access_type=offline.

Opcionales:
  GOOGLE_ADS_CUSTOMER_ID        default 8382715986 (la cuenta real de AEA)
  GOOGLE_ADS_LOGIN_CUSTOMER_ID  sólo si entras vía cuenta administradora (MCC)
  GOOGLE_ADS_API_VERSION        fija la versión y salta el autodescubrimiento
`);
}

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CREDENCIALES.clientId,
      client_secret: CREDENCIALES.clientSecret,
      refresh_token: CREDENCIALES.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `OAuth ${res.status}: ${json.error_description || json.error || 'sin detalle'}` +
        (json.error === 'invalid_grant'
          ? '\n   El refresh token caducó o fue revocado. Genera uno nuevo.'
          : '')
    );
  }
  return json.access_token;
}

/**
 * Busca la versión viva más nueva. listAccessibleCustomers es la llamada más
 * barata que valida token + versión, y no necesita customer id.
 *
 * Una versión que ya murió (o que todavía no existe) contesta 404; cualquier
 * otro código significa que la versión SÍ existe y el problema es otro
 * (credenciales, permisos), así que también sirve para parar la búsqueda.
 */
async function descubreVersion(token) {
  if (VERSION_FIJA) return VERSION_FIJA;

  for (let n = VERSION_MAX; n >= VERSION_MIN; n--) {
    const v = `v${n}`;
    const res = await fetch(
      `https://googleads.googleapis.com/${v}/customers:listAccessibleCustomers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'developer-token': CREDENCIALES.developerToken,
        },
      }
    );
    if (res.status === 404) continue;

    if (res.ok) return v;

    // Existe la versión pero algo más falla: mejor reventar aquí con el
    // detalle real que seguir bajando y culpar a la versión.
    const json = await res.json().catch(() => ({}));
    const err = json.error || {};
    throw new Error(
      `Ads API ${res.status} en ${v}: ${err.message || 'sin detalle'}` +
        (res.status === 401 || res.status === 403
          ? '\n   Suele ser developer token sin "Basic access", o el token\n' +
            '   no corresponde a la cuenta que estás consultando.'
          : '')
    );
  }

  throw new Error(
    `Ninguna versión viva entre v${VERSION_MIN} y v${VERSION_MAX}.\n` +
      '   Revisa conexión, o fija una con GOOGLE_ADS_API_VERSION=vNN.'
  );
}

/** GAQL contra la cuenta, paginando hasta traer todo. */
async function consulta(token, query) {
  const url = `https://googleads.googleapis.com/${VERSION}/customers/${CUENTA}/googleAds:search`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'developer-token': CREDENCIALES.developerToken,
    'Content-Type': 'application/json',
    ...(MANAGER ? { 'login-customer-id': MANAGER } : {}),
  };

  const filas = [];
  let pageToken;
  do {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = json.error || {};
      const detalle = err.details?.[0]?.errors?.[0];
      throw new Error(
        `Ads API ${res.status} ${err.status || ''}: ${detalle?.message || err.message || 'sin detalle'}` +
          (res.status === 404
            ? `\n   404 con ${VERSION}. Si la fijaste a mano, quita GOOGLE_ADS_API_VERSION\n` +
              '   del .env.local para que el script la descubra solo.'
            : '')
      );
    }
    filas.push(...(json.results || []));
    pageToken = json.nextPageToken;
  } while (pageToken);

  return filas;
}

const pesos = (micros) =>
  ((Number(micros) || 0) / 1e6).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

/** Lee la puja sin asumir cuál es: imprime la que venga. */
function describePuja(c) {
  const tipo = c.biddingStrategyType || 'DESCONOCIDA';
  const detalles = [];

  if (c.manualCpc) {
    detalles.push(
      c.manualCpc.enhancedCpcEnabled
        ? 'con eCPC ACTIVADO (Google ajusta la puja solo)'
        : 'sin eCPC'
    );
  }
  if (c.targetCpa?.targetCpaMicros) detalles.push(`CPA objetivo ${pesos(c.targetCpa.targetCpaMicros)}`);
  if (c.maximizeConversions?.targetCpaMicros)
    detalles.push(`CPA objetivo ${pesos(c.maximizeConversions.targetCpaMicros)}`);
  if (c.targetRoas?.targetRoas) detalles.push(`ROAS objetivo ${c.targetRoas.targetRoas}`);
  if (c.targetSpend) detalles.push('maximizar clics');
  if (c.biddingStrategy) detalles.push('usa estrategia de cartera (compartida)');

  return { tipo, detalles };
}

const ES_CPC = new Set(['MANUAL_CPC', 'ENHANCED_CPC', 'TARGET_SPEND']);

async function main() {
  const faltan = faltantes();
  if (faltan.length) {
    instrucciones(faltan);
    process.exitCode = 1;
    return;
  }

  const token = await accessToken();

  VERSION = await descubreVersion(token);
  console.log(
    `\nAPI ${VERSION}` +
      (VERSION_FIJA ? ' (fijada en el entorno)' : ' (descubierta; fíjala con GOOGLE_ADS_API_VERSION para ahorrar sondeos)')
  );

  const campañas = await consulta(
    token,
    `SELECT
       campaign.id,
       campaign.name,
       campaign.status,
       campaign.advertising_channel_type,
       campaign.bidding_strategy_type,
       campaign.bidding_strategy,
       campaign.manual_cpc.enhanced_cpc_enabled,
       campaign.target_cpa.target_cpa_micros,
       campaign.maximize_conversions.target_cpa_micros,
       campaign.target_roas.target_roas,
       campaign.primary_status,
       campaign.primary_status_reasons,
       campaign_budget.amount_micros
     FROM campaign
     WHERE campaign.status = 'ENABLED'`
  );

  console.log(`\n═══ Cuenta ${CUENTA} · ${campañas.length} campaña(s) activa(s) ═══\n`);

  if (!campañas.length) {
    console.log('⚠️  Ninguna campaña activa. O están todas pausadas, o la cuenta está detenida.\n');
  }

  for (const fila of campañas) {
    const c = fila.campaign || {};
    const { tipo, detalles } = describePuja(c);
    const ok = ES_CPC.has(tipo) && !c.manualCpc?.enhancedCpcEnabled;

    console.log(`▸ ${c.name}`);
    console.log(`  Puja:       ${ok ? '✅' : '⚠️ '} ${tipo}${detalles.length ? ' — ' + detalles.join(', ') : ''}`);
    console.log(`  Presupuesto: ${pesos(fila.campaignBudget?.amountMicros)}/día`);
    if (c.primaryStatus) {
      const razones = (c.primaryStatusReasons || []).join(', ');
      console.log(`  Estado:      ${c.primaryStatus}${razones ? ` (${razones})` : ''}`);
    }

    const grupos = await consulta(
      token,
      `SELECT ad_group.name, ad_group.cpc_bid_micros
       FROM ad_group
       WHERE campaign.id = ${c.id} AND ad_group.status = 'ENABLED'`
    );
    for (const g of grupos) {
      console.log(`    · ${g.adGroup.name}: CPC máx ${pesos(g.adGroup.cpcBidMicros)}`);
    }
    console.log('');
  }

  const hoyISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  // Saldo: la API de Ads NO expone el saldo prepagado. Lo que sí delata que se
  // acabó es el gasto diario cayendo a cero con la campaña encendida.
  const desde = new Date(Date.now() - (DIAS - 1) * 86400000).toLocaleDateString('en-CA', {
    timeZone: 'America/Mexico_City',
  });
  const dias = await consulta(
    token,
    `SELECT segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions
     FROM customer
     WHERE segments.date BETWEEN '${desde}' AND '${hoyISO}'
     ORDER BY segments.date`
  );

  console.log(`═══ Gasto por día (${DIAS} días, ${dias.length} con datos) ═══\n`);
  for (const d of dias) {
    const costo = Number(d.metrics?.costMicros) || 0;
    const barra = '█'.repeat(Math.min(30, Math.round(costo / 1e6 / 5)));
    console.log(
      `  ${d.segments.date}  ${pesos(costo).padStart(11)}  ${String(d.metrics?.clicks || 0).padStart(4)} clics  ${barra}`
    );
  }

  const hoy = dias.find((d) => d.segments.date === hoyISO);
  const gastoHoy = Number(hoy?.metrics?.costMicros) || 0;
  const impresionesHoy = Number(hoy?.metrics?.impressions) || 0;

  console.log('');
  if (!campañas.length) {
    console.log('💤 Sin campañas activas: el gasto de hoy no dice nada del saldo.');
  } else if (impresionesHoy === 0) {
    console.log(
      `🔴 Hoy (${hoyISO}) cero impresiones con la campaña encendida.\n` +
        '   El patrón de esta cuenta es saldo $0 → se apaga sola. Recarga en\n' +
        '   ads.google.com → Facturación → Resumen (la Visa ••••4282 es la que jala).'
    );
  } else {
    console.log(`🟢 Hoy (${hoyISO}) lleva ${pesos(gastoHoy)} y sí está sirviendo impresiones.`);
  }
  console.log('');
}

try {
  await main();
} catch (e) {
  // Los errores de este script son de configuración, no bugs: el stack no
  // aporta nada y esconde el mensaje, que sí dice qué hacer.
  console.error(`\n❌ ${e.message}\n`);
  process.exitCode = 1;
}
