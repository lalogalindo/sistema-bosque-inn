import { roomsApi } from '../api/rooms.client';
export const getRooms = roomsApi.list;
export const updateRoomStatus = roomsApi.setStatus;
export const updateRoomCost = roomsApi.setCost;
export type { RoomWithSession } from '../api/rooms.client';
