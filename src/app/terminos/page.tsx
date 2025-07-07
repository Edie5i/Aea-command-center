
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Banknote, Landmark, User, MessageSquare, Send, CheckCircle, Globe } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const refundSchema = z.object({
  studentName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  reason: z.string().min(10, { message: 'Por favor, detalla el motivo de tu solicitud (mínimo 10 caracteres).' }),
  bankName: z.string().min(2, { message: 'Por favor, ingresa el nombre del banco.' }),
  accountHolder: z.string().min(2, { message: 'Por favor, ingresa el nombre del titular de la cuenta.' }),
  clabe: z.string().length(18, { message: 'La CLABE debe tener 18 dígitos.' }).regex(/^\d+$/, { message: 'La CLABE solo debe contener números.' }),
});

type RefundFormValues = z.infer<typeof refundSchema>;


export default function TerminosPage() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      studentName: '',
      reason: '',
      bankName: '',
      accountHolder: '',
      clabe: '',
    }
  });

  function onSubmit(values: RefundFormValues) {
    const whatsAppNumber = "525634433212";
    
    let message = `🚨 *Solicitud de Reembolso* 🚨\n\n`;
    message += `*Nombre del Alumno:* ${values.studentName}\n`;
    message += `*Motivo de la Solicitud:*\n${values.reason}\n\n`;
    message += `*Datos Bancarios para Reembolso:*\n`;
    message += `*Banco:* ${values.bankName}\n`;
    message += `*Titular de la Cuenta:* ${values.accountHolder}\n`;
    message += `*CLABE Interbancaria:* ${values.clabe}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: '¡Solicitud Lista para Enviar!',
      description: `Se abrirá WhatsApp para que puedas enviar tu solicitud.`,
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
          Términos y Condiciones
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Detalles del acuerdo de servicio entre la autoescuela y los alumnos.
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
          <CardHeader>
            <CardTitle>Términos de Contratación</CardTitle>
            <CardDescription>
              Válido a partir del 1 de Julio de 2024.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">1. Objeto del Contrato</h3>
              <p>
                AEA se compromete a impartir un curso de manejo práctico y teórico al alumno, de acuerdo al paquete contratado. El objetivo es proporcionar las herramientas y conocimientos necesarios para una conducción segura y responsable.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">2. Requisitos del Alumno</h3>
              <p>
                El alumno debe ser mayor de 16 años. Para menores de edad, se requiere autorización por escrito de un padre o tutor. Es responsabilidad del alumno presentar cualquier documentación requerida, como identificación oficial o permiso de conducir provisional si aplica.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">3. Pagos y Vigencia</h3>
              <p>
                El pago del curso debe realizarse en su totalidad antes de la primera clase programada. Los paquetes de cursos tienen una vigencia de 3 meses a partir de la fecha de pago para ser completados. No hay reembolsos por cursos no tomados o cancelaciones fuera del plazo estipulado.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">4. Programación y Cancelación de Clases</h3>
              <p>
                Las clases deben ser agendadas según la disponibilidad de la escuela y los instructores. Se requiere un aviso de al menos 24 horas de anticipación para cancelar o reprogramar una clase. Las cancelaciones con menos de 24 horas de antelación o la inasistencia resultarán en la pérdida de dicha clase sin derecho a reposición o reembolso.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">5. Responsabilidades</h3>
              <p>
                La escuela proporcionará un vehículo en buen estado y un instructor certificado. El alumno se compromete a seguir todas las indicaciones del instructor y a no presentarse a las clases bajo la influencia de alcohol o sustancias que alteren su capacidad de conducción. Cualquier daño al vehículo causado por negligencia del alumno será su responsabilidad.
              </p>
            </div>
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">6. Aceptación de Términos</h3>
              <p>
                Al realizar el pago y agendar la primera clase, el alumno y/o su tutor aceptan en su totalidad los términos y condiciones aquí descritos.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">7. Confidencialidad y Protección de Datos</h3>
              <p>
                Los datos personales proporcionados por el alumno (nombre, teléfono, domicilio) así como los datos del instructor asignado, son estrictamente confidenciales. AEA se compromete a no compartir, vender o divulgar esta información a terceros bajo ninguna circunstancia, salvo requerimiento legal. Los datos se utilizan únicamente para la coordinación y logística del curso contratado.
              </p>
            </div>
          </CardContent>

          <Accordion type="single" collapsible className="w-full px-6 pb-4">
             <AccordionItem value="reembolso" className="border-t pt-4">
                <AccordionTrigger className="hover:no-underline font-semibold text-base">
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <Banknote className="h-5 w-5" />
                        <span>¿Necesitas solicitar un reembolso?</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                    {!submitted ? (
                        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardDescription className="mb-6 text-sm">
                                De acuerdo con la cláusula 3 y 4 de los términos, puedes solicitar un reembolso aquí. Tu solicitud será revisada por un administrador.
                            </CardDescription>
                            <div className="space-y-6">
                            <FormField
                                control={form.control}
                                name="studentName"
                                render={({ field }) => (
                                <FormItem>
                                    <Label>Nombre del Alumno</Label>
                                    <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="Nombre completo del alumno" {...field} className="pl-10" />
                                    </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                <FormItem>
                                    <Label>Motivo de la Solicitud</Label>
                                    <FormControl>
                                    <Textarea placeholder="Describe detalladamente por qué solicitas el reembolso..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="space-y-2">
                                <Label className="font-semibold">Datos Bancarios para Transferencia</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="bankName"
                                        render={({ field }) => (
                                        <FormItem>
                                            <Label>Banco</Label>
                                            <div className="relative">
                                                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input placeholder="Ej. BBVA, Santander" {...field} className="pl-10" />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="accountHolder"
                                        render={({ field }) => (
                                        <FormItem>
                                            <Label>Nombre del Titular</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <FormControl>
                                                    <Input placeholder="Nombre completo" {...field} className="pl-10" />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="clabe"
                                render={({ field }) => (
                                <FormItem>
                                    <Label>CLABE Interbancaria (18 dígitos)</Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input placeholder="012345678901234567" {...field} className="pl-10" />
                                        </FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>
                            <div className="flex justify-end pt-6">
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar Solicitud por WhatsApp
                            </Button>
                            </div>
                        </form>
                        </Form>
                    ) : (
                        <div className="text-center">
                        <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <AlertTitle className="text-xl font-bold text-green-700 dark:text-green-300">
                                ¡Solicitud Enviada!
                            </AlertTitle>
                            <AlertDescription className="text-foreground mt-2">
                                Se abrirá WhatsApp para que completes el envío. Tu solicitud será procesada lo antes posible.
                            </AlertDescription>
                        </Alert>
                        <Button onClick={() => setSubmitted(false)} className="mt-6">
                            Realizar otra solicitud
                        </Button>
                        </div>
                    )}
                </AccordionContent>
             </AccordionItem>
          </Accordion>

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
