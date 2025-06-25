'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScheduleForm } from '@/components/schedule-form';

export default function AgendaPage() {
  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const datesInfo = dates && dates.length > 0 
    ? `${dates.length} ${dates.length === 1 ? 'día' : 'días'} seleccionado${dates.length > 1 ? 's' : ''}` 
    : 'Ninguna fecha seleccionada';

  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
       <div className="flex flex-col items-center text-center my-8 px-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Agenda de Clases
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Consulta y gestiona las clases de manejo programadas.
        </p>
      </div>
      <div className="container px-4 sm:px-6 md:px-8 pb-8">
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <Card className="shadow-lg rounded-xl">
                <CardContent className="p-2 flex justify-center">
                    <Calendar
                        mode="multiple"
                        min={1}
                        max={6}
                        selected={dates}
                        onSelect={setDates}
                        className="rounded-md"
                        locale={es}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                    />
                </CardContent>
             </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fechas seleccionadas: <span className="text-primary">{datesInfo}</span></CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!dates || dates.length === 0}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Agendar Curso
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agendar nuevo curso</DialogTitle>
                      <DialogDescription>
                        Completa los datos del alumno para agendar un curso en las fechas seleccionadas.
                      </DialogDescription>
                    </DialogHeader>
                    {dates && dates.length > 0 && (
                        <ScheduleForm selectedDates={dates} onFormSubmit={() => setIsDialogOpen(false)} />
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-16 border-t">
                  <p className="font-semibold">No hay cursos programados.</p>
                  <p className="text-sm mt-1">Selecciona una o más fechas y agenda un nuevo curso.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
       <footer className="w-full mt-auto py-8 text-center text-sm text-muted-foreground border-t">
        <p>
          <a href="https://www.autoescuelaamericana.mx" target="_blank" rel="noopener noreferrer" className="hover:underline">
            www.autoescuelaamericana.mx
          </a>
        </p>
        <p className="mt-2">
          Powered by Next.js and Genkit.
        </p>
      </footer>
    </main>
  );
}
