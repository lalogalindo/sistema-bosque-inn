-- 1. Habitaciones (Rooms)
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  number INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DISPONIBLE', 'OCUPADA', 'POR ASEAR', 'CERRADA')),
  cost DECIMAL(10,2) NOT NULL
);

-- 2. Sesiones Activas (Active Sessions)
-- Se vincula a una habitación. Cuando la habitación queda libre, se borra.
CREATE TABLE active_sessions (
  sessionId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  folio TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  minutes_initial INT NOT NULL,
  minutes_added INT NOT NULL DEFAULT 0,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('CAR', 'WALKIN')),
  base_cost DECIMAL(10,2) NOT NULL,
  time_extra_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  extras_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL,
  vehicle JSONB -- Almacena {plate, photoDataUrl, takenAt}
);

-- 3. Tickets (Historial)
CREATE TABLE tickets (
  folio TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  room_number INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  minutes INT NOT NULL,
  entry_type TEXT NOT NULL,
  base_cost DECIMAL(10,2) NOT NULL,
  time_extra_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  extras_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL,
  status_at_issue TEXT NOT NULL,
  vehicle JSONB
);

-- 4. Ítems Extra (Extra Items)
CREATE TABLE extra_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT REFERENCES tickets(folio) ON DELETE CASCADE,
  at TIMESTAMPTZ NOT NULL,
  name TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL
);

-- 5. Logs de Habitaciones (Room Logs)
CREATE TABLE room_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  room_number INT NOT NULL,
  at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  folio TEXT,
  amount DECIMAL(10,2),
  note TEXT
);

-- Semilla inicial de habitaciones (Basado en tu Mock)
INSERT INTO rooms (id, number, status, cost) VALUES
('room-1', 1, 'DISPONIBLE', 250),
('room-2', 2, 'DISPONIBLE', 250),
('room-3', 3, 'DISPONIBLE', 250),
('room-4', 4, 'DISPONIBLE', 250),
('room-5', 5, 'DISPONIBLE', 250),
('room-6', 6, 'DISPONIBLE', 250),
('room-7', 7, 'DISPONIBLE', 250),
('room-8', 8, 'DISPONIBLE', 250),
('room-9', 9, 'DISPONIBLE', 250),
('room-10', 10, 'DISPONIBLE', 250);
