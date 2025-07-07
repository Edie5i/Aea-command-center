import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FloatingWhatsappButton } from "@/components/floating-whatsapp-button";

export const metadata: Metadata = {
  title: "AEA - Autoescuela Americana",
  description: "App de Auto Escuela Americana. Portal para instructores y alumnos para generar planes de lecciones, gestionar agendas y más.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("font-body antialiased h-full")}>
        {children}
        <Toaster />
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
