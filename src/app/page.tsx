"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, CreditCard, ShoppingBag, BookOpen, BarChart3, FileQuestion, Smile } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfigForm } from "@/components/config-form";
import { InstructionsDisplay } from "@/components/instructions-display";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contact-form";

export default function Home() {
  const [tips, setTips] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);

  const handleTipsGenerated = (generatedTips: string[]) => {
    setTips(generatedTips);
    setIsLoading(false);
    setKey(prevKey => prevKey + 1);
  };

  const handleReset = () => {
    setTips(null);
    setKey(prevKey => prevKey + 1);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8">
        <Link href="/" className="mb-4 text-sm text-primary hover:underline">
          Auto Escuela Americana
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-primary">
          Auto Escuela Americana
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Plataforma de gestión para instructores y alumnos. Genera planes de lecciones y consejos de manejo personalizados.
        </p>
      </div>

      <div className="w-full max-w-4xl mb-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
            <Link href="/catalogo">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Catálogo y Precios
            </Link>
        </Button>
        <Button asChild variant="secondary">
            <Link href="/agenda">
                <CalendarDays className="mr-2 h-4 w-4" />
                Agendar Clase
            </Link>
        </Button>
        <Button asChild>
            <Link href="/evaluacion">
                <BarChart3 className="mr-2 h-4 w-4" />
                Evaluar Nivel
            </Link>
        </Button>
        <Button asChild variant="secondary">
            <Link href="/examen-teorico">
                <FileQuestion className="mr-2 h-4 w-4" />
                Examen Teórico
            </Link>
        </Button>
        <Button asChild>
            <Link href="/programa">
                <BookOpen className="mr-2 h-4 w-4" />
                Programa del Curso
            </Link>
        </Button>
        <Button asChild variant="secondary">
            <Link href="/pagos">
                <CreditCard className="mr-2 h-4 w-4" />
                Métodos de Pago
            </Link>
        </Button>
      </div>

      <Card className="w-full max-w-3xl shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {!tips ? (
                <ConfigForm
                  onGenerated={handleTipsGenerated}
                  setLoading={setIsLoading}
                  isLoading={isLoading}
                />
              ) : (
                <InstructionsDisplay
                  tips={tips}
                  onReset={handleReset}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <ContactForm />

      <Card className="w-full max-w-3xl shadow-lg rounded-xl mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <Smile className="h-6 w-6 text-accent" />
            Encuesta de Satisfacción
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            ¿Ya tomaste un curso con nosotros? Tu opinión es muy valiosa. Ayúdanos a mejorar respondiendo una breve encuesta.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/encuesta-satisfaccion">
              <Smile className="mr-2 h-4 w-4" />
              Responder Encuesta
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="w-full max-w-3xl shadow-lg rounded-xl mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <MapPin className="h-6 w-6 text-primary" />
            Nuestra Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            Torreón #49, Colonia Roma Sur, Alcaldía Cuauhtémoc, CDMX
          </p>
          <div className="aspect-video w-full overflow-hidden rounded-lg border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.910334861842!2d-99.1650399256956!3d19.41584284067989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff394a4f8999%3A0x89223c21a3295b9c!2sTorre%C3%B3n%2049%2C%20Roma%20Sur%2C%20Cuauht%C3%A9moc%2C%2006760%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1sen!2smx!4v1719524940549!5m2!1sen!2smx"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </CardContent>
      </Card>

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
