
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CalendarPlus, CheckCircle, CheckCircle2, Phone, Clock, Calendar as CalendarIcon, CreditCard, ShoppingBag, UserCheck, MapPin, Settings2, Home, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { ScheduleForm } from '@/components/schedule-form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';


const programData = [
    {
        title: "1. Posición correcta al sentarse",
        content: [{
            points: [
                "Ajusta el retrovisor interior para ver toda la luneta.",
                "Imagina que el volante es un reloj: pon las manos a las 9:15 horas.",
                "Ajusta el reposacabezas hasta que esté a la altura de tus oídos u ojos.",
                "Recuerda que el interior se complementa con los retrovisores exteriores para tener una visión más amplia.",
                "Entre tu rodilla y el volante debe haber una distancia de un puño.",
                "Siéntate hasta atrás, que tus caderas lleguen a la parte trasera del asiento.",
                "Acerca el asiento de modo que tu pie llegue al acelerador.",
                "Pega la espalda al respaldo y estira tus brazos; las muñecas deben tocar la parte superior del volante."
            ]
        }]
    },
    {
        title: "2. Ajuste de espejos para eliminar puntos ciegos",
        content: [{
            points: [
                "El espejo retrovisor permite ver el área detrás del vehículo.",
                "El espejo izquierdo refleja ligeramente el borde derecho del auto y el carril de ese lado.",
                "El espejo derecho muestra la parte trasera del auto y una gran parte del carril.",
                "Para eliminar el punto ciego, se debe ajustar el espejo de tal manera que no se vea el propio vehículo.",
                "Los tres espejos del auto trabajan en conjunto: cuando un vehículo salga del espejo central, inmediatamente debe aparecer en el espejo lateral. Un ajuste tradicional donde el espejo lateral y el central muestran la misma parte del auto indica que están mal regulados."
            ]
        }]
    },
    {
        title: "3. Cambio de marchas (manual y automático)",
        content: [
            {
                heading: "Transmisión manual:",
                points: [
                    "1ª velocidad: Para poner el auto en marcha o estacionar en una pendiente.",
                    "2ª velocidad: Para cambiar a 20 km/h o para reducir velocidad.",
                    "3ª velocidad: Para cambiar a 40 km/h.",
                    "4ª velocidad: Para cambiar a 60 km/h.",
                    "5ª velocidad: Para cambiar a 80 km/h.",
                    "Neutro: Para estacionar o para detener el coche en un alto.",
                    "Reversa: Para dirigir el auto hacia atrás."
                ]
            },
            {
                heading: "Transmisión automática:",
                points: [
                    "P: Estacionar.",
                    "R: Reversa.",
                    "N: Neutro.",
                    "D: Avanzar."
                ]
            }
        ]
    },
    {
        title: "4. Distancia de frenado",
        content: [{
            points: [
                "Distancia de Frenado [C] = Distancia de Reacción [A] + Distancia de Frenado [B].",
                "A 50 km/h, la distancia de reacción es 14m, la distancia de frenado es 14m, y la distancia total de frenado es 28m.",
                "A 90 km/h, la distancia de reacción es 25m, la distancia de frenado es 45m, y la distancia total de frenado es 70m.",
                "A 120 km/h, la distancia de reacción es 33m, la distancia de frenado es 65m, y la distancia total de frenado es 98m."
            ]
        }]
    },
    {
        title: "5. Cómo estacionar en paralelo",
        content: [{
            points: [
                "Encuentra un espacio en el que quepa el coche.",
                "Colócate tan cerca del coche A como sea posible, y haz que el tuyo quede paralelo. Alinea la parte trasera de tu coche con la del coche A.",
                "Para y gira el volante a tope hacia la izquierda, no muevas el coche mientras lo haces.",
                "Date la vuelta y mira hacia atrás y comienza a dar marcha atrás hacia el coche B. No gires el volante de su posición completamente a la izquierda.",
                "Para de dar marcha atrás cuando la esquina frontal derecha del coche B esté justo en el medio de tu retrovisor interior.",
                "Mientras estás parado, vuelve a poner el volante en posición neutral.",
                "Continúa marcha atrás hasta que tu coche haya pasado literalmente al coche A.",
                "Para y gira el volante a tope hacia la derecha, no muevas el coche mientras lo haces.",
                "Continúa marcha atrás lentamente hacia el coche B, no gires el volante de su posición completamente a la izquierda.",
                "Cuando tu coche esté paralelo, para y gira el volante de vuelta a la posición central."
            ]
        }]
    },
    {
        title: "6. Límites de velocidad en CDMX",
        content: [{
            points: [
                "Carriles centrales de vías de acceso controlado: 80 km/h.",
                "Circulación en vías primarias: 50 km/h.",
                "En vías secundarias, incluyendo los laterales de vías de acceso controlado: 40 km/h.",
                "En zonas de tránsito lento: 30 km/h.",
                "En zonas escolares, de hospitales, de asilos, de albergues y casas hogar: 20 km/h.",
                "En estacionamientos y en vías peatonales en las cuales se permita el acceso a vehículos: 10 km/h."
            ]
        }]
    },
    {
        title: "7. Tipos de señales de tránsito",
        content: [{
            points: [
                "Preventivas: Señales de prevención.",
                "Reguladoras: Señales de reglamentación.",
                "Informativas: Señales de información."
            ]
        }]
    },
    {
        title: "8. Consejos para manejar en la lluvia",
        content: [{
            points: [
                "Reduce la velocidad.",
                "Enciende las luces para aumentar tu visibilidad.",
                "Aumenta tu distancia en referencia al vehículo delantero.",
                "Conduce con tranquilidad."
            ]
        }]
    },
    {
        title: "9. Consejos para manejar en el tráfico",
        content: [{
            points: [
                "Mantén la calma: Relaja los brazos, hombros y cuerpo durante la conducción. Escucha música relajante.",
                "Mantente a 5 km/h: Incluso en la carretera, mantente en esta velocidad para permitir que pasen otros conductores impacientes.",
                "Guarda distancia: Debes estar entre 5 y 3 metros de distancia con los otros vehículos.",
                "Usa los espejos: Haz un óptimo uso de los espejos, localizando cualquier riesgo u otros autos que intenten meterse en tu vía.",
                "Usa el GPS: Si estás en una parte desconocida para ti en la ciudad, usa el GPS y mantente alerta.",
                "Respeta los semáforos y señales de tránsito: Respeta siempre las señales de tránsito que se encuentren en la vía y los semáforos, no te impacientes y evita una tragedia."
            ]
        }]
    },
    {
        title: "10. 8 consejos para manejar en carretera",
        content: [{
            points: [
                "Planifica tu viaje: Consulta el estado de las vías con aplicaciones como Waze.",
                "Descanso necesario: No se aconseja conducir más de cuatro horas seguidas y relajar continuamente los músculos, cambiar de posición, hidratarse y evitar el cansancio extremo.",
                "Respetar distancias y velocidad: Mantener siempre una distancia prudente con los otros autos y respetar las señaléticas.",
                "Alimento ligero: La alimentación ligera antes o durante el viaje es importante.",
                "Siempre con luces encendidas: Es de vital importancia ser visible para otros vehículos con el objetivo de evitar accidentes, de ahí que las luces siempre deben ir encendidas.",
                "Qué hacer ante un desperfecto: Se deben encender las luces de emergencia y estacionarse en la berma. Para bajar del vehículo hay que hacerlo con el chaleco reflectante y de ser necesario se debe contactar al personal de emergencia de la ruta.",
                "Ojo con el equipaje: Toma la precaución de que el peso del equipaje sea distribuido correcta y equitativamente y que no quede ningún objeto suelto.",
                "Atento a la conducción y seguridad: Evitar el uso de celular u otros distractores. Además, siempre hay que tener los cinturones abrochados."
            ]
        }]
    },
    {
        title: "11. 7 consejos para manejo eficiente y ahorrar gasolina",
        content: [{
            points: [
                "Revisa la presión de los neumáticos: Conducir con presión inferior a la correcta aumenta el consumo de gasolina.",
                "Utiliza el combustible adecuado: Revisar si el auto admite gasolina de menos octanos, que será más económica. No siempre la de mayor octano aportará mejor rendimiento ni prestaciones.",
                "Evita acelerar y frenar bruscamente: Acelerar repentinamente causa un esfuerzo en el motor. Es mejor conducir con suavidad y anticiparse a posibles paradas. Este reflejo permite ahorrar hasta un 20% de combustible.",
                "Usa correctamente el aire acondicionado: Cuanto más se tenga que enfriar el auto, más energía y combustible se gastará.",
                "Verifica el peso y sube las ventanas: El peso de un vehículo muy cargado y manejar a más de 80 km/hora con las ventanas abiertas influyen negativamente en el consumo de combustible.",
                "Apaga el motor en las paradas largas: Los carros gastan entre 0.5 y 1 litro de combustible por hora cuando están parados, por eso es mejor detener el motor en paradas prolongadas.",
                "Carros ecológicos: Una opción a tener en cuenta es un auto más ecológico, que contamine menos y consuma menos."
            ]
        }]
    },
    {
        title: "12. Testigos e indicadores",
        content: [{
            points: [
                "El manual proporciona una lista exhaustiva de 65 luces de advertencia e indicadores. Algunos ejemplos incluyen:",
                "Neblineros delanteros encendidos",
                "Alerta de la dirección asistida",
                "Alerta de la pastilla de freno",
                "Control Crucero encendido",
                "Luces altas encendidas",
                "Baja presión en los neumáticos",
                "Cinturón de seguridad no abrochado",
                "Freno de estacionamiento activado",
                "Problema en la batería",
                "Asistente de estacionamiento activado",
                "Airbag",
                "Falla en la motorización",
                "Nivel de combustible bajo",
                "Problemas en la caja automática",
                "Presión de aceite baja"
            ]
        }]
    },
    {
        title: "13. Recuerda siempre",
        content: [{
            points: [
                "Respeta las señales de tránsito.",
                "Nunca uses el celular al conducir.",
                "Anticipa siempre tus maniobras.",
                "No excedas las velocidades máximas.",
                "Recuerda que el peatón siempre tiene prioridad. Respetalo.",
                "Usa siempre el cinturón de seguridad.",
                "Realiza un mantenimiento periódico de tu vehículo.",
                "No tomes alcohol si vas a manejar."
            ]
        }]
    }
];


