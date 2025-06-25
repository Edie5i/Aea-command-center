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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedDateString = date ? format(date, "EEEE, d 'de' MMMM", { locale: es }) : 'Ninguna fecha seleccionada';

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
                        mode="single"
                        selected={date}
                        onSelect={setDate}
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
                <CardTitle>Clases para: <span className="text-primary">{selectedDateString}</span></CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Agendar Clase
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agendar nueva clase</DialogTitle>
                      <DialogDescription>
                        Completa los datos del alumno para agendar una clase el <span className="font-semibold text-foreground">{date ? format(date, "d 'de' MMMM", { locale: es }) : ''}</span>.
                      </DialogDescription>
                    </DialogHeader>
                    {date && (
                        <ScheduleForm selectedDate={date} onFormSubmit={() => setIsDialogOpen(false)} />
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-16 border-t">
                  <p className="font-semibold">No hay clases programadas.</p>
                  <p className="text-sm mt-1">Selecciona otra fecha o agenda una nueva clase para este día.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
       <footer className="w-full mt-auto py-8 text-center text-sm text-muted-foreground border-t">
        <p>
          Powered by Next.js and Genkit.
        </p>
      </footer>
    </main>
  );
}
