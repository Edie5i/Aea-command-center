import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notas de Alumno | Auto Escuela Americana',
  robots: 'noindex, nofollow',
};

export default function NotasAlumnoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
