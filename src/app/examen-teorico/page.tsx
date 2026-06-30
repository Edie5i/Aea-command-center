
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle, User, Phone, Send, FileText, RefreshCw } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type Question = {
  id: number;
  text: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
};

const examQuestions: Question[] = [
  { id: 1, text: 'Según el Art. 5, ¿quién tiene la máxima prioridad en el uso de la vía pública?', options: [{ label: 'Vehículos de transporte público', value: 'a' }, { label: 'Peatones, especialmente con discapacidad', value: 'b' }, { label: 'Ciclistas', value: 'c' }, { label: 'Vehículos particulares', value: 'd' }], correctAnswer: 'b' },
  { id: 2, text: '¿Cuál es el límite de velocidad en carriles centrales de vías de acceso controlado como Periférico (Art. 9)?', options: [{ label: '50 km/h', value: 'a' }, { label: '100 km/h', value: 'b' }, { label: '80 km/h', value: 'c' }, { label: '90 km/h', value: 'd' }], correctAnswer: 'c' },
  { id: 3, text: 'Conforme al Art. 11, ¿quiénes están obligados a utilizar el cinturón de seguridad?', options: [{ label: 'Solo el conductor y el copiloto', value: 'a' }, { label: 'Todos los ocupantes del vehículo', value: 'b' }, { label: 'Solo en viajes de carretera', value: 'c' }, { label: 'Pasajeros del asiento trasero únicamente', value: 'd' }], correctAnswer: 'b' },
  { id: 4, text: '¿Qué acción está prohibida para los conductores mientras el vehículo está en movimiento (Art. 10)?', options: [{ label: 'Ajustar los espejos retrovisores', value: 'a' }, { label: 'Escuchar música a volumen moderado', value: 'b' }, { label: 'Utilizar el teléfono celular o cualquier distractor', value: 'c' }, { label: 'Hablar con los pasajeros', value: 'd' }], correctAnswer: 'c' },
  { id: 5, text: '¿Cuál es el límite máximo de alcohol en aire espirado para conductores particulares (Art. 10)?', options: [{ label: '0.40 mg/L', value: 'a' }, { label: '0.08 mg/L', value: 'b' }, { label: '0.50 mg/L', value: 'c' }, { label: '0.25 mg/L', value: 'd' }], correctAnswer: 'd' },
  { id: 6, text: 'De acuerdo al Art. 11, ¿dónde debe viajar un niño de 7 años y 1.20 m de estatura?', options: [{ label: 'En el asiento del copiloto con cinturón', value: 'a' }, { label: 'En el asiento trasero, con un sistema de retención infantil', value: 'b' }, { label: 'En cualquier asiento, siempre que use cinturón', value: 'c' }, { label: 'En brazos de un adulto en el asiento trasero', value: 'd' }], correctAnswer: 'b' },
  { id: 7, text: '¿En qué lugar está prohibido estacionarse según el Art. 34?', options: [{ label: 'Frente a parques o jardines', value: 'a' }, { label: 'En zonas residenciales después de las 10 pm', value: 'b' }, { label: 'Sobre banquetas, cruces peatonales o en doble fila', value: 'c' }, { label: 'A más de 10 metros de una esquina', value: 'd' }], correctAnswer: 'c' },
  { id: 8, text: 'El Art. 30 establece que los motociclistas deben...', options: [{ label: 'Circular entre carriles para avanzar más rápido', value: 'a' }, { label: 'Utilizar siempre un carril completo de circulación', value: 'b' }, { label: 'Llevar casco solo en vías rápidas', value: 'c' }, { label: 'Apagar las luces durante el día para ahorrar batería', value: 'd' }], correctAnswer: 'b' },
  { id: 9, text: '¿Cuál es el límite de velocidad en una zona escolar o de hospital (Art. 9)?', options: [{ label: '30 km/h', value: 'a' }, { label: '40 km/h', value: 'b' }, { label: '20 km/h', value: 'c' }, { label: '10 km/h', value: 'd' }], correctAnswer: 'c' },
  { id: 10, text: 'Si ves un vehículo de emergencia con sirenas y torretas encendidas, ¿qué debes hacer?', options: [{ label: 'Acelerar para no estorbar', value: 'a' }, { label: 'Seguirlo para aprovechar el paso libre', value: 'b' }, { label: 'Desplazarte al carril derecho y detenerte si es necesario', value: 'c' }, { label: 'Continuar a la misma velocidad', value: 'd' }], correctAnswer: 'c' },
  { id: 11, text: '¿Qué significa una línea continua en el pavimento?', options: [{ label: 'Indica el límite de la vía', value: 'a' }, { label: 'Prohibición de rebasar o cambiar de carril sobre ella', value: 'b' }, { label: 'Zona exclusiva para bicicletas', value: 'c' }, { label: 'Puedes rebasar si no vienen autos', value: 'd' }], correctAnswer: 'b' },
  { id: 12, text: '¿Cuál es uno de los documentos que un conductor siempre debe portar (Art. 8)?', options: [{ label: 'Comprobante de pago de tenencia', value: 'a' }, { label: 'Manual del propietario del vehículo', value: 'b' }, { label: 'Póliza de seguro de responsabilidad civil vigente', value: 'c' }, { label: 'Acta de nacimiento', value: 'd' }], correctAnswer: 'c' },
  { id: 13, text: 'Al rebasar a un ciclista, la distancia mínima lateral que debe mantener un vehículo es de:', options: [{ label: '1.50 metros', value: 'a' }, { label: '0.50 metros', value: 'b' }, { label: '2.00 metros', value: 'c' }, { label: '1.00 metro', value: 'd' }], correctAnswer: 'a' },
  { id: 14, text: 'En una glorieta sin señalización, ¿quién tiene la preferencia de paso?', options: [{ label: 'El vehículo más grande', value: 'a' }, { label: 'El vehículo que pretende entrar a la glorieta', value: 'b' }, { label: 'El vehículo que ya está circulando dentro de la glorieta', value: 'c' }, { label: 'El transporte público', value: 'd' }], correctAnswer: 'c' },
  { id: 15, text: '¿Cuándo está permitido que un motociclista circule entre carriles (Art. 30)?', options: [{ label: 'Nunca está permitido', value: 'a' }, { label: 'Solo si el tráfico está detenido, para llegar al área de espera', value: 'b' }, { label: 'En cualquier circunstancia, si lo hace con cuidado', value: 'c' }, { label: 'Únicamente en vías rápidas', value: 'd' }], correctAnswer: 'b' },
  { id: 16, text: '¿Cuál es el límite de velocidad en vías primarias como Insurgentes o Tlalpan (Art. 9)?', options: [{ label: '60 km/h', value: 'a' }, { label: '40 km/h', value: 'b' }, { label: '70 km/h', value: 'c' }, { label: '50 km/h', value: 'd' }], correctAnswer: 'd' },
  { id: 17, text: '¿Qué indica la luz ámbar (amarilla) de un semáforo?', options: [{ label: 'Acelerar para cruzar antes del rojo', value: 'a' }, { label: 'Detenerse de inmediato sobre el cruce peatonal', value: 'b' }, { label: 'Prepararse para detenerse antes de la línea de alto', value: 'c' }, { label: 'Indica que el semáforo no funciona', value: 'd' }], correctAnswer: 'c' },
  { id: 18, text: '¿Está permitida la vuelta a la derecha con el semáforo en rojo?', options: [{ label: 'Sí, siempre, cediendo el paso', value: 'a' }, { label: 'No, está estrictamente prohibido', value: 'b' }, { label: 'Sí, solo si hay una señal que lo permita explícitamente', value: 'c' }, { label: 'Solo si no hay peatones esperando para cruzar', value: 'd' }], correctAnswer: 'c' },
  { id: 19, text: 'De acuerdo al Art. 6, es una obligación de los peatones:', options: [{ label: 'Cruzar por cualquier punto si no vienen autos', value: 'a' }, { label: 'Hacer señales con la mano para que los autos se detengan', value: 'b' }, { label: 'Cruzar por las esquinas o cruces peatonales designados', value: 'c' }, { label: 'Caminar por el arroyo vehicular si la banqueta está ocupada', value: 'd' }], correctAnswer: 'c' },
  { id: 20, text: 'En caso de un accidente, ¿cuál es una de las primeras acciones (Art. 40)?', options: [{ label: 'Huir del lugar para evitar problemas', value: 'a' }, { label: 'Discutir con el otro conductor para determinar la culpa', value: 'b' }, { label: 'Detenerse en un lugar seguro y prestar ayuda a posibles lesionados', value: 'c' }, { label: 'Mover el vehículo inmediatamente para no obstruir el tráfico', value: 'd' }], correctAnswer: 'c' },
  { id: 21, text: '¿Para qué se deben usar las luces direccionales (Art. 37)?', options: [{ label: 'Para saludar a otros conductores', value: 'a' }, { label: 'Solo si es de noche', value: 'b' }, { label: 'Para indicar giros o cambios de carril', value: 'c' }, { label: 'Para pedir que te dejen pasar más rápido', value: 'd' }], correctAnswer: 'c' },
  { id: 22, text: '¿Qué prohibición aplica a todos los vehículos sobre las aceras (Art. 10)?', options: [{ label: 'Estacionarse por menos de 5 minutos', value: 'a' }, { label: 'Circular o estacionarse sobre ellas', value: 'b' }, { label: 'Subir solo con dos llantas', value: 'c' }, { label: 'Usarlas como atajo si hay mucho tráfico', value: 'd' }], correctAnswer: 'b' },
  { id: 23, text: '¿Qué obligación importante tienen los ciclistas además de usar aditamentos luminosos (Art. 21)?', options: [{ label: 'Llevar siempre una campana o timbre', value: 'a' }, { label: 'Circular lo más pegado a la derecha posible', value: 'b' }, { label: 'Usar casco protector', value: 'c' }, { label: 'Circular en sentido contrario en calles de un solo sentido', value: 'd' }], correctAnswer: 'c' },
  { id: 24, text: 'Según el Art. 37, ¿cuándo es obligatorio usar las luces bajas?', options: [{ label: 'Solo en túneles y pasos a desnivel', value: 'a' }, { label: 'Desde que anochece hasta que amanece y cuando la visibilidad es mala', value: 'b' }, { label: 'Solo en carreteras federales', value: 'c' }, { label: 'Únicamente cuando llueve', value: 'd' }], correctAnswer: 'b' },
  { id: 25, text: '¿Qué otra acción fundamental deben realizar siempre los motociclistas (Art. 30)?', options: [{ label: 'Llevar las luces encendidas en todo momento', value: 'a' }, { label: 'Rebasar por la derecha si hay espacio', value: 'b' }, { label: 'Llevar a un solo pasajero como máximo', value: 'c' }, { label: 'Usar el claxon constantemente para advertir su presencia', value: 'd' }], correctAnswer: 'a' },
];

