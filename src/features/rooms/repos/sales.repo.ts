import type { ExtraItem } from '../rooms.api.types';
import { dbClone, dbLoad, dbSave, makeId, nowIso, wait, roundMoney } from '../db/hotelDb';

export async function getExtrasRepo(folio: string): Promise<ExtraItem[]> {
  await wait(80);
  const db = dbLoad();
  return dbClone(db.extrasByFolio[folio] ?? []);
}

export async function addGeneralSaleRepo(folio: string, description: string, amount: number): Promise<ExtraItem> {
  await wait(120);
  const db = dbLoad();

  const total = roundMoney(amount);
  const item: ExtraItem = {
    id: makeId(),
    at: nowIso(),
    name: description,
    qty: 1,
    unitPrice: total,
    total,
  };

  db.extrasByFolio[folio] = [...(db.extrasByFolio[folio] ?? []), item];
  dbSave(db);

  return dbClone(item);
}
