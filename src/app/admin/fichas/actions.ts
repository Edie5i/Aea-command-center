
'use server';

import { adminDb, adminStorage } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const FichaSchema = z.object({
  studentName: z.string().min(2, { message: 'El nombre del alumno es requerido.' }),
  classDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'La fecha no es válida.' }),
});

export async function uploadFichaAction(prevState: any, formData: FormData) {
  const validatedFields = FichaSchema.safeParse({
    studentName: formData.get('studentName'),
    classDate: formData.get('classDate'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Error de validación.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { studentName, classDate } = validatedFields.data;
  const file = formData.get('file') as File;

  if (!file || file.size === 0) {
    return { message: 'No se ha seleccionado ningún archivo.', errors: null };
  }

  try {
    const bucket = adminStorage.bucket();
    const fileName = `${Date.now()}-${file.name}`;
    const fileRef = bucket.file(`fichas-inscripcion/${fileName}`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file publicly readable
    await fileRef.makePublic();
    const publicUrl = fileRef.publicUrl();

    await adminDb.collection('fichas').add({
      studentName,
      classDate: new Date(classDate),
      fileUrl: publicUrl,
      fileName: fileName,
      uploadedAt: new Date(),
    });

    revalidatePath('/admin/fichas');
    return { message: 'Ficha subida con éxito.', errors: null };
  } catch (error) {
    console.error('Error al subir la ficha:', error);
    return { message: 'Error en el servidor al subir la ficha.', errors: null };
  }
}
