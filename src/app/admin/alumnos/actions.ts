
'use server';

import { getStudents as getStudentsFlow, type Student } from '@/ai/flows/get-students';

export { type Student };

export async function getStudents() {
  try {
    const students = await getStudentsFlow();
    return { students, error: null };
  } catch (error) {
    console.error('Error fetching students:', error);
    const errorMessage = error instanceof Error ? error.message : 'Hubo un problema al obtener los datos de los alumnos.';
    return { students: null, error: errorMessage };
  }
}
