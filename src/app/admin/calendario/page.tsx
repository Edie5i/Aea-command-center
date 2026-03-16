
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar, Loader2, User, Clock, Car } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getWeeklySchedule, type WeeklySchedule } from './actions';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CalendarioSemanalPage() {
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchedule() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getWeeklySchedule();
        if (result.error) {
          setError(result.error);
        } else {
          setSchedule(result.schedule);
        }
      } catch (e) {
        setError('Ocurrió un error inesperado al cargar el calendario.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekRange = `Semana del ${format(weekStartDate, "d 'de' MMMM", { locale: es })} al ${format(weekEndDate, "d 'de' MMMM 'de' yyyy", { locale: es })}`;

  return (
    <main className="flex min-h-screen flex-col items-center bg-secondary p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Calendario Semanal de Cursos
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Vista en tiempo real de los cursos agendados en Google Calendar.
          <br />
          <span className="font-semibold">{weekRange}</span>
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center gap-8">
        <div className="w-full max-w-5xl flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Panel
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-7xl">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg">Cargando calendario...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de Configuración</AlertTitle>
              <AlertDescription>
                No se pudo cargar el calendario. Por favor, asegúrate de que la variable de entorno `GOOGLE_CALENDAR_ID` esté configurada correctamente y que la cuenta de servicio tenga permisos para acceder al calendario.
                <br />
                <code className="text-xs bg-muted p-1 rounded-sm mt-2 block">{error}</code>
              </AlertDescription>
            </Alert>
          ) : schedule ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {Object.entries(schedule).map(([day, courses]) => (
                <Card key={day} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="capitalize">{day}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {courses.length > 0 ? (
                      <ul className="space-y-4">
                        {courses.map((course, index) => (
                          <li key={index} className="p-3 bg-background/50 rounded-lg border">
                            <p className="font-semibold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {course.studentName}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Clock className="h-4 w-4" /> {course.time}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Car className="h-4 w-4" /> {course.transmission}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No hay cursos agendados.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <Alert>
              <AlertTitle>Sin Información</AlertTitle>
              <AlertDescription>No se pudo cargar la información del calendario.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
