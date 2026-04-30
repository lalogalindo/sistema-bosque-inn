import { mockFetch } from './mockApi';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpClientOptions = {
  baseUrl: string; // ej: "mock" o "https://tu-api.com"
  useMock: boolean;
};

const opts: HttpClientOptions = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'mock',
  useMock: (import.meta.env.VITE_USE_MOCK_API ?? 'true') === 'true',
};

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const url = opts.baseUrl === 'mock' ? path : `${opts.baseUrl}${path}`;

  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body !== undefined) {
    // Si hay una sesión activa, inyectamos el userId en el cuerpo de la petición
    // para que el servidor sepa quién hizo el cambio.
    const sessionRaw = localStorage.getItem('hotel_session_v1');
    let enrichedBody = body;
    if (sessionRaw && typeof body === 'object' && body !== null) {
        try {
            const session = JSON.parse(sessionRaw);
            if (session.id) {
                enrichedBody = { ...body, userId: session.id };
            }
        } catch {}
    }
    init.body = JSON.stringify(enrichedBody);
  }

  const res = opts.useMock ? await mockFetch(url, init) : await fetch(url, init);

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  // 204 no content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
