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

    return { success: true, message: `¡Evento de prueba creado con éxito! Revisa tu Google Calendar para confirmarlo.` };
    
  } catch (error) {
    console.error('Error creating test event:', error);
    // The calendarService now throws user-friendly error messages directly.
    const errorMessage = error instanceof Error ? error.message : 'Un error inesperado ocurrió.';
    return { success: false, message: errorMessage };
  }
}
