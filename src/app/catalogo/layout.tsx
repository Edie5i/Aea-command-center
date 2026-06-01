import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cursos de Manejo — Catálogo y Precios | Auto Escuela Americana',
  description: 'Conoce todos nuestros cursos de manejo en CDMX: básico, intensivo, refresco y más. Clases personalizadas con instructor desde $690. Roma Sur y a domicilio.',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/catalogo',
  },
  robots: 'index, follow',
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
