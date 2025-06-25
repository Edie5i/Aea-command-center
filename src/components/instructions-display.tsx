'use client';

import React from 'react';
import { RotateCw, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TipsDisplayProps = {
  tips: string[];
  onReset: () => void;
};

export function InstructionsDisplay({ tips, onReset }: TipsDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Consejos Generados</h2>
        <p className="text-muted-foreground">Utiliza estos puntos como base para tu próxima lección de manejo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tips.map((tip, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Consejo {index + 1}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>{tip}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <Button onClick={onReset} variant="outline">
          <RotateCw className="mr-2 h-4 w-4" />
          Generar Más Consejos
        </Button>
      </div>
    </div>
  );
}
