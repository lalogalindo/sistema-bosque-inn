import { dbClone, dbLoad, wait } from '../db/hotelDb';
import type { HotelConfig, TimeOption } from '../rooms.api.types';

export async function getConfigRepo(): Promise<HotelConfig> {
  await wait(120);
  const db = dbLoad();
  return dbClone(db.config);
}

export async function getRentalTimeOptionsRepo(): Promise<TimeOption[]> {
  await wait(120);
  const db = dbLoad();
  return dbClone(db.config.rentalTimeOptions);
}

export async function getExtendTimeOptionsRepo(): Promise<TimeOption[]> {
  await wait(120);
  const db = dbLoad();
  return dbClone(db.config.extendTimeOptions);
}
