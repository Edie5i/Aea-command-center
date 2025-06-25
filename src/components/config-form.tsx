'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lightbulb, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getInstructionsAction } from '@/app/actions';

const formSchema = z.object({
  firebaseConfig: z.string().min(1, { message: 'Firebase config is required.' }),
});

type ConfigFormProps = {
  onGenerated: (instructions: string) => void;
  setLoading: (loading: boolean) => void;
  isLoading: boolean;
};

export function ConfigForm({ onGenerated, setLoading, isLoading }: ConfigFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firebaseConfig: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const result = await getInstructionsAction(values.firebaseConfig);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: result.error,
      });
      setLoading(false);
    } else if (result.instructions) {
      onGenerated(result.instructions);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An unknown error occurred.',
        });
        setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Start Here</AlertTitle>
        <AlertDescription>
          Paste your Firebase config object into the text area below to get started.
        </AlertDescription>
      </Alert>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="firebaseConfig"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">Firebase Config</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`const firebaseConfig = {\n  apiKey: "AIza...",\n  authDomain: "your-project.firebaseapp.com",\n  ...\n};`}
                    className="min-h-[200px] font-code text-sm bg-muted/50"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  You can find this in your Firebase project settings.
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
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Generating...' : 'Generate Instructions'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
