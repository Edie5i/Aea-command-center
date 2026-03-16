
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, Users, AlertCircle, Phone, MapPin } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getStudents, type Student } from './actions';
import { Badge } from '@/components/ui/badge';

export default function AlumnosPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudents() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getStudents();
        if (result.error) {
          setError(result.error);
        } else {
          setStudents(result.students);
        }
      } catch (e) {
        setError('Ocurrió un error inesperado al cargar la lista de alumnos.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStudents();
  }, []);
  
  const createGoogleMapsUrl = (address: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-secondary p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Gestión de Alumnos
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Consulta la información de los alumnos con cursos agendados.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center gap-8">
        <div className="w-full max-w-7xl flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Panel
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-7xl">
          <CardHeader>
            <CardTitle>Listado de Alumnos</CardTitle>
            <CardDescription>
              Información extraída de los próximos eventos en Google Calendar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg">Cargando alumnos...</p>
              </div>
            ) : error ? (
              error.includes('GOOGLE_CALENDAR_ID') ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error de Configuración</AlertTitle>
                  <AlertDescription>
                    Falta la configuración de `GOOGLE_CALENDAR_ID`. Para que la app funcione, este secreto debe estar configurado en tu entorno.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error al Cargar</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )
            ) : students && students.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Punto de Encuentro</TableHead>
                      <TableHead>Próximas Clases</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.name}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground"/>
                                <span>{student.name}</span>
                            </div>
                           <Badge variant="secondary" className="mt-1">{student.transmission}</Badge>
                        </TableCell>
                        <TableCell>
                          <a href={`tel:${student.phone}`} className="flex items-center gap-2 hover:underline text-primary">
                            <Phone className="h-4 w-4" />
                            {student.phone}
                          </a>
                        </TableCell>
                        <TableCell>
                           <a href={createGoogleMapsUrl(student.address)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="max-w-xs truncate">{student.address}</span>
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {student.classDates.map(date => (
                              <span key={date} className="text-xs text-muted-foreground whitespace-nowrap">{date}</span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>No se encontraron alumnos</AlertTitle>
                <AlertDescription>No hay alumnos con clases agendadas próximamente en el calendario.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <AppFooter />
    </main>
  );
}
