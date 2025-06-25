import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const programData = [
    {
        title: "01 - Introducción",
        items: [
            "Funcionamiento de sistemas",
            "Posición correcta del asiento, pies y espejos",
            "Envío del manual al alumno",
            "Reglamento de tránsito",
            "Documentos del vehículo",
            "Aspectos legales"
        ]
    },
    {
        title: "02 - Proceso de Inicio",
        items: [
            "Introducción a los sistemas del vehículo",
            "Tablero",
            "Volante",
            "Pedales",
            "Cambios",
            "Retrovisores",
            "Sistema de luces",
            "Sistema de seguridad"
        ]
    },
    {
        title: "03 - Avance Inicial",
        items: [
            "Aceleración",
            "Control del Clutch",
            "Frenado",
            "Control del Volante",
            "Avance en Línea Recta",
            "Avance en Reversa",
            "Avance con Vuelta",
            "Avance con Vuelta en 'U'"
        ]
    },
    {
        title: "04 - Avance Intermedio",
        items: [
            "Recorrido en vías primarias y secundarias",
            "Recorrido en vías rápidas (laterales)",
            "Uso de agujas laterales para reincorporación a vías",
            "Subidas",
            "Frenado con motor (bajadas)",
            "Reversa"
        ]
    },
    {
        title: "05 - Avance Final",
        items: [
            "Arranque en vías principales",
            "Rebases",
            "Cambio de carriles",
            "Curvas",
            "Estacionamiento en 3 pasos"
        ]
    },
    {
        title: "06 - Mecánica",
        items: [
            "Nivel de aceite del motor y dirección",
            "Nivel de líquido de frenos",
            "Nivel de anticongelante",
            "Nivel de aceite de transmisión",
            "Explicación sobre alineación (servicio)",
            "Paso de corriente",
            "Arranque sin carga de batería",
            "Cambio de llantas"
        ]
    }
];

export default function ProgramaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="bg-primary/20 text-primary rounded-full p-3 mb-4">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Programa del Curso
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Nuestro temario está diseñado para cubrir todos los aspectos de la conducción, desde lo básico hasta lo avanzado.
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
            <CardTitle>Temario Detallado</CardTitle>
            <CardDescription>
              Cada módulo está diseñado para construir tus habilidades progresivamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {programData.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
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
