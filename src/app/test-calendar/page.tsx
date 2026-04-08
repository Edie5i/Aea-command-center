
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createTestEventAction } from './actions';
import { Loader2, CalendarPlus, AlertCircle, CheckCircle, ArrowLeft, CalendarSearch, Globe } from 'lucide-react';
import Link from 'next/link';

export default function TestCalendarPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCreateTestEvent = async () => {
    setIsLoading(true);
    setResult(null);
    const response = await createTestEventAction();
    setResult(response);
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md mt-8">
          <div className="flex justify-center mb-8">
            <Button asChild variant="outline">
                <a href="https://app.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
                    <Globe className="mr-2 h-4 w-4" />
                    app.autoescuelaamericana.com
                </a>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prueba de Google Calendar</CardTitle>
              <CardDescription>
                Haz clic en el botón para crear un evento de prueba en tu calendario. El evento se creará para mañana a las 3:00 PM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCreateTestEvent}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarPlus className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Creando evento...' : 'Crear Evento de Prueba'}
              </Button>
              {result && (
                <Alert variant={result.success ? 'default' : 'destructive'} className={result.success ? 'bg-green-100 dark:bg-green-900/30 border-green-500' : ''}>
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? 'Éxito' : 'Error'}</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
              {result?.success && (
                <Button asChild variant="secondary" className="w-full">
                    <a href="https://calendar.google.com/" target="_blank" rel="noopener noreferrer">
                        <CalendarSearch className="mr-2 h-4 w-4" />
                        Abrir Google Calendar para verificar
                    </a>
                </Button>
              )}
            </CardContent>
            <CardFooter>
                <Button asChild variant="link" className="px-0">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al inicio
                    </Link>
                </Button>
            </CardFooter>
          </Card>
      </div>
    </main>
  );
}
