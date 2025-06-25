"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, CalendarDays } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfigForm } from "@/components/config-form";
import { InstructionsDisplay } from "@/components/instructions-display";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
    <main className="flex min-h-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center mb-8">
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
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Powered by Next.js and Genkit.
        </p>
      </footer>
    </main>
  );
}
