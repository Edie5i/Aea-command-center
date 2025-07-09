
'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Phone, User, Clock, Home, MapPin, MessageSquare, StickyNote, Download, FileText } from 'lucide-react';
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
import { useEffect, useState, useRef } from 'react';
import { useLoadScript, Autocomplete, GoogleMap, MarkerF } from '@react-google-maps/api';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  phone: z.string().min(8, { message: 'Por favor, introduce un número de teléfono válido.' }),
  schedule: z.record(z.array(z.string()))
    .refine(
      (schedule) => Object.values(schedule).every((times) => times.length > 0),
      { message: 'Debes seleccionar al menos un horario para cada fecha.' }
    ),
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

const libraries: "places"[] = ['places'];

export function ScheduleForm({ selectedDates, onCourseScheduled }: ScheduleFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      schedule: {},
      terms: false,
      address: '',
      suggestedMeetingPoint: '',
      observaciones: '',
      nota: '',
      requiereConstancia: false,
    },
  });
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });
  
  const [mapCenter, setMapCenter] = useState({ lat: 19.4326, lng: -99.1332 });
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      const address = place.formatted_address || '';
      form.setValue('address', address, { shouldValidate: true });
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newPos = { lat, lng };
        setMapCenter(newPos);
        setMarkerPosition(newPos);
      }
    }
  };

  const addressValue = form.watch('address');
  useEffect(() => {
    if (!addressValue) {
        setMarkerPosition(null);
    }
  }, [addressValue]);


  useEffect(() => {
    const newSchedule = selectedDates.reduce((acc, date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        acc[dateString] = form.getValues(`schedule.${dateString}`) || [];
        return acc;
    }, {} as Record<string, string[]>);
    
    form.setValue('schedule', newSchedule, { shouldValidate: true });
}, [selectedDates, form]);

  const meetingPoint = form.watch('meetingPoint');
  const requiereConstancia = form.watch('requiereConstancia');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const whatsAppNumber = "525634433212";

    // Schedule formatting for WhatsApp
    const scheduleDetailsWhatsApp = Object.entries(values.schedule).map(([dateStr, times]) => {
      const date = new Date(dateStr + 'T12:00:00Z');
      const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });
      const formattedTimes = times.sort().map(time => {
          const [hourStr, minuteStr] = time.split(':');
          let hour = parseInt(hourStr, 10);
          const ampm = hour >= 12 ? 'pm' : 'am';
          hour = hour % 12;
          hour = hour ? hour : 12; // The hour '0' should be '12'
          return `${hour}:${minuteStr} ${ampm}`;
      }).join(', ');
      return `- *${formattedDate}:* ${formattedTimes}`;
    }).join('\n');
    
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
    message += `*FECHAS Y HORARIOS:*\n${scheduleDetailsWhatsApp}\n\n`;
    message += `- *Transmisión:* ${values.transmission}\n`;
    message += `- *Punto de Encuentro:* ${puntoDeEncuentroMsg}\n\n`;

    if (values.requiereConstancia) {
      message += `*TRÁMITE SEMOVI:* Sí, requiero constancia. (Se adjuntará CURP en PDF por WhatsApp)\n\n`;
    }

    if (values.observaciones?.trim()) {
        message += `*OBSERVACIONES:*\n${values.observaciones}\n\n`;
    }
    if(values.nota?.trim()){
        message += `*NOTA:*\n${values.nota}`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    // PDF Generation
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 0;

    const primaryColor = '#1D4ED8'; // Darker Blue
    const secondaryColor = '#374151'; // Dark Gray
    const lightGrayColor = '#F3F4F6'; // Background Gray
    const whiteColor = '#FFFFFF';
    const textColor = '#1F2937';
    
    // --- Header ---
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(whiteColor);
    doc.text('FICHA DE INSCRIPCIÓN', pageWidth / 2, 20, { align: 'center' });
    y = 45;

    // --- Helper for drawing a section ---
    const drawSection = (title: string, content: { label: string; value: string; link?: string }[]) => {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      // Section Title Background
      doc.setFillColor(lightGrayColor);
      doc.setDrawColor(lightGrayColor);
      doc.rect(15, y - 5, pageWidth - 30, 10, 'FD');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text(title, 20, y + 2);
      y += 15;

      content.forEach(item => {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(secondaryColor);
        doc.text(item.label, 20, y);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        const valueLines = doc.splitTextToSize(item.value, pageWidth - 95);

        if (item.link) {
          doc.setTextColor('#0000EE'); // Standard link blue
          doc.textWithLink(valueLines[0], 75, y, { url: item.link });
          doc.setTextColor(textColor); // Reset color
          if (valueLines.length > 1) {
            // Draw remaining lines without link
            doc.text(valueLines.slice(1), 75, y + 6);
          }
        } else {
          doc.setTextColor(textColor);
          doc.text(valueLines, 75, y);
        }

        y += (valueLines.length * 6) + 6;
      });
      y += 5;
    };
    
    // --- Alumno & Curso Section ---
    const puntoDeEncuentroItem: { label: string; value: string; link?: string } = {
        label: 'Punto de Encuentro:',
        value: values.meetingPoint || '',
    };

    if (values.meetingPoint === 'Punto de encuentro' && values.suggestedMeetingPoint) {
        puntoDeEncuentroItem.value = `Punto de encuentro (Sugerencia: ${values.suggestedMeetingPoint})`;
    } else if (values.meetingPoint === 'Domicilio del alumno' && values.address) {
        puntoDeEncuentroItem.label = 'Domicilio (clic para ver mapa):';
        puntoDeEncuentroItem.value = values.address;
        puntoDeEncuentroItem.link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(values.address)}`;
    }

    drawSection('DATOS DEL ALUMNO', [
        { label: 'Nombre Completo:', value: values.name },
        { label: 'Número de Teléfono:', value: values.phone },
    ]);

    drawSection('DETALLES DEL CURSO', [
        { label: 'Tipo de Transmisión:', value: values.transmission },
        puntoDeEncuentroItem,
    ]);
    
    // --- Schedule Section ---
    if (y > pageHeight - 80) {
        doc.addPage();
        y = 20;
    }
    doc.setFillColor(lightGrayColor);
    doc.setDrawColor(lightGrayColor);
    doc.rect(15, y - 5, pageWidth - 30, 10, 'FD');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('FECHAS Y HORARIOS SOLICITADOS', 20, y + 2);
    y += 15;
    
    Object.entries(values.schedule).forEach(([dateStr, times]) => {
      const date = new Date(dateStr + 'T12:00:00Z');
      const formattedDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
      const formattedTimes = times.sort().join(', ');

       if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
       }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor);
      doc.text(formattedDate, 20, y);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      doc.text(formattedTimes, 20, y + 7);
      y += 15;
    });
    y += 5;

    // --- Optional Sections ---
    if (values.requiereConstancia) {
        drawSection('TRÁMITE ADICIONAL', [
            { label: 'Solicitud SEMOVI:', value: 'Sí, se requiere constancia para permiso de conducir.'},
        ]);
    }
    if (values.observaciones?.trim()) {
        drawSection('OBSERVACIONES GENERALES', [{ label: '', value: values.observaciones }]);
    }
    if (values.nota?.trim()) {
        drawSection('NOTA PARA INSTRUCTOR', [{ label: '', value: values.nota }]);
    }
    
    // --- Footer ---
    doc.setFillColor(primaryColor);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setFontSize(9);
    doc.setTextColor(whiteColor);
    doc.text(`Ficha generada el ${format(new Date(), "d/MM/yyyy")}. Sujeto a confirmación. | www.autoescuelaamericana.com`,
      pageWidth / 2, pageHeight - 8, { align: 'center' });

    doc.save(`Ficha_Inscripcion_${values.name.replace(/\s/g, '_')}.pdf`);

    // --- User Feedback ---
    toast({
      title: '¡Ficha Generada!',
      description: 'Se abrirá WhatsApp y se descargará la ficha en formato PDF.',
    });
    
    onCourseScheduled();
    form.reset();
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
        
        <div className="space-y-4">
            <FormLabel>Horarios Disponibles</FormLabel>
            <FormDescription>
                Selecciona uno o varios horarios para cada día de tu curso.
            </FormDescription>
            {selectedDates.map(date => {
                const dateString = format(date, 'yyyy-MM-dd');
                return (
                    <div key={dateString} className="rounded-md border p-4 space-y-2">
                        <h4 className="font-semibold text-foreground">{format(date, "EEEE, d 'de' MMMM", { locale: es })}</h4>
                        <FormField
                            control={form.control}
                            name={`schedule.${dateString}`}
                            render={() => (
                                <FormItem>
                                     <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-2">
                                        {availableTimes.map(time => (
                                            <FormField
                                                key={time}
                                                control={form.control}
                                                name={`schedule.${dateString}`}
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(time)}
                                                                onCheckedChange={checked => {
                                                                    const currentValues = field.value || [];
                                                                    return checked
                                                                        ? field.onChange([...currentValues, time])
                                                                        : field.onChange(currentValues.filter(value => value !== time));
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">{time}</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )
            })}
             <FormField
                control={form.control}
                name="schedule"
                render={() => (
                    <FormItem>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>


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
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domicilio del Alumno</FormLabel>
                  <FormDescription>
                    Empieza a escribir y selecciona tu dirección de la lista.
                  </FormDescription>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <FormControl>
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={onLoad}
                          onPlaceChanged={onPlaceChanged}
                          options={{
                            types: ['address'],
                            componentRestrictions: { country: 'mx' },
                            bounds: {
                              north: 19.59,
                              south: 19.16,
                              east: -98.94,
                              west: -99.36,
                            },
                            strictBounds: false,
                          }}
                        >
                          <Input placeholder="Calle, número, colonia, C.P." {...field} value={field.value ?? ''} className="pl-10" />
                        </Autocomplete>
                      ) : (
                        <Input placeholder="Cargando autocompletado..." {...field} value={field.value ?? ''} className="pl-10" disabled />
                      )}
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isLoaded && markerPosition && (
              <div>
                <Label>Verifica la ubicación en el mapa</Label>
                <div className="mt-2 h-64 w-full rounded-md overflow-hidden border">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={17}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                  >
                    <MarkerF position={markerPosition} />
                  </GoogleMap>
                </div>
              </div>
            )}
          </div>
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
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
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
