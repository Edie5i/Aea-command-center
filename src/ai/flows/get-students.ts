
'use server';
/**
 * @fileOverview A flow to get a list of students from Google Calendar events.
 *
 * - getStudents - Fetches future events and parses student data from them.
 * - Student - The data structure for a student.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Define the schema for a single student's data
const StudentSchema = z.object({
  name: z.string().describe('The name of the student.'),
  phone: z.string().describe("The student's contact phone number."),
  address: z.string().describe('The meeting point or address for the class.'),
  transmission: z.string().describe('The vehicle transmission type.'),
  classDates: z.array(z.string()).describe('A list of formatted class dates and times.'),
});

export type Student = z.infer<typeof StudentSchema>;

// Schema for the flow's output
const StudentListSchema = z.array(StudentSchema);

// Function to authenticate and get calendar instance
async function getCalendarClient() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  const authClient = await auth.getClient();
  return google.calendar({ version: 'v3', auth: authClient as any });
}

// Main flow to get and parse student data from calendar events
export const getStudents = ai.defineFlow(
  {
    name: 'getStudents',
    inputSchema: z.void(),
    outputSchema: StudentListSchema,
  },
  async () => {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID environment variable is not set.');
    }

    const calendar = await getCalendarClient();

    // Fetch all future events
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250, // Limit to a reasonable number of future events
    });

    const events = response.data.items || [];
    const studentMap: Map<string, Student> = new Map();

    events.forEach((event) => {
      if (event.start?.dateTime && event.summary && event.summary.toLowerCase().startsWith('clase: ')) {
        const studentName = event.summary.substring(7); // Remove "Clase: "
        
        const props = event.extendedProperties?.private || {};
        const phone = props.phone || 'No disponible';
        const address = props.address || 'No disponible';
        const transmission = props.transmission || 'No especificada';
        const classDate = format(new Date(event.start.dateTime), "EEE, d 'de' MMM, h:mm a", { locale: es });

        if (studentMap.has(studentName)) {
            // Add date to existing student
            const existingStudent = studentMap.get(studentName)!;
            existingStudent.classDates.push(classDate);
        } else {
            // Create new student entry
            studentMap.set(studentName, {
                name: studentName,
                phone,
                address,
                transmission,
                classDates: [classDate],
            });
        }
      }
    });
    
    // Convert map to array and sort dates for each student
    const studentList = Array.from(studentMap.values());
    studentList.forEach(student => student.classDates.sort());

    return studentList;
  }
);
