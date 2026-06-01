import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'English Driving Course in Mexico City | Auto Escuela Americana',
  description: 'Learn to drive in Mexico City with English-speaking certified instructors. Personalized 1-on-1 classes in Roma Sur and door-to-door. Book your lesson today.',
  alternates: {
    canonical: 'https://www.autoescuelaamericana.com/english-course',
  },
  robots: 'index, follow',
};

export default function EnglishCourseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
