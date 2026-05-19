import type { Metadata, Viewport } from "next";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FloatingWhatsappButton } from "@/components/floating-whatsapp-button";
import { lexend, noto_sans } from "@/lib/fonts";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Auto Escuela Americana — Clases de Manejo en CDMX",
  description: "Aprende a manejar en CDMX con instructores certificados. Clases 1 a 1, a tu ritmo. Roma Sur y a domicilio en CDMX. Más de 220 reseñas ⭐ 4.8. Aparta tu lugar desde $690.",
  keywords: "clases de manejo CDMX, autoescuela Ciudad de México, aprender a manejar CDMX, escuela de manejo Roma Sur, clases de manejo personalizadas",
  robots: "index, follow",
  alternates: {
    canonical: "https://www.autoescuelaamericana.com/",
  },
  openGraph: {
    title: "Auto Escuela Americana — Clases de Manejo en CDMX",
    description: "Aprende a manejar en CDMX con instructores certificados. Clases 1 a 1, a tu ritmo. Más de 220 reseñas ⭐ 4.8.",
    url: "https://www.autoescuelaamericana.com/",
    siteName: "Auto Escuela Americana",
    locale: "es_MX",
    type: "website",
  },
  verification: {
    google: "tmH1weH1g2T3Q4aA49zS13GxOAj47ZA6_AgTBh2igHU",
  },
};

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={`${lexend.variable} ${noto_sans.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚗</text></svg>" />
      </head>
      <body className="font-body antialiased h-full">
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-LMZBQ47D8K" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LMZBQ47D8K');
            gtag('config', 'AW-11300877997');
          `}
        </Script>
        {children}
        <Toaster />
        <FloatingWhatsappButton />
      </body>
    </html>
  );
}
