
"use client";

import Link from "next/link";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/footer";

export default function Home() {

  const handleGetStartedClick = () => {
    const mainContent = document.getElementById('main-content');
    mainContent?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <div className="relative w-full">
        <div className="@container">
          <div className="@[480px]:p-4">
            <div
              className="w-full bg-gradient-to-br from-gray-900 to-black rounded-xl min-h-[50vh] md:min-h-[65vh] flex items-center justify-center p-4"
              style={{
                backgroundImage: "url('https://www.autoescuelaamericana.com/images/easy-landing/backgrounds/background-3.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              data-ai-hint="driving lesson car interior"
            >
              <div className="p-6 md:p-8 rounded-lg text-center bg-black/50 backdrop-blur-sm">
                  <h1 
                    className="text-5xl md:text-6xl font-semibold text-primary tracking-widest uppercase"
                    style={{
                      WebkitTextStroke: '2px #DC2626',
                      textStroke: '2px #DC2626',
                      paintOrder: 'stroke fill',
                    }}
                  >
                    Auto Escuela Americana
                  </h1>
                 <h2 className="text-white tracking-tight text-3xl sm:text-4xl md:text-5xl font-bold text-center mt-2">
                    Aprende a Conducir con los Expertos de la CDMX
                  </h2>
                  <p className="text-white text-lg md:text-xl font-normal text-center mt-4 max-w-2xl">
                    Cursos personalizados, instructores certificados y la confianza que necesitas para dominar el volante.
                  </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full flex justify-center py-6 px-4">
            <Button
              onClick={handleGetStartedClick}
              className="h-14 px-8 rounded-full font-bold text-lg max-w-md mx-auto shadow-lg"
              size="lg"
            >
              ¡Quiero Empezar!
            </Button>
        </div>
      </div>
      
      <div id="main-content" className="w-full flex flex-col items-center p-4 sm:p-6 md:p-8">
         <div className="w-full max-w-5xl mb-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Portal del Alumno</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Todas nuestras herramientas y recursos a tu alcance.
                </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild size="lg" className="h-24 text-base flex-col gap-1 bg-red-600 hover:bg-red-700 text-white">
                    <Link href="/catalogo">
                        <List className="h-6 w-6" />
                        Catálogo
                    </Link>
                </Button>
                <Button asChild size="lg" className="h-24 text-base flex-col gap-1 bg-white hover:bg-gray-100 text-black border border-gray-300">
                    <Link href="/agenda">
                        <CalendarDays className="h-6 w-6" />
                        Agendar
                    </Link>
                </Button>
                <Button asChild size="lg" className="h-24 text-base flex-col gap-1 bg-yellow-400 hover:bg-yellow-500 text-black">
                    <Link href="/evaluacion">
                        <BarChart3 className="h-6 w-6" />
                        Evaluar Nivel
                    </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-24 text-base flex-col gap-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-700">
                    <Link href="/examen-teorico">
                        <FileQuestion className="h-6 w-6" />
                        Examen Teórico
                    </Link>
                </Button>
                 <Button asChild size="lg" className="h-24 text-base flex-col gap-1 bg-red-600 hover:bg-red-700 text-white">
                    <Link href="/english-course">
                        <Languages className="h-6 w-6" />
                        English Course
                    </Link>
                </Button>
                <Button asChild size="lg" className="h-24 text-base flex-col gap-1 bg-white hover:bg-gray-100 text-black border border-gray-300">
                    <Link href="/programa">
                        <BookOpen className="h-6 w-6" />
                        Programa
                    </Link>
                </Button>
                 <Button asChild size="lg" className="h-24 text-base flex-col gap-1 bg-yellow-400 hover:bg-yellow-500 text-black">
                    <Link href="/pagos">
                        <CreditCard className="h-6 w-6" />
                        Pagos
                    </Link>
                </Button>
                 <Button asChild size="lg" variant="outline" className="h-24 text-base flex-col gap-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-700">
                    <Link href="/chatbot">
                        <Bot className="h-6 w-6" />
                        Asistente
                    </Link>
                </Button>
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

    