
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar as CalendarIcon, CalendarCheck } from 'lucide-react';
import { isGoogleCalendarConnected } from '@/app/actions';

export default function AdminPage() {
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);

  useEffect(() => {
    async function checkConnection() {
      const connected = await isGoogleCalendarConnected();
      setIsCalendarConnected(connected);
    }
    checkConnection();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Panel de Administrador
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Gestiona las conexiones e integraciones de la aplicación.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Integración con Google Calendar</CardTitle>
            <CardDescription>
              Conecta tu cuenta de Google para que las clases agendadas se creen automáticamente en tu calendario principal. Solo el administrador necesita hacer esto una vez.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-6">
            <Button asChild variant="secondary" disabled={isCalendarConnected} className="w-full max-w-xs">
              {isCalendarConnected ? (
                <div className="flex items-center cursor-not-allowed">
                  <CalendarCheck className="mr-2 h-4 w-4" />
                  Calendario Conectado
                </div>
              ) : (
                <Link href="/api/auth/google">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Conectar con Google Calendar
                </Link>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

       <footer className="w-full mt-auto py-8 text-center text-sm text-muted-foreground border-t">
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
    </main>
  );
}
