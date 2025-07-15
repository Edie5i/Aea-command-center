
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Globe, FileText, UserCheck, LogIn } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { useEffect, useState } from 'react';
import { GOOGLE_AUTH_TOKEN_COOKIE_KEY } from '@/lib/google-auth';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isClient, setIsClient] = useState(false);
  
    // We can't check cookies on the server in a client component,
    // so we'll check them on the client side after the component mounts.
    useEffect(() => {
        setIsClient(true);
        const hasAuthCookie = document.cookie.includes(GOOGLE_AUTH_TOKEN_COOKIE_KEY);
        setIsAuthenticated(hasAuthCookie);
    }, []);

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
          Gestiona las conexiones y las integraciones de la aplicación con servicios en la nube.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
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
            <CardTitle>Integración con Google Workspace</CardTitle>
            <CardDescription>
              Conecta tu cuenta de Google para permitir que la IA acceda a tu Calendario y pueda verificar la disponibilidad en tiempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center pt-6 space-y-4">
              {!isClient ? (
                <div className="h-10 bg-muted rounded-md w-48 animate-pulse"></div>
              ) : isAuthenticated ? (
                 <div className="flex items-center gap-2 text-green-600 p-3 bg-green-100 rounded-md dark:bg-green-900/30 dark:text-green-300">
                    <UserCheck className="h-5 w-5" />
                    <p className="font-semibold">Cuenta de Google conectada.</p>
                 </div>
              ) : (
                <Button asChild>
                    <Link href="/api/auth/google">
                        <LogIn className="mr-2 h-4 w-4" />
                        Conectar con Google
                    </Link>
                </Button>
              )}
               <p className="text-xs text-muted-foreground text-center max-w-md">
                Al conectar tu cuenta, otorgas permiso a esta aplicación para leer la información de disponibilidad (libre/ocupado) de tu calendario principal. No almacenaremos tus eventos, solo consultaremos la disponibilidad para responder preguntas sobre horarios.
              </p>
          </CardContent>
        </Card>
      </div>

       <AppFooter />
    </main>
  );
}
