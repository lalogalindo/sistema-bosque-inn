import { http } from '../../../api/httpClient';
import type { Ticket, EntryType, ExtraItem, VehicleInfo } from '../rooms.api.types';

function normalizeTicket(raw: any): Ticket {
  return {
    folio: raw.folio,
    roomId: raw.roomId ?? raw.room_id,
    roomNumber: raw.roomNumber ?? raw.room_number,
    createdAt: raw.createdAt ?? raw.created_at,
    minutes: raw.minutes,
    entryType: raw.entryType ?? raw.entry_type,
    baseCost: raw.baseCost ?? raw.base_cost ?? 0,
    timeExtraCost: raw.timeExtraCost ?? raw.time_extra_cost ?? 0,
    extrasCost: raw.extrasCost ?? raw.extras_cost ?? 0,
    totalCost: raw.totalCost ?? raw.total_cost ?? 0,
    statusAtIssue: raw.statusAtIssue ?? raw.status_at_issue,
    vehicle: raw.vehicle,
  };
}

function normalizeExtra(raw: any): ExtraItem {
  return {
    id: raw.id,
    at: raw.at,
    name: raw.name,
    qty: raw.qty,
    unitPrice: raw.unitPrice ?? raw.unit_price ?? 0,
    total: raw.total,
  };
}

export const ticketsApi = {
  create: (body: { roomId: string; minutes: number; entryType: EntryType }) =>
    http.post<any>('/api/tickets', body).then(normalizeTicket),

  getByFolio: (folio: string) =>
    http.get<any>(`/api/tickets/${encodeURIComponent(folio)}`).then(normalizeTicket),

  getActiveByRoom: (roomId: string) =>
    http.get<Ticket | null>(`/api/rooms/${encodeURIComponent(roomId)}/ticket`),

  getExtras: (folio: string) =>
    http
      .get<any[]>(`/api/tickets/${encodeURIComponent(folio)}/extras`)
      .then((rows) => rows.map(normalizeExtra)),

  reprint: (roomId: string) =>
    http.post<{ ok: true }>(`/api/rooms/${encodeURIComponent(roomId)}/reprint`),

  extendTime: (roomId: string, minutesToAdd: number) =>
    http.post<{ ok: true; extraCost: number; endsAt: string }>(
      `/api/rooms/${encodeURIComponent(roomId)}/extend`,
      { minutesToAdd }
    ),

  saleOpen: (roomId: string, description: string, amount: number) =>
    http.post<{ ok: true; item: any }>(
      `/api/rooms/${encodeURIComponent(roomId)}/sales`,
      { description, amount }
    ),
    saveVehicle: (roomId: string, plate: string, photoDataUrl: string) =>
        http.post<{ ok: true; vehicle: VehicleInfo }>(
        `/api/rooms/${encodeURIComponent(roomId)}/vehicle`,
        { plate, photoDataUrl }
        ),

};
