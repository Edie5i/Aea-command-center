import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FloatingWhatsappButton } from "@/components/floating-whatsapp-button";
import { lexend, noto_sans } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "AEA - Autoescuela Americana",
  description: "App de Auto Escuela Americana. Portal para instructores y alumnos para generar planes de lecciones, gestionar agendas y más.",
  themeColor: "#1D4ED8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${lexend.variable} ${noto_sans.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚗</text></svg>" />
      </head>
      <body className="font-body antialiased h-full">
        {children}
        <Toaster />
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
