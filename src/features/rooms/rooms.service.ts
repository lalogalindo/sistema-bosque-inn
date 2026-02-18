import type { Room } from './rooms.types';

// Mock “DB” en memoria (luego lo cambias por fetch a tu API)
let ROOMS: Room[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `room-${i + 1}`,
    number: i + 1,
    status: i === 2 ? 'OCUPADA' : 'DISPONIBLE',
    cost: 250,
  }));

export async function getRooms(): Promise<Room[]> {
  // Simula latencia
  await wait(150);
  return structuredClone(ROOMS);
}

export async function updateRoomCost(roomId: string, newCost: number): Promise<Room> {
  await wait(150);

  if (!Number.isFinite(newCost) || newCost <= 0) {
    throw new Error('El costo debe ser un número mayor a 0.');
  }

  const idx = ROOMS.findIndex(r => r.id === roomId);
  if (idx < 0) throw new Error('Habitación no encontrada.');

  ROOMS[idx] = { ...ROOMS[idx], cost: newCost };
  return structuredClone(ROOMS[idx]);
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
