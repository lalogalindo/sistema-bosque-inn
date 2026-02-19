export type MockRoom = {
  id: string;
  number: number;
  status: 'DISPONIBLE' | 'OCUPADA' | 'POR ASEAR' | 'CERRADA';
  cost: number; // costo base del cuarto (para la renta inicial)
};

export type MockTimeOption = {
  id: string;       // estable para UI (ej "2h")
  label: string;    // "2 horas"
  minutes: number;  // 120
};

export type HotelMock = {
  config: {
    currency: 'MXN';
    roomsCount: number;
    rentalTimeOptions: MockTimeOption[];
    extendTimeOptions: MockTimeOption[];
  };
  rooms: MockRoom[];
};

// ✅ Datos ejemplo (los que vienes usando)
export const HOTEL_MOCK: HotelMock = {
  config: {
    currency: 'MXN',
    roomsCount: 10,
    rentalTimeOptions: [
      { id: '2h', label: '2 horas', minutes: 120 },
      { id: '4h', label: '4 horas', minutes: 240 },
      { id: '6h', label: '6 horas', minutes: 360 },
      { id: '12h', label: '12 horas', minutes: 720 },
    ],
    extendTimeOptions: [
      { id: '30m', label: '30 min', minutes: 30 },
      { id: '60m', label: '60 min', minutes: 60 },
      { id: '120m', label: '120 min', minutes: 120 },
      { id: '180m', label: '180 min', minutes: 180 },
    ],
  },

  rooms: Array.from({ length: 10 }).map((_, i) => ({
    id: `room-${i + 1}`,
    number: i + 1,
    status: i === 2 ? 'OCUPADA' : 'DISPONIBLE', // ejemplo: habitación 3 ocupada
    cost: 250,
  })),
};
