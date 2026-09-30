'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WhatsAppIcon } from '@/components/whatsapp-icon';


export function FloatingWhatsappButton() {
  const pathname = usePathname();
  // En la ficha del alumno no va: esa página ya tiene su propio botón de
  // WhatsApp con el mensaje escrito y su folio, y este manda el genérico de
  // «quiero información sobre los cursos» —que es lo que NO necesita alguien
  // que ya tiene ficha—. Encima flota sobre el contenido y tapaba una clase.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/ficha')) return null;

  const whatsAppNumber = "525634433212";
  const message = "Hola, me gustaría recibir información sobre los cursos de manejo y agendar mi sesión.";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110"
            aria-label="Contactar por WhatsApp"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'whatsapp_click', { location: 'floating_button' });
              }
            }}
          >
            <WhatsAppIcon className="h-8 w-8 text-white" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Contáctanos por WhatsApp</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
