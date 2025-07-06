
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, Phone, Home, Send, CheckCircle, Globe } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const instructorSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  address: z.string().min(10, { message: 'Por favor, ingresa una dirección más detallada.' }),
});

type InstructorFormValues = z.infer<typeof instructorSchema>;

export default function InstructoresPage() {
    const [submitted, setSubmitted] = useState(false);
    const { toast } = useToast();
    const form = useForm<InstructorFormValues>({
        resolver: zodResolver(instructorSchema),
        defaultValues: {
            name: '',
            phone: '',
            address: '',
        }
    });

    function onSubmit(values: InstructorFormValues) {
        const whatsAppNumber = "525634433212"; // Admin number
        
        let message = `*Solicitud de Información para Instructor*\n\n`;
        message += `*Nombre del Aspirante:* ${values.name}\n`;
        message += `*Teléfono de Contacto:* ${values.phone}\n`;
        message += `*Dirección:* ${values.address}\n\n`;
        message += `¡Gracias!`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');

        toast({
            title: '¡Solicitud Lista para Enviar!',
            description: `Se abrirá WhatsApp para que puedas enviar tu información.`,
        });
        
        setSubmitted(true);
        form.reset();
    }
  
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button asChild variant="outline">
            <a href="https://www.autoescuelaamericana.com" target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 h-4 w-4" />
              www.autoescuelaamericana.com
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos y Condiciones
            </Link>
          </Button>
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Únete a Nuestro Equipo
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Si eres un instructor de manejo apasionado y con ganas de enseñar, nos encantaría conocerte.
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
                  <CardTitle>Información para Aspirantes a Instructor</CardTitle>
                  <CardDescription>
                    Completa el siguiente formulario para que podamos contactarte. La información se enviará por WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Nombre Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder="Tu nombre completo" {...field} className="pl-10" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Teléfono de Contacto</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder="Tu número de WhatsApp" {...field} className="pl-10" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Dirección</Label>
                        <div className="relative">
                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input placeholder="Tu dirección completa" {...field} className="pl-10" />
                            </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Información
                  </Button>
                </CardFooter>
              </form>
            </Form>
          ) : (
            <CardContent className="pt-6 text-center">
              <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-xl font-bold text-green-700 dark:text-green-300">
                      ¡Información Enviada!
                  </AlertTitle>
                  <AlertDescription className="text-foreground mt-2">
                     Gracias por tu interés. Se abrirá WhatsApp para que completes el envío. Nos pondremos en contacto contigo pronto.
                  </AlertDescription>
              </Alert>
               <Button onClick={() => setSubmitted(false)} className="mt-6">
                  Enviar otra solicitud
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
