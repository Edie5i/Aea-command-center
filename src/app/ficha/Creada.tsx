'use client';

import { ExternalLink } from 'lucide-react';
import { Compartir } from './Compartir';
import { Copiar } from './Copiar';

export type Resultado = {
  url: string | null;
  estado: string;
  faltantes: string[];
  deposito: number;
  apartado: number;
};

/**
 * Lo que se ve después de capturar una ficha.
 *
 * Vive aparte del formulario a propósito: para verla había que crear una ficha
 * de verdad en producción —con su WhatsApp al alumno—, así que cualquier
 * cambio aquí se hacía a ciegas. Es la misma razón por la que el tablero de
 * candidatos salió de su página.
 *
 * El alumno ya tiene su enlace: `guardarFicha` se lo manda al crearse. Lo de
 * aquí es para quien está en el mostrador —pasárselo a otro teléfono,
 * dictárselo, o abrirlo para enseñárselo en pantalla—.
 */
export function Creada({
  resultado,
  alumno,
  onOtra,
}: {
  resultado: Resultado;
  alumno: string;
  onOtra: () => void;
}) {
  const reservada = resultado.estado === 'reservada';

  return (
    <div className="panel">
      <div className={`estado ${reservada ? 'estado-verde' : 'estado-ambar'}`}>
        <span className={`testigo ${reservada ? 't-verde' : 't-ambar'}`} aria-hidden />
        {reservada ? 'Ficha reservada' : 'Ficha creada'}
      </div>

      <div className="cuerpo">
        <p className="texto">Se le mandó el enlace al alumno por WhatsApp.</p>

        {!reservada && resultado.faltantes.length > 0 && (
          <p className="aviso-ambar" style={{ marginTop: '0.5rem' }}>
            Falta: {resultado.faltantes.join(', ')}
          </p>
        )}

        {/* El enlace a la vista y no escondido detrás de un botón: es lo que se
            dicta por teléfono cuando el alumno viene sin su celular. */}
        {resultado.url && (
          <div className="hueco" style={{ padding: '0.75rem', marginTop: '1rem' }}>
            <p className="nota-chica">Su enlace</p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'space-between',
                marginTop: '0.25rem',
              }}
            >
              <span className="mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {resultado.url}
              </span>
              <Copiar valor={resultado.url} que="el enlace" />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
          {resultado.url && <Compartir url={resultado.url} alumno={alumno} />}
          {resultado.url && (
            <a
              className="secundario"
              href={resultado.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
              }}
            >
              <ExternalLink className="ico" aria-hidden />
              Abrir la ficha
            </a>
          )}
          <button className="secundario" onClick={onOtra}>
            Capturar otra
          </button>
        </div>
      </div>
    </div>
  );
}
