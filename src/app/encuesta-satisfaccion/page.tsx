
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Smile, Send, CheckCircle, Star, User, GraduationCap } from 'lucide-react';
import { Form, FormControl, FormItem } from '@/components/ui/form';

const surveySchema = z.object({
  studentName: z.string().optional(),
  instructorName: z.string().optional(),
  instructorRating: z.string({ required_error: 'Por favor, califica a tu instructor.' }),
  clarityRating: z.string({ required_error: 'Por favor, califica la claridad.' }),
  contentRating: z.string({ required_error: 'Por favor, califica el contenido.' }),
  confidenceImproved: z.string({ required_error: 'Por favor, selecciona una opción.' }),
  recommend: z.string({ required_error: 'Por favor, selecciona una opción.' }),
  source: z.string({ required_error: 'Por favor, selecciona cómo nos encontraste.' }),
  comments: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

const DARK_INPUT = "bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus-visible:ring-rose-500 focus-visible:ring-1 focus-visible:border-rose-500";

const CARD: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
  border: '1px solid rgba(148,163,184,0.1)',
};

const ratingLabels: Record<string, string> = {
  '5': 'Excelente',
  '4': 'Muy Bueno',
  '3': 'Bueno',
  '2': 'Regular',
  '1': 'Malo',
};

export default function EncuestaSatisfaccionPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: { studentName: '', instructorName: '', comments: '' },
  });

  const onSubmit = (data: SurveyFormValues) => {
    let message = `📝 *Encuesta de Satisfacción* 📝\n\n`;
    if (data.studentName) message += `*Nombre del Alumno:* ${data.studentName}\n`;
    if (data.instructorName) message += `*Nombre del Instructor:* ${data.instructorName}\n\n`;
    message += `*Amabilidad y profesionalismo del instructor:* ${data.instructorRating}/5\n`;
    message += `*Claridad en explicaciones y paciencia:* ${data.clarityRating}/5\n`;
    message += `*Utilidad del contenido del curso:* ${data.contentRating}/5\n`;
    message += `*¿Sientes que tu confianza mejoró?:* ${data.confidenceImproved}\n`;
    message += `*¿Recomendarías AEA?:* ${data.recommend}\n`;
    message += `*¿Cómo nos encontraste?:* ${data.source}\n\n`;
    if (data.comments) message += `*Comentarios adicionales:*\n${data.comments}`;

    window.open(`https://api.whatsapp.com/send?phone=525634433212&text=${encodeURIComponent(message)}`, '_blank');
    setSubmitted(true);
    form.reset();
  };

  const renderStarRating = (name: keyof SurveyFormValues, label: string, num: string) => (
    <div className="rounded-2xl p-5" style={CARD}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#475569' }}>{num}</p>
      <p className="text-sm font-semibold mb-4" style={{ color: '#cbd5e1' }}>{label}</p>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-2">
            {['5', '4', '3', '2', '1'].map(val => {
              const isSelected = field.value === val;
              return (
                <FormItem key={val} className="space-y-0">
                  <FormControl>
                    <RadioGroupItem value={val} id={`${name}-${val}`} className="sr-only" />
                  </FormControl>
                  <Label htmlFor={`${name}-${val}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all"
                    style={isSelected
                      ? { background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.35)', color: '#fda4af' }
                      : { background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', color: '#64748b' }}>
                    <Star className="w-3.5 h-3.5" style={isSelected ? { color: '#fb7185', fill: '#fb7185' } : { color: '#475569' }} />
                    {val} — {ratingLabels[val]}
                  </Label>
                </FormItem>
              );
            })}
          </RadioGroup>
        )}
      />
      {form.formState.errors[name] && (
        <p className="text-xs mt-2" style={{ color: '#f87171' }}>{form.formState.errors[name]?.message}</p>
      )}
    </div>
  );

  const renderPillGroup = (
    name: keyof SurveyFormValues,
    label: string,
    num: string,
    options: { value: string; label: string }[],
    wrap = false
  ) => (
    <div className="rounded-2xl p-5" style={CARD}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#475569' }}>{num}</p>
      <p className="text-sm font-semibold mb-4" style={{ color: '#cbd5e1' }}>{label}</p>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <RadioGroup onValueChange={field.onChange} value={field.value}
            className={`flex gap-2 ${wrap ? 'flex-wrap' : 'flex-wrap'}`}>
            {options.map(opt => {
              const isSelected = field.value === opt.value;
              return (
                <FormItem key={opt.value} className="space-y-0">
                  <FormControl>
                    <RadioGroupItem value={opt.value} id={`${name}-${opt.value}`} className="sr-only" />
                  </FormControl>
                  <Label htmlFor={`${name}-${opt.value}`}
                    className="px-4 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all block"
                    style={isSelected
                      ? { background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.35)', color: '#fda4af' }
                      : { background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)', color: '#64748b' }}>
                    {opt.label}
                  </Label>
                </FormItem>
              );
            })}
          </RadioGroup>
        )}
      />
      {form.formState.errors[name] && (
        <p className="text-xs mt-2" style={{ color: '#f87171' }}>{form.formState.errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(251,113,133,0.1) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-5 transition-colors"
            style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)' }}>
            <Smile className="w-6 h-6" style={{ color: '#fb7185' }} />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #f8fafc 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            Encuesta de Satisfacción
          </h1>
          <p className="text-sm" style={{ color: '#475569' }}>
            Tu opinión nos ayuda a mejorar · respuestas anónimas
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">

          {submitted ? (
            <div className="rounded-2xl p-8 text-center"
              style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#34d399' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#e2e8f0' }}>¡Encuesta enviada!</h2>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                Muchas gracias por tu tiempo. ¡Tu opinión nos ayuda a seguir mejorando!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setSubmitted(false)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
                  <Smile className="w-4 h-4" /> Responder de nuevo
                </button>
                <a href="https://g.page/r/CXb43zwsdca7EBE/review"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #b45309, #d97706)' }}>
                  <Star className="w-4 h-4 fill-current" /> Reseña en Google
                </a>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* Datos opcionales */}
                <div className="rounded-2xl p-5" style={CARD}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>
                    Datos opcionales
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormItem>
                      <Label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Tu nombre</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                        <Input id="studentName" placeholder="Juan Pérez (opcional)"
                          {...form.register('studentName')} className={`pl-10 ${DARK_INPUT}`} />
                      </div>
                    </FormItem>
                    <FormItem>
                      <Label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Instructor</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                        <Input id="instructorName" placeholder="Eduardo (opcional)"
                          {...form.register('instructorName')} className={`pl-10 ${DARK_INPUT}`} />
                      </div>
                    </FormItem>
                  </div>
                </div>

                {/* Calificaciones */}
                {renderStarRating('instructorRating', 'Amabilidad y profesionalismo del instructor.', '1')}
                {renderStarRating('clarityRating', 'Claridad en las explicaciones y paciencia del instructor.', '2')}
                {renderStarRating('contentRating', '¿Qué tan útil fue el contenido del curso?', '3')}

                {renderPillGroup('confidenceImproved', '¿Sientes que tu confianza al manejar mejoró después del curso?', '4', [
                  { value: 'Sí', label: 'Sí, mucho' },
                  { value: 'Parcialmente', label: 'Parcialmente' },
                  { value: 'No', label: 'No' },
                ])}

                {renderPillGroup('recommend', '¿Recomendarías Auto Escuela Americana a un amigo o familiar?', '5', [
                  { value: 'Sí', label: 'Sí' },
                  { value: 'No', label: 'No' },
                ])}

                {renderPillGroup('source', '¿Cómo nos encontraste?', '6', [
                  { value: 'Facebook', label: 'Facebook' },
                  { value: 'Google', label: 'Google' },
                  { value: 'Recomendación', label: 'Recomendación' },
                  { value: 'Otro', label: 'Otro' },
                ], true)}

                {/* Comentarios */}
                <div className="rounded-2xl p-5" style={CARD}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#475569' }}>7</p>
                  <p className="text-sm font-semibold mb-3" style={{ color: '#cbd5e1' }}>
                    Comentarios o sugerencias adicionales.
                  </p>
                  <Textarea
                    id="comments"
                    placeholder="¿Hay algo más que te gustaría compartir con nosotros?"
                    rows={4}
                    {...form.register('comments')}
                    className="resize-none bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus-visible:ring-rose-500 focus-visible:ring-1 focus-visible:border-rose-500"
                  />
                </div>

                <button type="submit" disabled={form.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #be185d, #e11d48)',
                    boxShadow: '0 4px 20px rgba(225,29,72,0.25)',
                  }}>
                  <Send className="w-4 h-4" />
                  Enviar Encuesta
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
