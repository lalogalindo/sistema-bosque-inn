import type { RoomLog } from '../rooms.api.types';
import { dbClone, dbLoad, dbSave, makeId, nowIso, wait } from '../db/hotelDb';

export async function addLogRepo(input: Omit<RoomLog, 'id' | 'at'>): Promise<void> {
  await wait(60);
  const db = dbLoad();
  db.logs.push({ id: makeId(), at: nowIso(), ...input });
  dbSave(db);
}

export async function getLogsRepo(params?: {
  roomId?: string;
  from?: string;
  to?: string;
}): Promise<RoomLog[]> {
  await wait(120);
  const db = dbLoad();

  const roomId = params?.roomId;
  const from = params?.from;
  const to = params?.to;

  let logs = [...db.logs];

  if (roomId) logs = logs.filter((l) => l.roomId === roomId);
  if (from) logs = logs.filter((l) => l.at >= from);
  if (to) logs = logs.filter((l) => l.at <= to);

  logs.sort((a, b) => (a.at < b.at ? 1 : -1));
  return dbClone(logs);
}
