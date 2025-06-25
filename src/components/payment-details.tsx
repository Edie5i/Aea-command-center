import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CopyButton } from './copy-button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Info, Banknote, Landmark, MessageSquare, CreditCard } from 'lucide-react';
import { Separator } from './ui/separator';
import Image from 'next/image';

export function PaymentDetails() {
  const accountNumber = '0484695739';
  const clabe = '012180004846957399';
  const debitCard = '4152314404288527';
  const whatsAppCatalogUrl = 'https://wa.me/c/5215634433212';
  
  return (
    <Card className="w-full max-w-3xl shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-6 w-6 text-primary" />
          Datos de Pago
        </CardTitle>
        <CardDescription>
          Puedes realizar el pago de tu curso a través de los siguientes métodos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2 text-lg"><CreditCard className="h-5 w-5 text-primary" />Pago con Tarjeta (Crédito/Débito)</h3>
            <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                <p className="text-sm text-muted-foreground">Aceptamos todas las tarjetas. El pago se procesa de forma segura a través de <strong>Openpay</strong>.</p>
                <Separator />
                <ul className="list-disc list-inside text-sm space-y-2 pl-2">
                    <li><strong>Meses Sin Intereses (MSI):</strong> Disponibles exclusivamente con tarjetas American Express y BBVA.</li>
                    <li><strong>Pagos Diferidos:</strong> Opción disponible para tarjetas de otros bancos a través de Openpay.</li>
                </ul>
                <p className="text-xs text-muted-foreground pt-2">Contacta a un asesor para generar tu enlace de pago personalizado.</p>
            </div>
        </div>

        <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2 text-lg"><Landmark className="h-5 w-5 text-primary" />Transferencia Bancaria</h3>
            <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
                <p className="text-sm text-muted-foreground">Beneficiario: <strong>Eduardo W. Czaplewski (Cuenta PYME BBVA)</strong></p>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Cuenta:</p>
                        <p className="font-mono text-base sm:text-lg">048 469 5739</p>
                    </div>
                    <CopyButton textToCopy={accountNumber} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">CLABE Interbancaria:</p>
                        <p className="font-mono text-base sm:text-lg">012 180 00484695739 9</p>
                    </div>
                    <CopyButton textToCopy={clabe} />
                </div>
            </div>
        </div>

        <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2 text-lg"><Banknote className="h-5 w-5 text-primary" />Depósito en Efectivo</h3>
             <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
                <p className="text-sm text-muted-foreground">Disponible en: <strong>Walmart, Sanborns, OXXO, 7-Eleven</strong>.</p>
                <Separator />
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Tarjeta de Débito BBVA:</p>
                        <p className="font-mono text-base sm:text-lg">4152 3144 0428 8527</p>
                    </div>
                    <CopyButton textToCopy={debitCard} />
                </div>
            </div>
        </div>

        <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2 text-lg"><MessageSquare className="h-5 w-5 text-primary" />Envía tu Comprobante</h3>
            <div className="rounded-lg border p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 bg-muted/20">
              <div className="text-center sm:text-left max-w-sm">
                <p className="text-sm text-muted-foreground">Una vez realizado el pago, envía tu comprobante a nuestro WhatsApp para confirmar tu curso y agilizar el proceso.</p>
                <p className="text-sm font-semibold mt-2 text-primary">¡Escanea el código QR para abrir el chat!</p>
              </div>
              <div className="p-2 bg-white rounded-md shadow-md">
                <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(whatsAppCatalogUrl)}`}
                    alt="Código QR para contactar por WhatsApp"
                    width={150}
                    height={150}
                    data-ai-hint="QR code"
                />
              </div>
            </div>
        </div>

        <Alert variant="default" className="bg-primary/10 border-primary/50">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">¡Importante!</AlertTitle>
          <AlertDescription className="text-foreground">
            Al realizar tu pago, asegúrate de poner el <strong>nombre completo del alumno</strong> en el concepto o referencia.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
