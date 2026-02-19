import type { Room, RoomStatus } from './rooms.types';
import type { ActiveSession, EntryType, ExtraItem, HotelConfig, RoomLog, Ticket, TimeOption } from './rooms.api.types';

import { dbLoad, dbSave, wait, makeId, roundMoney } from './db/hotelDb';
import { getConfigRepo, getExtendTimeOptionsRepo, getRentalTimeOptionsRepo } from './repos/config.repo';
import { getRoomsRepo, updateRoomCostRepo, updateRoomStatusRepo } from './repos/rooms.repo';
import { addLogRepo, getLogsRepo } from './repos/logs.repo';
import { addGeneralSaleRepo, getExtrasRepo } from './repos/sales.repo';
import { getTicketRepo } from './repos/tickets.repo';
import { deleteSessionForRoomRepo, getSessionByRoomRepo } from './repos/sessions.repo';

export type { EntryType, Ticket, ActiveSession, ExtraItem, RoomLog, TimeOption, HotelConfig };

export async function getConfig(): Promise<HotelConfig> {
  return getConfigRepo();
}

export async function getRentalTimeOptions(): Promise<TimeOption[]> {
  return getRentalTimeOptionsRepo();
}

export async function getExtendTimeOptions(): Promise<TimeOption[]> {
  return getExtendTimeOptionsRepo();
}

export async function getRooms(): Promise<Array<Room & { activeSession?: ActiveSession }>> {
  const rooms = await getRoomsRepo();
  const db = dbLoad(); // solo para mapear sesiones sin más repos
  return rooms.map((r) => ({ ...r, activeSession: db.sessionsByRoom[r.id] }));
}

export async function updateRoomCost(roomId: string, newCost: number): Promise<void> {
  await updateRoomCostRepo(roomId, newCost);
}

export async function updateRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
  const db = dbLoad();
  const roomBefore = db.rooms.find(r => r.id === roomId);
  const from = roomBefore?.status;

  const updated = await updateRoomStatusRepo(roomId, status);

  // si deja de estar ocupada, limpia sesión
  if (status !== 'OCUPADA') {
    await deleteSessionForRoomRepo(roomId);
  }

  await addLogRepo({
    roomId,
    roomNumber: updated.number,
    type: 'STATUS_CHANGE',
    fromStatus: from,
    toStatus: status,
  });
}

export async function createTicket(input: {
  roomId: string;
  minutes: number;
  entryType: EntryType;
}): Promise<Ticket> {
  await wait(180);
  const db = dbLoad();

  const room = db.rooms.find((r) => r.id === input.roomId);
  if (!room) throw new Error('Habitación no encontrada');

  if (room.status === 'OCUPADA') {
    const existing = db.sessionsByRoom[room.id];
    if (existing) {
      const t = db.ticketsByFolio[existing.folio];
      if (t) return { ...t };
    }
    throw new Error('La habitación ya está ocupada.');
  }

  const now = new Date();
  const ends = new Date(now.getTime() + input.minutes * 60_000);
  const folio = `HL-${now.getTime()}`;

  const baseCost = room.cost;

  const session: ActiveSession = {
    sessionId: makeId(),
    folio,
    startedAt: now.toISOString(),
    endsAt: ends.toISOString(),
    minutesInitial: input.minutes,
    minutesAdded: 0,
    entryType: input.entryType,
    baseCost,
    timeExtraCost: 0,
    extrasCost: 0,
    totalCost: baseCost,
  };

  const ticket: Ticket = {
    folio,
    roomId: room.id,
    roomNumber: room.number,
    createdAt: now.toISOString(),
    minutes: input.minutes,
    entryType: input.entryType,
    baseCost,
    timeExtraCost: 0,
    extrasCost: 0,
    totalCost: baseCost,
    statusAtIssue: 'OCUPADA',
  };

  db.sessionsByRoom[room.id] = session;
  db.ticketsByFolio[folio] = ticket;
  db.extrasByFolio[folio] = [];
  db.rooms = db.rooms.map((r) => (r.id === room.id ? { ...r, status: 'OCUPADA' } : r));
  dbSave(db);

  await addLogRepo({
    roomId: room.id,
    roomNumber: room.number,
    type: 'STATUS_CHANGE',
    fromStatus: room.status,
    toStatus: 'OCUPADA',
    folio,
    note: 'Ocupada por emisión de ticket',
  });

  await addLogRepo({
    roomId: room.id,
    roomNumber: room.number,
    type: 'TICKET_ISSUED',
    folio,
    amount: baseCost,
    note: `Tiempo: ${input.minutes} min, entrada: ${input.entryType}`,
  });

  return { ...ticket };
}

