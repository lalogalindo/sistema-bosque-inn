export type RoomStatus = 'DISPONIBLE' | 'OCUPADA' | 'POR ASEAR' | 'CERRADA';

export type Room = {
  id: string;
  number: number;
  status: RoomStatus;
  cost: number; // costo editable
};
