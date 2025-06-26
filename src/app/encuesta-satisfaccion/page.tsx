
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Smile, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormItem } from '@/components/ui/form';

const surveySchema = z.object({
  studentName: z.string().optional(),
  instructorName: z.string().optional(),
  instructorRating: z.string({ required_error: 'Por favor, califica a tu instructor.' }),
  clarityRating: z.string({ required_error: 'Por favor, califica la claridad.' }),
  contentRating: z.string({ required_error: 'Por favor, califica el contenido.' }),
  confidenceImproved: z.string({ required_error: 'Por favor, selecciona una opción.' }),
  recommend: z.string({ required_error: 'Por favor, selecciona una opción.' }),
  source: z.string({ required_error: 'Por favor, selecciona cómo nos encontraste.' }),
  comments: z.string().optional(),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

const ratingOptions = [
    { value: '5', label: 'Excelente' },
    { value: '4', label: 'Muy Bueno' },
    { value: '3', label: 'Bueno' },
    { value: '2', label: 'Regular' },
    { value: '1', label: 'Malo' },
];

export default function EncuestaSatisfaccionPage() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
        studentName: '',
        instructorName: '',
        comments: '',
    }
  });

  const onSubmit = (data: SurveyFormValues) => {
    const whatsAppNumber = "525634433212";
    
    let message = `📝 *Encuesta de Satisfacción* 📝\n\n`;
    if (data.studentName) message += `*Nombre del Alumno:* ${data.studentName}\n`;
    if (data.instructorName) message += `*Nombre del Instructor:* ${data.instructorName}\n\n`;

    message += `*Amabilidad y profesionalismo del instructor:* ${data.instructorRating}/5\n`;
    message += `*Claridad en explicaciones y paciencia:* ${data.clarityRating}/5\n`;
    message += `*Utilidad del contenido del curso:* ${data.contentRating}/5\n`;
    message += `*¿Sientes que tu confianza mejoró?:* ${data.confidenceImproved}\n`;
    message += `*¿Recomendarías AEA?:* ${data.recommend}\n`;
    message += `*¿Cómo nos encontraste?:* ${data.source}\n\n`;

    if (data.comments) {
        message += `*Comentarios adicionales:*\n${data.comments}`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: '¡Gracias por tus comentarios!',
      description: `Se abrirá WhatsApp para que puedas enviar tu encuesta.`,
    });

    setSubmitted(true);
    form.reset();
  };

  const renderRatingGroup = (name: keyof SurveyFormValues, label: string) => (
    <div className="space-y-3">
        <Label className="font-semibold">{label}</Label>
        <Controller
            name={name}
            control={form.control}
            render={({ field }) => (
                <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-wrap gap-x-6 gap-y-2"
                >
                    {ratingOptions.map(option => (
                        <FormItem key={option.value} className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                                <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                            </FormControl>
                            <Label htmlFor={`${name}-${option.value}`} className="font-normal cursor-pointer">
                                {option.label}
                            </Label>
                        </FormItem>
                    ))}
                </RadioGroup>
            )}
        />
        {form.formState.errors[name] && <p className="text-sm font-medium text-destructive">{form.formState.errors[name]?.message}</p>}
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="bg-primary/20 text-primary rounded-full p-3 mb-4">
          <Smile className="h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Encuesta de Satisfacción
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Tu opinión es muy importante para nosotros. Ayúdanos a mejorar respondiendo esta breve encuesta.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          {!submitted ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Cuéntanos tu Experiencia</CardTitle>
                  <CardDescription>
                    Tus respuestas son anónimas a menos que decidas incluir tu nombre.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormItem>
                            <Label htmlFor="studentName">Tu Nombre (Opcional)</Label>
                            <FormControl>
                                <Input id="studentName" placeholder="Juan Pérez" {...form.register('studentName')} />
                            </FormControl>
                        </FormItem>
                         <FormItem>
                            <Label htmlFor="instructorName">Nombre de tu Instructor (Opcional)</Label>
                            <FormControl>
                                <Input id="instructorName" placeholder="Eduardo" {...form.register('instructorName')} />
                            </FormControl>
                        </FormItem>
                    </div>

                    {renderRatingGroup('instructorRating', '1. Amabilidad y profesionalismo del instructor.')}
                    {renderRatingGroup('clarityRating', '2. Claridad en las explicaciones y paciencia del instructor.')}
                    {renderRatingGroup('contentRating', '3. ¿Qué tan útil fue el contenido del curso?')}
                    
                    <div className="space-y-3">
                        <Label className="font-semibold">4. ¿Sientes que tu confianza al manejar mejoró después del curso?</Label>
                         <Controller
                            name="confidenceImproved"
                            control={form.control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Sí" id="confidence-yes" /></FormControl><Label htmlFor="confidence-yes" className="font-normal cursor-pointer">Sí, mucho</Label></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Parcialmente" id="confidence-some" /></FormControl><Label htmlFor="confidence-some" className="font-normal cursor-pointer">Parcialmente</Label></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" id="confidence-no" /></FormControl><Label htmlFor="confidence-no" className="font-normal cursor-pointer">No</Label></FormItem>
                                </RadioGroup>
                            )}
                        />
                        {form.formState.errors.confidenceImproved && <p className="text-sm font-medium text-destructive">{form.formState.errors.confidenceImproved.message}</p>}
                    </div>

                     <div className="space-y-3">
                        <Label className="font-semibold">5. ¿Recomendarías Auto Escuela Americana a un amigo o familiar?</Label>
                        <Controller
                            name="recommend"
                            control={form.control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Sí" id="recommend-yes" /></FormControl><Label htmlFor="recommend-yes" className="font-normal cursor-pointer">Sí</Label></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="No" id="recommend-no" /></FormControl><Label htmlFor="recommend-no" className="font-normal cursor-pointer">No</Label></FormItem>
                                </RadioGroup>
                            )}
                        />
                        {form.formState.errors.recommend && <p className="text-sm font-medium text-destructive">{form.formState.errors.recommend.message}</p>}
                    </div>

                    <div className="space-y-3">
                        <Label className="font-semibold">6. ¿Cómo nos encontraste?</Label>
                        <Controller
                            name="source"
                            control={form.control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-x-6 gap-y-2">
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Facebook" id="source-facebook" /></FormControl><Label htmlFor="source-facebook" className="font-normal cursor-pointer">Facebook</Label></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Google" id="source-google" /></FormControl><Label htmlFor="source-google" className="font-normal cursor-pointer">Google</Label></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Recomendación" id="source-recommendation" /></FormControl><Label htmlFor="source-recommendation" className="font-normal cursor-pointer">Recomendación</Label></FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="Otro" id="source-other" /></FormControl><Label htmlFor="source-other" className="font-normal cursor-pointer">Otro</Label></FormItem>
                                </RadioGroup>
                            )}
                        />
                        {form.formState.errors.source && <p className="text-sm font-medium text-destructive">{form.formState.errors.source.message}</p>}
                    </div>

                    <FormItem>
                        <Label htmlFor="comments">7. Comentarios o sugerencias adicionales.</Label>
                        <FormControl>
                            <Textarea id="comments" placeholder="¿Hay algo más que te gustaría compartir con nosotros?" {...form.register('comments')} />
                        </FormControl>
                    </FormItem>

                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                     <Send className="mr-2 h-4 w-4" />
                    Enviar Encuesta por WhatsApp
                  </Button>
                </CardFooter>
              </form>
            </Form>
          ) : (
             <CardContent className="pt-6 text-center">
                <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-xl font-bold text-green-700 dark:text-green-300">
                        ¡Encuesta Enviada!
                    </AlertTitle>
                    <AlertDescription className="text-foreground mt-2">
                       Muchas gracias por tu tiempo y tus comentarios. ¡Nos ayudan a seguir mejorando!
                    </AlertDescription>
                </Alert>
                 <Button onClick={() => setSubmitted(false)} className="mt-6">
                    <Smile className="mr-2 h-4 w-4" />
                    Responder de nuevo
                </Button>
            </CardContent>
          )}
        </Card>
      </div>

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
