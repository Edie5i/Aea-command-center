
'use server';
/**
 * @fileOverview A flow to get and organize weekly scheduled courses.
 *
 * - getWeeklySchedule - Fetches all courses and organizes them by day of the current week.
 * - WeeklySchedule - The return type for the getWeeklySchedule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, collection, getDocs } from 'firebase/admin/firestore';
import { adminApp } from '@/lib/firebase-admin';

const db = getFirestore(adminApp);

const CourseSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  time: z.string().describe('The scheduled time for the class.'),
  transmission: z.string().describe('The vehicle transmission type (Automático or Estándar).'),
  classDate: z.string().describe('The date of the class in YYYY-MM-DD format.'),
});

export type Course = z.infer<typeof CourseSchema>;

const WeeklyScheduleSchema = z.object({
  lunes: z.array(CourseSchema),
  martes: z.array(CourseSchema),
  miércoles: z.array(CourseSchema),
  jueves: z.array(CourseSchema),
  viernes: z.array(CourseSchema),
  sábado: z.array(CourseSchema),
  domingo: z.array(CourseSchema),
});

export type WeeklySchedule = z.infer<typeof WeeklyScheduleSchema>;

const GetWeeklyScheduleOutputSchema = WeeklyScheduleSchema;

const GetWeeklyScheduleInputSchema = z.object({
  allCourses: z.array(CourseSchema),
  currentDate: z.string().describe('The current date in YYYY-MM-DD format.'),
});

export async function getWeeklySchedule(): Promise<WeeklySchedule> {
  return getWeeklyScheduleFlow();
}

const prompt = ai.definePrompt({
  name: 'organizeSchedulePrompt',
  input: { schema: GetWeeklyScheduleInputSchema },
  output: { schema: GetWeeklyScheduleOutputSchema },
  prompt: `You are a scheduling assistant. Your task is to organize a list of scheduled courses into a weekly calendar structure.
The current date is {{currentDate}}.
Based on the 'classDate' of each course, place it under the correct day of the current week (lunes, martes, etc.).
If a course date is not in the current week, do not include it.
The week starts on Monday.

List of all courses:
{{{json allCourses}}}
`,
});

const getWeeklyScheduleFlow = ai.defineFlow(
  {
    name: 'getWeeklyScheduleFlow',
    inputSchema: z.void(),
    outputSchema: GetWeeklyScheduleOutputSchema,
  },
  async () => {
    // 1. Fetch all documents from the 'scheduledCourses' collection in Firestore.
    const coursesSnapshot = await getDocs(collection(db, 'scheduledCourses'));
    const coursesList: Course[] = [];
    coursesSnapshot.forEach((doc) => {
      const data = doc.data();
      // Validate data with Zod schema before pushing
      const validation = CourseSchema.safeParse({
          studentName: data.studentName,
          time: data.time,
          transmission: data.transmission,
          classDate: data.classDate,
      });
      if(validation.success) {
          coursesList.push(validation.data);
      }
    });

    // 2. Get the current date in YYYY-MM-DD format.
    const currentDate = new Date().toISOString().split('T')[0];

    // 3. Call the Genkit prompt to organize the data.
    const { output } = await prompt({
      allCourses: coursesList,
      currentDate: currentDate,
    });

    if (!output) {
      throw new Error('AI failed to generate a schedule.');
    }
    
    return output;
  }
);
