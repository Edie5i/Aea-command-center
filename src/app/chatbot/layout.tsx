import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Asistente Virtual | Auto Escuela Americana',
  robots: 'noindex, nofollow',
};

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
