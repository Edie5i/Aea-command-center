
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Upload, Calendar as CalendarIcon, ExternalLink, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFichaAction } from './actions';
import { useFichas } from '@/hooks/useFichas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Subiendo...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Subir Ficha
        </>
      )}
    </Button>
  );
}

export default function FichasAdminPage() {
  const [state, formAction] = useFormState(uploadFichaAction, { message: null, errors: null });
  const { toast } = useToast();
  const { fichas, loading, error } = useFichas();

  // Show a toast on form submission result
  if (state?.message) {
    toast({
      title: state.errors ? 'Error' : 'Éxito',
      description: state.message,
      variant: state.errors ? 'destructive' : 'default',
    });
    // Reset message to prevent re-toasting on re-render
    state.message = null; 
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline" size="icon">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Fichas de Inscripción</h1>
            <p className="text-muted-foreground">Sube y administra las fichas de los alumnos.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Subir Nueva Ficha</CardTitle>
                <CardDescription>Completa los datos y selecciona el archivo PDF.</CardDescription>
              </CardHeader>
              <form action={formAction}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Nombre del Alumno</Label>
                    <Input id="studentName" name="studentName" placeholder="Juan Pérez" required />
                    {state?.errors?.studentName && <p className="text-destructive text-sm">{state.errors.studentName[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classDate">Fecha de la Clase</Label>
                    <Input id="classDate" name="classDate" type="date" required />
                     {state?.errors?.classDate && <p className="text-destructive text-sm">{state.errors.classDate[0]}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">Archivo PDF de la Ficha</Label>
                    <Input id="file" name="file" type="file" accept="application/pdf" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <SubmitButton />
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* List Column */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Fichas Subidas</CardTitle>
                <CardDescription>Lista de todas las fichas de inscripción registradas.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <p>Cargando fichas...</p>
                    </div>
                )}
                {error && (
                   <Alert variant="destructive">
                    <AlertTitle>Error al Cargar</AlertTitle>
                    <AlertDescription>No se pudieron cargar las fichas. Por favor, intenta de nuevo.</AlertDescription>
                  </Alert>
                )}
                {!loading && !error && fichas.length === 0 && (
                  <Alert>
                    <AlertTitle>No hay Fichas</AlertTitle>
                    <AlertDescription>Aún no se ha subido ninguna ficha de inscripción.</AlertDescription>
                  </Alert>
                )}
                {!loading && !error && fichas.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alumno</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fichas.map((ficha) => (
                        <TableRow key={ficha.id}>
                          <TableCell className="font-medium">{ficha.studentName}</TableCell>
                          <TableCell>{format(ficha.classDate, "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="icon">
                                <a href={ficha.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
