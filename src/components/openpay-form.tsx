
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, CheckCircle, User, Phone, Mail, Bank, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const banks = [
  "BBVA",
  "Santander",
  "Citibanamex",
  "Banorte",
  "HSBC",
  "Scotiabank",
  "American Express",
  "Otro",
];

const openpaySchema = z.object({
  cardholderName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo electrónico válido.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  bankName: z.string({ required_error: 'Por favor, selecciona tu banco.' }),
  paymentOption: z.string({ required_error: 'Debes seleccionar una opción de pago.' }),
});

type OpenpayFormValues = z.infer<typeof openpaySchema>;

export function OpenpayForm() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const form = useForm<OpenpayFormValues>({
    resolver: zodResolver(openpaySchema),
  });

  function onSubmit(values: OpenpayFormValues) {
    const whatsAppNumber = "525634433212"; // Admin number

    let message = `*Solicitud de Enlace de Pago Openpay*\n\n`;
    message += `*Nombre del Titular:* ${values.cardholderName}\n`;
    message += `*Correo Electrónico:* ${values.email}\n`;
    message += `*Teléfono:* ${values.phone}\n`;
    message += `*Banco Emisor:* ${values.bankName}\n`;
    message += `*Opción de Pago Solicitada:* ${values.paymentOption}\n\n`;
    message += `Por favor, generar y enviar el enlace de pago a la dirección de correo proporcionada.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: '¡Solicitud Lista para Enviar!',
      description: `Se abrirá WhatsApp para que puedas enviar tu solicitud de pago.`,
    });

    setSubmitted(true);
    form.reset();
  }

  return (
    <Card className="w-full max-w-3xl shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Solicitar Enlace de Pago Openpay
        </CardTitle>
        <CardDescription>
          Llena este formulario para que un asesor te envíe un enlace de pago seguro a tu correo electrónico.
        </CardDescription>
      </CardHeader>
      {submitted ? (
        <CardContent className="text-center pt-6">
            <Alert variant="default" className="bg-green-100 dark:bg-green-900/30 border-green-500">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-xl font-bold text-green-700 dark:text-green-300">
                    ¡Solicitud Enviada!
                </AlertTitle>
                <AlertDescription className="text-foreground mt-2">
                    Gracias por tu solicitud. Revisa tu correo electrónico en los próximos minutos, te enviaremos el enlace para completar tu pago.
                </AlertDescription>
            </Alert>
            <Button onClick={() => setSubmitted(false)} className="mt-6">
                Hacer Otra Solicitud
            </Button>
        </CardContent>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="cardholderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Titular de la Tarjeta</FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Nombre completo como aparece en la tarjeta" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="donde-recibirás-el-enlace@email.com" {...field} className="pl-10" />
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
                        <FormLabel>Número de Teléfono</FormLabel>
                        <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="Tu número de contacto" {...field} className="pl-10" />
                        </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

               <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Banco Emisor de la Tarjeta</FormLabel>
                             <div className="relative">
                                <Bank className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="pl-10">
                                        <SelectValue placeholder="Selecciona tu banco" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {banks.map((bank) => (
                                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                  />

                <FormField
                    control={form.control}
                    name="paymentOption"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Opción de Pago</FormLabel>
                        <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row gap-4 pt-2">
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="Una sola exhibición" id="pago-unico" /></FormControl>
                                <Label htmlFor="pago-unico" className="font-normal cursor-pointer">Una sola exhibición</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="3 Meses Sin Intereses" id="pago-3msi" /></FormControl>
                                <Label htmlFor="pago-3msi" className="font-normal cursor-pointer">3 Meses Sin Intereses</Label>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="6 Meses Sin Intereses" id="pago-6msi" /></FormControl>
                                <Label htmlFor="pago-6msi" className="font-normal cursor-pointer">6 Meses Sin Intereses</Label>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <Alert variant="default" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-semibold">Promociones Disponibles</AlertTitle>
                  <AlertDescription>
                    Los Meses Sin Intereses (MSI) están disponibles exclusivamente para tarjetas de crédito <strong>BBVA</strong> y <strong>American Express</strong>.
                  </AlertDescription>
                </Alert>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                Solicitar Enlace de Pago
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  );
}
