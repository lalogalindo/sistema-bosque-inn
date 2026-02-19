import { http } from '../../../api/httpClient';
import type { HotelConfig, TimeOption } from '../rooms.api.types';

export const configApi = {
  getConfig: () => http.get<HotelConfig>('/api/config'),
  getRentalTimeOptions: async (): Promise<TimeOption[]> => {
    const cfg = await http.get<HotelConfig>('/api/config');
    return cfg.rentalTimeOptions;
  },
  getExtendTimeOptions: async (): Promise<TimeOption[]> => {
    const cfg = await http.get<HotelConfig>('/api/config');
    return cfg.extendTimeOptions;
  },
};
