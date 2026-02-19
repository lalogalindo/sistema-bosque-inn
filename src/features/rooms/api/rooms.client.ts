import { http } from '../../../api/httpClient';
import type { Room, RoomStatus } from '../rooms.types';
import type { ActiveSession } from '../rooms.api.types';

export type RoomWithSession = Room & { activeSession?: ActiveSession };

export const roomsApi = {
  list: () => http.get<RoomWithSession[]>('/api/rooms'),
  setStatus: (roomId: string, status: RoomStatus) =>
    http.patch<{ ok: true }>(`/api/rooms/${encodeURIComponent(roomId)}/status`, { status }),
  setCost: (roomId: string, cost: number) =>
    http.patch<{ ok: true }>(`/api/rooms/${encodeURIComponent(roomId)}/cost`, { cost }),
};
