'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Lightbulb, Loader2, Sparkles } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getIdeasAction } from '@/app/actions';

const formSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }),
});

type IdeaFormProps = {
  onGenerated: (ideas: string[]) => void;
  setLoading: (loading: boolean) => void;
  isLoading: boolean;
};

export function ConfigForm({ onGenerated, setLoading, isLoading }: IdeaFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const result = await getIdeasAction(values.topic);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setLoading(false);
    } else if (result.ideas) {
      onGenerated(result.ideas);
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
        <AlertTitle>Unleash Your Creativity</AlertTitle>
        <AlertDescription>
          Enter a topic and let our AI generate some brilliant ideas for you.
        </AlertDescription>
      </Alert>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">Your Topic</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., mobile apps for book lovers"
                    className="bg-muted/50"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  What kind of ideas are you looking for?
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
              {isLoading ? 'Generating...' : 'Generate Ideas'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
