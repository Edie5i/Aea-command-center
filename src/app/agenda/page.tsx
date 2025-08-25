
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { es } from 'date-fns/locale';
import { format, isPast, isToday } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ArrowLeft, CreditCard, List, Globe, FileText, CalendarCheck, CheckCircle, Download, User, Phone, MapPin, Clock, MessageSquare, UserCheck } from 'lucide-react';
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

const timeSlots = ["7:00 AM", "10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM"];

export default function AgendaPage() {
  const [selectedDates, setSelectedDates] = useState<DateWithTime[]>([]);
  const [courseScheduled, setCourseScheduled] = useState(false);
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
    // Filter out past dates, but allow today
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
    form.reset();
  };

  async function onSubmit(values: ScheduleFormValues) {
    // Fill in any empty time slots with the previous day's time
    const finalDates = [...selectedDates];
    for (let i = 0; i < finalDates.length; i++) {
        if (!finalDates[i].time && i > 0) {
            finalDates[i].time = finalDates[i-1].time;
        }
    }
    
    if (finalDates.some(d => !d.time)) {
        toast({
            variant: 'destructive',
            title: 'Error de Horario',
            description: 'Por favor, selecciona un horario para al menos el primer día.',
        });
        return;
    }

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // --- Header ---
    const headerBlue = '#1D4ED8';
    doc.setFillColor(headerBlue);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor('#C0C0C0');
    doc.setLineWidth(0.2);
    doc.setTextColor('#FFFFFF');
    doc.text('FICHA DE INSCRIPCIÓN', 105, 20, { align: 'center', renderingMode: 'FillThenStroke' });

    let y = 45;
    const leftMargin = 20;
    const rightMargin = 115;
    const sectionSpacing = 15;
    const itemSpacing = 8;
    
    const addSectionTitle = (title: string) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(headerBlue);
        doc.text(title, leftMargin, y);
        y += 10;
    };
    
    const addDataRow = (label: string, value: string) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666666');
        doc.text(label, leftMargin, y);
        
        doc.setTextColor('#000000');
        doc.text(value, rightMargin, y);
        y += itemSpacing;
    };

    // --- Student & Course Data ---
    addSectionTitle('DATOS DEL ALUMNO Y CURSO');
    addDataRow('Nombre Completo:', values.name);
    addDataRow('Teléfono de Contacto:', values.phone);
    addDataRow('Tipo de Transmisión:', values.transmission);
    if (values.isMinor) {
        addDataRow('Modalidad:', 'Menor de Edad');
    }
    y += itemSpacing;

    addSectionTitle('PUNTO DE ENCUENTRO');
    doc.setFontSize(11);
    doc.setTextColor('#000000');
    const addressLines = doc.splitTextToSize(values.address, 170);
    doc.text(addressLines, leftMargin, y);
    y += (addressLines.length * 6) + 5;

    // --- Dates & Times ---
    addSectionTitle('FECHAS Y HORARIOS SOLICITADOS');
    doc.setFontSize(11);
    doc.setTextColor('#000000');
    finalDates.forEach(item => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.text(`• ${format(item.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} - ${item.time}`, leftMargin, y);
        y += 7;
    });
    y += 5;

    // --- Additional Notes ---
    if (values.notes) {
        addSectionTitle('NOTAS ADICIONALES');
        doc.setFontSize(11);
        const noteLines = doc.splitTextToSize(values.notes, 170);
        doc.text(noteLines, leftMargin, y);
        y += noteLines.length * 7;
    }
    
    // --- Footer ---
    doc.setFillColor(headerBlue);
    doc.rect(0, 282, 210, 15, 'F');
    doc.setFontSize(9);
    doc.setTextColor('#FFFFFF');
    doc.text(`Ficha generada el ${format(new Date(), 'dd/MM/yyyy')}. Sujeto a confirmación por un asesor. | www.autoescuelaamericana.com`, 105, 288, { align: 'center' });

    doc.save(`Ficha_AEA_${values.name.replace(/\s/g, '_')}.pdf`);

    let message = `*¡Hola! Quiero solicitar mi inscripción.*\n\n`;
    message += `*Nombre:* ${values.name}\n`;
    if (values.isMinor) { message += `*Modalidad:* El curso es para un MENOR DE EDAD.\n`; }
    message += `*Teléfono:* ${values.phone}\n`;
    message += `*Punto de Encuentro:* ${values.address}\n`;
    message += `*Transmisión:* ${values.transmission}\n\n`;
    message += `*Fechas y Horarios solicitados:*\n`;
    finalDates.forEach(item => {
        message += `• ${format(item.date, "EEEE, d 'de' MMMM", { locale: es })} a las ${item.time}\n`;
    });
     if (values.notes) {
        message += `\n*Notas Adicionales:*\n${values.notes}\n`;
    }
    message += `\nAdjunto mi ficha de inscripción. Un asesor se pondrá en contacto para confirmar los horarios. ¡Gracias!`;

    const whatsAppNumber = "525634433212";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    setCourseScheduled(true);
    toast({ title: '¡Ficha Generada!', description: 'Se ha descargado tu ficha y se abrirá WhatsApp para que envíes tu solicitud.' });
  }

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
                            Tu ficha se ha descargado y se ha preparado un mensaje en WhatsApp para que lo envíes junto con el PDF. Un asesor confirmará los horarios a la brevedad.
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
                                    Elige un horario para cada día. Si dejas uno vacío, se usará el del día anterior.
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
                                                {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
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
                                            <Download className="mr-2 h-4 w-4" />
                                            Enviar y Crear Ficha
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
