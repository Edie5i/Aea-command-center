import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AgendaNLP from './AgendaNLP'; // v2

const ADMIN_PIN = (process.env.ADMIN_PIN ?? '1234').trim();

export default async function AgendaPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('admin_pin')?.value !== ADMIN_PIN) {
    redirect('/admin/conversaciones/login');
  }
  return <AgendaNLP />;
}
