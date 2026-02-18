import type { Role, Session } from './auth.store';

// MOCK local (MVP). Luego lo cambias por fetch a tu API.
const USERS: Array<{ email: string; password: string; role: Role }> = [
  { email: 'admin@hotel.com', password: '123456', role: 'ADMIN' },
  { email: 'vendedor@hotel.com', password: '123456', role: 'VENDEDOR' },
];

export async function signIn(email: string, password: string): Promise<Session> {
  await wait(200);

  const user = USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    throw new Error('Usuario o contraseña inválidos.');
  }

  return { username: user.email, role: user.role };
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
