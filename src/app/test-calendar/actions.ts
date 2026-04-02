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

    const eventId = await createCalendarEvent(testEventDetails);

    if (eventId) {
      return { success: true, message: `¡Evento de prueba creado con éxito! Revisa tu Google Calendar para confirmarlo.` };
    } else {
      return { success: false, message: 'La función se ejecutó pero no devolvió un ID de evento. Revisa los logs del servidor y asegúrate de que las variables de entorno del calendario estén configuradas.' };
    }
  } catch (error) {
    console.error('Error creating test event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Un error inesperado ocurrió.';
    return { success: false, message: `Error: ${errorMessage}` };
  }
}
