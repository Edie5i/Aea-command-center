'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, CreditCard, List, Info, Hourglass, Globe, FileText } from 'lucide-react';
import { es } from 'date-fns/locale';
import { ScheduleForm } from '@/components/schedule-form';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { AppFooter } from '@/components/footer';

export default function AgendaPage() {
  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const mockAppointments = [
    { time: '10:00', student: 'Juan P.', type: 'Automático', status: 'confirmed' as const },
    { time: '13:00', student: 'Maria L.', type: 'Estándar', status: 'pending' as const },
    { time: '16:00', student: 'Pedro S.', type: 'Automático', status: 'confirmed' as const },
  ];

  const handleCourseScheduled = () => {
    setSubmitted(true);
    setDates([]); // Reset dates after submission
  };

  const resetForm = () => {
    setSubmitted(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative w-full bg-muted py-12">
        <Image
          src="https://placehold.co/1920x480.png"
          alt="Banner de calendario de manejo"
          fill
          className="absolute inset-0 z-0 object-cover opacity-10"
          data-ai-hint="calendar schedule"
        />
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Button asChild variant="outline" className="bg-background/80 backdrop-blur-sm hover:bg-background">
              <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                www.autoescuelaamericana.com
              </a>
            </Button>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
            Agenda tu Curso
          </h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            Sigue los pasos para solicitar tu curso de manejo. ¡Es rápido y fácil!
          </p>
        </div>
      </section>
      <div className="container px-4 sm:px-6 md:px-8 py-8 flex flex-col items-center">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pagos">
              <CreditCard className="mr-2 h-4 w-4" />
              Ver Métodos de Pago
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalogo">
                <List className="mr-2 h-4 w-4" />
                Ver Catálogo y Precios
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos y Condiciones
            </Link>
          </Button>
        </div>
        
        <div className="w-full max-w-3xl">
          <Card className="w-full max-w-3xl shadow-lg rounded-xl mb-8">
            <CardHeader>
              <CardTitle>Agenda del Día (Ejemplo)</CardTitle>
              <CardDescription>
                Así se verían las clases confirmadas (verde) y pendientes (amarillo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAppointments.map((apt) => (
                <div
                  key={apt.time}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    apt.status === 'confirmed'
                      ? 'bg-green-100/50 dark:bg-green-900/30 border-green-500/50'
                      : 'bg-yellow-100/50 dark:bg-yellow-900/30 border-yellow-500/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {apt.status === 'confirmed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Hourglass className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{apt.time} - {apt.student}</p>
                      <Badge variant={apt.type === 'Automático' ? 'default' : 'secondary'} className="mt-1">
                        {apt.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {apt.status === 'confirmed' ? (
                      <span className="text-green-700 dark:text-green-300">Confirmado</span>
                    ) : (
                      <span className="text-yellow-700 dark:text-yellow-300">Pendiente</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        
          {submitted ? (
            <Card className="shadow-lg rounded-xl text-center">
              <CardHeader>
                <CardTitle className="flex justify-center items-center gap-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  ¡Solicitud Enviada!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground">
                  Gracias por agendar con nosotros.
                </p>
                <p className="mt-2 text-muted-foreground">
                  Hemos abierto WhatsApp para que puedas enviar tu solicitud. Un instructor se pondrá en contacto contigo muy pronto para confirmar los detalles.
                </p>
              </CardContent>
              <CardFooter className="flex-col sm:flex-row justify-center gap-4">
                <Button onClick={resetForm}>
                  Agendar otro curso
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Volver al Inicio</Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
             <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Paso 1: Elige las Fechas de tu Curso</CardTitle>
                    <CardDescription>Puedes seleccionar hasta 6 días para tu curso en el calendario.</CardDescription>
                </CardHeader>
                <CardContent className="p-2 flex flex-col items-center gap-4">
                    {isClient ? (
                        <Calendar
                            mode="multiple"
                            min={1}
                            max={6}
                            selected={dates}
                            onSelect={setDates}
                            className="rounded-md"
                            locale={es}
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                        />
                    ) : (
                        <div className="p-3">
                            <div className="h-[370px] w-[340px] bg-muted rounded-md animate-pulse"></div>
                        </div>
                    )}
                    <Alert variant="default" className="bg-primary/10 border-primary/50 w-full max-w-md">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-bold">Aviso para Menores de Edad</AlertTitle>
                        <AlertDescription className="text-foreground">
                        La constancia para el trámite de permiso de conducir tiene un costo adicional de $500 MXN. Si la necesitas, podrás solicitarla en el siguiente paso.
                        </AlertDescription>
                    </Alert>
                </CardContent>
                {dates && dates.length > 0 && (
                  <>
                    <Separator />
                    <CardHeader>
                        <CardTitle>Paso 2: Completa tus Datos</CardTitle>
                        <CardDescription>Completa el formulario para enviar tu solicitud por WhatsApp.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScheduleForm selectedDates={dates} onCourseScheduled={handleCourseScheduled} />
                    </CardContent>
                  </>
                )}
             </Card>
          )}
        </div>

      </div>
       <AppFooter />
    </main>
  );
}
