'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, User, MessageSquare, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  alcaldia: z.string({ required_error: 'Por favor, selecciona tu alcaldía.' }),
});

const alcaldias = [
  "Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán", 
  "Cuajimalpa de Morelos", "Cuauhtémoc", "Gustavo A. Madero", 
  "Iztacalco", "Iztapalapa", "La Magdalena Contreras", "Miguel Hidalgo",
  "Milpa Alta", "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco"
];

export function ContactForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      alcaldia: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const whatsAppNumber = "525634433212";
    
    const message = `¡Hola! Me gustaría más información sobre los cursos de manejo.
*Nombre:* ${values.name}
*Teléfono:* ${values.phone}
*Alcaldía:* ${values.alcaldia}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: '¡Listo para enviar!',
      description: `Se abrirá WhatsApp para que puedas enviar tu solicitud de información.`,
    });
    
    form.reset();
  }

  return (
    <Card id="contact-form" className="w-full max-w-3xl shadow-lg rounded-xl mt-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Solicita Más Información
            </CardTitle>
            <CardDescription>
                Completa el formulario y un asesor te contactará por WhatsApp para brindarte toda la información que necesites.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre</FormLabel>
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
                        <FormLabel>Teléfono</FormLabel>
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
                </div>
                 <FormField
                    control={form.control}
                    name="alcaldia"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Alcaldía</FormLabel>
                             <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger className="pl-10">
                                        <SelectValue placeholder="Selecciona tu alcaldía" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {alcaldias.map((alcaldia) => (
                                        <SelectItem key={alcaldia} value={alcaldia}>{alcaldia}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                <Button type="submit">
                    Enviar por WhatsApp
                </Button>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
