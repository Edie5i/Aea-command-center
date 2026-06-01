import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/test-calendar/',
          '/webhook/',
          '/ficha',
          '/notas-alumno/',
          '/pagos/',
          '/encuesta-satisfaccion/',
        ],
      },
    ],
    sitemap: 'https://www.autoescuelaamericana.com/sitemap.xml',
  };
}
