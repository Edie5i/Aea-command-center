
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

import { Calendar as CalendarIcon, ArrowLeft, CreditCard, List, CalendarCheck, CheckCircle, Download, User, Phone, MapPin, MessageSquare, UserCheck, Loader2, Star } from 'lucide-react';
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-[420px] rounded-t-[20px] sm:rounded-2xl p-5 pb-9 sm:pb-5 border-t-2 sm:border border-slate-200 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => navMonth(-1)} className="w-10 h-10 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center text-xl hover:bg-slate-50 transition-colors">‹</button>
          <span className="font-black text-slate-800 uppercase text-lg tracking-tight">{MONTHS_ES[mo]} {yr}</span>
          <button type="button" onClick={() => navMonth(1)} className="w-10 h-10 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center text-xl hover:bg-slate-50 transition-colors">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DOW_ES.map(d => <div key={d} className="text-center text-[10px] font-mono text-slate-400 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {buildGrid().map(({ day, date, other, past, sel, tdy }, i) => (
            <button key={i} type="button" onClick={() => toggleDay(date)}
              disabled={past || other}
              className={[
                'min-h-[44px] flex items-center justify-center rounded-xl text-base font-medium transition-colors text-slate-700',
                other ? 'opacity-20 cursor-default' : '',
                past && !other ? 'opacity-30 cursor-default line-through' : '',
                sel ? 'bg-blue-600 text-white shadow-sm' : '',
                !sel && tdy ? 'border-2 border-blue-500 text-blue-600' : '',
                !sel && !past && !other ? 'hover:bg-blue-50 text-slate-900' : '',
              ].filter(Boolean).join(' ')}>
              {day}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex-1 text-slate-500 text-sm font-medium">{picked.length} de 6 fechas</span>
          <button type="button" onClick={onClose} className="px-4 py-3 text-slate-600 text-xs font-bold uppercase tracking-wider border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          <button type="button" onClick={() => onConfirm(picked)} disabled={picked.length === 0} className="px-5 py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40">Confirmar</button>
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
      
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_${values.name.replace(/ /g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
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


  const DARK_INPUT = "bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-blue-500";
  const DARK_LABEL = "text-slate-700 text-sm font-semibold";

  return (
    <main className="flex min-h-screen flex-col" style={{ background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)' }}>

      {/* Hero */}
      <section className="relative overflow-hidden text-center px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(37,99,235,0.06) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link href="/" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
              style={{ background: 'white', border: '1px solid rgba(148,163,184,0.3)', color: '#475569' }}>
              <ArrowLeft className="w-3 h-3" /> Inicio
            </Link>
            <Link href="/pagos" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
              style={{ background: 'white', border: '1px solid rgba(148,163,184,0.3)', color: '#475569' }}>
              <CreditCard className="w-3 h-3" /> Pagos
            </Link>
            <a href="https://autoescuelaamericana.com/cursos" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
              style={{ background: 'white', border: '1px solid rgba(148,163,184,0.3)', color: '#475569' }}>
              <List className="w-3 h-3" /> Cursos
            </a>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1 text-slate-800">
            {courseScheduled ? '¡Listo!' : <>Reservar <span className="text-blue-600">Clases</span></>}
          </h1>
          <p className="text-sm mt-2" style={{ color: '#475569' }}>
            {courseScheduled ? 'Tu inscripción está completa.' : 'Selecciona fechas, horario y tus datos.'}
          </p>
        </div>
      </section>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        <div className="w-full max-w-2xl">

          {/* Card principal */}
          <div className="rounded-2xl overflow-hidden mb-8 bg-white shadow-md border border-slate-200">

            {courseScheduled ? (
              <div className="p-6 text-center">
                <div className="inline-flex w-14 h-14 items-center justify-center rounded-full mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <CheckCircle className="w-7 h-7" style={{ color: '#34d399' }} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">¡Inscripción y Agenda Completas!</h2>
                <p className="text-sm mb-6" style={{ color: '#475569' }}>
                  Tus clases se agendaron en el calendario. Descarga tu ficha o envíala por WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
                  <button onClick={handleDownloadPdf} disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#cbd5e1' }}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isProcessing ? 'Generando...' : 'Descargar PDF'}
                  </button>
                  <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer"
                    onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'whatsapp_click', { location: 'agenda_success' }); }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                    <MessageSquare className="w-4 h-4" /> Enviar por WhatsApp
                  </a>
                  <button onClick={handleNewSchedule}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{ color: '#475569' }}>
                    <CalendarCheck className="w-4 h-4" /> Nueva ficha
                  </button>
                </div>
                <a href="https://g.page/r/CXb43zwsdca7EBE/review" target="_blank" rel="noopener noreferrer"
                  onClick={() => { if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'review_click', { location: 'agenda_success' }); }}
                  className="inline-flex items-center justify-center gap-2 mt-4 text-sm font-medium"
                  style={{ color: '#fbbf24' }}>
                  <Star className="w-4 h-4 fill-current" /> Déjanos una reseña en Google
                </a>
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {/* Paso 1: Fechas */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>Paso 1 — Días de clase</p>
                  <button type="button" onClick={() => setCalOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors text-left bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100">
                    <span>{selectedDates.length > 0
                      ? `${selectedDates.length} fecha${selectedDates.length !== 1 ? 's' : ''} seleccionada${selectedDates.length !== 1 ? 's' : ''}`
                      : 'Toca para seleccionar fechas'}</span>
                    <CalendarIcon className="w-4 h-4 shrink-0 text-blue-500" />
                  </button>
                  {selectedDates.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      {selectedDates.map((item, i) => (
                        <span key={i} className="inline-flex items-center text-xs px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {format(item.date, "EEE d MMM", { locale: es })}
                        </span>
                      ))}
                      <button type="button" onClick={handleClearSelection}
                        className="text-xs underline text-slate-500 hover:text-slate-800">Limpiar</button>
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

                {/* Pasos 2 y 3 — solo si hay fechas */}
                {selectedDates.length > 0 && (
                  <>
                    {/* Paso 2: Horarios */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Paso 2 — Horarios</p>
                      <div className="space-y-2">
                        {selectedDates.map((item, index) => (
                          <div key={item.date.toISOString()}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-medium capitalize text-slate-700">
                              {format(item.date, "EEEE, d 'de' MMMM", { locale: es })}
                            </p>
                            <Select onValueChange={(value) => handleTimeChange(index, value)} defaultValue={item.time}>
                              <SelectTrigger className={`w-full sm:w-[160px] ${DARK_INPUT}`}>
                                <SelectValue placeholder="Elige hora" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-200 text-slate-800">
                                {timeSlots.map(slot => (
                                  <SelectItem key={slot} value={slot} className="focus:bg-slate-100 focus:text-slate-900">
                                    {format(parse(slot, 'HH:mm', new Date()), 'h:mm a')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Paso 3: Datos */}
                    <div className="mt-8">
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748b' }}>Paso 3 — Tus datos</p>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                              <FormItem>
                                <FormLabel className={DARK_LABEL}>Nombre Completo</FormLabel>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94a3b8' }} />
                                  <FormControl><Input placeholder="Tu nombre" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
                                </div>
                                <FormMessage className="text-red-500 text-xs" />
                              </FormItem>
                            )}/>
                            <FormField control={form.control} name="phone" render={({ field }) => (
                              <FormItem>
                                <FormLabel className={DARK_LABEL}>WhatsApp</FormLabel>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94a3b8' }} />
                                  <FormControl><Input placeholder="55 1234 5678" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
                                </div>
                                <FormMessage className="text-red-500 text-xs" />
                              </FormItem>
                            )}/>
                          </div>

                          <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                              <FormLabel className={DARK_LABEL}>Dirección / Punto de encuentro</FormLabel>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94a3b8' }} />
                                <FormControl><Input placeholder="Calle, número, colonia…" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
                              </div>
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )}/>

                          <FormField control={form.control} name="transmission" render={({ field }) => (
                            <FormItem>
                              <FormLabel className={DARK_LABEL}>Transmisión</FormLabel>
                              <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-1">
                                  {[{ val: 'Automático', id: 'auto' }, { val: 'Estándar', id: 'std' }].map(({ val, id }) => (
                                    <FormItem key={id} className="flex items-center space-x-2 space-y-0">
                                      <FormControl><RadioGroupItem value={val} id={id} className="border-slate-300 text-blue-600" /></FormControl>
                                      <Label htmlFor={id} className="font-medium cursor-pointer" style={{ color: '#475569' }}>{val}</Label>
                                    </FormItem>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )}/>

                          <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                              <FormLabel className={DARK_LABEL}>Notas (Opcional)</FormLabel>
                              <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-4 w-4" style={{ color: '#94a3b8' }} />
                                <FormControl>
                                  <Textarea placeholder="Ej: Me da miedo incorporarme a vías rápidas" {...field}
                                    className={`pl-10 ${DARK_INPUT}`} />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}/>

                          <div className="space-y-3 pt-1">
                            <FormField control={form.control} name="isMinor" render={({ field }) => (
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" /></FormControl>
                                <Label className="font-medium cursor-pointer flex items-center gap-2" style={{ color: '#475569' }}>
                                  <UserCheck className="w-4 h-4" /> Este curso es para un menor de edad
                                </Label>
                              </FormItem>
                            )}/>
                            <FormField control={form.control} name="terms" render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-0.5" /></FormControl>
                                <div>
                                  <FormLabel className="font-medium cursor-pointer text-slate-600">
                                    Acepto los <Link href="https://autoescuelaamericana.com/terminos" target="_blank" className="text-blue-600 underline">Términos y Condiciones</Link>.
                                  </FormLabel>
                                  <FormMessage className="text-red-400 text-xs mt-1" />
                                </div>
                              </FormItem>
                            )}/>
                          </div>

                          <button type="submit" disabled={isProcessing}
                            className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)' }}>
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                            {isProcessing ? 'Procesando…' : 'Finalizar y Agendar Curso'}
                          </button>
                        </form>
                      </Form>
                    </div>
                  </>
                )}

                {selectedDates.length === 0 && (
                  <div className="text-center py-10 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 mt-4">
                    <CalendarCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">Selecciona tus fechas en el paso 1<br/>para continuar con el formulario</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="px-4 py-6 mt-auto text-center border-t border-slate-200">
        <p className="text-[11px] font-medium text-slate-400">Auto Escuela Americana · CDMX</p>
      </footer>
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
