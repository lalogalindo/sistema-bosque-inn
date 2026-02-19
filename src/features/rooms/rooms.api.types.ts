import type { RoomStatus } from './rooms.types';

export type EntryType = 'CAR' | 'WALKIN';

export type TimeOption = {
  id: string;
  label: string;
  minutes: number;
};
export type VehicleInfo = {
  plate: string;         // texto normalizado
  photoDataUrl: string;  // base64 data URL (MVP)
  takenAt: string;       // ISO
};

export type Ticket = {
  folio: string;
  roomId: string;
  roomNumber: number;
  createdAt: string; // ISO
  minutes: number;
  entryType: EntryType;

  baseCost: number;
  timeExtraCost: number;
  extrasCost: number;
  totalCost: number;

  statusAtIssue: RoomStatus;

  vehicle?: VehicleInfo;
};

export type ActiveSession = {
  sessionId: string;
  folio: string;
  startedAt: string;
  endsAt: string;

  minutesInitial: number;
  minutesAdded: number;
  entryType: EntryType;

  baseCost: number;
  timeExtraCost: number;
  extrasCost: number;
  totalCost: number;

  vehicle?: VehicleInfo;
};

export type ExtraItem = {
  id: string;
  at: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type RoomLogEventType =
  | 'STATUS_CHANGE'
  | 'TICKET_ISSUED'
  | 'TICKET_REPRINTED'
  | 'TIME_EXTENDED'
  | 'EXTRA_SOLD';

export type RoomLog = {
  id: string;
  at: string;
  roomId: string;
  roomNumber: number;
  type: RoomLogEventType;
  fromStatus?: RoomStatus;
  toStatus?: RoomStatus;
  folio?: string;
  note?: string;
  amount?: number;
  actor?: string;
};

export type HotelConfig = {
  currency: 'MXN';
  roomsCount: number;
  rentalTimeOptions: TimeOption[];
  extendTimeOptions: TimeOption[];
};
