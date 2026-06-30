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
      className="w-full text-sm py-3 transition-colors"
      style={{ color: '#334155' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#475569')}
      onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
    >
      Cerrar sesión
    </button>
  );
}
