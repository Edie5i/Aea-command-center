import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Evaluación | Auto Escuela Americana',
  robots: 'noindex, nofollow',
};

export default function EvaluacionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
