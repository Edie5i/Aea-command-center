'use client';

import React from 'react';
import { RotateCw, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type IdeasDisplayProps = {
  ideas: string[];
  onReset: () => void;
};

export function InstructionsDisplay({ ideas, onReset }: IdeasDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Here are your ideas!</h2>
        <p className="text-muted-foreground">We've brainstormed a few concepts for you.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ideas.map((idea, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Idea {index + 1}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>{idea}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <Button onClick={onReset} variant="outline">
          <RotateCw className="mr-2 h-4 w-4" />
          Generate More
        </Button>
      </div>
    </div>
  );
}
