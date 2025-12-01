'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, FileText, Download, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { programData } from '@/lib/course-data';
import { AppFooter } from '@/components/footer';
import { useState } from 'react';

export default function ProgramaPage() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const sectionData = programData.find(section => section.title.startsWith("14."));

      if (!sectionData) {
        console.error("PDF generation failed: Section data not found.");
        setIsGeneratingPdf(false);
        return;
      }

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(sectionData.title, 105, 20, { align: 'center' });
      let y = 40;

      sectionData.content.forEach(contentBlock => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        if (contentBlock.heading) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(contentBlock.heading, 15, y);
          y += 10;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        contentBlock.points.forEach(point => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          const lines = doc.splitTextToSize(`• ${point}`, 175);
          doc.text(lines, 20, y);
          y += (lines.length * 6);
        });
        y += 8;
      });

      doc.save('Guia_Verificacion_y_Mantenimiento.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

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
          Programa del Curso
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Esta es la guía de conducción completa de Auto Escuela Americana. Utilízala como referencia para tus clases y para repasar conceptos clave.
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
          <Button asChild variant="outline">
            <Link href="/terminos">
                <FileText className="mr-2 h-4 w-4" />
                Términos
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Manual de Conducción</CardTitle>
            <CardDescription>
              Explora cada sección para aprender sobre conducción segura y eficiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Accordion type="single" collapsible className="w-full">
              {programData.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-muted-foreground">
                      {section.content.map((contentBlock, blockIndex) => (
                        <div key={blockIndex}>
                          {contentBlock.heading && (
                            <h4 className="font-semibold text-foreground mb-2">{contentBlock.heading}</h4>
                          )}
                          <ul className="list-disc space-y-2 pl-6">
                            {contentBlock.points.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
          <CardFooter className="flex justify-center bg-muted/50 p-4 border-t">
              <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isGeneratingPdf ? 'Generando...' : 'Descargar Guía de Mantenimiento'}
              </Button>
          </CardFooter>
        </Card>
      </div>
      
      <AppFooter />
    </main>
  );
}
