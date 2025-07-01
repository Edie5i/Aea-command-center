
'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Phone, User, Clock, Home, MapPin, MessageSquare, StickyNote, Download, FileText } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  time: z.string({ required_error: 'Debes seleccionar un horario.' }),
  transmission: z.string({ required_error: 'Debes seleccionar el tipo de transmisión.' }),
  meetingPoint: z.string({ required_error: 'Debes seleccionar un punto de encuentro.' }),
  address: z.string().optional(),
  suggestedMeetingPoint: z.string().optional(),
  observaciones: z.string().optional(),
  nota: z.string().optional(),
  requiereConstancia: z.boolean().optional(),
  terms: z.boolean().refine((value) => value === true, {
    message: 'Debes aceptar los términos y condiciones.',
  }),
}).refine(data => {
    if (data.meetingPoint === 'Domicilio del alumno' && (!data.address || data.address.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'La dirección es requerida para esta opción.',
    path: ['address'],
}).refine(data => {
    if (data.meetingPoint === 'Punto de encuentro' && (!data.suggestedMeetingPoint || data.suggestedMeetingPoint.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'Por favor, sugiere un punto de encuentro (ej. Metro Chilpancingo).',
    path: ['suggestedMeetingPoint'],
});


type ScheduleFormProps = {
  selectedDates: Date[];
  onCourseScheduled: () => void;
};

// Hardcoded available time slots for demonstration
const availableTimes = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
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
      address: '',
      suggestedMeetingPoint: '',
      observaciones: '',
      nota: '',
      requiereConstancia: false,
    },
  });

  const meetingPoint = form.watch('meetingPoint');
  const requiereConstancia = form.watch('requiereConstancia');

  function onSubmit(values: z.infer<typeof formSchema>) {
    const whatsAppNumber = "525634433212";

    // Date formatting
    const dateStrings = selectedDates.map(date => format(date, "d 'de' MMMM", { locale: es }));
    const year = selectedDates.length > 0 ? format(selectedDates[0], 'yyyy') : '';
    const finalDateString = selectedDates.length > 0 ? `${dateStrings.join(', ')} de ${year}` : "Fechas no seleccionadas";
    
    // Time formatting
    const [hourStr, minuteStr] = values.time.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    hour = hour % 12;
    hour = hour ? hour : 12; // The hour '0' should be '12'
    const formattedTime = `${hour}:${minuteStr} ${ampm}`;

    // Meeting point formatting
    let puntoDeEncuentroMsg = values.meetingPoint;
    if (values.meetingPoint === 'Punto de encuentro' && values.suggestedMeetingPoint) {
      puntoDeEncuentroMsg = `Punto de encuentro (sugerencia: ${values.suggestedMeetingPoint})`;
    } else if (values.meetingPoint === 'Domicilio del alumno' && values.address) {
      puntoDeEncuentroMsg = `Domicilio del alumno: ${values.address}`;
    }
    
    // Message construction for WhatsApp
    let message = `*FICHA DE INSCRIPCIÓN*\n`;
    message += `*Auto Escuela Americana*\n\n`;
    message += `*CURSO:* Manejo de Vehículos\n\n`;
    message += `*DATOS DEL ALUMNO*\n\n`;
    message += `- *Nombre:* ${values.name}\n`;
    message += `- *Teléfono:* ${values.phone}\n\n`;
    message += `*DETALLES DEL CURSO*\n\n`;
    message += `- *Fechas:* ${finalDateString}\n`;
    message += `- *Hora:* ${formattedTime}\n`;
    message += `- *Transmisión:* ${values.transmission}\n`;
    message += `- *Punto de Encuentro:* ${puntoDeEncuentroMsg}\n\n`;

    if (values.requiereConstancia) {
      message += `*TRÁMITE SEMOVI:* Sí, requiero constancia. (Se adjuntará CURP en PDF por WhatsApp)\n\n`;
    }

    message += `*OBSERVACIONES:*\n${values.observaciones || '[Espacio para agregar observaciones o comentarios]'}\n\n`;
    message += `*NOTA:*\n${values.nota || '[Espacio para agregar notas importantes]'}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    // PDF Generation - Redesigned for a professional look
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 0;

    // --- Header ---
    const primaryColor = '#2563EB'; // approx. from hsl(221.2 83.2% 53.3%)
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#FFFFFF');
    doc.text('AEA', 20, 23);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(18);
    doc.text('Ficha de Inscripción', pageWidth / 2, 23, { align: 'center' });
    yPos = 50;

    // --- Helper function for sections ---
    const drawSection = (title: string, content: () => void) => {
        if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text(title, 15, yPos);
        yPos += 2;
        doc.setDrawColor('#DDDDDD');
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#333333');
        content();
        yPos += 8;
    };
    
    const drawKeyValuePair = (key: string, value: string) => {
        const keyWidth = doc.getTextWidth(key);
        const valueX = 20 + keyWidth + 5;
        const valueLines = doc.splitTextToSize(value, pageWidth - valueX - 20);
        
        if (yPos + (valueLines.length * 6) > pageHeight - 30) {
             doc.addPage();
             yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(key, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(valueLines, valueX, yPos);
        yPos += (valueLines.length * 5) + 4;
    };


    // --- Datos del Alumno ---
    drawSection('Datos del Alumno', () => {
        drawKeyValuePair('Nombre:', values.name);
        drawKeyValuePair('Teléfono:', values.phone);
    });

    // --- Detalles del Curso ---
    drawSection('Detalles del Curso', () => {
        drawKeyValuePair('Fechas:', finalDateString);
        drawKeyValuePair('Hora:', formattedTime);
        drawKeyValuePair('Transmisión:', values.transmission);
        
        let puntoDeEncuentroMsgFull = values.meetingPoint;
        if (values.meetingPoint === 'Punto de encuentro' && values.suggestedMeetingPoint) {
            puntoDeEncuentroMsgFull = `Punto de encuentro (Sugerencia: ${values.suggestedMeetingPoint})`;
        } else if (values.meetingPoint === 'Domicilio del alumno' && values.address) {
            puntoDeEncuentroMsgFull = `Domicilio del alumno: ${values.address}`;
        }
        drawKeyValuePair('Punto de Encuentro:', puntoDeEncuentroMsgFull);
    });
    
    // --- Trámite SEMOVI ---
    if (values.requiereConstancia) {
        drawSection('Trámite SEMOVI', () => {
            const text = '- Sí, se requiere constancia para permiso de conducir.\n- El alumno enviará su CURP en formato PDF por WhatsApp.';
            const lines = doc.splitTextToSize(text, pageWidth - 40);
            doc.text(lines, 20, yPos);
            yPos += (lines.length * 5) + 4;
        });
    }

    // --- Observaciones y Notas ---
    const hasObservaciones = values.observaciones && values.observaciones.trim() !== '';
    const hasNota = values.nota && values.nota.trim() !== '';

    if (hasObservaciones || hasNota) {
         drawSection('Información Adicional', () => {
            if (hasObservaciones) {
                drawKeyValuePair('Observaciones:', values.observaciones!);
            }
            if (hasNota) {
                drawKeyValuePair('Nota Adicional:', values.nota!);
            }
        });
    }
    
    // --- Footer ---
    const finalYPos = pageHeight - 25;
    doc.setDrawColor('#CCCCCC');
    doc.line(15, finalYPos, pageWidth - 15, finalYPos);
    
    doc.setFontSize(9);
    doc.setTextColor('#777777');
    doc.text('Auto Escuela Americana | www.autoescuelaamericana.com | WhatsApp: 52 56 3443 3212', pageWidth / 2, finalYPos + 8, { align: 'center' });


    doc.save(`Ficha-${values.name.replace(/\s/g, '_')}.pdf`);


    toast({
      title: '¡Ficha Generada!',
      description: `Se abrirá WhatsApp y se descargará la ficha en formato PDF.`,
    });
    
    onCourseScheduled();
    
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
          name="transmission"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Transmisión del Vehículo</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-row space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Automático" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Automático
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Estándar" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Estándar
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="meetingPoint"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Punto de Encuentro</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Sucursal" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Sucursal (Torreón #49, Roma Sur)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Punto de encuentro" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Punto de encuentro (a convenir)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Domicilio del alumno" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Domicilio del alumno
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {meetingPoint === 'Punto de encuentro' && (
          <FormField
            control={form.control}
            name="suggestedMeetingPoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Punto de Encuentro Sugerido</FormLabel>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input placeholder="ej. Metro Chilpancingo, Parque México" {...field} value={field.value ?? ''} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {meetingPoint === 'Domicilio del alumno' && (
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domicilio del Alumno</FormLabel>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input placeholder="Calle, número, colonia, C.P." {...field} value={field.value ?? ''} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
            control={form.control}
            name="observaciones"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Observaciones (Opcional)</FormLabel>
                <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Textarea
                        placeholder="Ej. El alumno es menor de edad y requiere constancia para el trámite de su permiso."
                        className="pl-10"
                        {...field}
                    />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="nota"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nota Adicional para el Instructor (Opcional)</FormLabel>
                <div className="relative">
                    <StickyNote className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Textarea
                        placeholder="Cualquier otra información importante que el instructor deba saber."
                        className="pl-10"
                        {...field}
                    />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="requiereConstancia"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Requiero constancia para trámite de permiso ante SEMOVI
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        {requiereConstancia && (
            <Alert variant="default" className="bg-primary/10 border-primary/50">
                <FileText className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">¡Importante!</AlertTitle>
                <AlertDescription className="text-foreground">
                Para completar tu solicitud de constancia, no olvides enviar tu <strong>CURP en formato PDF</strong> a nuestro chat de WhatsApp después de enviar esta ficha.
                </AlertDescription>
            </Alert>
        )}

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
            <Download className="mr-2 h-4 w-4" />
            Enviar y Descargar Ficha
          </Button>
        </div>
      </form>
    </Form>
  );
}

    
