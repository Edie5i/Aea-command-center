
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Ficha {
  id: string;
  studentName: string;
  classDate: Date;
  fileUrl: string;
}

export function useFichas() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'fichas'), orderBy('classDate', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fichasData: Ficha[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fichasData.push({
            id: doc.id,
            studentName: data.studentName,
            // Firestore timestamps need to be converted to JS Dates
            classDate: (data.classDate as Timestamp).toDate(),
            fileUrl: data.fileUrl,
          });
        });
        setFichas(fichasData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching fichas:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { fichas, loading, error };
}
