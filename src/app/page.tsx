"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, CalendarDays, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfigForm } from "@/components/config-form";
import { InstructionsDisplay } from "@/components/instructions-display";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <div className="bg-primary/20 text-primary rounded-full p-3 mb-4">
          <Car className="h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Escuela de Manejo AI
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Recibe consejos y planes de lecciones personalizados para mejorar tus habilidades de manejo.
        </p>
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
         <CardFooter className="p-6 pt-0 border-t flex justify-center">
            <Button asChild variant="secondary" className="mt-6">
                <Link href="/agenda">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Ver Agenda de Clases
                </Link>
            </Button>
        </CardFooter>
      </Card>

      <Card className="w-full max-w-3xl shadow-lg rounded-xl mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Nuestra Zona de Cobertura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full overflow-hidden rounded-lg border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d240827.4627993354!2d-99.28002494396264!3d19.42991612499149!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce0026db3b7a83%3A0x88d2588b0a93f773!2sMexico%20City%2C%20CDMX!5e0!3m2!1sen!2smx!4v1678832960410!5m2!1sen!2smx"
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

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Powered by Next.js and Genkit.
        </p>
      </footer>
    </main>
  );
}
