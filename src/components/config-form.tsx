'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getDrivingTipsAction } from '@/app/actions';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'El tema debe tener al menos 3 caracteres.' }),
});

type TipsFormProps = {
  onGenerated: (tips: string[]) => void;
  setLoading: (loading: boolean) => void;
  isLoading: boolean;
};

export function ConfigForm({ onGenerated, setLoading, isLoading }: TipsFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const result = await getDrivingTipsAction(values.topic);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setLoading(false);
    } else if (result.tips) {
      onGenerated(result.tips);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Ocurrió un error desconocido.',
        });
        setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Generador de Consejos AI</h2>
        <p className="text-muted-foreground">
          Describe un tema o área de enfoque y la IA creará una lista de consejos de manejo.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">Tema para Consejos</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ej. estacionamiento en paralelo, manejo en carretera"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Sé específico para obtener mejores resultados.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Generando...' : 'Generar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
