
'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { es } from 'date-fns/locale';
import { format, isPast, isToday, parse } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ArrowLeft, CreditCard, List, Globe, FileText, CalendarCheck, CheckCircle, Download, User, Phone, MapPin, MessageSquare, UserCheck, Loader2 } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createCalendarEventsAction } from './actions';

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

const timeSlots = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DOW_ES = ['L','M','X','J','V','S','D'];

function CalendarModal({ selected, onConfirm, onClose }: {
  selected: Date[];
  onConfirm: (dates: Date[]) => void;
  onClose: () => void;
}) {
  const todayRef = new Date(); todayRef.setHours(0,0,0,0);
  const [yr, setYr] = useState(todayRef.getFullYear());
  const [mo, setMo] = useState(todayRef.getMonth());
  const [picked, setPicked] = useState<Date[]>(selected);

  function navMonth(dir: number) {
    let m = mo + dir, y = yr;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMo(m); setYr(y);
  }

  function toggleDay(d: Date) {
    if (d < todayRef) return;
    const t = d.getTime();
    const idx = picked.findIndex((p: Date) => p.getTime() === t);
    if (idx >= 0) setPicked(picked.filter((_: Date, i: number) => i !== idx));
    else if (picked.length < 6) setPicked([...picked, d].sort((a: Date, b: Date) => a.getTime() - b.getTime()));
  }

  function buildGrid() {
    const firstDow = new Date(yr, mo, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const dim = new Date(yr, mo + 1, 0).getDate();
    const dip = new Date(yr, mo, 0).getDate();
    const total = Math.ceil((offset + dim) / 7) * 7;
    return Array.from({ length: total }, (_: unknown, i: number) => {
      let day: number, dy = yr, dm = mo, other = false;
      if (i < offset) { day = dip - offset + i + 1; dm = mo - 1; if (dm < 0) { dm = 11; dy = yr - 1; } other = true; }
      else if (i >= offset + dim) { day = i - offset - dim + 1; dm = mo + 1; if (dm > 11) { dm = 0; dy = yr + 1; } other = true; }
      else { day = i - offset + 1; }
      const date = new Date(dy, dm, day); date.setHours(0,0,0,0);
      const past = date < todayRef;
      const sel = picked.some((p: Date) => p.getTime() === date.getTime());
      const tdy = date.getTime() === todayRef.getTime();
      return { day, date, other, past, sel, tdy };
    });
  }

  return (
    <div className="fixed inset-0 bg-black/65 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-[#1C2130] w-full max-w-[420px] rounded-t-[20px] sm:rounded-2xl p-5 pb-9 sm:pb-5 border-t-2 sm:border-2 border-[#5B9BFF]" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => navMonth(-1)} className="w-10 h-10 rounded-full border border-white/20 text-white flex items-center justify-center text-xl hover:border-white/60 transition-colors">‹</button>
          <span className="font-black text-white uppercase text-lg tracking-tight">{MONTHS_ES[mo]} {yr}</span>
          <button type="button" onClick={() => navMonth(1)} className="w-10 h-10 rounded-full border border-white/20 text-white flex items-center justify-center text-xl hover:border-white/60 transition-colors">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW_ES.map(d => <div key={d} className="text-center text-[10px] font-mono text-white/40 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {buildGrid().map(({ day, date, other, past, sel, tdy }, i) => (
            <button key={i} type="button" onClick={() => toggleDay(date)}
              disabled={past || other}
              className={[
                'min-h-[44px] flex items-center justify-center rounded-xl text-base font-medium transition-colors text-white',
                other ? 'opacity-20 cursor-default' : '',
                past && !other ? 'opacity-30 cursor-default line-through' : '',
                sel ? 'bg-[#004AAD]' : '',
                !sel && tdy ? 'border-2 border-[#5B9BFF] text-[#5B9BFF]' : '',
                !sel && !past && !other ? 'hover:bg-[#5B9BFF]/20' : '',
              ].filter(Boolean).join(' ')}>
              {day}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex-1 text-white/50 text-sm font-mono">{picked.length} de 6 fechas</span>
          <button type="button" onClick={onClose} className="px-4 py-3 text-white/50 text-xs font-mono uppercase tracking-wider border border-white/15 rounded-lg hover:border-white/40 transition-colors">Cancelar</button>
          <button type="button" onClick={() => onConfirm(picked)} disabled={picked.length === 0} className="px-5 py-3 bg-[#004AAD] text-white text-xs font-mono uppercase tracking-wider rounded-lg hover:bg-[#003080] transition-colors disabled:opacity-40">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function AgendaContent() {
  const searchParams = useSearchParams();
  const [selectedDates, setSelectedDates] = useState<DateWithTime[]>([]);
  const [calOpen, setCalOpen] = useState(false);
  const [courseScheduled, setCourseScheduled] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<SubmissionData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      name: searchParams.get('name') ?? '',
      phone: searchParams.get('phone') ?? '',
      address: searchParams.get('address') ?? '',
      transmission: undefined,
      isMinor: false,
      notes: '',
      terms: false,
    },
  });

  const handleSelectDates = (dates: Date[]) => {
    const validDates = dates.filter(date => isToday(date) || !isPast(date));
    setSelectedDates(validDates.slice(0, 6).map(date => ({ date })));
  };

  const handleCalConfirm = (dates: Date[]) => {
    handleSelectDates(dates);
    setCalOpen(false);
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
    setLastSubmission(null);
    form.reset();
  };

  const handleDownloadPdf = async () => {
    if (!lastSubmission) return;

    toast({ title: 'Generando PDF...' });
    setIsProcessing(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { values, dates } = lastSubmission;
      
      const doc = new jsPDF();
      
      doc.setFillColor(0, 74, 173);
      doc.rect(0, 0, 210, 25, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("AUTO ESCUELA AMERICANA", 105, 15, { align: 'center' });
      
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 74, 173);
      doc.text("Ficha de Inscripción", 105, 38, { align: 'center' });
      
      let y = 55;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Datos del Alumno", 14, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${values.name}`, 14, y);
      y += 7;
      doc.text(`Teléfono: ${values.phone}`, 14, y);
      y += 7;
      
      const addressLines = doc.splitTextToSize(`Punto de Encuentro: ${values.address}`, 180);
      doc.text(addressLines, 14, y);
      y += (addressLines.length * 5) + 2;

      doc.text(`Transmisión: ${values.transmission}`, 14, y);
      y += 7;

      if (values.isMinor) {
          doc.setFont('helvetica', 'bold');
          doc.text("Modalidad: El curso es para un MENOR DE EDAD.", 14, y);
          y += 7;
          doc.setFont('helvetica', 'normal');
      }

      if (values.notes) {
          y += 2;
          const notesLines = doc.splitTextToSize(`Notas Adicionales: ${values.notes}`, 180);
          doc.text(notesLines, 14, y);
          y += (notesLines.length * 5) + 3;
      }

      y += 5;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Fechas y Horarios Solicitados", 14, y);
      y += 8;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      dates.forEach(item => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          const formattedTime = item.time ? format(parse(item.time, 'HH:mm', new Date()), 'h:mm a') : 'Sin hora';
          doc.text(`• ${format(item.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} a las ${formattedTime}`, 14, y);
          y += 7;
      });
      
      doc.save(`Ficha_${values.name.replace(/ /g, '_')}.pdf`);
      toast({ title: 'PDF generado exitosamente.' });

    } catch (error) {
      console.error("Error al generar PDF:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        variant: 'destructive',
        title: 'Error al Generar PDF',
        description: `Hubo un problema al crear la ficha: ${errorMessage}`,
      });
    } finally {
        setIsProcessing(false);
    }
  };

  async function onSubmit(values: ScheduleFormValues) {
    setIsProcessing(true);
    try {
        if (selectedDates.length === 0) {
            throw new Error('Por favor, selecciona al menos un día para tu curso.');
        }
        if (!selectedDates.every(d => !!d.time)) {
            throw new Error('Debes seleccionar un horario para cada fecha elegida.');
        }

        // Call the calendar action first.
        const calendarResult = await createCalendarEventsAction({
            ...values,
            dates: selectedDates.map(d => ({
                date: d.date.toISOString(),
                time: d.time!, // We already checked that time is not undefined.
            })),
        });

        // If the action failed, throw an error to be caught by the main catch block.
        if (!calendarResult.success) {
            throw new Error(calendarResult.error || 'No se pudieron crear los eventos en el calendario.');
        }

        // Only if the calendar part was successful, we proceed.
        const submissionData = { values, dates: selectedDates };
        setLastSubmission(submissionData);
        setCourseScheduled(true);
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'agenda_submit', { transmission: values.transmission });
        }

        // Show a success toast with the message from the server.
        toast({
            title: '¡Solicitud Procesada con Éxito!',
            description: calendarResult.message,
            className: 'bg-green-100 dark:bg-green-900/30 border-green-500',
            duration: 7000,
        });

    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Error en la Solicitud',
            description: error.message || 'Ocurrió un error inesperado. Revisa tus datos e intenta de nuevo.',
            duration: 9000,
        });
    } finally {
        setIsProcessing(false);
    }
  }

  let whatsAppUrl = '';
  if (lastSubmission) {
      const { values, dates } = lastSubmission;
      let message = `*¡Hola! Quiero solicitar mi inscripción.*\n\n`;
      message += `*Nombre:* ${values.name}\n`;
      if (values.isMinor) { message += `*Modalidad:* El curso es para un MENOR DE EDAD.\n`; }
      message += `*Teléfono:* ${values.phone}\n`;
      message += `*Punto de Encuentro:* ${values.address}\n`;
      message += `*Transmisión:* ${values.transmission}\n\n`;
      message += `*Fechas y Horarios solicitados:*\n`;
      dates.forEach(item => {
          const formattedTime = item.time ? format(parse(item.time, 'HH:mm', new Date()), 'h:mm a') : 'A confirmar';
          message += `• ${format(item.date, "EEEE, d 'de' MMMM", { locale: es })} a las ${formattedTime}\n`;
      });
      if (values.notes) {
          message += `\n*Notas Adicionales:*\n${values.notes}\n`;
      }
      message += `\nUn asesor se pondrá en contacto para confirmar los horarios. ¡Gracias!`;

      const whatsAppNumber = "525634433212";
      const encodedMessage = encodeURIComponent(message);
      whatsAppUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;
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
            {courseScheduled ? '¡Tu inscripción y agenda están completas!' : 'Selecciona las fechas para tu curso y completa el formulario.'}
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
                            ¡Inscripción y Agenda Completas!
                        </AlertTitle>
                        <AlertDescription className="text-foreground mt-2">
                            Tus clases se han agendado correctamente en el calendario. Ahora puedes descargar tu ficha de inscripción o enviarla por WhatsApp para finalizar el proceso.
                        </AlertDescription>
                    </Alert>
                    <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
                        <Button onClick={handleDownloadPdf} variant="secondary" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {isProcessing ? 'Generando...' : 'Descargar Ficha PDF'}
                        </Button>
                         <Button asChild>
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (typeof window !== 'undefined' && (window as any).gtag) {
                                  (window as any).gtag('event', 'whatsapp_click', { location: 'agenda_success' });
                                }
                              }}
                            >
                               <MessageSquare className="mr-2 h-4 w-4" />
                               Enviar por WhatsApp
                            </a>
                        </Button>
                        <Button onClick={handleNewSchedule} variant="ghost" className="text-muted-foreground">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Generar Nueva Ficha
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
                <CardContent className="flex flex-col gap-6">
                    <div>
                      <button
                        type="button"
                        onClick={() => setCalOpen(true)}
                        className="w-full flex items-center justify-between bg-muted/50 border rounded-xl px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        <span className="text-sm text-muted-foreground">
                          {selectedDates.length > 0
                            ? `${selectedDates.length} fecha${selectedDates.length !== 1 ? 's' : ''} seleccionada${selectedDates.length !== 1 ? 's' : ''}`
                            : 'Toca para seleccionar fechas'}
                        </span>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                      {selectedDates.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          {selectedDates.map((item, i) => (
                            <span key={i} className="inline-flex items-center bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium">
                              {format(item.date, "EEE d MMM", { locale: es })}
                            </span>
                          ))}
                          <button type="button" onClick={handleClearSelection} className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
                            Limpiar
                          </button>
                        </div>
                      )}
                    </div>
                    {calOpen && (
                      <CalendarModal
                        selected={selectedDates.map(d => d.date)}
                        onConfirm={handleCalConfirm}
                        onClose={() => setCalOpen(false)}
                      />
                    )}
                    <div className="w-full">
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
                                        
                                        <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                                            {isProcessing ? 'Procesando...' : 'Generar Ficha y Agendar'}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        ) : (
                             <Alert>
                                <CalendarCheck className="h-4 w-4" />
                                <AlertTitle>Esperando selección...</AlertTitle>
                                <AlertDescription>
                                Toca el botón de arriba para elegir tus fechas de clase.
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

export default function AgendaPage() {
  return (
    <Suspense>
      <AgendaContent />
    </Suspense>
  );
}