type Course = {
  id: number;
  name: string;
  phone: string;
  time: string;
  dates: Date[];
  meetingPoint: string;
  status: 'Pendiente' | 'Confirmado';
  instructor?: string;
  transmission: string;
  address?: string;
  currentStage: number;
};

export default function AgendaPage() {
  const [dates, setDates] = useState<Date[] | undefined>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseToConfirm, setCourseToConfirm] = useState<Course | null>(null);
  const [instructorName, setInstructorName] = useState('');
  const { toast } = useToast();
  
  const instructors = ['Eduardo Walter', 'Mauricio'];

  const handleScheduleCourse = (newCourseData: { name: string; phone: string; time: string; dates: Date[]; meetingPoint: string; transmission: string; address?: string; }) => {
    const newCourse: Course = {
      id: Date.now(),
      ...newCourseData,
      status: 'Pendiente',
      currentStage: 0,
    };
    setCourses(prevCourses => [newCourse, ...prevCourses]);
    setDates([]);
  };

  const generateGoogleCalendarLink = (course: Course) => {
    const firstDate = course.dates[0];
    if (!firstDate) return '#';

    const [hours, minutes] = course.time.split(':').map(Number);
    
    const startDateTime = new Date(firstDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime.getTime() + 90 * 60 * 1000);

    const toGoogleISO = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '');

    const allDatesFormatted = course.dates.map(d => format(d, "EEEE, d 'de' MMMM", { locale: es })).join('\n');

    const details = `Curso de manejo para ${course.name}.
Instructor: ${course.instructor}
Teléfono: ${course.phone}
Punto de encuentro: ${course.meetingPoint}
${course.address ? `Dirección: ${course.address}\n` : ''}
Fechas del curso:\n${allDatesFormatted}
`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Clase de manejo - ${course.name}`,
      dates: `${toGoogleISO(startDateTime)}/${toGoogleISO(endDateTime)}`,
      details: details,
      location: course.meetingPoint === 'Domicilio del alumno' ? course.address || '' : 'Torreón #49, Roma Sur, CDMX',
      ctz: 'America/Mexico_City'
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
  };

  const handleConfirmCourse = () => {
    if (!courseToConfirm || !instructorName.trim()) return;
    
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseToConfirm.id ? { ...course, status: 'Confirmado', instructor: instructorName.trim(), currentStage: 0 } : course
      )
    );

    const studentPhoneNumber = courseToConfirm.phone.replace(/\D/g, '');
    const countryCode = '52';
    const fullPhoneNumber = studentPhoneNumber.length === 10 ? countryCode + studentPhoneNumber : studentPhoneNumber;

    const formattedDates = courseToConfirm.dates.map(date => format(date, "EEEE, d 'de' MMMM", { locale: es })).join(', ');
    const message = `¡Hola ${courseToConfirm.name}! Soy ${instructorName.trim()} de AEA. He confirmado tu curso de manejo para los días: ${formattedDates} a las ${courseToConfirm.time}. ¡Estoy a tu disposición para coordinarnos!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullPhoneNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
        title: '¡Curso confirmado!',
        description: `Contacta a ${courseToConfirm.name} y añade el evento a tu calendario.`,
    });
    
    closeConfirmationDialog();
  };

  const handleUpdateStage = (courseId: number, newStage: number) => {
    const courseToUpdate = courses.find(c => c.id === courseId);
    if (!courseToUpdate) return;

    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, currentStage: newStage } : course
      )
    );

    const studentPhoneNumber = courseToUpdate.phone.replace(/\D/g, '');
    const countryCode = '52';
    const fullPhoneNumber = studentPhoneNumber.length === 10 ? countryCode + studentPhoneNumber : studentPhoneNumber;

    const completedStageInfo = programData[newStage - 1];
    const nextStageInfo = programData[newStage];

    let message = `¡Hola ${courseToUpdate.name}! Felicidades por completar la etapa ${newStage}: "${completedStageInfo.title}".`;
    if (nextStageInfo) {
      message += `\n\nTu siguiente objetivo es la etapa ${newStage + 1}: "${nextStageInfo.title}". ¡Sigue así!`;
    } else {
      message += `\n\n¡Has completado todas las etapas del curso! ¡Excelente trabajo!`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullPhoneNumber}&text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    toast({
      title: '¡Progreso actualizado!',
      description: `Se abrirá WhatsApp para notificar a ${courseToUpdate.name}.`,
    });
  };

  const isConfirmDialogButtonDisabled = !instructorName.trim();

  const closeConfirmationDialog = () => {
    setCourseToConfirm(null);
    setInstructorName('');
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
       <div className="flex flex-col items-center text-center my-8 px-4">
        <Link href="/" className="mb-4 text-sm text-primary hover:underline">
          Auto Escuela Americana
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Agenda de Clases
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Aquí puedes agendar nuevas clases y administrar las solicitudes de los alumnos.
        </p>
      </div>
      <div className="container px-4 sm:px-6 md:px-8 pb-8">
        <div className="mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pagos">
              <CreditCard className="mr-2 h-4 w-4" />
              Ver Datos de Pago
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/catalogo">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Catálogo y Precios
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
             <Card className="shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Agendar Nuevo Curso</CardTitle>
                    <CardDescription>Paso 1: Elige hasta 6 días para el curso en el calendario.</CardDescription>
                </CardHeader>
                <CardContent className="p-2 flex justify-center">
                    <Calendar
                        mode="multiple"
                        min={1}
                        max={6}
                        selected={dates}
                        onSelect={setDates}
                        className="rounded-md"
                        locale={es}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                    />
                </CardContent>
                {dates && dates.length > 0 && (
                  <>
                    <Separator />
                    <CardHeader>
                        <CardTitle>Paso 2: Datos del Alumno</CardTitle>
                        <CardDescription>Completa el formulario para finalizar la solicitud.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScheduleForm selectedDates={dates} onCourseScheduled={handleScheduleCourse} />
                    </CardContent>
                  </>
                )}
             </Card>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Alert variant="default" className="bg-primary/10 border-primary/50">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-bold">Aviso para Menores de Edad</AlertTitle>
              <AlertDescription className="text-foreground">
                Si el alumno es menor de edad y requiere constancia para el trámite de permiso de conducir, es necesario adjuntar su documentación. Este proceso tiene un costo adicional de $500 MXN.
              </AlertDescription>
            </Alert>
            <Card className="h-full shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle>Cursos por Confirmar</CardTitle>
                <CardDescription>
                    Aquí se muestran las solicitudes de los alumnos. Confirma para asignar un instructor y enlazarlo con el alumno.
                    <br/>
                    <span className="text-xs text-muted-foreground italic">(Esto es una simulación. Los datos se perderán al recargar la página)</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16 border rounded-lg">
                        <p className="font-semibold">No hay cursos programados.</p>
                        <p className="text-sm mt-1">Selecciona una o más fechas y agenda un nuevo curso.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {courses.map((course) => (
                            <Card key={course.id} className="bg-muted/30">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg">{course.name}</CardTitle>
                                    <Badge variant={course.status === 'Confirmado' ? 'default' : 'secondary'} className="capitalize">
                                        {course.status === 'Confirmado' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                        {course.status}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{course.phone}</span>
                                    </div>
                                     <div className="flex items-center">
                                        <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Transmisión: {course.transmission}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Clases a las {course.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Punto de encuentro: {course.meetingPoint}</span>
                                    </div>
                                    {course.address && (
                                        <div className="flex items-center">
                                            <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span>{course.address}</span>
                                        </div>
                                    )}
                                    <Separator className="my-2" />
                                    <div className="flex items-start">
                                        <CalendarIcon className="mr-2 mt-1 h-4 w-4 text-muted-foreground" />
                                        <ul className="list-disc list-inside">
                                            {course.dates.map(date => (
                                                <li key={date.toISOString()}>{format(date, "EEEE, d 'de' MMMM", { locale: es })}</li>
                                            ))}
                                        </ul>
                                    </div>
                                     {course.status === 'Confirmado' && course.instructor && (
                                            <div className="flex items-center pt-2 text-green-700 dark:text-green-400 font-semibold">
                                                <UserCheck className="mr-2 h-4 w-4" />
                                                <span>Confirmado por: {course.instructor}</span>
                                            </div>
                                    )}
                                    {course.status === 'Confirmado' && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="font-semibold text-md mb-2">Progreso del Curso</h4>
                                            {course.currentStage === 0 && (
                                                <div className="text-center p-4 bg-muted/50 rounded-md">
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        El curso está listo para comenzar. La primera etapa es: <strong>{programData[0].title}</strong>.
                                                    </p>
                                                    <Button size="sm" onClick={() => handleUpdateStage(course.id, 1)}>
                                                        Comenzar y Completar Etapa 1
                                                    </Button>
                                                </div>
                                            )}
                                            {course.currentStage > 0 && (
                                                <div className="space-y-3">
                                                    <Progress value={(course.currentStage / programData.length) * 100} className="w-full" />
                                                    <div className="flex justify-between items-center text-sm">
                                                        <p className="text-muted-foreground">
                                                            <CheckCircle className="inline-block h-4 w-4 mr-1 text-green-500" />
                                                            Etapa {course.currentStage} de {programData.length} completada
                                                        </p>
                                                        <p className="font-bold">{Math.round((course.currentStage / programData.length) * 100)}%</p>
                                                    </div>

                                                    {course.currentStage < programData.length ? (
                                                        <div className="flex flex-col items-start gap-2 pt-2">
                                                            <p className="text-sm">
                                                                Siguiente etapa: <strong>{programData[course.currentStage].title}</strong>
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleUpdateStage(course.id, course.currentStage + 1)}
                                                                className="w-full"
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Completar y Notificar al Alumno
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 pt-2 text-green-600 dark:text-green-400 font-semibold">
                                                            <CheckCircle className="h-5 w-5" />
                                                            <span>¡Curso completado!</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                                                <Link href={generateGoogleCalendarLink(course)} target="_blank" rel="noopener noreferrer">
                                                    <CalendarPlus className="mr-2 h-4 w-4" />
                                                    Añadir a Google Calendar
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                                {course.status === 'Pendiente' && (
                                    <CardFooter>
                                        <Button className="w-full" onClick={() => setCourseToConfirm(course)}>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Asignar Instructor y Confirmar
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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

      <Dialog open={!!courseToConfirm} onOpenChange={(open) => !open && closeConfirmationDialog()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmar Curso y Asignar Instructor</DialogTitle>
                <DialogDescription>
                    Selecciona tu nombre de la lista para confirmar que tomarás este curso. Se abrirá WhatsApp para enlazar al alumno contigo.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="instructor-name" className="text-right">
                        Instructor
                    </Label>
                    <Select
                        onValueChange={setInstructorName}
                        defaultValue={instructorName}
                    >
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Seleccionar instructor" />
                        </SelectTrigger>
                        <SelectContent>
                            {instructors.map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={closeConfirmationDialog}>Cancelar</Button>
                <Button onClick={handleConfirmCourse} disabled={isConfirmDialogButtonDisabled}>
                    Confirmar y Asignar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
