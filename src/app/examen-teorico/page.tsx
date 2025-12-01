
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, XCircle, User, Phone, Send, Globe, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AppFooter } from '@/components/footer';

type Question = {
  id: number;
  text: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
};

const examQuestions: Question[] = [
  {
    id: 1,
    text: 'Según el Art. 5 del Reglamento de Tránsito, ¿quién tiene la máxima prioridad en el uso de la vía pública?',
    options: [
      { label: 'Vehículos de transporte público', value: 'a' },
      { label: 'Peatones, especialmente con discapacidad', value: 'b' },
      { label: 'Ciclistas', value: 'c' },
      { label: 'Vehículos particulares', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 2,
    text: '¿Cuál es el límite de velocidad en carriles centrales de vías de acceso controlado como Periférico (Art. 9)?',
    options: [
      { label: '50 km/h', value: 'a' },
      { label: '100 km/h', value: 'b' },
      { label: '80 km/h', value: 'c' },
      { label: '90 km/h', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 3,
    text: 'Conforme al Art. 11, ¿quiénes están obligados a utilizar el cinturón de seguridad?',
    options: [
      { label: 'Solo el conductor y el copiloto', value: 'a' },
      { label: 'Todos los ocupantes del vehículo', value: 'b' },
      { label: 'Solo en viajes de carretera', value: 'c' },
      { label: 'Pasajeros del asiento trasero únicamente', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 4,
    text: '¿Qué acción está prohibida para los conductores mientras el vehículo está en movimiento (Art. 10)?',
    options: [
      { label: 'Ajustar los espejos retrovisores', value: 'a' },
      { label: 'Escuchar música a volumen moderado', value: 'b' },
      { label: 'Utilizar el teléfono celular o cualquier distractor', value: 'c' },
      { label: 'Hablar con los pasajeros', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 5,
    text: '¿Cuál es el límite máximo de alcohol en aire espirado permitido para conductores particulares (Art. 10)?',
    options: [
      { label: '0.40 mg/L', value: 'a' },
      { label: '0.08 mg/L', value: 'b' },
      { label: '0.50 mg/L', value: 'c' },
      { label: '0.25 mg/L', value: 'd' },
    ],
    correctAnswer: 'd',
  },
  {
    id: 6,
    text: 'De acuerdo al Art. 11, ¿dónde debe viajar un niño de 7 años y 1.20 metros de estatura?',
    options: [
      { label: 'En el asiento del copiloto con cinturón', value: 'a' },
      { label: 'En el asiento trasero, con un sistema de retención infantil', value: 'b' },
      { label: 'En cualquier asiento, siempre que use cinturón', value: 'c' },
      { label: 'En brazos de un adulto en el asiento trasero', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 7,
    text: '¿En qué lugar está prohibido estacionarse según el Art. 34?',
    options: [
      { label: 'Frente a parques o jardines', value: 'a' },
      { label: 'En zonas residenciales después de las 10 pm', value: 'b' },
      { label: 'Sobre banquetas, cruces peatonales o en doble fila', value: 'c' },
      { label: 'A más de 10 metros de una esquina', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 8,
    text: 'El Art. 30 establece que los motociclistas deben...',
    options: [
      { label: 'Circular entre carriles para avanzar más rápido', value: 'a' },
      { label: 'Utilizar siempre un carril completo de circulación', value: 'b' },
      { label: 'Llevar casco solo en vías rápidas', value: 'c' },
      { label: 'Apagar las luces durante el día para ahorrar batería', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 9,
    text: '¿Cuál es el límite de velocidad en una zona escolar o de hospital (Art. 9)?',
    options: [
      { label: '30 km/h', value: 'a' },
      { label: '40 km/h', value: 'b' },
      { label: '20 km/h', value: 'c' },
      { label: '10 km/h', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 10,
    text: 'Si ves un vehículo de emergencia con sirenas y torretas encendidas, ¿qué debes hacer (Art. 19 del documento de referencia)?',
    options: [
      { label: 'Acelerar para no estorbar', value: 'a' },
      { label: 'Seguirlo para aprovechar el paso libre', value: 'b' },
      { label: 'Desplazarte al carril derecho y detenerte si es necesario', value: 'c' },
      { label: 'Continuar a la misma velocidad', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 11,
    text: '¿Qué significa una línea continua en el pavimento (Art. 20 del documento de referencia)?',
    options: [
      { label: 'Indica el límite de la vía', value: 'a' },
      { label: 'Prohibición de rebasar o cambiar de carril sobre ella', value: 'b' },
      { label: 'Zona exclusiva para bicicletas', value: 'c' },
      { label: 'Puedes rebasar si no vienen autos', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 12,
    text: '¿Cuál es uno de los documentos que un conductor siempre debe portar, según el Art. 8?',
    options: [
      { label: 'Comprobante de pago de tenencia', value: 'a' },
      { label: 'Manual del propietario del vehículo', value: 'b' },
      { label: 'Póliza de seguro de responsabilidad civil vigente', value: 'c' },
      { label: 'Acta de nacimiento', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 13,
    text: 'Al rebasar a un ciclista, la distancia mínima lateral que debe mantener un vehículo es de:',
    options: [
      { label: '1.50 metros', value: 'a' },
      { label: '0.50 metros', value: 'b' },
      { label: '2.00 metros', value: 'c' },
      { label: '1.00 metro', value: 'd' },
    ],
    correctAnswer: 'a',
  },
  {
    id: 14,
    text: 'En una glorieta sin señalización, ¿quién tiene la preferencia de paso?',
    options: [
      { label: 'El vehículo más grande', value: 'a' },
      { label: 'El vehículo que pretende entrar a la glorieta', value: 'b' },
      { label: 'El vehículo que ya está circulando dentro de la glorieta', value: 'c' },
      { label: 'El transporte público', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 15,
    text: '¿Cuándo está permitido que un motociclista circule entre carriles (Art. 30)?',
    options: [
      { label: 'Nunca está permitido', value: 'a' },
      { label: 'Solo si el tráfico está detenido, para llegar al área de espera', value: 'b' },
      { label: 'En cualquier circunstancia, si lo hace con cuidado', value: 'c' },
      { label: 'Únicamente en vías rápidas', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 16,
    text: '¿Cuál es el límite de velocidad en vías primarias como Insurgentes o Tlalpan (Art. 9)?',
    options: [
      { label: '60 km/h', value: 'a' },
      { label: '40 km/h', value: 'b' },
      { label: '70 km/h', value: 'c' },
      { label: '50 km/h', value: 'd' },
    ],
    correctAnswer: 'd',
  },
  {
    id: 17,
    text: '¿Qué indica la luz ámbar (amarilla) de un semáforo?',
    options: [
      { label: 'Acelerar para cruzar antes del rojo', value: 'a' },
      { label: 'Detenerse de inmediato sobre el cruce peatonal', value: 'b' },
      { label: 'Prepararse para detenerse antes de la línea de alto', value: 'c' },
      { label: 'Indica que el semáforo no funciona', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 18,
    text: '¿Está permitida la vuelta a la derecha con el semáforo en rojo?',
    options: [
      { label: 'Sí, siempre, cediendo el paso', value: 'a' },
      { label: 'No, está estrictamente prohibido', value: 'b' },
      { label: 'Sí, solo si hay una señal que lo permita explícitamente y con precaución', value: 'c' },
      { label: 'Solo si no hay peatones esperando para cruzar', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 19,
    text: 'De acuerdo al Art. 6, es una obligación de los peatones:',
    options: [
      { label: 'Cruzar por cualquier punto de la calle si no vienen autos', value: 'a' },
      { label: 'Hacer señales con la mano para que los autos se detengan', value: 'b' },
      { label: 'Cruzar por las esquinas o cruces peatonales designados', value: 'c' },
      { label: 'Caminar por el arroyo vehicular si la banqueta está ocupada', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 20,
    text: 'En caso de un accidente de tránsito, ¿cuál es una de las primeras acciones que debe tomar un conductor (Art. 40)?',
    options: [
      { label: 'Huir del lugar para evitar problemas', value: 'a' },
      { label: 'Discutir con el otro conductor para determinar la culpa', value: 'b' },
      { label: 'Detenerse en un lugar seguro y prestar ayuda a posibles lesionados', value: 'c' },
      { label: 'Mover el vehículo inmediatamente para no obstruir el tráfico', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 21,
    text: '¿Para qué se deben usar las luces direccionales según el Art. 37?',
    options: [
      { label: 'Para saludar a otros conductores', value: 'a' },
      { label: 'Solo si es de noche', value: 'b' },
      { label: 'Para indicar giros o cambios de carril', value: 'c' },
      { label: 'Para pedir que te dejen pasar más rápido', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 22,
    text: '¿Qué prohibición aplica a todos los vehículos sobre las aceras (Art. 10)?',
    options: [
      { label: 'Estacionarse por menos de 5 minutos', value: 'a' },
      { label: 'Circular o estacionarse sobre ellas', value: 'b' },
      { label: 'Subir solo con dos llantas', value: 'c' },
      { label: 'Usarlas como atajo si hay mucho tráfico', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 23,
    text: 'Además de usar aditamentos luminosos en la noche, ¿qué otra obligación importante tienen los ciclistas (Art. 21)?',
    options: [
      { label: 'Llevar siempre una campana o timbre', value: 'a' },
      { label: 'Circular lo más pegado a la derecha posible', value: 'b' },
      { label: 'Usar casco protector', value: 'c' },
      { label: 'Circular en sentido contrario en calles de un solo sentido', value: 'd' },
    ],
    correctAnswer: 'c',
  },
  {
    id: 24,
    text: 'Según el Art. 37, ¿cuándo es obligatorio usar las luces bajas?',
    options: [
      { label: 'Solo en túneles y pasos a desnivel', value: 'a' },
      { label: 'Desde que anochece hasta que amanece y cuando la visibilidad es mala', value: 'b' },
      { label: 'Solo en carreteras federales', value: 'c' },
      { label: 'Únicamente cuando llueve', value: 'd' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 25,
    text: 'Además de usar un carril completo, ¿qué otra acción es fundamental que los motociclistas realicen siempre (Art. 30)?',
    options: [
      { label: 'Llevar las luces encendidas en todo momento', value: 'a' },
      { label: 'Rebasar por la derecha si hay espacio', value: 'b' },
      { label: 'Llevar a un solo pasajero como máximo', value: 'c' },
      { label: 'Usar el claxon constantemente para advertir su presencia', value: 'd' },
    ],
    correctAnswer: 'a',
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

const examSchema = z.object({
  studentName: z.string().min(2, { message: 'Por favor, ingresa tu nombre completo.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
});

type ExamFormValues = z.infer<typeof examSchema>;

export default function ExamenTeoricoPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Result | null>(null);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
        studentName: '',
        phone: '',
    },
  });

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  function onSubmit(data: ExamFormValues) {
    let correctCount = 0;
    examQuestions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = examQuestions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    
    setResult({
        score: score,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
    });

    let recommendation = '';
    if (score >= 80) {
        recommendation = 'Te recomendamos un *Curso Avanzado o de Perfeccionamiento* para pulir tus habilidades.';
    } else if (score >= 60) {
        recommendation = 'Te recomendamos nuestro *Curso Intermedio* para afianzar tus conocimientos y ganar más confianza.';
    } else {
        recommendation = 'Te recomendamos nuestro *Curso de Principiante* para construir una base sólida desde cero.';
    }

    const whatsAppNumber = "525634433212";
    const message = `📝 *Resultado del Examen Teórico*\n\n` +
                    `*Alumno:* ${data.studentName}\n` +
                    `*Teléfono:* ${data.phone}\n` +
                    `*Calificación:* ${score}/100\n` +
                    `*Respuestas Correctas:* ${correctCount} de ${totalQuestions}\n\n` +
                    `*Recomendación:* ${recommendation}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };
  
  const resetExam = () => {
    setAnswers({});
    setResult(null);
    form.reset();
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
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="https://mi-proyecto-de-prueba-12345.web.app" target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 h-4 w-4" />
              mi-proyecto-de-prueba-12345.web.app
            </a>
          </Button>
        </div>
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
                <CardTitle>Cuestionario</CardTitle>
                <CardDescription>
                  Ingresa tus datos, selecciona tus respuestas y envía el resultado para obtener una recomendación.
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

                {!result && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="studentName"
                        render={({ field }) => (
                          <FormItem>
                            <Label>Tu Nombre</Label>
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
                            <Label>Tu Teléfono</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <FormControl>
                                <Input placeholder="Número de WhatsApp" {...field} className="pl-10" />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                   </div>
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
                    <Button type="button" onClick={resetExam}>
                        Reintentar
                    </Button>
                 ) : (
                    <Button type="submit" disabled={!isExamComplete || form.formState.isSubmitting}>
                       <Send className="mr-2 h-4 w-4" />
                      Calificar y Enviar
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