export async function getTicketByFolio(folio: string): Promise<Ticket> {
  const t = await getTicketRepo(folio);
  if (!t) throw new Error('Ticket no encontrado');
  return t;
}

export async function getActiveTicketForRoom(roomId: string): Promise<Ticket | null> {
  const s = await getSessionByRoomRepo(roomId);
  if (!s) return null;
  const t = await getTicketRepo(s.folio);
  return t ?? null;
}

export async function getExtrasForFolio(folio: string): Promise<ExtraItem[]> {
  return getExtrasRepo(folio);
}

export async function getRoomLogs(params?: { roomId?: string; from?: string; to?: string }): Promise<RoomLog[]> {
  return getLogsRepo(params);
}

export async function logReprint(roomId: string): Promise<void> {
  const db = dbLoad();
  const room = db.rooms.find(r => r.id === roomId);
  const s = db.sessionsByRoom[roomId];
  if (!room || !s) return;

  await addLogRepo({
    roomId,
    roomNumber: room.number,
    type: 'TICKET_REPRINTED',
    folio: s.folio,
  });
}

export async function extendTimeForRoom(input: { roomId: string; minutesToAdd: number }): Promise<void> {
  await wait(180);
  const db = dbLoad();

  const room = db.rooms.find((r) => r.id === input.roomId);
  if (!room) throw new Error('Habitación no encontrada');

  const session = db.sessionsByRoom[input.roomId];
  if (!session) throw new Error('La habitación no tiene sesión activa.');

  if (!Number.isFinite(input.minutesToAdd) || input.minutesToAdd <= 0) {
    throw new Error('Minutos inválidos.');
  }

  const ratePerMinute = session.baseCost / session.minutesInitial;
  const extraCost = roundMoney(ratePerMinute * input.minutesToAdd);

  const newEnds = new Date(new Date(session.endsAt).getTime() + input.minutesToAdd * 60_000);

  session.minutesAdded += input.minutesToAdd;
  session.endsAt = newEnds.toISOString();

  session.timeExtraCost = roundMoney(session.timeExtraCost + extraCost);
  session.totalCost = roundMoney(session.baseCost + session.timeExtraCost + session.extrasCost);

  const ticket = db.ticketsByFolio[session.folio];
  if (ticket) {
    ticket.timeExtraCost = session.timeExtraCost;
    ticket.totalCost = session.totalCost;
  }

  dbSave(db);

  await addLogRepo({
    roomId: room.id,
    roomNumber: room.number,
    type: 'TIME_EXTENDED',
    folio: session.folio,
    amount: extraCost,
    note: `Se agregaron ${input.minutesToAdd} min`,
  });
}

export async function sellGeneralExtraForRoom(input: {
  roomId: string;
  description: string;
  amount: number;
}): Promise<void> {
  await wait(180);
  const db = dbLoad();

  const room = db.rooms.find((r) => r.id === input.roomId);
  if (!room) throw new Error('Habitación no encontrada');

  const session = db.sessionsByRoom[input.roomId];
  if (!session) throw new Error('La habitación no tiene sesión activa.');

  const description = input.description.trim();
  if (!description) throw new Error('Descripción requerida');

  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Monto inválido');

  const item = await addGeneralSaleRepo(session.folio, description, input.amount);

  // recalcular acumulados
  const db2 = dbLoad();
  const s2 = db2.sessionsByRoom[input.roomId]!;
  s2.extrasCost = roundMoney(s2.extrasCost + item.total);
  s2.totalCost = roundMoney(s2.baseCost + s2.timeExtraCost + s2.extrasCost);

  const t2 = db2.ticketsByFolio[s2.folio];
  if (t2) {
    t2.extrasCost = s2.extrasCost;
    t2.totalCost = s2.totalCost;
  }
  dbSave(db2);

  await addLogRepo({
    roomId: room.id,
    roomNumber: room.number,
    type: 'EXTRA_SOLD',
    folio: s2.folio,
    amount: item.total,
    note: description,
  });
}
