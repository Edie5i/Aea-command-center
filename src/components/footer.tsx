'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AppFooter() {
  const { toast } = useToast();
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // This ensures the code only runs on the client-side
    // where `window` is available, preventing hydration mismatches.
    setAppUrl(window.location.origin);
  }, []);

  const handleCopyLink = () => {
    if (appUrl) {
      navigator.clipboard.writeText(appUrl)
        .then(() => {
          toast({ title: '¡Enlace copiado!', description: 'El enlace de la app ha sido copiado al portapapeles.' });
        })
        .catch(err => {
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo copiar el enlace.' });
          console.error('Failed to copy link: ', err);
        });
    }
  };

  return (
    <footer className="w-full mt-auto py-8 text-center text-sm text-muted-foreground border-t">
        <div className="mb-4">
            <Button variant="ghost" onClick={handleCopyLink} disabled={!appUrl}>
                <Link2 className="mr-2 h-4 w-4" />
                Copiar enlace de la app
            </Button>
        </div>
      <p>
        <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
          www.autoescuelaamericana.com
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
