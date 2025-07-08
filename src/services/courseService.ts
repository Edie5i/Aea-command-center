'use server';

import { botContextData } from '@/lib/bot-data';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  order?: number;
  imageUrl?: string;
}

/**
 * Fetches the list of courses from local data.
 */
export async function getCourses(): Promise<Course[]> {
  const courses: Course[] = botContextData.catalogoCursos.map((c, index) => ({
    id: c.nombre.toLowerCase().replace(/\s/g, '-'),
    title: c.nombre,
    description: c.descripcion,
    price: c.precioMXN.toString(),
    order: index,
  }));

  courses.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  return courses;
}
