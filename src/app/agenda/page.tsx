'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CalendarPlus, CheckCircle2, Phone, Clock, Calendar as CalendarIcon, CreditCard, ShoppingBag, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { ScheduleForm } from '@/components/schedule-form';
import { Separator } from '@/components/ui/separator';

type Course = {
  id: number;
  name: string;
  phone: string;
  time: string;
  dates: Date[];
  status: 'Pendiente' | 'Confirmado';
  instructor?: string;
};

export default function AgendaPage() {
  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [courseToConfirm, setCourseToConfirm] = useState<Course | null>(null);
  const [instructorName, setInstructorName] = useState('');

  const datesInfo = dates && dates.length > 0 
    ? `${dates.length} ${dates.length === 1 ? 'día' : 'días'} seleccionado${dates.length > 1 ? 's' : ''}` 
    : 'Ninguna fecha seleccionada';

  const handleScheduleCourse = (newCourseData: { name: string; phone: string; time: string; dates: Date[] }) => {
    const newCourse: Course = {
      id: Date.now(),
      ...newCourseData,
      status: 'Pendiente',
    };
    setCourses(prevCourses => [newCourse, ...prevCourses]);
    setIsDialogOpen(false);
    setDates([]); // Reset date selection
  };

  const handleConfirmCourse = () => {
    if (!courseToConfirm || !instructorName.trim()) return;
    
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseToConfirm.id ? { ...course, status: 'Confirmado', instructor: instructorName.trim() } : course
      )
    );
    
    closeConfirmationDialog();
  };

  const isConfirmDialogButtonDisabled = !instructorName.trim();

  const closeConfirmationDialog = () => {
    setCourseToConfirm(null);
    setInstructorName('');
  }

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
        <div className="mb-4 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pagos">
              <CreditCard className="mr-2 h-4 w-4" />
              Ver Datos de Pago
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://wa.me/c/5215634433212" target="_blank" rel="noopener noreferrer">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Catálogo
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Seleccionar Fechas</CardTitle>
                    <CardDescription>Elige hasta 6 días para el curso.</CardDescription>
                </CardHeader>
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
                <CardFooter className="flex-col items-start p-4 border-t">
                    <p className="text-sm font-medium mb-2">Fechas seleccionadas: <span className="text-primary font-bold">{datesInfo}</span></p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={!dates || dates.length === 0} className="w-full">
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
                            <ScheduleForm selectedDates={dates} onCourseScheduled={handleScheduleCourse} />
                        )}
                      </DialogContent>
                    </Dialog>
                </CardFooter>
             </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="h-full shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle>Cursos por Confirmar</CardTitle>
                <CardDescription>
                    Aquí se muestran las solicitudes de los alumnos. Confirma para asignar un instructor y enlazarlo con el alumno.
                    <br/>
                    <span className="text-xs text-muted-foreground italic">(Esto es una simulación. Los datos se perderán al recargar la página)</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16 border rounded-lg">
                        <p className="font-semibold">No hay cursos programados.</p>
                        <p className="text-sm mt-1">Selecciona una o más fechas y agenda un nuevo curso.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {courses.map((course) => (
                            <Card key={course.id} className="bg-muted/30">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg">{course.name}</CardTitle>
                                    <Badge variant={course.status === 'Confirmado' ? 'default' : 'secondary'} className="capitalize">
                                        {course.status === 'Confirmado' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                        {course.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{course.phone}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Clases a las {course.time}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex items-start">
                                        <CalendarIcon className="mr-2 mt-1 h-4 w-4 text-muted-foreground" />
                                        <ul className="list-disc list-inside">
                                            {course.dates.map(date => (
                                                <li key={date.toISOString()}>{format(date, "EEEE, d 'de' MMMM", { locale: es })}</li>
                                            ))}
                                        </ul>
                                    </div>
                                     {course.status === 'Confirmado' && course.instructor && (
                                        <>
                                            <Separator className="my-2" />
                                            <div className="flex items-center pt-1 text-green-700 dark:text-green-400 font-semibold">
                                                <UserCheck className="mr-2 h-4 w-4" />
                                                <span>Confirmado por: {course.instructor}</span>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                {course.status === 'Pendiente' && (
                                    <CardFooter>
                                        <Button className="w-full" onClick={() => setCourseToConfirm(course)}>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Asignar Instructor y Confirmar
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
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
          <Link href="/terminos" className="hover:underline">
            Términos y Condiciones
          </Link>
        </p>
        <p className="mt-2">
          Powered by Next.js and Genkit.
        </p>
      </footer>

      <Dialog open={!!courseToConfirm} onOpenChange={(open) => !open && closeConfirmationDialog()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Curso y Asignar Instructor</DialogTitle>
                <DialogDescription>
                    Ingresa tu nombre para confirmar que tomarás este curso. Esto enlazará al alumno contigo.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="instructor-name" className="text-right">
                        Instructor
                    </Label>
                    <Input
                        id="instructor-name"
                        value={instructorName}
                        onChange={(e) => setInstructorName(e.target.value)}
                        placeholder="Tu nombre"
                        className="col-span-3"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={closeConfirmationDialog}>Cancelar</Button>
                <Button onClick={handleConfirmCourse} disabled={isConfirmDialogButtonDisabled}>
                    Confirmar y Asignar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
