import { http } from '../../../api/httpClient';
import type { Ticket, EntryType, ExtraItem, VehicleInfo } from '../rooms.api.types';

export const ticketsApi = {
  create: (body: { roomId: string; minutes: number; entryType: EntryType }) =>
    http.post<Ticket>('/api/tickets', body),

  getByFolio: (folio: string) =>
    http.get<Ticket>(`/api/tickets/${encodeURIComponent(folio)}`),

  getActiveByRoom: (roomId: string) =>
    http.get<Ticket | null>(`/api/rooms/${encodeURIComponent(roomId)}/ticket`),

  getExtras: (folio: string) =>
    http.get<ExtraItem[]>(`/api/tickets/${encodeURIComponent(folio)}/extras`),

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
