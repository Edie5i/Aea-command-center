
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { es } from 'date-fns/locale';
import { format, isPast } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ArrowLeft, CreditCard, List, Globe, FileText, CalendarCheck, CheckCircle } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { Calendar } from '@/components/ui/calendar';
import { ScheduleForm } from '@/components/schedule-form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function AgendaPage() {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [courseScheduled, setCourseScheduled] = useState(false);

  const handleSelectDates = (dates: Date[] | undefined) => {
    const newDates = dates || [];
    // Filter out past dates and limit selection to 6
    const validDates = newDates.filter(date => !isPast(date) || format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
    setSelectedDates(validDates.slice(0, 6));
  };

  const handleClearSelection = () => {
    setSelectedDates([]);
  };

  const handleCourseScheduled = () => {
    setCourseScheduled(true);
  };
  
  const handleNewSchedule = () => {
    setCourseScheduled(false);
    setSelectedDates([]);
  };


  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative w-full bg-muted py-12">
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
            {courseScheduled ? '¡Tu ficha ha sido generada con éxito!' : 'Selecciona las fechas para tu curso y completa el formulario.'}
          </p>
        </div>
      </section>
      <div className="container px-4 sm:px-6 md:px-8 py-8 flex flex-col items-center">
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pagos">
              <CreditCard className="mr-2 h-4 w-4" />
              Pagos
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalogo">
                <List className="mr-2 h-4 w-4" />
                Catálogo
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos
            </Link>
          </Button>
        </div>
        
        <div className="w-full max-w-4xl">
           <Card className="w-full shadow-lg rounded-xl mb-8">
             {courseScheduled ? (
                <CardContent className="p-6 text-center">
                     <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertTitle className="text-xl font-bold text-green-700 dark:text-green-300">
                            ¡Ficha de Inscripción Generada!
                        </AlertTitle>
                        <AlertDescription className="text-foreground mt-2">
                            Tu ficha se ha descargado en formato PDF y se ha preparado un mensaje en WhatsApp para que lo envíes. Un asesor confirmará la disponibilidad de los horarios solicitados a la brevedad.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={handleNewSchedule} variant="secondary">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Agendar Otro Curso
                        </Button>
                        <Button asChild>
                            <Link href="/pagos">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Ver Métodos de Pago
                            </Link>
                        </Button>
                    </div>
                </CardContent>
             ) : (
                <>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                        Selecciona tus Días de Clase
                    </CardTitle>
                    <CardDescription>
                       Elige hasta 6 fechas en el calendario para tu curso. Las clases se confirmarán según disponibilidad.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-auto flex justify-center">
                        <Calendar
                            mode="multiple"
                            selected={selectedDates}
                            onSelect={handleSelectDates}
                            locale={es}
                            numberOfMonths={1}
                            disabled={{ before: new Date() }}
                            modifiers={{
                                selected: selectedDates,
                            }}
                            modifiersClassNames={{
                                selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
                            }}
                            footer={
                                <div className="text-center pt-2 text-sm text-muted-foreground">
                                    {selectedDates.length} de 6 días seleccionados.
                                    {selectedDates.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={handleClearSelection} className="ml-2">
                                            Limpiar
                                        </Button>
                                    )}
                                </div>
                            }
                        />
                    </div>
                    <div className="flex-grow w-full">
                        {selectedDates.length > 0 ? (
                           <ScheduleForm selectedDates={selectedDates} onCourseScheduled={handleCourseScheduled} />
                        ) : (
                             <Alert>
                                <CalendarCheck className="h-4 w-4" />
                                <AlertTitle>Esperando selección...</AlertTitle>
                                <AlertDescription>
                                Por favor, selecciona al menos un día en el calendario para ver el formulario de inscripción.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
                </>
             )}
           </Card>
        </div>
      </div>
       <AppFooter />
    </main>
  );
}
