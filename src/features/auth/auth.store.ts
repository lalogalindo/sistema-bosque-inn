export type Role = 'ADMIN' | 'VENDEDOR';

export type Session = {
  username: string;
  role: Role;
};

const KEY = 'hotel_session_v1';

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
