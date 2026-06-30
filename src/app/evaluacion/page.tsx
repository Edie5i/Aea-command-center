
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lightbulb, BarChart3, User, Phone, Send, CheckCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type Question = {
  id: string;
  text: string;
  options: { label: string; value: string; score: number }[];
};

const questions: Question[] = [
  {
    id: 'experience',
    text: '¿Cuál es tu nivel de experiencia manejando?',
    options: [
      { label: 'Nunca he manejado', value: 'none', score: 0 },
      { label: 'He tomado algunas clases o practicado un poco', value: 'some', score: 1 },
      { label: 'Manejo ocasionalmente, pero no me siento 100% seguro', value: 'occasional', score: 2 },
      { label: 'Manejo regularmente y tengo licencia', value: 'regular', score: 3 },
    ],
  },
  {
    id: 'lane_change',
    text: '¿Cómo te sientes al cambiar de carril en avenidas transitadas?',
    options: [
      { label: 'Inseguro/a, prefiero evitarlo', value: 'no', score: 0 },
      { label: 'Algo nervioso/a, pero lo logro con precaución', value: 'some', score: 1 },
      { label: 'Confiado/a, lo hago de forma segura y fluida', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'intersections',
    text: '¿Sabes cómo incorporarte a vías rápidas como Viaducto o Periférico?',
    options: [
      { label: 'No, lo evito por completo', value: 'no', score: 0 },
      { label: 'Lo he hecho, pero me genera mucho estrés', value: 'some', score: 1 },
      { label: 'Sí, me incorporo y manejo sin problemas', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'parking',
    text: '¿Cómo te sientes al estacionarte en paralelo o en batería?',
    options: [
      { label: 'Nunca lo he intentado o me parece muy difícil', value: 'hard', score: 0 },
      { label: 'Lo logro, pero me toma tiempo y varios intentos', value: 'medium', score: 1 },
      { label: 'Me siento bastante cómodo haciéndolo', value: 'easy', score: 2 },
    ],
  },
  {
    id: 'traffic',
    text: '¿Cómo manejas el tráfico denso y las avenidas principales?',
    options: [
      { label: 'Me genera mucha ansiedad y lo evito', value: 'anxious', score: 0 },
      { label: 'Puedo hacerlo, pero me estresa', value: 'stressful', score: 1 },
      { label: 'Lo manejo con confianza y seguridad', value: 'confident', score: 2 },
    ],
  },
  {
    id: 'night_driving',
    text: '¿Tienes experiencia conduciendo de noche en la ciudad?',
    options: [
      { label: 'No, me da miedo o lo evito', value: 'no', score: 0 },
      { label: 'Muy poca, y me siento inseguro/a', value: 'some', score: 1 },
      { label: 'Sí, conduzco de noche con regularidad', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'rain_driving',
    text: '¿Cómo reaccionas si empieza a llover fuerte mientras manejas?',
    options: [
      { label: 'Me pongo muy nervioso/a y preferiría detenerme', value: 'nervous', score: 0 },
      { label: 'Reduzco la velocidad y aumento mi precaución, pero con nervios', value: 'cautious', score: 1 },
      { label: 'Sé qué hacer: reduzco velocidad, enciendo luces y mantengo distancia', value: 'confident', score: 2 },
    ],
  },
  {
    id: 'slopes',
    text: '¿Sabes cómo arrancar en una pendiente ascendente sin que el coche se vaya para atrás?',
    options: [
      { label: 'No tengo idea, es uno de mis mayores miedos', value: 'no', score: 0 },
      { label: 'Lo he intentado, pero me cuesta mucho trabajo', value: 'some', score: 1 },
      { label: 'Sí, domino la técnica del clutch/freno o freno de mano', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'roundabouts',
    text: 'Al llegar a una glorieta, ¿sabes quién tiene preferencia y cómo circular en ella?',
    options: [
      { label: 'No estoy seguro/a, me confunden y prefiero evitarlas', value: 'no', score: 0 },
      { label: 'Tengo una idea, pero me siento inseguro/a al entrar', value: 'some', score: 1 },
      { label: 'Sí, cedo el paso a quien está dentro y circulo correctamente', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'reversing',
    text: '¿Cómo es tu habilidad para maniobrar en reversa?',
    options: [
      { label: 'Muy mala, me cuesta mucho trabajo ir derecho/a', value: 'bad', score: 0 },
      { label: 'Regular, lo hago pero necesito corregir mucho', value: 'regular', score: 1 },
      { label: 'Buena, puedo controlar el vehículo en reversa con confianza', value: 'good', score: 2 },
    ],
  },
  {
    id: 'mirror_usage',
    text: '¿Con qué frecuencia usas tus espejos retrovisores mientras conduces?',
    options: [
      { label: 'Casi nunca, me concentro solo en lo que está enfrente', value: 'rarely', score: 0 },
      { label: 'Solo cuando voy a cambiar de carril o dar vuelta', value: 'sometimes', score: 1 },
      { label: 'Constantemente, para mantenerme al tanto de todo mi entorno', value: 'constantly', score: 2 },
    ],
  },
  {
    id: 'highway',
    text: '¿Te sentirías cómodo/a manejando en carretera a 80-100 km/h?',
    options: [
      { label: 'No, me da mucho miedo la velocidad', value: 'no', score: 0 },
      { label: 'Podría, pero me sentiría muy tenso/a', value: 'some', score: 1 },
      { label: 'Sí, me siento capaz de manejar en carretera de forma segura', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'emergency_braking',
    text: 'Si el coche de adelante frena de repente, ¿confías en tu tiempo de reacción?',
    options: [
      { label: 'No, a menudo siento que voy muy pegado/a o reacciono tarde', value: 'no', score: 0 },
      { label: 'Creo que sí, pero no estoy completamente seguro/a', value: 'some', score: 1 },
      { label: 'Sí, siempre mantengo distancia segura y estoy alerta', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'signaling',
    text: '¿Usas las direccionales para TODAS tus maniobras?',
    options: [
      { label: 'A veces se me olvida, especialmente en cambios de carril', value: 'sometimes', score: 0 },
      { label: 'Casi siempre, pero podría ser más consistente', value: 'mostly', score: 1 },
      { label: 'Sí, es un hábito automático para mí', value: 'always', score: 2 },
    ],
  },
  {
    id: 'vehicle_knowledge',
    text: '¿Sabes qué hacer si se enciende un testigo en el tablero?',
    options: [
      { label: 'No, no sabría qué significa ni cómo reaccionar', value: 'no', score: 0 },
      { label: 'Reconocería algunos, pero no sabría qué hacer en todos los casos', value: 'some', score: 1 },
      { label: 'Sí, sé lo que indican y cómo actuar', value: 'yes', score: 2 },
    ],
  },
];

const evaluationSchema = z.object({
  studentName: z.string().min(2, { message: 'Por favor, ingresa tu nombre completo.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  answers: z.record(z.string()).refine(val => Object.keys(val).length === questions.length, {
    message: 'Por favor responde todas las preguntas.',
  }),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

type Result = {
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  recommendation: string;
  accent: string;
};

const DARK_INPUT = "bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:ring-1 focus-visible:border-blue-500";

export default function EvaluacionPage() {
  const [result, setResult] = useState<Result | null>(null);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: { studentName: '', phone: '', answers: {} },
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    const current = form.getValues('answers');
    form.setValue('answers', { ...current, [questionId]: value });
  };

  function onSubmit(data: EvaluationFormValues) {
    const beginnerResult: Result = {
      level: 'Principiante',
      description: 'Estás comenzando tu viaje como conductor o necesitas reforzar los fundamentos.',
      recommendation: 'Nuestro curso para principiantes es perfecto para ti. Cubrimos desde los conceptos básicos hasta tus primeras prácticas en tráfico real.',
      accent: '#f59e0b',
    };

    if (data.answers.experience === 'none') {
      setResult(beginnerResult);
      sendToWhatsApp(data, beginnerResult);
      return;
    }

    let totalScore = 0;
    for (const question of questions) {
      const answerValue = data.answers[question.id];
      if (answerValue) {
        const opt = question.options.find(o => o.value === answerValue);
        if (opt) totalScore += opt.score;
      }
    }

    let finalResult: Result;
    if (totalScore <= 12) {
      finalResult = beginnerResult;
    } else if (totalScore <= 22) {
      finalResult = {
        level: 'Intermedio',
        description: 'Ya tienes experiencia, pero hay áreas clave en las que puedes mejorar para sentirte más seguro en el tráfico diario.',
        recommendation: 'Te recomendamos nuestro curso intermedio. Nos enfocaremos en perfeccionar tus habilidades en situaciones de tráfico real y maniobras de precisión.',
        accent: '#3b82f6',
      };
    } else {
      finalResult = {
        level: 'Avanzado',
        description: 'Tienes una base sólida. Podemos pulir habilidades para una conducción más segura y eficiente.',
        recommendation: 'Nuestro curso avanzado o clases de perfeccionamiento son ideales para ti: manejo en carretera, conducción defensiva y condiciones adversas.',
        accent: '#34d399',
      };
    }

    setResult(finalResult);
    sendToWhatsApp(data, finalResult);
  }

  const sendToWhatsApp = (data: EvaluationFormValues, r: Result) => {
    const msg = `📝 *Evaluación de Habilidades*\n\n*Alumno:* ${data.studentName}\n*Teléfono:* ${data.phone}\n\n*Nivel:* ${r.level}\n\n*Recomendación:* ${r.recommendation}`;
    window.open(`https://api.whatsapp.com/send?phone=525634433212&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const answeredCount = Object.keys(form.watch('answers')).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(245,158,11,0.1) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-5 transition-colors"
            style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Lightbulb className="w-6 h-6" style={{ color: '#f59e0b' }} />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #f8fafc 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            {result ? `Nivel: ${result.level}` : 'Evalúa tus Habilidades'}
          </h1>
          <p className="text-sm" style={{ color: '#475569' }}>
            {result ? 'Tu resultado está listo.' : 'Descubre qué curso se adapta mejor a ti.'}
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        <div className="w-full max-w-2xl">

          {result ? (
            /* Resultado */
            <div className="rounded-2xl p-6 text-center"
              style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: `1px solid ${result.accent}30` }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: `${result.accent}12`, border: `1px solid ${result.accent}30` }}>
                <CheckCircle className="w-8 h-8" style={{ color: result.accent }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: result.accent }}>
                Nivel recomendado
              </p>
              <h2 className="text-2xl font-black text-white mb-4">{result.level}</h2>
              <p className="text-sm mb-3 leading-relaxed" style={{ color: '#94a3b8' }}>{result.description}</p>
              <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: '#cbd5e1' }}>{result.recommendation}</p>
              <p className="text-xs mb-6" style={{ color: '#475569' }}>
                Se abrió WhatsApp con tu resultado para enviarlo a un asesor.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => { setResult(null); form.reset(); }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
                  <BarChart3 className="w-4 h-4" /> Hacer de nuevo
                </button>
                <Link href="/agenda"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                  Agendar mi curso →
                </Link>
              </div>
            </div>
          ) : (
            /* Formulario */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                {/* Datos personales */}
                <div className="rounded-2xl p-5"
                  style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Tus datos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="studentName" render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Nombre</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                          <FormControl><Input placeholder="Tu nombre completo" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
                        </div>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <Label className="text-sm font-medium" style={{ color: '#94a3b8' }}>WhatsApp</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                          <FormControl><Input placeholder="55 1234 5678" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
                        </div>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}/>
                  </div>
                </div>

                {/* Barra de progreso */}
                {answeredCount > 0 && (
                  <div className="px-1">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: '#475569' }}>
                      <span>{answeredCount} de {questions.length} preguntas</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f59e0b, #3b82f6)' }} />
                    </div>
                  </div>
                )}

                {/* Preguntas */}
                {questions.map((question, index) => {
                  const answered = !!form.watch('answers')[question.id];
                  return (
                    <div key={question.id} className="rounded-2xl p-5 transition-all"
                      style={{
                        background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
                        border: answered ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(148,163,184,0.08)',
                      }}>
                      <p className="text-sm font-semibold mb-4 leading-snug" style={{ color: '#e2e8f0' }}>
                        <span className="text-xs font-bold mr-2 px-1.5 py-0.5 rounded"
                          style={{ background: answered ? 'rgba(59,130,246,0.15)' : 'rgba(148,163,184,0.08)', color: answered ? '#60a5fa' : '#475569' }}>
                          {index + 1}
                        </span>
                        {question.text}
                      </p>
                      <RadioGroup
                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                        value={form.watch('answers')[question.id]}
                        className="space-y-2">
                        {question.options.map((option) => (
                          <div key={option.value}
                            className="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors"
                            style={{
                              background: form.watch('answers')[question.id] === option.value
                                ? 'rgba(59,130,246,0.08)'
                                : 'rgba(148,163,184,0.03)',
                              border: form.watch('answers')[question.id] === option.value
                                ? '1px solid rgba(59,130,246,0.2)'
                                : '1px solid transparent',
                            }}>
                            <RadioGroupItem
                              value={option.value}
                              id={`${question.id}-${option.value}`}
                              className="border-slate-600 text-blue-500 mt-0.5 shrink-0"
                            />
                            <Label
                              htmlFor={`${question.id}-${option.value}`}
                              className="text-sm font-normal cursor-pointer leading-snug"
                              style={{ color: form.watch('answers')[question.id] === option.value ? '#e2e8f0' : '#94a3b8' }}>
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  );
                })}

                {form.formState.errors.answers && (
                  <p className="text-xs text-red-400 text-center">{String(form.formState.errors.answers?.message || '')}</p>
                )}

                <button type="submit"
                  disabled={answeredCount < questions.length || form.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: answeredCount === questions.length ? '0 4px 20px rgba(37,99,235,0.3)' : 'none' }}>
                  <Send className="w-4 h-4" />
                  Ver y Enviar mi Resultado
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
