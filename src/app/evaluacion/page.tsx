
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
import { ArrowLeft, Lightbulb, BarChart3, Globe, FileText, User, Phone, Send } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AppFooter } from '@/components/footer';

type Question = {
  id: keyof Answers;
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
    text: '¿Sabes cómo arrancar en una pendiente ascendente sin que el coche se vaya para atrás (especialmente en estándar)?',
    options: [
        { label: 'No tengo idea, es uno de mis mayores miedos', value: 'no', score: 0 },
        { label: 'Lo he intentado, pero me cuesta mucho trabajo y a veces se apaga', value: 'some', score: 1 },
        { label: 'Sí, domino la técnica del clutch/freno o uso el freno de mano', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'roundabouts',
    text: 'Al llegar a una glorieta (rotonda), ¿sabes quién tiene la preferencia y cómo circular en ella?',
    options: [
        { label: 'No estoy seguro/a, me confunden y prefiero evitarlas', value: 'no', score: 0 },
        { label: 'Tengo una idea, pero me siento inseguro/a al entrar o salir', value: 'some', score: 1 },
        { label: 'Sí, cedo el paso a quien está dentro y circulo por el carril correcto', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'reversing',
    text: '¿Cómo es tu habilidad para maniobrar en reversa en línea recta o para girar en una esquina?',
    options: [
        { label: 'Muy mala, me cuesta mucho trabajo ir derecho/a', value: 'bad', score: 0 },
        { label: 'Regular, lo hago pero necesito corregir mucho la dirección', value: 'regular', score: 1 },
        { label: 'Buena, puedo controlar el vehículo en reversa con confianza', value: 'good', score: 2 },
    ],
  },
  {
    id: 'mirror_usage',
    text: '¿Con qué frecuencia utilizas tus espejos retrovisores (central y laterales) mientras conduces?',
    options: [
        { label: 'Casi nunca, me concentro solo en lo que está enfrente', value: 'rarely', score: 0 },
        { label: 'Solo cuando voy a cambiar de carril o dar vuelta', value: 'sometimes', score: 1 },
        { label: 'Constantemente, para mantenerme al tanto de todo mi entorno', value: 'constantly', score: 2 },
    ],
  },
  {
    id: 'highway',
    text: '¿Te sentirías cómodo/a manejando en una carretera fuera de la ciudad a velocidades de 80-100 km/h?',
    options: [
        { label: 'No, me da mucho miedo la velocidad o los otros vehículos', value: 'no', score: 0 },
        { label: 'Podría hacerlo, pero me sentiría muy tenso/a y preferiría ir despacio', value: 'some', score: 1 },
        { label: 'Sí, me siento capaz de manejar en carretera de forma segura', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'emergency_braking',
    text: 'Si el coche de adelante frena de repente, ¿confías en tu tiempo de reacción y distancia de seguimiento?',
    options: [
        { label: 'No, a menudo siento que voy muy pegado/a o reacciono tarde', value: 'no', score: 0 },
        { label: 'Creo que sí, pero no estoy completamente seguro/a', value: 'some', score: 1 },
        { label: 'Sí, siempre mantengo una distancia segura y estoy alerta', value: 'yes', score: 2 },
    ],
  },
  {
    id: 'signaling',
    text: '¿Utilizas las luces direccionales para TODAS tus maniobras (cambios de carril, vueltas, etc.)?',
    options: [
        { label: 'A veces se me olvida, especialmente en cambios de carril', value: 'sometimes', score: 0 },
        { label: 'Casi siempre, pero podría ser más consistente', value: 'mostly', score: 1 },
        { label: 'Sí, es un hábito automático para mí', value: 'always', score: 2 },
    ],
  },
  {
    id: 'vehicle_knowledge',
    text: '¿Sabes qué hacer si se enciende un testigo en el tablero como el de la batería o la temperatura?',
    options:
    [
        { label: 'No, no sabría qué significa ni cómo reaccionar', value: 'no', score: 0 },
        { label: 'Reconocería algunos, pero no sabría qué hacer en todos los casos', value: 'some', score: 1 },
        { label: 'Sí, sé lo que indican los testigos más importantes y cómo actuar', value: 'yes', score: 2 },
    ],
  },
];

const evaluationSchema = z.object({
  studentName: z.string().min(2, { message: 'Por favor, ingresa tu nombre completo.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  answers: z.record(z.string()).refine(val => Object.keys(val).length === questions.length, {
      message: "Por favor responde todas las preguntas."
  })
});

type Answers = { [key: string]: string };
type EvaluationFormValues = z.infer<typeof evaluationSchema>;

type Result = {
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  recommendation: string;
};

export default function EvaluacionPage() {
  const [result, setResult] = useState<Result | null>(null);
  
  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      studentName: '',
      phone: '',
      answers: {},
    },
  });

  const handleAnswerChange = (questionId: string, value: string) => {
    const currentAnswers = form.getValues('answers');
    form.setValue('answers', { ...currentAnswers, [questionId]: value });
  };
  
  function onSubmit(data: EvaluationFormValues) {
    const beginnerResult: Result = {
      level: 'Principiante',
      description: 'Tus respuestas indican que estás comenzando tu viaje como conductor o que aún necesitas reforzar los fundamentos.',
      recommendation: 'Nuestro curso para principiantes es perfecto para ti. Cubrimos desde los conceptos más básicos hasta tus primeras prácticas en tráfico ligero, construyendo tu confianza paso a paso.',
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
        const selectedOption = question.options.find(opt => opt.value === answerValue);
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
      }
    }

    let finalResult: Result;
    if (totalScore <= 12) {
      finalResult = beginnerResult;
    } else if (totalScore <= 22) {
      finalResult = {
        level: 'Intermedio',
        description: 'Ya tienes experiencia, pero hay áreas clave en las que puedes mejorar para sentirte más seguro en el tráfico diario.',
        recommendation: 'Te recomendamos nuestro curso intermedio. Nos enfocaremos en perfeccionar tus habilidades en situaciones de tráfico real, estacionamiento avanzado y maniobras de precisión.',
      };
    } else {
      finalResult = {
        level: 'Avanzado',
        description: 'Pareces tener una base sólida, pero siempre se pueden pulir habilidades para una conducción más segura y eficiente.',
        recommendation: 'Nuestro curso avanzado o las clases de perfeccionamiento son ideales para ti. Podrás pulir técnicas específicas como manejo en carretera, conducción defensiva o manejo en condiciones adversas.',
      };
    }
    
    setResult(finalResult);
    sendToWhatsApp(data, finalResult);
  };

  const sendToWhatsApp = (data: EvaluationFormValues, resultData: Result) => {
    const whatsAppNumber = "525634433212";
    const message = `📝 *Resultado de Evaluación de Habilidades*\n\n` +
                    `*Alumno:* ${data.studentName}\n` +
                    `*Teléfono:* ${data.phone}\n\n` +
                    `*Nivel Recomendado:* ${resultData.level}\n\n` +
                    `*Sugerencia:* ${resultData.recommendation}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  const isFormComplete = Object.keys(form.watch('answers')).length === questions.length;

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="/agenda">
              <Globe className="mr-2 h-4 w-4" />
              Agendar clase
            </a>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Evalúa tus Habilidades
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Responde estas preguntas para descubrir qué curso de manejo se adapta mejor a tus necesidades.
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
            <Link href="https://autoescuelaamericana.com/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          {!result ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Cuestionario de Habilidades</CardTitle>
                  <CardDescription>
                    Sé honesto/a en tus respuestas para obtener la mejor recomendación.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
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

                  {questions.map((question, index) => (
                    <div key={question.id}>
                      <p className="font-semibold mb-3">{index + 1}. {question.text}</p>
                      <RadioGroup
                        onValueChange={(value) => handleAnswerChange(String(question.id), value)}
                        value={form.getValues('answers')[question.id]}
                        className="space-y-2"
                      >
                        {question.options.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3">
                            <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                            <Label htmlFor={`${question.id}-${option.value}`} className="font-normal cursor-pointer">{option.label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                   {form.formState.errors.answers && <p className="text-sm font-medium text-destructive">{String(form.formState.errors.answers?.message || "")}</p>}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={!isFormComplete || form.formState.isSubmitting}>
                     <Send className="mr-2 h-4 w-4" />
                    Ver y Enviar Recomendación
                  </Button>
                </CardFooter>
              </form>
            </Form>
          ) : (
             <CardContent className="pt-6">
                <Alert variant="default" className="bg-primary/10 border-primary/50">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-bold text-xl">
                        Nivel Recomendado: {result.level}
                    </AlertTitle>
                    <AlertDescription className="text-foreground mt-2 space-y-2">
                       <p>{result.description}</p>
                       <p className="font-semibold">{result.recommendation}</p>
                       <p className="pt-2">Se ha preparado un mensaje con tu resultado para que lo envíes a un asesor por WhatsApp.</p>
                    </AlertDescription>
                </Alert>

                 <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                     <Button onClick={() => { setResult(null); form.reset(); }}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Hacer de Nuevo
                    </Button>
                    <Button asChild variant="secondary">
                       <Link href="/#contact-button-section">
                           Solicitar Info
                       </Link>
                    </Button>
                 </div>
            </CardContent>
          )}
        </Card>
      </div>

       <AppFooter />
    </main>
  );
}
