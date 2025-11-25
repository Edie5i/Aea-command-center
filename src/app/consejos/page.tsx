
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lightbulb, Sparkles, Send, Loader2, AlertCircle } from 'lucide-react';
import { AppFooter } from '@/components/footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateDrivingTipsAction } from '@/app/actions';

const tipTopics = [
  { value: 'lluvia', label: 'Conducir en Lluvia' },
  { value: 'noche', label: 'Conducir de Noche' },
  { value: 'carretera', label: 'Manejo en Carretera' },
  { value: 'tráfico denso', label: 'Manejo en Tráfico Denso' },
  { value: 'estacionarse', label: 'Estacionarse Correctamente' },
  { value: 'glorietas', label: 'Navegar Glorietas' },
  { value: 'ahorrar gasolina', label: 'Ahorrar Gasolina' },
];

export default function ConsejosPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTips = async () => {
    if (!selectedTopic) {
      setError('Por favor, selecciona un tema para generar los consejos.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTips([]);

    try {
      const result = await generateDrivingTipsAction(selectedTopic);
      if (result.error || !result.tips) {
        throw new Error(result.error || 'No se pudieron generar los consejos.');
      }
      setTips(result.tips);
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Consejos de Manejo con IA
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Selecciona un tema y obtén consejos prácticos generados por nuestro asistente de IA para ser un mejor conductor.
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
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/>Generador de Consejos</CardTitle>
            <CardDescription>
              Elige un tema de la lista y presiona "Generar Consejos" para recibir ayuda de nuestra IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Select onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Selecciona un tema..." />
                </SelectTrigger>
                <SelectContent>
                  {tipTopics.map((topic) => (
                    <SelectItem key={topic.value} value={topic.value}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleGenerateTips} disabled={isLoading || !selectedTopic} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isLoading ? 'Generando...' : 'Generar Consejos'}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg">Generando consejos, por favor espera...</p>
              </div>
            )}
            
            {tips.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Send className="text-primary h-5 w-5"/>
                        Consejos para: <span className="capitalize">{selectedTopic}</span>
                    </h3>
                    <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                        {tips.map((tip, index) => (
                            <li key={index} className="pl-2">{tip}</li>
                        ))}
                    </ul>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

       <AppFooter />
    </main>
  );
}
