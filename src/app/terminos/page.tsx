import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function TerminosPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="flex flex-col items-center text-center my-8 px-4">
        <Link href="/" className="mb-4 text-sm text-primary hover:underline">
          Auto Escuela Americana
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
          Términos y Condiciones
        </h1>
        <p className="mt-2 max-w-xl text-lg text-muted-foreground">
          Detalles del acuerdo de servicio entre la autoescuela y los alumnos.
        </p>
      </div>

      <div className="container px-4 sm:px-6 md:px-8 pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl mb-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Link>
          </Button>
        </div>

        <Card className="w-full max-w-3xl shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle>Términos de Contratación</CardTitle>
            <CardDescription>
              Válido a partir del 1 de Julio de 2024.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">1. Objeto del Contrato</h3>
              <p>
                AEA se compromete a impartir un curso de manejo práctico y teórico al alumno, de acuerdo al paquete contratado. El objetivo es proporcionar las herramientas y conocimientos necesarios para una conducción segura y responsable.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">2. Requisitos del Alumno</h3>
              <p>
                El alumno debe ser mayor de 16 años. Para menores de edad, se requiere autorización por escrito de un padre o tutor. Es responsabilidad del alumno presentar cualquier documentación requerida, como identificación oficial o permiso de conducir provisional si aplica.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">3. Pagos y Vigencia</h3>
              <p>
                El pago del curso debe realizarse en su totalidad antes de la primera clase programada. Los paquetes de cursos tienen una vigencia de 3 meses a partir de la fecha de pago para ser completados. No hay reembolsos por cursos no tomados o cancelaciones fuera del plazo estipulado.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">4. Programación y Cancelación de Clases</h3>
              <p>
                Las clases deben ser agendadas según la disponibilidad de la escuela y los instructores. Se requiere un aviso de al menos 24 horas de anticipación para cancelar o reprogramar una clase. Las cancelaciones con menos de 24 horas de antelación o la inasistencia resultarán en la pérdida de dicha clase sin derecho a reposición o reembolso.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">5. Responsabilidades</h3>
              <p>
                La escuela proporcionará un vehículo en buen estado y un instructor certificado. El alumno se compromete a seguir todas las indicaciones del instructor y a no presentarse a las clases bajo la influencia de alcohol o sustancias que alteren su capacidad de conducción. Cualquier daño al vehículo causado por negligencia del alumno será su responsabilidad.
              </p>
            </div>
             <div className="space-y-2">
              <h3 className="font-semibold text-foreground">6. Aceptación de Términos</h3>
              <p>
                Al realizar el pago y agendar la primera clase, el alumno y/o su tutor aceptan en su totalidad los términos y condiciones aquí descritos.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">7. Confidencialidad y Protección de Datos</h3>
              <p>
                Los datos personales proporcionados por el alumno (nombre, teléfono, domicilio) así como los datos del instructor asignado, son estrictamente confidenciales. AEA se compromete a no compartir, vender o divulgar esta información a terceros bajo ninguna circunstancia, salvo requerimiento legal. Los datos se utilizan únicamente para la coordinación y logística del curso contratado.
              </p>
            </div>
          </CardContent>
        </Card>
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
    </main>
  );
}
