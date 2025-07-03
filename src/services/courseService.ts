
'use server';

import { getAuthenticatedSheetsClient } from '@/lib/google-auth';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  order?: number;
  imageUrl?: string;
}

/**
 * Fetches the list of courses from a configured Google Sheet.
 * Courses are ordered by the 'order' column.
 */
export async function getCourses(): Promise<Course[]> {
  const sheets = await getAuthenticatedSheetsClient();
  if (!sheets) {
    throw new Error('El administrador no está autenticado con Google. Por favor, ve a la página /admin para conectar la cuenta.');
  }

  const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  const sheetName = process.env.NEXT_PUBLIC_GOOGLE_SHEET_NAME || 'Cursos';

  if (!spreadsheetId || spreadsheetId.startsWith('YOUR_')) {
    throw new Error('El ID de la Hoja de Cálculo de Google no está configurado. Por favor, agrégalo al archivo .env.');
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A2:E`, // Assumes row 1 is headers. Reads columns A (title) to E (imageUrl).
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    const courses: Course[] = rows
      .map((row, index) => {
        // Expects columns: Title, Description, Price, Order, ImageUrl
        if (!row[0]) return null; // Skip if title is empty
        return {
          id: `sheet-course-${index}`,
          title: row[0] || '',
          description: row[1] || '',
          price: row[2] || '0',
          order: parseInt(row[3], 10) || 99,
          imageUrl: row[4] || '',
        };
      })
      .filter((course): course is Course => course !== null); // Filter out empty rows

    // Sort courses by the 'order' column
    courses.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    return courses;
  } catch (e: any) {
    if (e.message.includes('Not Found') || e.message.includes('Unable to parse range')) {
      throw new Error(`No se pudo encontrar la Hoja de Cálculo. Verifica que el ID ('${spreadsheetId}') sea correcto y que el nombre de la hoja ('${sheetName}') exista en tu archivo.`);
    }
    if (e.message.includes('permission denied')) {
      throw new Error('Permiso denegado para acceder a la Hoja de Cálculo. Asegúrate de haber otorgado permisos de lectura al conectar tu cuenta de Google.');
    }
    console.error("Google Sheets API error:", e);
    throw new Error('Ocurrió un error al intentar leer los datos de la Hoja de Cálculo.');
  }
}
