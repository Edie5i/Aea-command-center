'use server';

import { createCalendarEvent } from '@/services/calendarService';

export async function createTestEventAction() {
  try {
    const testEventDetails = {
      studentName: 'Estudiante de Prueba',
      studentPhone: '5555555555',
      studentAddress: 'Av. de la Prueba 123, Colonia Test',
      transmission: 'Automático de Prueba',
      isMinor: false,
      notes: 'Este es un evento de prueba generado automáticamente desde la app.',
      classDate: new Date(), // Today
      classTime: '15:00', // 3:00 PM
    };
    
    // Set date to tomorrow to avoid creating events in the past
    testEventDetails.classDate.setDate(testEventDetails.classDate.getDate() + 1);

    await createCalendarEvent(testEventDetails);

    // If createCalendarEvent succeeds, it returns a string. If it fails, it throws.
    // So if we get here, it was successful.
    return { success: true, message: `¡Evento de prueba creado con éxito! Revisa tu Google Calendar para confirmarlo.` };
    
  } catch (error) {
    console.error('Error creating test event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error inesperado ocurrió.';

    // Check for specific configuration errors and provide a user-friendly message
    if (errorMessage.includes('GOOGLE_CALENDAR_ID')) {
        return { 
            success: false, 
            message: 'CONFIGURACIÓN REQUERIDA: La variable de entorno GOOGLE_CALENDAR_ID no está configurada o es incorrecta. Por favor, ve a la sección de Secretos del proyecto y establece el valor para el secreto GOOGLE_CALENDAR_ID. El valor debe ser el ID de tu calendario (generalmente parece una dirección de correo).' 
        };
    }
    if (errorMessage.includes('CALENDAR_KEY') || errorMessage.includes('Autenticación fallida')) {
        return { 
            success: false, 
            message: 'CONFIGURACIÓN REQUERIDA: La credencial CALENDAR_KEY no está configurada o es inválida. Por favor, ve a la sección de Secretos del proyecto y pega el contenido completo del archivo JSON de tu cuenta de servicio en el secreto CALENDAR_KEY.' 
        };
    }
    if (errorMessage.includes('Permisos insuficientes')) {
        return {
            success: false,
            message: 'ERROR DE PERMISOS: La cuenta de servicio no tiene permiso para editar el calendario. Asegúrate de haber compartido tu calendario con la dirección de correo de la cuenta de servicio (el `client_email` del archivo JSON) y de haberle dado el permiso "Hacer cambios en los eventos".'
        }
    }

    // Generic error for other cases
    return { success: false, message: `Error: ${errorMessage}` };
  }
}
