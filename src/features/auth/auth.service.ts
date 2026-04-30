import { http } from '../../api/httpClient';
import type { Role, Session } from './auth.store';

export async function signIn(username: string, password: string): Promise<Session> {
  try {
    const user = await http.post<{ id: string; username: string; role: Role }>('/api/auth/login', {
      username,
      password,
    });

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.username, // Podríamos pedir el nombre real si lo agregamos a la tabla
    };
  } catch (error: any) {
    throw new Error(error.message || 'Error al iniciar sesión');
  }
}