
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, FileQuestion, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Question = {
  id: number;
  text: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
};

const examQuestions: Question[] = [
  {
    id: 1,
    text: '¿Cuál es el límite de velocidad en carriles centrales de vías de acceso controlado como Periférico o Viaducto?',
    options: [
      { label: '50 km/h', value: 'a' },
      { label: '80 km/h', value: 'b' },
      { label: '100 km/h', value: 'c' },
      { label: '60 km/h', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 2,
    text: 'En un semáforo, ¿qué significa la luz ámbar (amarilla) fija?',
    options: [
      { label: 'Puede pasar con precaución.', value: 'a' },
      { label: 'Detenerse por completo.', value: 'b' },
      { label: 'Acelerar para pasar antes del rojo.', value: 'c' },
      { label: 'Es una advertencia de que la luz cambiará a rojo y debe empezar a detenerse.', value: 'd' },
    ],
    correctAnswer: 'd',
  },
  {
    id: 3,
    text: '¿Quién tiene la preferencia de paso en una intersección sin semáforos ni señales?',
    options: [
      { label: 'El vehículo que llegue primero.', value: 'a' },
      { label: 'El vehículo más grande.', value: 'b' },
      { label: 'El vehículo que va por la avenida más ancha.', value: 'c' },
      { label: 'El vehículo que va a la derecha.', value: 'd' },
    ],
    correctAnswer: 'a',
  },
  {
    id: 4,
    text: '¿Cuál es el límite de alcohol en aire espirado permitido para conductores de vehículos particulares en CDMX?',
    options: [
      { label: '0.8 mg/L', value: 'a' },
      { label: '0.4 mg/L', value: 'b' },
      { label: '0.25 mg/L', value: 'c' },
      { label: '0.0 mg/L', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 5,
    text: '¿Está permitido usar el teléfono celular mientras se conduce?',
    options: [
      { label: 'Sí, si es por menos de un minuto.', value: 'a' },
      { label: 'No, está prohibido a menos que se use con un sistema de manos libres.', value: 'b' },
      { label: 'Sí, si se sostiene con una sola mano.', value: 'c' },
      { label: 'Solo en semáforos en rojo.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 6,
    text: '¿Quiénes están obligados a usar el cinturón de seguridad en un vehículo?',
    options: [
      { label: 'Solo el conductor.', value: 'a' },
      { label: 'El conductor y el copiloto.', value: 'b' },
      { label: 'Todos los pasajeros, incluyendo los de los asientos traseros.', value: 'c' },
      { label: 'Solo en carretera.', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 7,
    text: '¿Cuál es el límite de velocidad en zonas escolares, de hospitales y peatonales?',
    options: [
      { label: '40 km/h', value: 'a' },
      { label: '30 km/h', value: 'b' },
      { label: '20 km/h', value: 'c' },
      { label: '10 km/h', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 8,
    text: 'Al acercarse un vehículo de emergencia (ambulancia, policía) con sirena y luces encendidas, ¿qué debe hacer?',
    options: [
      { label: 'Seguir a la misma velocidad.', value: 'a' },
      { label: 'Acelerar para no estorbar.', value: 'b' },
      { label: 'Ceder el paso, moviéndose al carril derecho y deteniéndose si es necesario.', value: 'c' },
      { label: 'Ponerse detrás de él para avanzar más rápido.', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 9,
    text: 'En una glorieta sin señalización, ¿quién tiene la preferencia de paso?',
    options: [
      { label: 'El que entra a la glorieta.', value: 'a' },
      { label: 'El vehículo que ya se encuentra circulando dentro de ella.', value: 'b' },
      { label: 'El vehículo más rápido.', value: 'c' },
      { label: 'El vehículo de transporte público.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 10,
    text: '¿Está permitido estacionarse en una esquina?',
    options: [
      { label: 'Sí, si no obstruye el paso.', value: 'a' },
      { label: 'No, está prohibido.', value: 'b' },
      { label: 'Solo por menos de 5 minutos.', value: 'c' },
      { label: 'Solo si se dejan las luces intermitentes.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 11,
    text: '¿A partir de qué edad pueden viajar los niños en el asiento delantero?',
    options: [
      { label: 'A partir de los 8 años.', value: 'a' },
      { label: 'A partir de los 12 años.', value: 'b' },
      { label: 'A cualquier edad si usan cinturón.', value: 'c' },
      { label: 'A partir de los 10 años.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 12,
    text: 'Según el reglamento de tránsito, ¿cuál de las siguientes acciones está prohibida para los motociclistas?',
    options: [
      { label: 'Circular por el carril de extrema derecha.', value: 'a' },
      { label: 'Transportar a un menor de 12 años de edad.', value: 'b' },
      { label: 'Rebasar a otro vehículo por la izquierda.', value: 'c' },
      { label: 'Usar casco certificado.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 13,
    text: 'En un paso de peatones sin semáforo, ¿quién tiene la prioridad?',
    options: [
      { label: 'El vehículo.', value: 'a' },
      { label: 'El peatón.', value: 'b' },
      { label: 'Quien se mueva más rápido.', value: 'c' },
      { label: 'Depende de la hora del día.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 14,
    text: 'La señal de "ALTO" (o "STOP") significa que debe:',
    options: [
      { label: 'Reducir la velocidad y pasar con cuidado.', value: 'a' },
      { label: 'Detenerse por completo y ceder el paso antes de continuar.', value: 'b' },
      { label: 'Ceder el paso solo si vienen otros autos.', value: 'c' },
      { label: 'Tocar el claxon antes de pasar.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 15,
    text: '¿Qué significa una luz de flecha verde en un semáforo?',
    options: [
      { label: 'Puede dar vuelta en la dirección de la flecha con precaución.', value: 'a' },
      { label: 'Debe esperar la luz verde circular.', value: 'b' },
      { label: 'Que la vuelta está prohibida.', value: 'c' },
      { label: 'Que solo los autobuses pueden dar vuelta.', value: 'd' },
    ],
    correctAnswer: 'a',
  },
  {
    id: 16,
    text: 'El sistema de Fotocívicas de la CDMX sanciona infracciones con puntos menos a la matrícula. ¿En qué consisten principalmente las sanciones?',
    options: [
      { label: 'Pagos de multas con descuento.', value: 'a' },
      { label: 'Cursos en línea y trabajo comunitario.', value: 'b' },
      { label: 'Aumento en el costo de la licencia.', value: 'c' },
      { label: 'La inmovilización inmediata del vehículo.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 17,
    text: '¿Se permite la vuelta a la derecha con el semáforo en rojo?',
    options: [
      { label: 'Sí, siempre.', value: 'a' },
      { label: 'Nunca está permitido.', value: 'b' },
      { label: 'Solo si hay una señal que lo permita explícitamente y con precaución.', value: 'c' },
      { label: 'Solo de noche.', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 18,
    text: 'Al encontrar un transporte escolar detenido subiendo o bajando escolares, ¿qué acción debe realizar?',
    options: [
      { label: 'Rebasarlo por la izquierda con precaución.', value: 'a' },
      { label: 'Tocar el claxon para que avance.', value: 'b' },
      { label: 'Detener totalmente el vehículo y ceder el paso.', value: 'c' },
      { label: 'Seguir avanzando lentamente.', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 19,
    text: 'En caso de participar en un accidente de tránsito con solo daños materiales, ¿qué es lo primero que debe hacer?',
    options: [
      { label: 'Huir del lugar.', value: 'a' },
      { label: 'Mover el vehículo a una posición segura para no obstruir el tráfico.', value: 'b' },
      { label: 'Dejar el vehículo en medio de la calle.', value: 'c' },
      { label: 'Llamar a un amigo.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 20,
    text: 'Las luces intermitentes (o de emergencia) del vehículo se deben usar para:',
    options: [
      { label: 'Estacionarse en doble fila.', value: 'a' },
      { label: 'Indicar una situación de emergencia o que el vehículo está detenido por una falla.', value: 'b' },
      { label: 'Conducir bajo la lluvia.', value: 'c' },
      { label: 'Agradecer a otro conductor.', value: 'd' },
    ],
    correctAnswer: 'b',
  },
];

type Answers = {
  [key: number]: string;
};

type Result = {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
};

export default function ExamenTeoricoPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Result | null>(null);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateResult = () => {
    let correctCount = 0;
    examQuestions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = examQuestions.length;
    const score = (correctCount / totalQuestions) * 100;
    setResult({
      score: Math.round(score),
      correctAnswers: correctCount,
      incorrectAnswers: totalQuestions - correctCount,
    });
  };
  
  const resetExam = () => {
    setAnswers({});
    setResult(null);
  };

  const isExamComplete = Object.keys(answers).length === examQuestions.length;

  const getOptionLabelClass = (question: Question, optionValue: string) => {
    if (!result) return '';
    
    const isCorrect = optionValue === question.correctAnswer;
    const isSelected = answers[question.id] === optionValue;

    if (isCorrect) {
        return 'text-green-600 font-bold';
    }
    if (isSelected && !isCorrect) {
        return 'text-red-600 font-bold line-through';
    }
    return '';
  };


  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <Link href="/">
            <Image
                src="/logo.png"
                alt="Logo de Auto Escuela Americana"
                width={100}
                height={100}
                className="mb-4"
            />
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Examen Teórico de Manejo
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Pon a prueba tus conocimientos sobre el Reglamento de Tránsito de la CDMX.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Cuestionario</CardTitle>
            <CardDescription>
              Selecciona la respuesta que consideres correcta para cada pregunta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {result && (
                <Alert variant={result.score >= 80 ? 'default' : 'destructive'} className={cn(result.score >= 80 && 'bg-green-100 dark:bg-green-900/30 border-green-500')}>
                    <AlertTitle className="text-xl font-bold">
                        {result.score >= 80 ? `¡Felicidades! Has Aprobado` : `Necesitas Repasar`}
                    </AlertTitle>
                    <AlertDescription className="mt-2 text-base">
                        Tu calificación es: <strong>{result.score}/100</strong>.
                        <br />
                        Respuestas correctas: {result.correctAnswers} | Respuestas incorrectas: {result.incorrectAnswers}
                    </AlertDescription>
                </Alert>
            )}

            {examQuestions.map((question, index) => (
              <div key={question.id}>
                <p className="font-semibold mb-3 flex items-start gap-2">
                    <span>{index + 1}. {question.text}</span>
                    {result && (
                        answers[question.id] === question.correctAnswer ? 
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" /> :
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                </p>
                <RadioGroup
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  value={answers[question.id]}
                  className="space-y-2"
                  disabled={!!result}
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                      <Label 
                        htmlFor={`${question.id}-${option.value}`} 
                        className={cn("font-normal cursor-pointer", getOptionLabelClass(question, option.value))}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
             {result ? (
                <Button onClick={resetExam}>
                    Intentar de Nuevo
                </Button>
             ) : (
                <Button onClick={calculateResult} disabled={!isExamComplete}>
                  Calificar Examen
                </Button>
             )}
          </CardFooter>
        </Card>
      </div>

       <footer className="w-full mt-auto py-8 text-center text-sm text-muted-foreground border-t">
        <p>
          <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            www.autoescuelaamericana.com
          </a>
        </p>
        <p className="mt-2">
          <Link href="/terminos" className="hover:underline">
            Términos y Condiciones
          </Link>
        </p>
        <p className="mt-2">
          Powered by Next.js and Genkit.
        </p>
      </footer>
    </main>
  );
}
