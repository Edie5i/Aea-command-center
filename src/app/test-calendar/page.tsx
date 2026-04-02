'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createTestEventAction } from './actions';
import { Loader2, CalendarPlus, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted p-8">
      <Card className="w-full max-w-md">
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
        </CardContent>
         <CardContent>
            <Button asChild variant="link" className="px-0">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio
                </Link>
            </Button>
        </CardContent>
      </Card>
    </main>
  );
}
