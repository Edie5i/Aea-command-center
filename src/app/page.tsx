
"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  CalendarDays, 
  MapPin, 
  CreditCard, 
  List, 
  BookOpen, 
  BarChart3, 
  FileQuestion, 
  Smile, 
  Star,
  User,
  MessageSquare,
  Languages,
  Lightbulb,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/footer";

export default function Home() {

  const handleGetStartedClick = () => {
    const mainContent = document.getElementById('main-content');
    mainContent?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      
      {/* Hero Section */}
      <section
        className="relative w-full h-[60vh] md:h-[70vh] bg-cover bg-center text-white flex items-center justify-center"
        style={{ backgroundImage: "url('https://i.ibb.co/bX0v0rD/car-driving-in-city.jpg')" }}
        data-ai-hint="driving lesson car interior"
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center p-4 flex flex-col items-center">
            <Image 
              src="https://www.autoescuelaamericana.com/img/logo-aea-blue.png"
              alt="Auto Escuela Americana Logo"
              width={128}
              height={128}
              className="mb-4 rounded-full"
              priority
            />
            <h1 
              className="text-4xl md:text-5xl font-semibold text-primary tracking-widest uppercase"
              style={{
                WebkitTextStroke: '2px #DC2626',
                textStroke: '2px #DC2626',
                paintOrder: 'stroke fill',
              }}
            >
              Auto Escuela Americana
            </h1>
           <h2 className="tracking-tight text-2xl sm:text-3xl md:text-4xl font-bold text-center mt-2">
              Aprende a Conducir con los Expertos de la CDMX
            </h2>
            <p className="text-lg md:text-xl font-normal text-center mt-4 max-w-2xl">
              Cursos personalizados, instructores certificados y la confianza que necesitas para dominar el volante.
            </p>
            <div className="mt-8">
              <Button
                onClick={handleGetStartedClick}
                className="h-14 px-8 rounded-full font-bold text-lg shadow-lg"
                size="lg"
              >
                ¡Quiero Empezar!
              </Button>
            </div>
        </div>
      </section>
      
      <div id="main-content" className="w-full flex flex-col items-center p-4 sm:p-6 md:p-8">
         <div className="w-full max-w-5xl mb-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Portal del Alumno</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Todas nuestras herramientas y recursos a tu alcance.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><List />Catálogo de Cursos</CardTitle>
                        <CardDescription>Explora todos los cursos que ofrecemos.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline"><Link href="/catalogo">Ver Cursos</Link></Button>
                    </CardFooter>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CalendarDays />Agendar Curso</CardTitle>
                        <CardDescription>Elige tus fechas y completa tu inscripción.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild><Link href="/agenda">Agendar Ahora</Link></Button>
                    </CardFooter>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3 />Evalúa tu Nivel</CardTitle>
                        <CardDescription>Descubre qué curso es el ideal para ti.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline"><Link href="/evaluacion">Empezar Evaluación</Link></Button>
                    </CardFooter>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileQuestion />Examen Teórico</CardTitle>
                        <CardDescription>Pon a prueba tus conocimientos de tránsito.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline"><Link href="/examen-teorico">Hacer Examen</Link></Button>
                    </CardFooter>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookOpen />Programa del Curso</CardTitle>
                        <CardDescription>Consulta nuestro manual de conducción.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline"><Link href="/programa">Ver Programa</Link></Button>
                    </CardFooter>
                </Card>
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bot />Asistente Virtual</CardTitle>
                        <CardDescription>Resuelve tus dudas al instante con nuestra IA.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline"><Link href="/chatbot">Chatear Ahora</Link></Button>
                    </CardFooter>
                </Card>
                 <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Languages />English Course</CardTitle>
                        <CardDescription>Driving lessons completely in English.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline"><Link href="/english-course">View Course</Link></Button>
                    </CardFooter>
                </Card>
                 <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CreditCard />Métodos de Pago</CardTitle>
                        <CardDescription>Conoce las opciones para pagar tu curso.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild variant="outline"><Link href="/pagos">Ver Pagos</Link></Button>
                    </CardFooter>
                </Card>
            </div>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl overflow-hidden mt-8 bg-muted/30">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">Consejos Destacados</CardTitle>
                <CardDescription>Pequeños hábitos que hacen una gran diferencia en el camino.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 grid gap-6 sm:grid-cols-1">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Mantén tu Distancia</h3>
                        <p className="text-sm text-muted-foreground">La "regla de los dos segundos" es tu mejor aliada. Asegúrate de que pasen al menos dos segundos entre que el coche de adelante pasa un punto y tú lo haces. Aumenta a 3 o 4 segundos si llueve.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Usa tus Espejos Constantemente</h3>
                        <p className="text-sm text-muted-foreground">No mires solo hacia adelante. Revisa tus espejos retrovisores y laterales cada 5-8 segundos. Saber qué pasa a tu alrededor te permite anticipar y reaccionar a tiempo.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <Lightbulb className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Anticipa tus Movimientos</h3>
                        <p className="text-sm text-muted-foreground">Señaliza tus intenciones con las direccionales mucho antes de girar o cambiar de carril. Esto le da tiempo a los demás conductores para reaccionar a tus movimientos, creando un entorno más seguro para todos.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="w-full max-w-3xl pt-8" id="contact-button-section">
            <div className="flex justify-center">
                <Button asChild size="lg">
                    <a href="https://wa.me/525634433212?text=¡Hola!%20Me%20gustaría%20más%20información%20sobre%20los%20cursos%20de%20manejo." target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Solicitar Info por WhatsApp
                    </a>
                </Button>
            </div>
        </div>


        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <Card className="shadow-lg rounded-xl h-full flex flex-col border-accent/50 bg-accent/10">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Smile className="h-6 w-6 text-accent-foreground" />
                Encuesta de Satisfacción
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow text-center">
              <p className="text-muted-foreground">
                ¿Ya tomaste un curso? Tu opinión es muy valiosa para nosotros y nos ayuda a mejorar.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild variant="outline">
                <Link href="/encuesta-satisfaccion">
                  <Smile className="mr-2 h-4 w-4" />
                  Responder
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg rounded-xl h-full flex flex-col">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center gap-2 justify-center">
                <MapPin className="h-6 w-6 text-primary" />
                Nuestra Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-center text-muted-foreground mb-4">
                  Torreón #49, Roma Sur, CDMX. ¡Te esperamos!
              </p>
                <div className="aspect-video w-full overflow-hidden rounded-lg border">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.910334861842!2d-99.1650399256956!3d19.41584284067989!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff394a4f8999%3A0x89223c21a3295b9c!2sTorre%C3%B3n%2049%2C%20Roma%20Sur%2C%20Cuauht%C3%A9moc%2C%2006760%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX!5e0!3m2!1sen!2smx!4v1719524940549!5m2!1sen!2smx"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="w-full max-w-3xl mt-8 bg-secondary">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-center text-center sm:text-left sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-md">
                <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Calificación de 5 Estrellas</h3>
                <p className="text-muted-foreground mt-1">Descubre por qué nuestros alumnos nos recomiendan en Google.</p>
              </div>
            </div>
            <Button asChild className="shrink-0 mt-4 sm:mt-0">
              <a
                href="https://g.co/kgs/6Ks1oGz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Star className="mr-2 h-4 w-4 fill-current" />
                Leer Reseñas
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="w-full max-w-3xl my-8 p-6 bg-muted rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
                <h3 className="text-xl font-bold text-foreground">¿Quieres formar parte de nuestro equipo?</h3>
                <p className="text-muted-foreground mt-1">Buscamos instructores apasionados por la seguridad vial. ¡Únete a nosotros!</p>
            </div>
            <Button asChild size="lg" variant="outline" className="mt-4 md:mt-0 shrink-0">
                <Link href="/instructores">
                    <User className="mr-2 h-5 w-5" />
                    Ser Instructor
                </Link>
            </Button>
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
