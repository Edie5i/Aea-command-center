'use server';

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  order?: number; // Optional: use this field in Firestore to control the display order
  imageUrl?: string;
}

/**
 * Fetches the list of courses from the 'courses' collection in Firestore.
 * Courses are ordered by the 'order' field in ascending order.
 */
export async function getCourses(): Promise<Course[]> {
  const coursesCollection = collection(db, 'courses');
  const q = query(coursesCollection, orderBy('order', 'asc'));
  const courseSnapshot = await getDocs(q);

  if (courseSnapshot.empty) {
    return [];
  }

  const courses: Course[] = courseSnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Course, 'id'>)
  }));

  return courses;
}
