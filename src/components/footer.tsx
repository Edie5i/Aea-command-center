'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link2 } from 'lucide-react';

export function AppFooter() {
  const { toast } = useToast();

  const handleCopyLink = () => {
    const appUrl = window.location.href;
    navigator.clipboard.writeText(appUrl)
      .then(() => {
        toast({ title: '¡Enlace copiado!', description: 'El enlace de la app ha sido copiado al portapapeles.' });
      })
      .catch(err => {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo copiar el enlace.' });
        console.error('Failed to copy link: ', err);
      });
  };

  return (
    <footer className="w-full mt-auto py-8 text-center text-sm text-muted-foreground border-t">
        <div className="mb-4">
            <Button variant="ghost" onClick={handleCopyLink}>
                <Link2 className="mr-2 h-4 w-4" />
                Copiar enlace de la app
            </Button>
        </div>
      <p>
        <a href="https://mi-proyecto-de-prueba-12345.web.app" target="_blank" rel="noopener noreferrer" className="hover:underline">
          mi-proyecto-de-prueba-12345.web.app
        </a>
      </p>
      <p className="mt-2">
        <Link href="/terminos" className="hover:underline">
          Términos y Condiciones
        </Link>
      </p>
      <p className="mt-2">
        Powered by Next.js and Genkit.
      </p>
    </footer>
  );
}
