'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Lightbulb, BarChart3, Globe, FileText } from 'lucide-react';
import { AppFooter } from '@/components/footer';

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
    ]
  },
  {
    id: 'intersections',
    text: '¿Sabes cómo incorporarte a vías rápidas como Viaducto o Periférico?',
    options: [
      { label: 'No, lo evito por completo', value: 'no', score: 0 },
      { label: 'Lo he hecho, pero me genera mucho estrés', value: 'some', score: 1 },
      { label: 'Sí, me incorporo y manejo sin problemas', value: 'yes', score: 2 },
    ]
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
];

type Answers = {
  [key: string]: string;
};

type Result = {
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  recommendation: string;
};

export default function EvaluacionPage() {
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<Result | null>(null);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateResult = () => {
    const beginnerResult: Result = {
      level: 'Principiante',
      description: 'Tus respuestas indican que estás comenzando tu viaje como conductor.',
      recommendation: 'Nuestro curso para principiantes es perfecto para ti. Cubrimos desde los conceptos más básicos hasta tus primeras prácticas en tráfico ligero, construyendo tu confianza paso a paso.',
    };

    // Rule: If user has never driven, they are a beginner.
    if (answers.experience === 'none') {
      setResult(beginnerResult);
      return;
    }

    let totalScore = 0;
    for (const question of questions) {
      const answerValue = answers[question.id];
      if (answerValue) {
        const selectedOption = question.options.find(opt => opt.value === answerValue);
        if (selectedOption) {
          totalScore += selectedOption.score;
        }
      }
    }

    if (totalScore <= 4) {
      setResult(beginnerResult);
    } else if (totalScore <= 8) {
      setResult({
        level: 'Intermedio',
        description: 'Ya tienes algo de experiencia, pero hay áreas clave en las que puedes mejorar para sentirte más seguro.',
        recommendation: 'Te recomendamos nuestro curso intermedio. Nos enfocaremos en perfeccionar tus habilidades en situaciones de tráfico real, estacionamiento avanzado y maniobras de precisión.',
      });
    } else {
      setResult({
        level: 'Avanzado',
        description: 'Pareces tener una buena base de conducción, pero siempre se puede perfeccionar.',
        recommendation: 'Nuestro curso avanzado o las clases de perfeccionamiento son ideales para ti. Podrás pulir técnicas específicas como manejo en carretera, conducción defensiva o manejo eficiente.',
      });
    }
  };

  const isFormComplete = Object.keys(answers).length === questions.length;

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 h-4 w-4" />
              www.autoescuelaamericana.com
            </a>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Evalúa tus Habilidades
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Responde estas breves preguntas para descubrir qué curso de manejo se adapta mejor a tus necesidades.
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
          {!result ? (
            <>
              <CardHeader>
                <CardTitle>Cuestionario de Habilidades</CardTitle>
                <CardDescription>
                  Sé honesto en tus respuestas para obtener la mejor recomendación.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {questions.map((question, index) => (
                  <div key={question.id}>
                    <p className="font-semibold mb-3">{index + 1}. {question.text}</p>
                    <RadioGroup
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                      value={answers[question.id]}
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
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={calculateResult} disabled={!isFormComplete}>
                  Ver Recomendación
                </Button>
              </CardFooter>
            </>
          ) : (
             <CardContent className="pt-6">
                <Alert variant="default" className="bg-accent/20 border-accent/50">
                    <Lightbulb className="h-4 w-4 text-accent" />
                    <AlertTitle className="text-accent font-bold text-xl">
                        Nivel Recomendado: {result.level}
                    </AlertTitle>
                    <AlertDescription className="text-foreground mt-2 space-y-2">
                       <p>{result.description}</p>
                       <p className="font-semibold">{result.recommendation}</p>
                    </AlertDescription>
                </Alert>

                 <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                     <Button onClick={() => { setResult(null); setAnswers({}); }}>
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
