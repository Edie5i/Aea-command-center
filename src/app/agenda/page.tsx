
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { es } from 'date-fns/locale';
import { format, isPast, isToday, parse } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createCalendarEventAction } from '@/app/actions';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ArrowLeft, CreditCard, List, Globe, FileText, CalendarCheck, CheckCircle, Download, User, Phone, MapPin, MessageSquare, UserCheck, Loader2 } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const scheduleSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  address: z.string().min(10, { message: 'Por favor, introduce una dirección válida (mínimo 10 caracteres).' }),
  transmission: z.string({ required_error: 'Debes seleccionar el tipo de transmisión.' }),
  isMinor: z.boolean().default(false).optional(),
  notes: z.string().optional(),
  terms: z.boolean().refine((value) => value === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

type DateWithTime = {
    date: Date;
    time?: string;
};

type SubmissionData = {
    values: ScheduleFormValues;
    dates: DateWithTime[];
};

const timeSlots = ["07:00", "10:00", "13:00", "16:00", "19:00"];

export default function AgendaPage() {
  const [selectedDates, setSelectedDates] = useState<DateWithTime[]>([]);
  const [courseScheduled, setCourseScheduled] = useState(false);
  const [calendarLink, setCalendarLink] = useState<string | null>(null);
  const [lastSubmission, setLastSubmission] = useState<SubmissionData | null>(null);
  const { toast } = useToast();
  
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      transmission: undefined,
      isMinor: false,
      notes: '',
      terms: false,
    },
  });

  const handleSelectDates = (dates: Date[] | undefined) => {
    const newDates = dates || [];
    const validDates = newDates.filter(date => isToday(date) || !isPast(date));
    const dateWithTimeObjects = validDates.slice(0, 6).map(date => ({ date }));
    setSelectedDates(dateWithTimeObjects);
  };
  
  const handleTimeChange = (dateIndex: number, time: string) => {
    const updatedDates = [...selectedDates];
    updatedDates[dateIndex].time = time;
    setSelectedDates(updatedDates);
  };

  const handleClearSelection = () => {
    setSelectedDates([]);
  };

  const handleNewSchedule = () => {
    setCourseScheduled(false);
    setSelectedDates([]);
    setCalendarLink(null);
    setLastSubmission(null);
    form.reset();
  };

  const handleDownloadPdf = async () => {
    if (!lastSubmission) return;
    const { values, dates } = lastSubmission;

    try {
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        let y = 20;
        const addText = (text: string, isTitle = false) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', isTitle ? 'bold' : 'normal');
            doc.setFontSize(isTitle ? 16 : 11);
            doc.text(text, 15, y);
            y += isTitle ? 10 : 7;
        };

        addText('Ficha de Inscripción - Auto Escuela Americana', true);
        y += 5;

        addText(`Nombre del Alumno: ${values.name}`);
        addText(`Teléfono de Contacto: ${values.phone}`);
        addText(`Tipo de Transmisión: ${values.transmission}`);
        if (values.isMinor) addText('Modalidad: El curso es para un menor de edad');
        addText(`Punto de Encuentro: ${values.address}`);
        if (values.notes) addText(`Notas Adicionales: ${values.notes}`);

        y += 5;
        addText('Fechas y Horarios Solicitados:', true);

        dates.forEach(item => {
            const formattedTime = item.time ? format(parse(item.time, 'HH:mm', new Date()), 'h:mm a') : 'Sin hora';
            const formattedDate = format(item.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
            addText(`• ${formattedDate} a las ${formattedTime}`);
        });

        doc.save(`Ficha_AEA_${values.name.replace(/\s/g, '_')}.pdf`);

    } catch (e) {
        console.error("PDF generation failed: ", e);
        toast({
            variant: 'destructive',
            title: 'Error al Generar PDF',
            description: 'No pudimos generar la ficha. Por favor, inténtalo de nuevo o contacta a un asesor.',
        });
    }
  };
  
  const handleOpenWhatsApp = () => {
    if (!lastSubmission) return;
    const { values, dates } = lastSubmission;

    let message = `*¡Hola! Quiero solicitar mi inscripción.*\n\n`;
    message += `*Nombre:* ${values.name}\n`;
    if (values.isMinor) { message += `*Modalidad:* El curso es para un MENOR DE EDAD.\n`; }
    message += `*Teléfono:* ${values.phone}\n`;
    message += `*Punto de Encuentro:* ${values.address}\n`;
    message += `*Transmisión:* ${values.transmission}\n\n`;
    message += `*Fechas y Horarios solicitados:*\n`;
    dates.forEach(item => {
        const formattedTime = format(parse(item.time!, 'HH:mm', new Date()), 'h:mm a');
        message += `• ${format(item.date, "EEEE, d 'de' MMMM", { locale: es })} a las ${formattedTime}\n`;
    });
    if (values.notes) {
        message += `\n*Notas Adicionales:*\n${values.notes}\n`;
    }
    message += `\nAdjunto mi ficha de inscripción. Un asesor se pondrá en contacto para confirmar los horarios. ¡Gracias!`;

    const whatsAppNumber = "525634433212";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };


  async function onSubmit(values: ScheduleFormValues) {
    try {
        if (selectedDates.length === 0) {
            toast({ variant: 'destructive', title: 'Error de Horario', description: 'Por favor, selecciona al menos un día.' });
            return;
        }
        if (!selectedDates.every(d => !!d.time)) {
            toast({ variant: 'destructive', title: 'Error de Horario', description: 'Selecciona un horario para cada día.' });
            return;
        }

        const eventCreationResult = await createCalendarEventAction({
          studentName: values.name,
          phone: values.phone,
          address: values.address,
          transmission: values.transmission,
          isMinor: values.isMinor,
          notes: values.notes,
          classDates: selectedDates.map(d => ({
              date: format(d.date, 'yyyy-MM-dd'),
              time: d.time!
          }))
        });

        if (!eventCreationResult.success) {
            toast({
                variant: 'destructive',
                title: 'Error al Agendar',
                description: eventCreationResult.error || 'No se pudo registrar la solicitud en el calendario.',
            });
            return;
        }

        setCourseScheduled(true);
        if (eventCreationResult.link) {
          setCalendarLink(eventCreationResult.link);
        }
        setLastSubmission({ values, dates: selectedDates });
        
        toast({
            title: '¡Solicitud Registrada!',
            description: 'Tu curso fue agendado. Ahora puedes descargar tu ficha.',
            className: 'bg-green-100 dark:bg-green-900/30 border-green-500'
        });
    } catch (error) {
        console.error("An unexpected error occurred in onSubmit:", error);
        toast({
            variant: 'destructive',
            title: 'Error Inesperado',
            description: 'Ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        });
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="relative w-full bg-muted py-12">
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Button asChild variant="outline" className="bg-background/80 backdrop-blur-sm hover:bg-background">
              <a href="https://app.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                app.autoescuelaamericana.com
              </a>
            </Button>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
            Agenda tu Curso
          </h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            {courseScheduled ? '¡Tu solicitud ha sido registrada con éxito!' : 'Selecciona las fechas para tu curso y completa el formulario.'}
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
                            ¡Solicitud de Inscripción Registrada!
                        </AlertTitle>
                        <AlertDescription className="text-foreground mt-2">
                            Tu clase se ha agendado con éxito. Ahora, descarga tu ficha y envíala por WhatsApp a un asesor para completar el proceso.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
                        <Button onClick={handleDownloadPdf} variant="secondary">
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Ficha PDF
                        </Button>
                         <Button onClick={handleOpenWhatsApp}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Enviar por WhatsApp
                        </Button>
                        {calendarLink && (
                          <Button asChild variant="outline">
                            <a href={calendarLink} target="_blank" rel="noopener noreferrer">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Ver Evento en Calendario
                            </a>
                          </Button>
                        )}
                        <Button onClick={handleNewSchedule} variant="ghost" className="text-muted-foreground">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Agendar Otro Curso
                        </Button>
                    </div>
                </CardContent>
             ) : (
                <>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                        Paso 1: Selecciona tus Días de Clase
                    </CardTitle>
                    <CardDescription>
                       Elige hasta 6 fechas. Un asesor confirmará los horarios por WhatsApp.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-auto flex justify-center">
                        <Calendar
                            mode="multiple"
                            selected={selectedDates.map(d => d.date)}
                            onSelect={handleSelectDates}
                            locale={es}
                            numberOfMonths={1}
                            disabled={(date) => isPast(date) && !isToday(date)}
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
                            <div className="space-y-4">
                               <CardHeader className="p-0 mb-4">
                                  <CardTitle>Paso 2: Selecciona los Horarios</CardTitle>
                                   <CardDescription>
                                    Elige un horario para cada día.
                                  </CardDescription>
                               </CardHeader>
                               <div className="space-y-3">
                                {selectedDates.map((item, index) => (
                                    <div key={item.date.toISOString()} className="flex items-center justify-between gap-4 p-2 border rounded-md">
                                        <p className="text-sm font-medium">
                                            {format(item.date, "EEEE, d 'de' MMMM", { locale: es })}
                                        </p>
                                        <Select onValueChange={(value) => handleTimeChange(index, value)} defaultValue={item.time}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Selecciona horario" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{format(parse(slot, 'HH:mm', new Date()), 'h:mm a')}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                                </div>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                                        <CardHeader className="p-0">
                                            <CardTitle>Paso 3: Completa tus Datos</CardTitle>
                                            <CardDescription>
                                                Llena este breve formulario para crear tu ficha.
                                            </CardDescription>
                                        </CardHeader>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <FormField control={form.control} name="name" render={({ field }) => (
                                              <FormItem>
                                                  <FormLabel>Nombre Completo</FormLabel>
                                                  <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input placeholder="Tu nombre" {...field} className="pl-10" /></FormControl></div>
                                                  <FormMessage />
                                              </FormItem>
                                          )}/>
                                          <FormField control={form.control} name="phone" render={({ field }) => (
                                              <FormItem>
                                                  <FormLabel>Teléfono de WhatsApp</FormLabel>
                                                  <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input placeholder="55 1234 5678" {...field} className="pl-10" /></FormControl></div>
                                                  <FormMessage />
                                              </FormItem>
                                          )}/>
                                        </div>
                                        <FormField control={form.control} name="address" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Dirección / Punto de encuentro</FormLabel>
                                                <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><FormControl><Input placeholder="Calle, número, colonia, etc." {...field} className="pl-10" /></FormControl></div>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        
                                        <FormField control={form.control} name="transmission" render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Transmisión</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4 pt-2">
                                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Automático" id="auto"/></FormControl><Label htmlFor="auto" className="font-normal cursor-pointer">Automático</Label></FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Estándar" id="std"/></FormControl><Label htmlFor="std" className="font-normal cursor-pointer">Estándar</Label></FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        
                                        <FormField control={form.control} name="notes" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notas Adicionales (Opcional)</FormLabel>
                                                <div className="relative"><MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><FormControl><Textarea placeholder="Ej: Me da miedo incorporarme a vías rápidas" {...field} className="pl-10" /></FormControl></div>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>

                                        <div className="space-y-4">
                                            <FormField control={form.control} name="isMinor" render={({ field }) => (
                                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    <Label htmlFor="isMinor" className="font-normal flex items-center gap-2 cursor-pointer"><UserCheck className="h-4 w-4"/>Este curso es para un menor de edad</Label>
                                                </FormItem>
                                            )}/>
                                            <FormField control={form.control} name="terms" render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>Acepto los <Link href="/terminos" target="_blank" className="text-primary hover:underline">Términos y Condiciones</Link>.</FormLabel>
                                                        <FormMessage />
                                                    </div>
                                                </FormItem>
                                            )}/>
                                        </div>
                                        
                                        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                                            {form.formState.isSubmitting ? 'Procesando...' : 'Confirmar y Agendar en Calendario'}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        ) : (
                             <Alert>
                                <CalendarCheck className="h-4 w-4" />
                                <AlertTitle>Esperando selección...</AlertTitle>
                                <AlertDescription>
                                Por favor, selecciona al menos un día en el calendario para ver el formulario.
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

    