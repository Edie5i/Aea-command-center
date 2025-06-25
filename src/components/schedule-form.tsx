'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Phone, User, Clock } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  time: z.string({ required_error: 'Debes seleccionar un horario.' }),
  terms: z.boolean().refine((value) => value === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
});

type ScheduleFormProps = {
  selectedDates: Date[];
  onCourseScheduled: (courseData: { name: string; phone: string; time: string; dates: Date[] }) => void;
};

// Hardcoded available time slots for demonstration
const availableTimes = [
  '07:00',
  '10:00',
  '13:00',
  '16:00',
  '19:00',
];

export function ScheduleForm({ selectedDates, onCourseScheduled }: ScheduleFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      terms: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const whatsAppNumber = "525634433212";
    const formattedDates = selectedDates.map(date => format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })).join('\n');
    
    const message = `¡Nueva solicitud de curso!
*Fechas:*
${formattedDates}
*Hora para cada día:* ${values.time}
*Alumno:* ${values.name}
*Teléfono:* ${values.phone}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: '¡Información Lista!',
      description: `Se abrirá WhatsApp para enviar los detalles del curso.`,
    });
    
    onCourseScheduled({
      name: values.name,
      phone: values.phone,
      time: values.time,
      dates: selectedDates,
    });
    
    form.reset(); // Reset form fields
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="ej. Ana Pérez" {...field} className="pl-10" />
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
                  <Input placeholder="ej. 55 1234 5678" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horario Disponible para cada día</FormLabel>
               <div className="relative">
                 <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Selecciona un horario" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
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
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Acepto los{' '}
                  <Link
                    href="/terminos"
                    target="_blank"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Términos y Condiciones
                  </Link>
                  .
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">
            <Calendar className="mr-2 h-4 w-4" />
            Confirmar Curso
          </Button>
        </div>
      </form>
    </Form>
  );
}
