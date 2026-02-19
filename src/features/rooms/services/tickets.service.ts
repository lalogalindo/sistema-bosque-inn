import { ticketsApi } from '../api/tickets.client';

export const createTicket = ticketsApi.create;
export const getTicketByFolio = ticketsApi.getByFolio;
export const getActiveTicketForRoom = ticketsApi.getActiveByRoom;
export const getExtrasForFolio = ticketsApi.getExtras;

export const logReprint = ticketsApi.reprint;
export const extendTimeForRoom = (args: { roomId: string; minutesToAdd: number }) =>
  ticketsApi.extendTime(args.roomId, args.minutesToAdd);

export const sellGeneralExtraForRoom = (args: { roomId: string; description: string; amount: number }) =>
  ticketsApi.saleOpen(args.roomId, args.description, args.amount);
export const saveVehicleForRoom = (args: { roomId: string; plate: string; photoDataUrl: string }) =>
  ticketsApi.saveVehicle(args.roomId, args.plate, args.photoDataUrl);
