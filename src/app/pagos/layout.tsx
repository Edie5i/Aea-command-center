import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagos | Auto Escuela Americana',
  robots: 'noindex, nofollow',
};

export default function PagosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
