import type { Room, RoomStatus } from '../rooms.types';
import { dbLoad, dbSave, wait, roundMoney } from '../db/hotelDb';

export async function getRoomsRepo(): Promise<Room[]> {
  await wait(120);
  const db = dbLoad();
  return db.rooms.map((r) => ({ ...r }));
}

export async function updateRoomCostRepo(roomId: string, newCost: number): Promise<void> {
  await wait(120);
  const db = dbLoad();

  if (!Number.isFinite(newCost) || newCost <= 0) throw new Error('Costo inválido');

  const idx = db.rooms.findIndex((r) => r.id === roomId);
  if (idx < 0) throw new Error('Habitación no encontrada');

  db.rooms[idx] = { ...db.rooms[idx], cost: roundMoney(newCost) };
  dbSave(db);
}

export async function updateRoomStatusRepo(roomId: string, status: RoomStatus): Promise<Room> {
  await wait(120);
  const db = dbLoad();

  const idx = db.rooms.findIndex((r) => r.id === roomId);
  if (idx < 0) throw new Error('Habitación no encontrada');

  db.rooms[idx] = { ...db.rooms[idx], status };
  dbSave(db);

  return { ...db.rooms[idx] };
}
