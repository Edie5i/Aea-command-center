import { describe, it, expect } from 'vitest';
import { fechaLarga, enlaceFicha, mensajeAlumno, mensajeAdmin, type FichaData } from '../ficha-enlace';


const ficha: FichaData = {
  nombre: 'María Fernanda López',
  telefono: '525512345678',
  zona: 'Coyoacán',
  curso: 'Automático',
  fechas: [
    { date: '2026-09-22', time: '10:00' },
    { date: '2026-09-23', time: '10:00' },
    { date: '2026-09-24', time: '16:00' },
    { date: '2026-09-25', time: '19:00' },
  ],
};

describe('fechaLarga', () => {
  it('escribe la fecha como se la dirías a alguien', () => {
    expect(fechaLarga('2026-09-22', '10:00')).toBe('martes 22 de septiembre · 10:00 a.m.');
  });

  it('la tarde va en p.m. y el 12 no se vuelve 0', () => {
    expect(fechaLarga('2026-09-22', '16:00')).toContain('4:00 p.m.');
    expect(fechaLarga('2026-09-22', '12:30')).toContain('12:30 p.m.');
    expect(fechaLarga('2026-09-22', '00:30')).toContain('12:30 a.m.');
  });

  it('una fecha rota se devuelve tal cual en vez de inventar', () => {
    expect(fechaLarga('no-es-fecha', '10:00')).toBe('no-es-fecha 10:00');
  });
});

describe('mensajeAlumno', () => {
  const m = mensajeAlumno(ficha, 'abc123');

  it('saluda por el nombre de pila y trae el enlace', () => {
    expect(m).toMatch(/^📋 Hola María,/);
    expect(m).toContain('https://app.autoescuelaamericana.com/ficha/abc123');
  });

  it('lista sus clases en lenguaje normal', () => {
    expect(m).toContain('• martes 22 de septiembre · 10:00 a.m.');
    expect(m).toContain('Tus clases:');
  });

  it('NO menciona PDF ni archivo', () => {
    expect(m.toLowerCase()).not.toContain('pdf');
    expect(m.toLowerCase()).not.toContain('adjunt');
  });

  it('sin nombre no queda un "Hola ," colgado', () => {
    const sinNombre = mensajeAlumno({ ...ficha, nombre: '   ' }, 'abc123');
    expect(sinNombre).not.toContain('Hola ,');
    expect(sinNombre).toMatch(/^📋 Aquí está tu ficha/);
  });

  it('sin fechas no deja el encabezado vacío', () => {
    const sinFechas = mensajeAlumno({ ...ficha, fechas: [] }, 'abc123');
    expect(sinFechas).not.toContain('Tus clases:');
    expect(sinFechas).toContain('/ficha/abc123');
  });

  it('con más de cuatro clases solo lista las primeras cuatro', () => {
    const muchas = mensajeAlumno(
      { ...ficha, fechas: [...ficha.fechas, { date: '2026-09-26', time: '10:00' }] },
      'abc123'
    );
    expect(muchas.match(/^• /gm)).toHaveLength(4);
  });
});

describe('mensajeAdmin', () => {
  const m = mensajeAdmin(ficha, 'abc123');

  it('trae con qué identificar y localizar al alumno', () => {
    expect(m).toContain('María Fernanda López');
    expect(m).toContain('+525512345678');
    expect(m).toContain('Coyoacán');
    expect(m).toContain('Automático');
    expect(m).toContain(enlaceFicha('abc123'));
  });

  it('sin zona lo dice en vez de dejar el renglón vacío', () => {
    expect(mensajeAdmin({ ...ficha, zona: '' }, 'abc123')).toContain('Sin zona');
  });

  it('sin curso no deja un renglón suelto', () => {
    const sinCurso = mensajeAdmin({ ...ficha, curso: undefined }, 'abc123');
    expect(sinCurso).not.toContain('🚗');
  });
});
