
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, User, Phone, Send, CheckCircle, Globe, FileText, BookUser } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AppFooter } from '@/components/footer';
import { programData } from '@/lib/course-data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { guardarFicha } from './actions';

const notesSchema = z.object({
  studentName: z.string().min(2, { message: 'Por favor, ingresa el nombre completo del alumno.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
});

type NotesFormValues = z.infer<typeof notesSchema>;

type CheckedItems = {
  [key: string]: boolean;
};

export default function NotasAlumnoPage() {
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<NotesFormValues>({
    resolver: zodResolver(notesSchema),
    defaultValues: {
      studentName: '',
      phone: '',
    },
  });

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: isChecked }));
  };

  function onSubmit(data: NotesFormValues) {
    let coveredTopics = '✅ *Temas Cubiertos*\n';
    let pendingTopics = '📝 *Temas Pendientes por Repasar*\n';
    let hasCovered = false;
    let hasPending = false;
    const completedTopicsArr: string[] = [];
    const pendingTopicsArr: string[] = [];
    let totalTopics = 0;

    programData.forEach(section => {
        let coveredPoints: string[] = [];
        let pendingPoints: string[] = [];

        section.content.forEach((contentBlock, blockIndex) => {
            contentBlock.points.forEach((point, index) => {
                const pointId = `${section.title}-${blockIndex}-${index}`;
                totalTopics++;
                if (checkedItems[pointId]) {
                    coveredPoints.push(`  • ${point}`);
                    completedTopicsArr.push(point);
                } else {
                    pendingPoints.push(`  • ${point}`);
                    pendingTopicsArr.push(point);
                }
            });
        });

        if (coveredPoints.length > 0) {
            hasCovered = true;
            coveredTopics += `\n*${section.title}*\n${coveredPoints.join('\n')}\n`;
        }
        if (pendingPoints.length > 0) {
            hasPending = true;
            pendingTopics += `\n*${section.title}*\n${pendingPoints.join('\n')}\n`;
        }
    });

    // Guardar ficha en Firestore (fire-and-forget)
    guardarFicha(data.studentName, data.phone, completedTopicsArr, pendingTopicsArr, totalTopics)
      .catch(err => console.error('[notas-alumno] Error guardando ficha:', err));

    const whatsAppNumber = "52" + data.phone;
    let message = `*Reporte de Avance para ${data.studentName}*\n\n` +
                  `Hola ${data.studentName}, aquí tienes un resumen de tu progreso en el curso de manejo de Auto Escuela Americana:\n\n`;

    if (hasCovered) {
        message += coveredTopics;
    } else {
        message += 'Aún no hemos marcado temas como cubiertos. ¡En la próxima clase empezamos!\n';
    }

    if (hasPending) {
        message += `\n---\n\n${pendingTopics}`;
    } else {
        message += '\n---\n\n🎉 *¡Felicidades!* Has cubierto todos los temas del programa.';
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    setSubmitted(true);
  };
  
  const resetForm = () => {
    setSubmitted(false);
    setCheckedItems({});
    form.reset();
  };

  let blockIndex = 0; // Needed for unique checkbox IDs

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="https://app.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 h-4 w-4" />
              app.autoescuelaamericana.com
            </a>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Notas de Progreso del Alumno
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Genera un reporte de avance para el alumno y compártelo fácilmente por WhatsApp.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Reporte de Avance</CardTitle>
                <CardDescription>
                  Ingresa los datos del alumno y marca los temas cubiertos en clase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {submitted ? (
                    <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <AlertTitle className="text-xl font-bold text-green-700 dark:text-green-300">
                            ¡Reporte Listo para Enviar!
                        </AlertTitle>
                        <AlertDescription className="text-foreground mt-2">
                            Se ha abierto WhatsApp con el reporte de avance del alumno.
                        </AlertDescription>
                    </Alert>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="studentName"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Nombre del Alumno</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input placeholder="Nombre completo" {...field} className="pl-10" />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Teléfono del Alumno</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input type="tel" placeholder="5512345678" {...field} className="pl-10" />
                              </FormControl>
                            </div>
                             <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                        <Label className="font-semibold text-base mb-2 flex items-center gap-2"><BookUser />Temas del Programa</Label>
                        <CardDescription>Marca los temas que el alumno ya domina.</CardDescription>
                         <Accordion type="single" collapsible className="w-full mt-4 border rounded-md px-4">
                            {programData.map((section) => (
                                <AccordionItem value={section.title} key={section.title}>
                                    <AccordionTrigger className="text-lg font-semibold">{section.title}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 text-muted-foreground">
                                        {section.content.map((contentBlock) => {
                                            blockIndex++;
                                            return (
                                            <div key={blockIndex}>
                                                {contentBlock.heading && (
                                                    <h4 className="font-semibold text-foreground mb-2">{contentBlock.heading}</h4>
                                                )}
                                                <div className="space-y-3 pl-2">
                                                {contentBlock.points.map((item, itemIndex) => {
                                                    const id = `${section.title}-${blockIndex}-${itemIndex}`;
                                                    return (
                                                    <div key={id} className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={id}
                                                            checked={!!checkedItems[id]}
                                                            onCheckedChange={(checked) => handleCheckboxChange(id, !!checked)}
                                                        />
                                                        <Label htmlFor={id} className="font-normal cursor-pointer leading-tight">{item}</Label>
                                                    </div>
                                                    );
                                                })}
                                                </div>
                                            </div>
                                            );
                                        })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-4">
                 {submitted ? (
                    <Button type="button" onClick={resetForm}>
                        Crear Nuevo Reporte
                    </Button>
                 ) : (
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                       <Send className="mr-2 h-4 w-4" />
                      Generar y Compartir Avance
                    </Button>
                 )}
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
       <AppFooter />
    </main>
  );
}
