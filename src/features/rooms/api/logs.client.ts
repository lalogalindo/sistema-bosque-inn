import { http } from '../../../api/httpClient';
import type { RoomLog } from '../rooms.api.types';

export const logsApi = {
  list: (params?: { roomId?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.roomId) q.set('roomId', params.roomId);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return http.get<RoomLog[]>(`/api/logs${qs ? `?${qs}` : ''}`);
  },
};
