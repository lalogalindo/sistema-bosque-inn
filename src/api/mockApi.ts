import type { Room, RoomStatus } from '../features/rooms/rooms.types';
import type {
  ActiveSession,
  EntryType,
  ExtraItem,
  HotelConfig,
  RoomLog,
  Ticket,
  TimeOption,
} from '../features/rooms/rooms.api.types';
import { HOTEL_MOCK } from '../mocks/hotel.mock';

const DB_KEY = 'hotel_lupe_db_v2_api';

type DB = {
  config: HotelConfig;
  rooms: Room[];
  sessionsByRoom: Record<string, ActiveSession | undefined>;
  ticketsByFolio: Record<string, Ticket | undefined>;
  extrasByFolio: Record<string, ExtraItem[] | undefined>;
  logs: RoomLog[];
};

function seedDb(): DB {
  return {
    config: {
      currency: HOTEL_MOCK.config.currency,
      roomsCount: HOTEL_MOCK.config.roomsCount,
      rentalTimeOptions: HOTEL_MOCK.config.rentalTimeOptions.map(mapTime),
      extendTimeOptions: HOTEL_MOCK.config.extendTimeOptions.map(mapTime),
    },
    rooms: HOTEL_MOCK.rooms.map((r) => ({ id: r.id, number: r.number, status: r.status, cost: r.cost })),
    sessionsByRoom: {},
    ticketsByFolio: {},
    extrasByFolio: {},
    logs: [],
  };
}

function mapTime(x: { id: string; label: string; minutes: number }): TimeOption {
  return { id: x.id, label: x.label, minutes: x.minutes };
}

function loadDb(): DB {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw) as DB;
  const db = seedDb();
  saveDb(db);
  return db;
}

