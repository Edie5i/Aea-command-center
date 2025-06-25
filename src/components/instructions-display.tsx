'use client';

import React from 'react';
import { RotateCw, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from './copy-button';

type InstructionsDisplayProps = {
  instructions: string;
  onReset: () => void;
};

export function InstructionsDisplay({ instructions, onReset }: InstructionsDisplayProps) {
  const parts = instructions.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Integration Steps</h2>
        <p className="text-muted-foreground">Follow these steps to add Firebase to your project.</p>
      </div>
      <div className="prose prose-blue dark:prose-invert max-w-none space-y-4 rounded-lg border bg-secondary/50 p-6">
        {parts.map((part, index) => {
          if (part.startsWith('```')) {
            const code = part.replace(/```(?:\w+\n)?/g, '').replace(/```$/, '');
            return (
              <div key={index} className="relative group">
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton textToCopy={code} />
                </div>
                <pre className="bg-background rounded-md p-4 text-sm overflow-x-auto">
                    <code className='font-code'>{code.trim()}</code>
                </pre>
              </div>
            );
          }
          // Process markdown-like features manually for non-code parts
          const lines = part.trim().split('\n').map((line, lineIndex) => {
            if (line.startsWith('# ')) {
              return <h2 key={lineIndex} className="text-xl font-bold mt-4 mb-2">{line.substring(2)}</h2>;
            }
            if (line.startsWith('## ')) {
              return <h3 key={lineIndex} className="text-lg font-bold mt-3 mb-1">{line.substring(3)}</h3>;
            }
            if (line.match(/^\d+\./)) {
                return <p key={lineIndex} className="my-1">{line}</p>
            }
            return <p key={lineIndex}>{line}</p>;
          });

          return <div key={index}>{lines}</div>;
        })}
      </div>
      <div className="flex justify-end">
        <Button onClick={onReset} variant="outline">
          <RotateCw className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>
    </div>
  );
}
