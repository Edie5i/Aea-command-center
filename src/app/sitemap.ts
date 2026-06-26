import { MetadataRoute } from 'next';

const BASE_URL = 'https://app.autoescuelaamericana.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/agenda`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/chatbot`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/evaluacion`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/examen-teorico`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/notas-alumno`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/registro`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];
}
