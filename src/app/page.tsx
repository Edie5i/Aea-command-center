"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfigForm } from "@/components/config-form";
import { InstructionsDisplay } from "@/components/instructions-display";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [ideas, setIdeas] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);

  const handleIdeasGenerated = (generatedIdeas: string[]) => {
    setIdeas(generatedIdeas);
    setIsLoading(false);
    setKey(prevKey => prevKey + 1);
  };

  const handleReset = () => {
    setIdeas(null);
    setKey(prevKey => prevKey + 1);
  };

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="bg-primary/20 text-primary rounded-full p-3 mb-4">
          <Lightbulb className="h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          AI Idea Spark
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Turn your spark of a thought into a flame of brilliant ideas.
          Just enter a topic and let our AI do the rest.
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
              {!ideas ? (
                <ConfigForm
                  onGenerated={handleIdeasGenerated}
                  setLoading={setIsLoading}
                  isLoading={isLoading}
                />
              ) : (
                <InstructionsDisplay
                  ideas={ideas}
                  onReset={handleReset}
                />
              )}
            </motion.div>
          </AnimatePresence>
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
