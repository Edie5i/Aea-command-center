import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FloatingWhatsappButton } from "@/components/floating-whatsapp-button";

export const metadata: Metadata = {
  title: "AEA - Autoescuela Americana",
  description: "App de Auto Escuela Americana. Portal para instructores y alumnos para generar planes de lecciones, gestionar agendas y más.",
  openGraph: {
    title: "AEA - Autoescuela Americana",
    description: "Portal para aprender a conducir, agendar clases y más.",
    url: "https://autoescuela-americana.com",
    siteName: "Auto Escuela Americana",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AEA - Autoescuela Americana",
    description: "Portal para aprender a conducir, agendar clases y más.",
  },
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
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚗</text></svg>" />
      </head>
      <body className={cn("font-body antialiased h-full")}>
        {children}
        <Toaster />
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
