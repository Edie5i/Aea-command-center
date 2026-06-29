const ZONAS_DOMICILIO = [
  'miguel hidalgo', 'cuauhtémoc', 'cuauhtemoc', 'benito juárez', 'benito juarez',
  'álvaro obregón', 'alvaro obregon', 'coyoacán', 'coyoacan',
  'polanco', 'lomas de chapultepec', 'chapultepec', 'condesa', 'hipódromo', 'hipodromo',
  'roma norte', 'roma sur', 'roma', 'centro histórico', 'centro historico', 'centro',
  'doctores', 'obrera', 'guerrero', 'tepito', 'santa maría la ribera', 'santa maria la ribera',
  'nonoalco', 'tlatelolco', 'anzures', 'escandón', 'escandon', 'tacubaya',
  'del valle', 'narvarte', 'nápoles', 'napoles', 'insurgentes', 'mixcoac',
  'san ángel', 'san angel', 'pedregal', 'jardines del pedregal', 'florida',
  'actipan', 'xoco', 'portales', 'letrán valle', 'letran valle', 'general anaya',
  'churubusco', 'axotla', 'tizapán', 'tizapan', 'chimalistac', 'copilco',
  'villa coyoacán', 'villa coyoacan', 'peña pobre', 'peña verde',
  'juárez', 'juarez', 'tabacalera', 'lomas de bezares',
  'bosque de las lomas', 'interlomas', 'tecamachalco', 'granada', 'irrigación',
];

export const ZONAS_PUNTO_FIJO: Record<string, string> = {
  'cuajimalpa':       'Parque La Mexicana (Av. Prolongación Reforma s/n)',
  'lomas de santa fe':'Parque La Mexicana (Av. Prolongación Reforma s/n)',
  'contadero':        'Parque La Mexicana (Av. Prolongación Reforma s/n)',
  'zentlapatl':       'Parque La Mexicana (Av. Prolongación Reforma s/n)',
  'santa fe':         'Parque La Mexicana (Av. Prolongación Reforma s/n)',
  'azcapotzalco':     'Colonia Irrigación o Metro Polanco (acordar con el alumno)',
  'vallejo':          'Colonia Irrigación o Metro Polanco (acordar con el alumno)',
  'tlalnepantla':     'Colonia Irrigación o Metro Polanco (acordar con el alumno)',
  'iztapalapa':       'Av. Universidad 1407, Col. Copilco (a pasos de Metro Viveros)',
  'iztacalco':        'Av. Universidad 1407, Col. Copilco (a pasos de Metro Viveros)',
  'tláhuac':          'Av. Universidad 1407, Col. Copilco (a pasos de Metro Viveros)',
  'tlahuac':          'Av. Universidad 1407, Col. Copilco (a pasos de Metro Viveros)',
};

export type CoverageResult =
  | { tipo: 'domicilio'; nota: string }
  | { tipo: 'punto_fijo'; punto: string; nota: string }
  | { tipo: 'dudosa'; nota: string };

export function checkCoverage(zona: string, colonia?: string | null): CoverageResult {
  const z = (colonia ?? zona).toLowerCase();

  if (ZONAS_DOMICILIO.some(k => z.includes(k))) {
    return {
      tipo: 'domicilio',
      nota: '✅ *Zona con cobertura a domicilio* — el instructor puede llegar directo.',
    };
  }

  const puntoFijoKey = Object.keys(ZONAS_PUNTO_FIJO).find(k => z.includes(k));
  if (puntoFijoKey) {
    const punto = ZONAS_PUNTO_FIJO[puntoFijoKey];
    return {
      tipo: 'punto_fijo',
      punto,
      nota: `📍 *Zona con punto de encuentro fijo*\nEl instructor espera en: ${punto}`,
    };
  }

  return {
    tipo: 'dudosa',
    nota: '❓ *Zona no identificada* — el equipo debe confirmar punto de encuentro.',
  };
}