function saveDb(db: DB) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function err(message: string, status = 400) {
  return json({ message }, status);
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(): string {
  const anyCrypto = globalThis.crypto as Crypto | undefined;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function addLog(db: DB, input: Omit<RoomLog, 'id' | 'at'>) {
  db.logs.push({ id: makeId(), at: nowIso(), ...input });
}

function parseUrl(url: string) {
  // url puede venir como "/rooms" (mock) o "https://..." (real)
  const u = url.startsWith('http') ? new URL(url) : new URL(`http://mock${url}`);
  return { path: u.pathname, search: u.searchParams };
}

export async function mockFetch(url: string, init?: RequestInit): Promise<Response> {
  // simula latencia
  await new Promise((r) => setTimeout(r, 120));

  const method = (init?.method ?? 'GET').toUpperCase();
  const { path, search } = parseUrl(url);
  const db = loadDb();

  // -------- CONFIG --------
  if (method === 'GET' && path === '/api/config') return json(db.config);

  // -------- ROOMS --------
  if (method === 'GET' && path === '/api/rooms') {
    const rooms = db.rooms.map((r) => ({ ...r, activeSession: db.sessionsByRoom[r.id] }));
    return json(rooms);
  }

  // PATCH /api/rooms/:id/status
  {
    const m = path.match(/^\/api\/rooms\/([^/]+)\/status$/);
    if (m && method === 'PATCH') {
      const roomId = decodeURIComponent(m[1]);
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const status = body?.status as RoomStatus;

      const idx = db.rooms.findIndex((r) => r.id === roomId);
      if (idx < 0) return err('Habitación no encontrada', 404);

      const from = db.rooms[idx].status;
      db.rooms[idx] = { ...db.rooms[idx], status };

      if (status !== 'OCUPADA') delete db.sessionsByRoom[roomId];

      addLog(db, {
        roomId,
        roomNumber: db.rooms[idx].number,
        type: 'STATUS_CHANGE',
        fromStatus: from,
        toStatus: status,
      });

      saveDb(db);
      return json({ ok: true });
    }
  }
// POST /api/rooms/:id/vehicle { plate, photoDataUrl }
{
  const m = path.match(/^\/api\/rooms\/([^/]+)\/vehicle$/);
  if (m && method === 'POST') {
    const roomId = decodeURIComponent(m[1]);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const plateRaw = String(body?.plate ?? '');
    const photoDataUrl = String(body?.photoDataUrl ?? '');

    const room = db.rooms.find((r) => r.id === roomId);
    const s = db.sessionsByRoom[roomId];
    if (!room || !s) return err('No hay sesión activa', 400);

    if (!plateRaw.trim()) return err('Placa requerida');
    if (!photoDataUrl.startsWith('data:image/')) return err('Foto inválida');

    const vehicle = {
      plate: plateRaw.trim(),
      photoDataUrl,
      takenAt: nowIso(),
    };

    // guarda en sesión y en ticket
    s.vehicle = vehicle;
    const t = db.ticketsByFolio[s.folio];
    if (t) t.vehicle = vehicle;

    addLog(db, {
      roomId,
      roomNumber: room.number,
      type: 'EXTRA_SOLD', // si prefieres, crea un tipo nuevo VEHICLE_CAPTURED
      folio: s.folio,
      note: `Foto/placa capturada: ${vehicle.plate}`,
    });

    saveDb(db);
    return json({ ok: true, vehicle });
  }
}

  // PATCH /api/rooms/:id/cost
  {
    const m = path.match(/^\/api\/rooms\/([^/]+)\/cost$/);
    if (m && method === 'PATCH') {
      const roomId = decodeURIComponent(m[1]);
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const cost = Number(body?.cost);

      if (!Number.isFinite(cost) || cost <= 0) return err('Costo inválido');

      const idx = db.rooms.findIndex((r) => r.id === roomId);
      if (idx < 0) return err('Habitación no encontrada', 404);

      db.rooms[idx] = { ...db.rooms[idx], cost: roundMoney(cost) };
      saveDb(db);
      return json({ ok: true });
    }
  }

  // -------- TICKETS --------
  // POST /api/tickets  { roomId, minutes, entryType }
  if (method === 'POST' && path === '/api/tickets') {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const roomId = String(body?.roomId ?? '');
    const minutes = Number(body?.minutes ?? 0);
    const entryType = body?.entryType as EntryType;

    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) return err('Habitación no encontrada', 404);
    if (room.status === 'OCUPADA') return err('La habitación ya está ocupada');

    if (!Number.isFinite(minutes) || minutes <= 0) return err('Tiempo inválido');
    if (entryType !== 'CAR' && entryType !== 'WALKIN') return err('Entrada inválida');

    const now = new Date();
    const ends = new Date(now.getTime() + minutes * 60_000);
    const folio = `HL-${now.getTime()}`;

    const baseCost = room.cost;

    const session: ActiveSession = {
      sessionId: makeId(),
      folio,
      startedAt: now.toISOString(),
      endsAt: ends.toISOString(),
      minutesInitial: minutes,
      minutesAdded: 0,
      entryType,
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
      minutes,
      entryType,
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

    addLog(db, {
      roomId: room.id,
      roomNumber: room.number,
      type: 'STATUS_CHANGE',
      fromStatus: room.status,
      toStatus: 'OCUPADA',
      folio,
      note: 'Ocupada por emisión de ticket',
    });

    addLog(db, {
      roomId: room.id,
      roomNumber: room.number,
      type: 'TICKET_ISSUED',
      folio,
      amount: baseCost,
      note: `Tiempo: ${minutes} min, entrada: ${entryType}`,
    });

    saveDb(db);
    return json(ticket, 201);
  }

  // GET /api/tickets/:folio
  {
    const m = path.match(/^\/api\/tickets\/([^/]+)$/);
    if (m && method === 'GET') {
      const folio = decodeURIComponent(m[1]);
      const t = db.ticketsByFolio[folio];
      if (!t) return err('Ticket no encontrado', 404);
      return json(t);
    }
  }

  // GET /api/rooms/:id/ticket
  {
    const m = path.match(/^\/api\/rooms\/([^/]+)\/ticket$/);
    if (m && method === 'GET') {
      const roomId = decodeURIComponent(m[1]);
      const s = db.sessionsByRoom[roomId];
      if (!s) return json(null);
      const t = db.ticketsByFolio[s.folio] ?? null;
      return json(t);
    }
  }

  // POST /api/rooms/:id/reprint
  {
    const m = path.match(/^\/api\/rooms\/([^/]+)\/reprint$/);
    if (m && method === 'POST') {
      const roomId = decodeURIComponent(m[1]);
      const room = db.rooms.find((r) => r.id === roomId);
      const s = db.sessionsByRoom[roomId];
      if (!room || !s) return err('No hay sesión activa', 400);

      addLog(db, {
        roomId,
        roomNumber: room.number,
        type: 'TICKET_REPRINTED',
        folio: s.folio,
      });

      saveDb(db);
      return json({ ok: true });
    }
  }

  // POST /api/rooms/:id/extend { minutesToAdd }
  {
    const m = path.match(/^\/api\/rooms\/([^/]+)\/extend$/);
    if (m && method === 'POST') {
      const roomId = decodeURIComponent(m[1]);
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const minutesToAdd = Number(body?.minutesToAdd ?? 0);

      const room = db.rooms.find((r) => r.id === roomId);
      const s = db.sessionsByRoom[roomId];
      if (!room || !s) return err('No hay sesión activa', 400);
      if (!Number.isFinite(minutesToAdd) || minutesToAdd <= 0) return err('Minutos inválidos');

      const ratePerMinute = s.baseCost / s.minutesInitial;
      const extraCost = roundMoney(ratePerMinute * minutesToAdd);

      const newEnds = new Date(new Date(s.endsAt).getTime() + minutesToAdd * 60_000);
      s.minutesAdded += minutesToAdd;
      s.endsAt = newEnds.toISOString();
      s.timeExtraCost = roundMoney(s.timeExtraCost + extraCost);
      s.totalCost = roundMoney(s.baseCost + s.timeExtraCost + s.extrasCost);

      const t = db.ticketsByFolio[s.folio];
      if (t) {
        t.timeExtraCost = s.timeExtraCost;
        t.totalCost = s.totalCost;
      }

      addLog(db, {
        roomId,
        roomNumber: room.number,
        type: 'TIME_EXTENDED',
        folio: s.folio,
        amount: extraCost,
        note: `Se agregaron ${minutesToAdd} min`,
      });

      saveDb(db);
      return json({ ok: true, extraCost, endsAt: s.endsAt });
    }
  }

  // POST /api/rooms/:id/sales { description, amount }
  {
    const m = path.match(/^\/api\/rooms\/([^/]+)\/sales$/);
    if (m && method === 'POST') {
      const roomId = decodeURIComponent(m[1]);
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const description = String(body?.description ?? '').trim();
      const amount = Number(body?.amount ?? 0);

      const room = db.rooms.find((r) => r.id === roomId);
      const s = db.sessionsByRoom[roomId];
      if (!room || !s) return err('No hay sesión activa', 400);
      if (!description) return err('Descripción requerida');
      if (!Number.isFinite(amount) || amount <= 0) return err('Monto inválido');

      const total = roundMoney(amount);

      const item: ExtraItem = {
        id: makeId(),
        at: nowIso(),
        name: description,
        qty: 1,
        unitPrice: total,
        total,
      };

      db.extrasByFolio[s.folio] = [...(db.extrasByFolio[s.folio] ?? []), item];

      s.extrasCost = roundMoney(s.extrasCost + total);
      s.totalCost = roundMoney(s.baseCost + s.timeExtraCost + s.extrasCost);

      const t = db.ticketsByFolio[s.folio];
      if (t) {
        t.extrasCost = s.extrasCost;
        t.totalCost = s.totalCost;
      }

      addLog(db, {
        roomId,
        roomNumber: room.number,
        type: 'EXTRA_SOLD',
        folio: s.folio,
        amount: total,
        note: description,
      });

      saveDb(db);
      return json({ ok: true, item });
    }
  }

  // GET /api/tickets/:folio/extras
  {
    const m = path.match(/^\/api\/tickets\/([^/]+)\/extras$/);
    if (m && method === 'GET') {
      const folio = decodeURIComponent(m[1]);
      return json(db.extrasByFolio[folio] ?? []);
    }
  }

  // GET /api/logs?roomId=&from=&to=
  if (method === 'GET' && path === '/api/logs') {
    let logs = [...db.logs];
    const roomId = search.get('roomId') ?? undefined;
    const from = search.get('from') ?? undefined;
    const to = search.get('to') ?? undefined;

    if (roomId) logs = logs.filter((l) => l.roomId === roomId);
    if (from) logs = logs.filter((l) => l.at >= from);
    if (to) logs = logs.filter((l) => l.at <= to);

    logs.sort((a, b) => (a.at < b.at ? 1 : -1));
    return json(logs);
  }

  return err(`Mock API: ruta no soportada (${method} ${path})`, 404);
}