type Answers = { [key: number]: string };
type Result = { score: number; correctAnswers: number; incorrectAnswers: number };

const examSchema = z.object({
  studentName: z.string().min(2, { message: 'Por favor, ingresa tu nombre completo.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
});
type ExamFormValues = z.infer<typeof examSchema>;

const DARK_INPUT = "bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus-visible:ring-purple-500 focus-visible:ring-1 focus-visible:border-purple-500";

export default function ExamenTeoricoPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Result | null>(null);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: { studentName: '', phone: '' },
  });

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  function onSubmit(data: ExamFormValues) {
    let correctCount = 0;
    examQuestions.forEach(q => { if (answers[q.id] === q.correctAnswer) correctCount++; });
    const score = Math.round((correctCount / examQuestions.length) * 100);
    setResult({ score, correctAnswers: correctCount, incorrectAnswers: examQuestions.length - correctCount });

    const recommendation = score >= 80
      ? 'Te recomendamos un *Curso Avanzado o de Perfeccionamiento* para pulir tus habilidades.'
      : score >= 60
      ? 'Te recomendamos nuestro *Curso Intermedio* para afianzar conocimientos.'
      : 'Te recomendamos nuestro *Curso de Principiante* para construir una base sólida.';

    const msg = `📝 *Resultado del Examen Teórico*\n\n*Alumno:* ${data.studentName}\n*Teléfono:* ${data.phone}\n*Calificación:* ${score}/100\n*Correctas:* ${correctCount} de ${examQuestions.length}\n\n*Recomendación:* ${recommendation}`;
    window.open(`https://api.whatsapp.com/send?phone=525634433212&text=${encodeURIComponent(msg)}`, '_blank');
  }

  const resetExam = () => { setAnswers({}); setResult(null); form.reset(); };
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / examQuestions.length) * 100);

  const scoreColor = result
    ? result.score >= 80 ? '#34d399' : result.score >= 60 ? '#f59e0b' : '#f87171'
    : '#8b5cf6';

  const getOptionStyle = (question: Question, optionValue: string): React.CSSProperties => {
    if (!result) {
      const isSelected = answers[question.id] === optionValue;
      return isSelected
        ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }
        : { background: 'rgba(148,163,184,0.03)', border: '1px solid transparent' };
    }
    const isCorrect = optionValue === question.correctAnswer;
    const isSelected = answers[question.id] === optionValue;
    if (isCorrect) return { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' };
    if (isSelected && !isCorrect) return { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' };
    return { background: 'transparent', border: '1px solid transparent' };
  };

  const getOptionTextColor = (question: Question, optionValue: string): string => {
    if (!result) return answers[question.id] === optionValue ? '#c4b5fd' : '#64748b';
    if (optionValue === question.correctAnswer) return '#34d399';
    if (answers[question.id] === optionValue) return '#f87171';
    return '#475569';
  };

  return (
    <main className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0c111d 0%, #111827 60%, #0f172a 100%)' }}>

      {/* Hero */}
      <header className="relative overflow-hidden text-center px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg mb-5 transition-colors"
            style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
            <ArrowLeft className="w-3 h-3" /> Inicio
          </Link>

          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
            <FileText className="w-6 h-6" style={{ color: '#a78bfa' }} />
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1"
            style={{
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #f8fafc 55%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            {result ? `${result.score}/100` : 'Examen Teórico'}
          </h1>
          <p className="text-sm" style={{ color: '#475569' }}>
            {result
              ? result.score >= 80 ? '¡Felicidades, aprobaste!' : result.score >= 60 ? 'Cerca, sigue practicando.' : 'Necesitas repasar el reglamento.'
              : '25 preguntas del Reglamento de Tránsito CDMX'}
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-5">

          {/* Resultado */}
          {result && (
            <div className="rounded-2xl p-6 text-center"
              style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: `1px solid ${scoreColor}30` }}>
              {/* Score circle */}
              <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center mx-auto mb-4"
                style={{ background: `${scoreColor}12`, border: `2px solid ${scoreColor}40` }}>
                <span className="text-2xl font-black" style={{ color: scoreColor }}>{result.score}</span>
                <span className="text-[10px] font-semibold" style={{ color: scoreColor }}>/ 100</span>
              </div>
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: '#34d399' }}>{result.correctAnswers}</p>
                  <p className="text-[11px]" style={{ color: '#475569' }}>correctas</p>
                </div>
                <div className="w-px h-8" style={{ background: 'rgba(148,163,184,0.1)' }} />
                <div className="text-center">
                  <p className="text-xl font-bold" style={{ color: '#f87171' }}>{result.incorrectAnswers}</p>
                  <p className="text-[11px]" style={{ color: '#475569' }}>incorrectas</p>
                </div>
              </div>
              <p className="text-xs mb-5" style={{ color: '#64748b' }}>
                Se abrió WhatsApp con tu resultado para enviarlo a un asesor.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={resetExam}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)', color: '#94a3b8' }}>
                  <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
                <Link href="/agenda"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                  Agendar mi curso →
                </Link>
              </div>
            </div>
          )}

          {/* Datos personales — solo antes de calificar */}
          {!result && (
            <div className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', border: '1px solid rgba(148,163,184,0.1)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Tus datos</p>
              <Form {...form}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="studentName" render={({ field }) => (
                    <FormItem>
                      <Label className="text-sm font-medium" style={{ color: '#94a3b8' }}>Nombre</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#475569' }} />
                        <FormControl><Input placeholder="Nombre completo" {...field} className={`pl-10 ${DARK_INPUT}`} /></FormControl>
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
              </Form>
            </div>
          )}

          {/* Barra de progreso */}
          {!result && answeredCount > 0 && (
            <div className="px-1">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: '#475569' }}>
                <span>{answeredCount} de {examQuestions.length} preguntas</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
              </div>
            </div>
          )}

          {/* Preguntas */}
          {examQuestions.map((question, index) => {
            const isAnswered = !!answers[question.id];
            const isCorrect = result && answers[question.id] === question.correctAnswer;
            const isWrong = result && answers[question.id] !== question.correctAnswer;

            return (
              <div key={question.id} className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
                  border: result
                    ? isCorrect ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(248,113,113,0.2)'
                    : isAnswered ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(148,163,184,0.08)',
                }}>
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={result
                      ? { background: isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.12)', color: isCorrect ? '#34d399' : '#f87171' }
                      : { background: isAnswered ? 'rgba(139,92,246,0.15)' : 'rgba(148,163,184,0.08)', color: isAnswered ? '#a78bfa' : '#475569' }}>
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-snug flex-1" style={{ color: '#e2e8f0' }}>
                    {question.text}
                  </p>
                  {result && (
                    isCorrect
                      ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                      : <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  )}
                </div>
                <RadioGroup
                  onValueChange={(v) => !result && handleAnswerChange(question.id, v)}
                  value={answers[question.id]}
                  className="space-y-2"
                  disabled={!!result}>
                  {question.options.map((option) => (
                    <div key={option.value}
                      className="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                      style={getOptionStyle(question, option.value)}>
                      <RadioGroupItem
                        value={option.value}
                        id={`${question.id}-${option.value}`}
                        className="border-slate-600 text-purple-500 mt-0.5 shrink-0"
                      />
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className={`text-sm font-normal cursor-pointer leading-snug ${result && answers[question.id] === option.value && option.value !== question.correctAnswer ? 'line-through' : ''}`}
                        style={{ color: getOptionTextColor(question, option.value) }}>
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            );
          })}

          {/* Submit / Reintentar */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {!result ? (
                <button type="submit"
                  disabled={answeredCount < examQuestions.length || form.formState.isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    boxShadow: answeredCount === examQuestions.length ? '0 4px 20px rgba(124,58,237,0.3)' : 'none',
                  }}>
                  <Send className="w-4 h-4" />
                  Calificar y Enviar Resultado
                </button>
              ) : (
                <button type="button" onClick={resetExam}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', color: '#64748b' }}>
                  <RefreshCw className="w-4 h-4" /> Intentar de nuevo
                </button>
              )}
            </form>
          </Form>
        </div>
      </div>

      <footer className="px-4 py-4 text-center" style={{ borderTop: '1px solid rgba(148,163,184,0.07)' }}>
        <p className="text-[11px]" style={{ color: '#334155' }}>Auto Escuela Americana · CDMX</p>
      </footer>
    </main>
  );
}
