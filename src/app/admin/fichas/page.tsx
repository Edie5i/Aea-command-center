
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, CalendarIcon, User, FileDown, Loader2, List, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppFooter } from '@/components/footer';

const fichaSchema = z.object({
  studentName: z.string().min(2, 'El nombre es requerido.'),
  classDate: z.date({ required_error: 'La fecha de la clase es requerida.' }),
  pdfFile: z.instanceof(File).refine(file => file.size > 0, 'Debes seleccionar un archivo PDF.')
             .refine(file => file.type === 'application/pdf', 'El archivo debe ser un PDF.'),
});

type FichaFormValues = z.infer<typeof fichaSchema>;

interface Ficha {
  id: string;
  studentName: string;
  classDate: Date;
  pdfUrl: string;
}

export default function FichasAdminPage() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FichaFormValues>({
    resolver: zodResolver(fichaSchema),
  });

  useEffect(() => {
    setIsLoading(true);
    const fichasCollection = collection(db, 'fichas');
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(fichasCollection, (snapshot) => {
      const fichasData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          studentName: data.studentName,
          classDate: (data.classDate as Timestamp).toDate(),
          pdfUrl: data.pdfUrl,
        };
      });
      // Sort by class date descending
      fichasData.sort((a, b) => b.classDate.getTime() - a.classDate.getTime());
      setFichas(fichasData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching fichas: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las fichas.' });
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const onSubmit = async (data: FichaFormValues) => {
    setIsUploading(true);
    try {
      // 1. Upload PDF to Firebase Storage
      const storageRef = ref(storage, `fichas/${data.pdfFile.name}-${Date.now()}`);
      const uploadResult = await uploadBytes(storageRef, data.pdfFile);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Save data to Firestore
      await addDoc(collection(db, 'fichas'), {
        studentName: data.studentName,
        classDate: Timestamp.fromDate(data.classDate),
        pdfUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      toast({ title: '¡Éxito!', description: 'La ficha ha sido subida correctamente.' });
      form.reset();
    } catch (error) {
      console.error("Error uploading ficha: ", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al subir la ficha.' });
    } finally {
      setIsUploading(false);
    }
  };

  const scheduledDays = fichas.map(ficha => ficha.classDate);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative w-full bg-muted py-12">
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
            Gestión de Fichas de Inscripción
          </h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            Sube y consulta las fichas de los alumnos.
          </p>
        </div>
      </section>

      <div className="container px-4 sm:px-6 md:px-8 py-8 flex-grow">
        <div className="mb-8 flex justify-center">
            <Button asChild variant="outline">
                <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Panel
                </Link>
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Subir Nueva Ficha</CardTitle>
                <CardDescription>Completa los datos y sube el PDF.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="studentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Alumno</FormLabel>
                           <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input placeholder="Nombre completo" {...field} className="pl-10" /></FormControl></div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="classDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de la Clase</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP', { locale: es })
                                  ) : (
                                    <span>Selecciona una fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date('1990-01-01')}
                                initialFocus
                                locale={es}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="pdfFile"
                        render={({ field: { onChange, ...fieldProps } }) => (
                            <FormItem>
                                <FormLabel>Archivo PDF de la Ficha</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                        {...fieldProps}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isUploading}>
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {isUploading ? 'Subiendo...' : 'Subir Ficha'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Calendario de Clases</CardTitle>
                    <CardDescription>Días con fichas de inscripción registradas.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={scheduledDays}
                        locale={es}
                        modifiers={{ scheduled: scheduledDays }}
                        modifiersClassNames={{ scheduled: 'bg-primary/20 rounded-full' }}
                    />
                </CardContent>
            </Card>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><List />Fichas Registradas</CardTitle>
                    <CardDescription>Lista de todas las fichas subidas.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground py-10">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <p>Cargando fichas...</p>
                        </div>
                    ) : fichas.length === 0 ? (
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>No hay fichas</AlertTitle>
                            <AlertDescription>
                            Todavía no se ha subido ninguna ficha de inscripción.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Alumno</TableHead>
                                <TableHead>Fecha de Clase</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fichas.map((ficha) => (
                                <TableRow key={ficha.id}>
                                    <TableCell className="font-medium">{ficha.studentName}</TableCell>
                                    <TableCell>{format(ficha.classDate, 'PPP', { locale: es })}</TableCell>
                                    <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <a href={ficha.pdfUrl} target="_blank" rel="noopener noreferrer">
                                            <FileDown className="mr-2 h-4 w-4" />
                                            Ver PDF
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
      <AppFooter />
    </main>
  );
}
