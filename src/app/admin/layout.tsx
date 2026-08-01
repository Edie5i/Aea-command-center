import type { Metadata, Viewport } from 'next';

// El panel se instala como PWA aparte del sitio público: arranca directo en
// Conversaciones en vez de la landing de clientes, que es lo que hacía el
// manifest raíz (start_url '/'). Next fusiona esta metadata sobre la del layout
// raíz, así que basta con redeclarar 'manifest'.
export const metadata: Metadata = {
  title: 'AEA Command Center',
  manifest: '/admin-manifest.json',
};

// Fondo oscuro del panel, para que la barra del sistema y el splash de la app
// no salgan en el azul del sitio público.
export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
