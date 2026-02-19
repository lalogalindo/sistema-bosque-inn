import type { ActiveSession } from '../rooms.api.types';
import { dbLoad, dbSave, wait } from '../db/hotelDb';

export async function getSessionByRoomRepo(roomId: string): Promise<ActiveSession | undefined> {
  await wait(80);
  const db = dbLoad();
  const s = db.sessionsByRoom[roomId];
  return s ? { ...s } : undefined;
}

export async function setSessionForRoomRepo(roomId: string, session: ActiveSession): Promise<void> {
  await wait(80);
  const db = dbLoad();
  db.sessionsByRoom[roomId] = session;
  dbSave(db);
}

export async function deleteSessionForRoomRepo(roomId: string): Promise<void> {
  await wait(80);
  const db = dbLoad();
  delete db.sessionsByRoom[roomId];
  dbSave(db);
}
