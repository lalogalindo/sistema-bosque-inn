import type { Room } from '../rooms.types';
import type { ActiveSession, ExtraItem, HotelConfig, RoomLog, Ticket } from '../rooms.api.types';
import { HOTEL_MOCK } from '../../../mocks/hotel.mock';
import { HOTEL_DB_KEY } from './hotelDb.keys';

export type HotelDb = {
  config: HotelConfig;
  rooms: Room[];
  sessionsByRoom: Record<string, ActiveSession | undefined>;
  ticketsByFolio: Record<string, Ticket | undefined>;
  extrasByFolio: Record<string, ExtraItem[] | undefined>;
  logs: RoomLog[];
};

export function dbLoad(): HotelDb {
  const raw = localStorage.getItem(HOTEL_DB_KEY);
  if (raw) return JSON.parse(raw) as HotelDb;

  const seeded: HotelDb = {
    config: {
      currency: HOTEL_MOCK.config.currency,
      roomsCount: HOTEL_MOCK.config.roomsCount,
      rentalTimeOptions: HOTEL_MOCK.config.rentalTimeOptions.map((x) => ({ ...x })),
      extendTimeOptions: HOTEL_MOCK.config.extendTimeOptions.map((x) => ({ ...x })),
    },
    rooms: HOTEL_MOCK.rooms.map((r) => ({
      id: r.id,
      number: r.number,
      status: r.status,
      cost: r.cost,
    })),
    sessionsByRoom: {},
    ticketsByFolio: {},
    extrasByFolio: {},
    logs: [],
  };

  dbSave(seeded);
  return seeded;
}

export function dbSave(db: HotelDb) {
  localStorage.setItem(HOTEL_DB_KEY, JSON.stringify(db));
}

export function dbClone<T>(v: T): T {
  // structuredClone no siempre está tipado/soportado en todos lados; JSON ok para este caso
  return JSON.parse(JSON.stringify(v)) as T;
}

export function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(): string {
  const anyCrypto = globalThis.crypto as Crypto | undefined;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}
