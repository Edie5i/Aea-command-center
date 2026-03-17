
'use server';

import { getStudents as getStudentsFlow, type Student } from '@/ai/flows/get-students';

export { type Student };

export async function getStudents() {
  try {
    const students = await getStudentsFlow();
    return { students, error: null };
  } catch (error) {
    console.error('Error fetching students:', error);
    let errorMessage = 'Hubo un problema al obtener los datos de los alumnos.';
    if (error instanceof Error) {
        if (error.message.includes('GOOGLE_CALENDAR_ID')) {
            errorMessage = 'Error de Configuración: Falta la variable GOOGLE_CALENDAR_ID. Asegúrate de que esté configurada en tu entorno.';
        } else if (error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('permissions')) {
            errorMessage = 'Error de Permisos: La aplicación no tiene permiso para leer el calendario. Asegúrate de haber compartido tu Google Calendar con la cuenta de servicio del proyecto y haberle dado permisos para "Hacer cambios en los eventos".';
        } else if (error.message.includes('Not Found') || error.message.includes('404')) {
            errorMessage = 'Error de Calendario: No se encontró el calendario. Verifica que el GOOGLE_CALENDAR_ID sea correcto.';
        } else {
            errorMessage = `Error inesperado: ${error.message}`;
        }
    }
    return { students: null, error: errorMessage };
  }
}
