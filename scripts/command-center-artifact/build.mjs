/**
 * Paso 2 de 2: inyecta leads.json y corte.txt en plantilla.html y escribe
 * command-center.html, listo para publicarlo como artifact.
 *
 *   node scripts/command-center-artifact/build.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const leeAqui = (f) => fs.readFileSync(path.join(AQUI, f), 'utf8');

const plantilla = leeAqui('plantilla.html');
const leads = leeAqui('leads.json');
const corte = leeAqui('corte.txt').trim();

if (!/^\d+$/.test(corte)) throw new Error('corte.txt no trae millis');
JSON.parse(leads); // revienta aquí y no en el navegador

const HUECOS = [
  [/\/\*__LEADS__\*\/[\s\S]*?\/\*__\/LEADS__\*\//, leads],
  [/\/\*__CORTE__\*\/[\s\S]*?\/\*__\/CORTE__\*\//, corte],
];

let html = plantilla;
for (const [hueco, valor] of HUECOS) {
  if (!hueco.test(html)) throw new Error(`la plantilla perdió el hueco ${hueco}`);
  html = html.replace(hueco, () => valor);
}

// El publicador envuelve el archivo en su propio <head>: si la plantilla se
// regenera copiando un artifact ya publicado, hay que quitarle ese envoltorio.
if (html.includes('__FRAME_PREAMBLE')) throw new Error('la plantilla trae el runtime del publicador');

const salida = path.join(AQUI, 'command-center.html');
fs.writeFileSync(salida, html);
console.error(`${salida} · ${(html.length / 1024).toFixed(1)}KB`);
