
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
import { AppFooter } from '@/components/footer';

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
    
    let message = `🚨 *Solicitud de Cancelación y Devolución* 🚨\n\n`;
    message += `*Nombre del Alumno:* ${values.studentName}\n`;
    message += `*Motivo de la Solicitud:*\n${values.reason}\n\n`;
    message += `*Datos Bancarios para Devolución:*\n`;
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
            <a href="https://mi-proyecto-de-prueba-12345.web.app" target="_blank" rel="noopener noreferrer">
              <Globe className="mr-2 h-4 w-4" />
              mi-proyecto-de-prueba-12345.web.app
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
              Inicio
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
              <h3 className="font-semibold text-foreground">1. Reserva del curso</h3>
              <p>
                Para reservar el curso, el alumno deberá realizar un anticipo mínimo del 20% del valor total. El curso debe de ser reservado 48 horas al menos antes para guardar los espacios en el slot de la agenda por motivos de espacio entre los demás cursos.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">2. Pago total del curso</h3>
              <p>
                El pago total deberá liquidarse al finalizar la primera clase. Si no se realiza dicho pago, se considerará que el alumno no desea continuar con el curso y se perderá el anticipo.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">3. Cambios de horario y transmisión</h3>
              <p>
                El horario previamente acordado con la Escuela, la transmisión y el domicilio, no podrán ser modificados por parte del alumno, salvo en casos de fuerza mayor debidamente justificados. En caso de un cambio sin justificación, se aplicará una penalización de $700 MXN o se contará la clase como impartida (clase por vista).
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">4. Acuerdos adicionales con el instructor</h3>
              <p>
                Autoescuela Americana no se hace responsable por acuerdos entre instructor y alumno en temas de horarios, lugares de encuentro, rutas, traslados, etc. El alumno acepta que solo los acuerdos comunicados por escrito al instructor y confirmados por la Escuela tendrán validez.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">5. Conducta durante las clases</h3>
              <p>
                Está estrictamente prohibido tomar la clase bajo el influjo de alcohol, drogas o cualquier sustancia que altere la conciencia o reflejos. En caso de sospecha, el instructor podrá suspender la clase sin derecho a reembolso.
              </p>
            </div>
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">6. Servicio a domicilio</h3>
              <p>
                El servicio a domicilio solo aplica en las áreas de cobertura de la Escuela. Se tomarán en cuenta factores como: la distancia, condiciones de enseñanza y seguridad de la zona, entre otros. El servicio a domicilio solo cubre el descrito en la confirmación, cualquier otra ruta debe cotizarse por separado, solicitándolo con su asesor. No estarán permitidos los traslados. Las clases deberán empezar y terminar en el mismo lugar.
              </p>
            </div>
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">7. Modificaciones por parte de la Escuela</h3>
              <p>
                Autoescuela Americana puede modificar horarios por rutas, contingencias, tráfico y cierres viales, comunicándoselo al alumno. Los mismos no generan cargo para el alumno y la Escuela se compromete a buscar espacios para la reposición del tiempo perdido.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">8. Reporte de Anomalías</h3>
              <p>
                El Alumno deberá reportar de inmediato cualquier anomalía con el horario o con el instructor a Autoescuela Americana. En caso contrario Autoescuela Americana no se hace responsable si no se da aviso de inmediato.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">9. Asignación de Instructor</h3>
              <p>
                Autoescuela Americana asigna a sus instructores de acuerdo a sus zona. La Escuela se reserva el derecho al cambio de instructor. Esto no afecta el plan de trabajo y/o la continuidad de sus clases.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">10. Puntualidad</h3>
              <p>
                El instructor puede esperar un máximo de quince (15) minutos al alumno, dicho tiempo será tomado a cuenta de clase. En caso de no presentarse en este tiempo la clase se dará por vista.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">11. Política de cancelación y devoluciones</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>El alumno podrá solicitar la devolución de pagos solo si han transcurrido al menos 30 días naturales desde la fecha de pago.</li>
                  <li>Para ello, deberá llenar un formulario de cancelación, exponer los motivos y enviarlo por correo electrónico.</li>
                  <li>La solicitud será evaluada en un plazo máximo de 10 días hábiles y, si procede, se efectuará la devolución correspondiente menos el anticipo, que no es reembolsable.</li>
                  <li>No se harán devoluciones si el alumno ya ha tomado más del 30% del curso o si incumple con cualquiera de los términos establecidos en este documento.</li>
                </ul>
            </div>
          </CardContent>

          <Accordion type="single" collapsible className="w-full px-6 pb-4">
             <AccordionItem value="reembolso" className="border-t pt-4">
                <AccordionTrigger className="hover:no-underline font-semibold text-base">
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                        <Banknote className="h-5 w-5" />
                        <span>Solicitud de Cancelación y Devolución</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                    {!submitted ? (
                        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardDescription className="mb-6 text-sm">
                                De acuerdo con la cláusula 11, puedes iniciar tu solicitud de cancelación llenando este formulario. La solicitud será evaluada por un administrador. Recuerda que el anticipo no es reembolsable.
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
                                    <Textarea placeholder="Describe detalladamente por qué solicitas la cancelación..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="space-y-2">
                                <Label className="font-semibold">Datos Bancarios para Devolución (si aplica)</Label>
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
                                Enviar por WhatsApp
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
                            Hacer Otra Solicitud
                        </Button>
                        </div>
                    )}
                </AccordionContent>
             </AccordionItem>
          </Accordion>

        </Card>
      </div>

      <AppFooter />
    </main>
  );
}
