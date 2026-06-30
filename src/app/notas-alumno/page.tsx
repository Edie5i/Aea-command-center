
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User, Phone, Send, CheckCircle, BookUser, RefreshCw, ChevronDown } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { programData } from '@/lib/course-data';
import { guardarFicha } from './actions';

const notesSchema = z.object({
  studentName: z.string().min(2, { message: 'Por favor, ingresa el nombre completo del alumno.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
});

type NotesFormValues = z.infer<typeof notesSchema>;
type CheckedItems = { [key: string]: boolean };

const DARK_INPUT = "bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus-visible:ring-teal-500 focus-visible:ring-1 focus-visible:border-teal-500";

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
};

// Contar todos los temas del programa
const TOTAL_TOPICS = programData.reduce(
  (acc, section) => acc + section.content.reduce((a, b) => a + b.points.length, 0),
  0
);

export default function NotasAlumnoPage() {
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({});
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<NotesFormValues>({
    resolver: zodResolver(notesSchema),
    defaultValues: { studentName: '', phone: '' },
  });

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((checkedCount / TOTAL_TOPICS) * 100);

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
    let blockIdx = 0;

    programData.forEach(section => {
      let coveredPoints: string[] = [];
      let pendingPoints: string[] = [];
      section.content.forEach((contentBlock) => {
        blockIdx++;
        contentBlock.points.forEach((point, index) => {
          const pointId = `${section.title}-${blockIdx}-${index}`;
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
      if (coveredPoints.length > 0) { hasCovered = true; coveredTopics += `\n*${section.title}*\n${coveredPoints.join('\n')}\n`; }
      if (pendingPoints.length > 0) { hasPending = true; pendingTopics += `\n*${section.title}*\n${pendingPoints.join('\n')}\n`; }
    });

    guardarFicha(data.studentName, data.phone, completedTopicsArr, pendingTopicsArr, totalTopics)
      .catch(err => console.error('[notas-alumno] Error guardando ficha:', err));

    let message = `*Reporte de Avance para ${data.studentName}*\n\nHola ${data.studentName}, aquí tienes un resumen de tu progreso en el curso de manejo de Auto Escuela Americana:\n\n`;
    message += hasCovered ? coveredTopics : 'Aún no hemos marcado temas como cubiertos. ¡En la próxima clase empezamos!\n';
    message += hasPending ? `\n---\n\n${pendingTopics}` : '\n---\n\n🎉 *¡Felicidades!* Has cubierto todos los temas del programa.';

    window.open(`https://api.whatsapp.com/send?phone=52${data.phone}&text=${encodeURIComponent(message)}`, '_blank');
    setSubmitted(true);
  }

  const resetForm = () => { setSubmitted(false); setCheckedItems({}); form.reset(); };

  let blockIndex = 0;

  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(20,184,166,0.12) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-5 transition-colors"
            style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)' }}>
            <BookUser className="w-6 h-6" style={{ color: '#2dd4bf' }} />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #f8fafc 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Notas de Progreso
          </h1>
          <p className="text-sm" style={{ color: '#475569' }}>
            Genera un reporte de avance y compártelo por WhatsApp
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-5">

          {/* Estado enviado */}
          {submitted && (
            <div className="rounded-2xl p-6 text-center"
              style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.3)' }}>
                <CheckCircle className="w-7 h-7" style={{ color: '#34d399' }} />
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#e2e8f0' }}>¡Reporte listo para enviar!</h2>
              <p className="text-sm mb-5" style={{ color: '#64748b' }}>Se abrió WhatsApp con el reporte de avance del alumno.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={resetForm}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
                  <RefreshCw className="w-4 h-4" /> Nuevo reporte
                </button>
                <Link href="/agenda"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
                  Agendar clase →
                </Link>
              </div>
            </div>
          )}

          {!submitted && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* Datos del alumno */}
                <div className="rounded-2xl p-5" style={CARD}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Datos del alumno</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="studentName" render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Nombre completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                          <FormControl><Input placeholder="Nombre del alumno" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
                        </div>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm font-medium" style={{ color: '#94a3b8' }}>WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                          <FormControl><Input type="tel" placeholder="5512345678" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
                        </div>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}/>
                  </div>
                </div>

                {/* Progreso */}
                {checkedCount > 0 && (
                  <div className="px-1">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: '#475569' }}>
                      <span>{checkedCount} de {TOTAL_TOPICS} temas cubiertos</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0d9488, #14b8a6)' }} />
                    </div>
                  </div>
                )}

                {/* Temas del programa */}
                <div className="rounded-2xl p-5" style={CARD}>
                  <div className="flex items-center gap-2 mb-1">
                    <BookUser className="w-4 h-4" style={{ color: '#2dd4bf' }} />
                    <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Temas del Programa</p>
                  </div>
                  <p className="text-xs mb-4" style={{ color: '#475569' }}>Marca los temas que el alumno ya domina.</p>

                  <Accordion type="single" collapsible className="space-y-2">
                    {programData.map((section) => (
                      <AccordionItem
                        value={section.title}
                        key={section.title}
                        className="rounded-xl overflow-hidden border-0"
                        style={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)' }}>
                        <AccordionTrigger
                          className="px-4 py-3 text-sm font-semibold hover:no-underline hover:bg-white/[0.02] transition-colors [&>svg]:hidden"
                          style={{ color: '#cbd5e1' }}>
                          <span className="flex items-center justify-between w-full">
                            {section.title}
                            <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
                              style={{ color: '#475569' }} />
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                          <div className="space-y-4">
                            {section.content.map((contentBlock) => {
                              blockIndex++;
                              const currentBlock = blockIndex;
                              return (
                                <div key={currentBlock}>
                                  {contentBlock.heading && (
                                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2"
                                      style={{ color: '#2dd4bf' }}>{contentBlock.heading}</h4>
                                  )}
                                  <div className="space-y-2 pl-2">
                                    {contentBlock.points.map((item, itemIndex) => {
                                      const id = `${section.title}-${currentBlock}-${itemIndex}`;
                                      const isChecked = !!checkedItems[id];
                                      return (
                                        <div key={id}
                                          className="flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer"
                                          style={isChecked
                                            ? { background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)' }
                                            : { background: 'transparent', border: '1px solid transparent' }}
                                          onClick={() => handleCheckboxChange(id, !isChecked)}>
                                          <Checkbox
                                            id={id}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => handleCheckboxChange(id, !!checked)}
                                            className="border-slate-600 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600 mt-0.5 shrink-0"
                                          />
                                          <Label htmlFor={id}
                                            className="text-sm font-normal cursor-pointer leading-snug"
                                            style={{ color: isChecked ? '#5eead4' : '#64748b' }}>
                                            {item}
                                          </Label>
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

                {/* Submit */}
                <button type="submit" disabled={form.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                    boxShadow: '0 4px 20px rgba(20,184,166,0.25)',
                  }}>
                  <Send className="w-4 h-4" />
                  Generar y Compartir Avance
                </button>

              </form>
            </Form>
          )}
        </div>
      </div>

      <footer className="px-4 py-4 text-center" style={{ borderTop: '1px solid rgba(148,163,184,0.07)' }}>
        <p className="text-[11px]" style={{ color: '#334155' }}>Auto Escuela Americana · CDMX</p>
      </footer>
    </main>
  );
}
