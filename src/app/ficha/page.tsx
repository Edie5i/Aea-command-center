import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FichaForm from './FichaForm';

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export default async function FichaPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }
  return <FichaForm />;
}
