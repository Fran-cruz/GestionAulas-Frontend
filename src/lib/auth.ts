const API_URL = import.meta.env.VITE_API_URL ?? 'https://darkgray-bee-113622.hostingersite.com/api';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  rol: string;
};

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? data?.email ?? 'No se pudo iniciar sesión.');
  }

  return data as { message: string; user: AuthUser };
}

export async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }).catch(() => undefined);

  localStorage.removeItem('auth_user');
}

export async function forgotPassword(email: string) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message ?? 'No se pudo enviar el enlace.');
  }

  return data as { message: string };
}

export function getStoredAuthUser(): AuthUser | null {
  const raw = localStorage.getItem('auth_user');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
