'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Bot, BarChart3, FileQuestion, Users, MessageSquare } from 'lucide-react';
import { AppFooter } from '@/components/footer';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-secondary p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Panel de Administrador
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Herramientas de gestión para Auto Escuela Americana.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="text-primary"/> Calendario de Cursos</CardTitle>
              <CardDescription>Visualiza los cursos programados por semana.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/calendario">
                  Ver Calendario Semanal
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="text-primary"/> Asistente Virtual</CardTitle>
              <CardDescription>Prueba el chatbot de la escuela.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild>
                <Link href="/chatbot">
                  Chatear Ahora
                </Link>
              </Button>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="text-primary"/> Solicitudes de Info</CardTitle>
              <CardDescription>Contacta a los interesados por WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
               <Button asChild>
                <a href="https://wa.me/525634433212" target="_blank" rel="noopener noreferrer">
                  Abrir WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
      <AppFooter />
    </main>
  );
}
