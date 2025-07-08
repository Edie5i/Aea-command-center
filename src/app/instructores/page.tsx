'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, Phone, Home, Send, CheckCircle, Globe, Briefcase, HeartHandshake, Check } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AppFooter } from '@/components/footer';

const instructorSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  address: z.string().min(10, { message: 'Por favor, ingresa una dirección más detallada.' }),
  interviewTime: z.string({ required_error: 'Por favor, selecciona un horario para la entrevista.' }),
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
            interviewTime: '',
        }
    });

    function onSubmit(values: InstructorFormValues) {
        const whatsAppNumber = "525634433212"; // Admin number
        
        let message = `*Solicitud de Entrevista para Instructor*\n\n`;
        message += `*Nombre del Aspirante:* ${values.name}\n`;
        message += `*Teléfono de Contacto:* ${values.phone}\n`;
        message += `*Dirección:* ${values.address}\n`;
        message += `*Horario Solicitado para Entrevista:* ${values.interviewTime} hrs\n\n`;
        message += `¡Gracias!`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');

        toast({
            title: '¡Solicitud Lista para Enviar!',
            description: `Se abrirá WhatsApp para que puedas enviar tu solicitud de entrevista.`,
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
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          ¡Conviértete en Instructor de Manejo en CDMX!
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          ¿Eres un conductor con experiencia y te apasiona la seguridad vial? En Auto Escuela Americana te formamos como instructor certificado, ¡no importa si no tienes experiencia enseñando!
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-left">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase className="text-primary"/>Te Ofrecemos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span><span className="font-semibold">Formación completa</span> y profesional.</span></div>
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span>Oportunidades de <span className="font-semibold">desarrollo</span>.</span></div>
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span><span className="font-semibold">Horarios flexibles</span>.</span></div>
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span><span className="font-semibold">Ingresos atractivos</span> y contribución a la seguridad vial.</span></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HeartHandshake className="text-primary"/>Buscamos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span>Licencia de conducir vigente.</span></div>
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span>Amplio conocimiento del <span className="font-semibold">Reglamento de Tránsito CDMX</span>.</span></div>
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span>Paciencia, responsabilidad y buena comunicación.</span></div>
                    <div className="flex items-start gap-3"><Check className="text-green-500 mt-1 h-5 w-5 shrink-0" /><span>¡Ganas de enseñar y formar conductores seguros!</span></div>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos y Condiciones
            </Link>
          </Button>
        </div>
        
        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          {!submitted ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Invierte en tu Futuro: Solicita una Entrevista</CardTitle>
                  <CardDescription>
                    Completa tus datos y selecciona un horario. Un miembro de nuestro equipo te contactará para agendar tu entrevista.
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
                  <FormField
                    control={form.control}
                    name="interviewTime"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <Label>Horario Preferido para Entrevista</Label>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-wrap gap-x-6 gap-y-2"
                          >
                            {['10:00', '12:00', '14:00', '16:00', '18:00'].map(time => (
                              <FormItem key={time} className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={time} id={`time-${time}`} />
                                </FormControl>
                                <Label htmlFor={`time-${time}`} className="font-normal cursor-pointer">{time} hrs</Label>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    Solicitar Entrevista
                  </Button>
                </CardFooter>
              </form>
            </Form>
          ) : (
            <CardContent className="pt-6 text-center">
              <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-xl font-bold text-green-700 dark:text-green-300">
                      ¡Solicitud Enviada!
                  </AlertTitle>
                  <AlertDescription className="text-foreground mt-2">
                     Gracias por tu interés. Se abrirá WhatsApp para que completes el envío de tu solicitud de entrevista.
                  </AlertDescription>
              </Alert>
               <Button onClick={() => setSubmitted(false)} className="mt-6">
                  Enviar otra solicitud
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      <AppFooter />
    </main>
  );
}
