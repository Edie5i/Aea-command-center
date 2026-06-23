'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/portal/logout', { method: 'POST' });
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="w-full text-sm text-gray-400 py-2 hover:text-gray-600 transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
