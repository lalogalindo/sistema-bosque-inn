import type { Role, Session } from './auth.store';

// MOCK local (MVP). Luego lo cambias por fetch a tu API.
const USERS: Array<{ username: string; password: string; role: Role, name: string }> = [
  { username: 'admin', password: '123456', role: 'ADMIN', name: 'Alejandro Galindo' },
  { username: 'pedro', password: '234567', role: 'VENDEDOR', name: 'Pedro Reyes' },
  { username: 'lalogalindo', password: '345678', role: 'ADMIN', name: 'Eduardo Galindo' },
];

export async function signIn(username: string, password: string): Promise<Session> {
  await wait(200);

  const user = USERS.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password
  );

  if (!user) {
    throw new Error('Usuario o contraseña inválidos.');
  }

  return {
    username: user.username,
    role: user.role,
    name: user.name
  };
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}