import type { Ticket } from '../rooms.api.types';
import { dbLoad, dbSave, wait } from '../db/hotelDb';

export async function getTicketRepo(folio: string): Promise<Ticket | undefined> {
  await wait(120);
  const db = dbLoad();
  const t = db.ticketsByFolio[folio];
  return t ? { ...t } : undefined;
}

export async function setTicketRepo(folio: string, ticket: Ticket): Promise<void> {
  await wait(120);
  const db = dbLoad();
  db.ticketsByFolio[folio] = ticket;
  dbSave(db);
}
