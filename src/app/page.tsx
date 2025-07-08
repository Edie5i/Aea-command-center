"use client";

import { useState, useRef } from "react";
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
  FileText,
  Bot,
  User
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import jsPDF from "jspdf";
import { ConfigForm } from "@/components/config-form";
import { InstructionsDisplay } from "@/components/instructions-display";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contact-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppFooter } from "@/components/footer";


export default function Home() {
  const [tips, setTips] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [key, setKey] = useState(0);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [documentToGenerate, setDocumentToGenerate] = useState<'constancia' | null>(null);
  const [studentName, setStudentName] = useState('');
  const [curp, setCurp] = useState('');

  const mainContentRef = useRef<HTMLDivElement>(null);

  const handleGetStartedClick = () => {
    mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTipsGenerated = (generatedTips: string[]) => {
    setTips(generatedTips);
    setIsLoading(false);
    setKey(prevKey => prevKey + 1);
  };

  const handleReset = () => {
    setTips(null);
    setKey(prevKey => prevKey + 1);
  };

  const generateConstanciaMenor = (alumno: string, curp: string) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Constancia para Menor de Edad', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Este documento certifica que ${alumno}, con CURP ${curp},`, 20, 40);
    doc.text('ha completado satisfactoriamente el curso de manejo requerido para el trámite', 20, 47);
    doc.text('de su permiso de conducir para menor de edad.', 20, 54);
    doc.text('Auto Escuela Americana', 20, 70);
    doc.save(`Constancia_Menor_Edad_${alumno.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDocumentSelect = (docType: 'constancia') => {
    setDocumentToGenerate(docType);
    setStudentName('');
    setCurp('');
    setIsGeneratorOpen(true);
  };

  const handleGenerateDocument = () => {
    if (!studentName.trim() || curp.trim().length !== 18) {
      return;
    }

    generateConstanciaMenor(studentName.trim(), curp.trim().toUpperCase());
    
    const docTitle = 'Constancia de Menor de Edad';
    let whatsAppMessageDetails = `*Para el alumno:* ${studentName.trim()}`;
    whatsAppMessageDetails += `\n*CURP:* ${curp.trim().toUpperCase()}`;

    const whatsAppNumber = "525634433212";
    const message = `Se ha generado el siguiente documento:\n\n*Tipo:* ${docTitle}\n${whatsAppMessageDetails}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsAppNumber}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    setIsGeneratorOpen(false);
    setDocumentToGenerate(null);
    setStudentName('');
    setCurp('');
  };


  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <div className="relative w-full flex flex-col justify-between" style={{minHeight: '100vh'}}>
        <div>
          <div className="@container">
            <div className="@[480px]:p-4">
              <div
                className="w-full bg-center bg-no-repeat bg-cover rounded-xl min-h-[50vh] md:min-h-[65vh]"
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuATDYn_-lIbqYSXnv6mW7DKFPH7T90teDEaszaH2_MLpLz5Oe3KPctwAB-fUwZ1oZfXtW27nUvdxNr7Q6S90U35h55kUh-Gm0lHnTMeVizuudEOdVz784e6IWedtCv6iQV2YWboiB1r_InPJosF3I3Dl8-T9NFsURJM0oqBpo0Bg-2p6WkFcC6pxCrSUNY-PIgucran0WN1EC2RnPLHUq_POOnR9BaJ5KqgzC7hahkxeTyWCFKKcu7NZJlz2r0KXmyN8mXVvhsbiVA")',
                }}
              ></div>
            </div>
          </div>
          <h2 className="text-foreground tracking-tight text-[28px] font-bold text-center px-4 pt-5 pb-3">
            Bienvenido a Auto Escuela Americana
          </h2>
          <p className="text-muted-foreground text-base font-normal text-center px-4 pt-1 pb-3">
            Aprende a conducir con confianza y seguridad en la Ciudad de México.
          </p>
        </div>
        <div>
          <div className="flex px-4 py-3">
            <Button
              onClick={handleGetStartedClick}
              className="h-12 px-5 flex-1 rounded-full font-bold text-base max-w-md mx-auto"
              size="lg"
            >
              <span className="truncate">Comenzar</span>
            </Button>
          </div>
          <div className="h-5"></div>
        </div>
      </div>
      
      <div ref={mainContentRef} className="w-full flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl mb-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-full">
            <Link href="/chatbot">
              <Bot className="mr-2 h-4 w-4" />
              IA Bot
            </Link>
          </Button>
          <Button asChild className="w-full">
              <Link href="/catalogo">
                  <List className="mr-2 h-4 w-4" />
                  Catálogo
              </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
              <Link href="/agenda">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Agendar
              </Link>
          </Button>
          <Button asChild className="w-full">
              <Link href="/evaluacion">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Evaluar Nivel
              </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
              <Link href="/examen-teorico">
                  <FileQuestion className="mr-2 h-4 w-4" />
                  Examen
              </Link>
          </Button>
          <Button asChild className="w-full">
              <Link href="/programa">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Programa
              </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
              <Link href="/pagos">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagos
              </Link>
          </Button>
          <Button onClick={() => handleDocumentSelect('constancia')} className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Constancias
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/terminos">
              <FileText className="mr-2 h-4 w-4" />
              Términos
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-3xl mb-8 flex justify-center">
          <Button asChild variant="outline">
              <Link href="/instructores">
                  <User className="mr-2 h-4 w-4" />
                  Únete al Equipo
              </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {!tips ? (
                  <ConfigForm
                    onGenerated={handleTipsGenerated}
                    setLoading={setIsLoading}
                    isLoading={isLoading}
                  />
                ) : (
                  <InstructionsDisplay
                    tips={tips}
                    onReset={handleReset}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <ContactForm />

        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <Card className="shadow-lg rounded-xl h-full flex flex-col">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Smile className="h-6 w-6 text-accent" />
                Encuesta
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow text-center">
              <p className="text-muted-foreground">
                ¿Ya tomaste un curso? Tu opinión es muy valiosa para nosotros.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link href="/encuesta-satisfaccion">
                  <Smile className="mr-2 h-4 w-4" />
                  Responder Encuesta
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg rounded-xl h-full flex flex-col">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center gap-2 justify-center">
                <MapPin className="h-6 w-6 text-primary" />
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-center text-muted-foreground mb-4">
                  Torreón #49, Roma Sur, CDMX.
              </p>
                <div className="aspect-square w-full overflow-hidden rounded-lg border">
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

        <Card className="w-full max-w-3xl mt-8 bg-primary/10 border-primary/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-center text-center sm:text-left sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-md">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Nuestros Casos de Éxito</h3>
                <p className="text-muted-foreground mt-1">Descubre por qué nuestros alumnos nos califican con 5 estrellas en Google.</p>
              </div>
            </div>
            <Button asChild className="shrink-0 mt-4 sm:mt-0">
              <a
                href="https://g.co/kgs/6Ks1oGz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Star className="mr-2 h-4 w-4 fill-current" />
                Leer Reseñas en Google
              </a>
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generar Constancia de Menor de Edad</DialogTitle>
              <DialogDescription>
                Ingresa los datos para generar la constancia. Se notificará por WhatsApp. Recuerda que también se necesita una foto digital del alumno con fondo blanco, a la altura de los hombros, que deberás solicitar por separado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="col-span-3"
                  placeholder="Nombre completo del alumno"
                />
              </div>
              {documentToGenerate === 'constancia' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="curp" className="text-right">
                    CURP
                  </Label>
                  <Input
                    id="curp"
                    value={curp}
                    onChange={(e) => setCurp(e.target.value.toUpperCase())}
                    className="col-span-3"
                    placeholder="CURP del alumno (18 caracteres)"
                    maxLength={18}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleGenerateDocument}
                disabled={!studentName.trim() || (documentToGenerate === 'constancia' && curp.trim().length !== 18)}
              >
                Generar y Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <AppFooter />
    </main>
  );
}
