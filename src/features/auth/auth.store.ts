export type Role = 'ADMIN' | 'VENDEDOR';

export type Session = {
  username: string;
  role: Role;
  name: string;
};

const KEY = 'hotel_session_v1';

export function getCurrentUser(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function setSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}