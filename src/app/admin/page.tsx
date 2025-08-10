
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Globe, FileText, Calendar, LogIn } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 h-4 w-4" />
              www.autoescuelaamericana.com
            </a>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Panel de Administrador
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Gestiona las integraciones y configuraciones de la aplicación.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center gap-8">
        <div className="w-full max-w-3xl flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Integraciones Externas</CardTitle>
            <CardDescription>
              Conecta servicios externos para habilitar nuevas funcionalidades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertTitle>Integración con Google Calendar</AlertTitle>
              <AlertDescription>
                Conecta tu cuenta de Google para permitir que el Asistente de IA verifique la disponibilidad de horarios en tiempo real directamente desde tu calendario principal.
              </AlertDescription>
              <div className="mt-4">
                <Button asChild>
                    <Link href="/api/auth/google">
                        <LogIn className="mr-2 h-4 w-4" />
                        Conectar con Google Calendar
                    </Link>
                </Button>
              </div>
            </Alert>
          </CardContent>
        </Card>
      </div>

       <AppFooter />
    </main>
  );
}
