import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper for rounding money
const roundMoney = (n: number) => Math.round(n * 100) / 100;

// -------- HEALTH CHECK --------
app.get('/health', async (req: Request, res: Response) => {
    const { data, error } = await supabase.from('rooms').select('count', { count: 'exact', head: true });
    if (error) {
        return res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
    }
    res.json({ status: 'ok', database: 'connected', rooms_count: data });
});

// -------- CONFIG --------
app.get('/api/config', async (req: Request, res: Response) => {
  // In a real app, this might come from DB, but we can hardcode it for now
  // or fetch from a 'config' table.
  res.json({
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
  });
});

// -------- ROOMS --------
app.get('/api/rooms', async (req: Request, res: Response) => {
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*, active_sessions(*)');

  if (error) return res.status(500).json({ message: error.message });

  // Map to the format the frontend expects
  const mapped = rooms.map((r: any) => ({
    ...r,
    activeSession: r.active_sessions?.[0] || null
  }));

  res.json(mapped);
});

// PATCH /api/rooms/:id/status
app.patch('/api/rooms/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // Get current status for logging
  const { data: room } = await supabase.from('rooms').select('*').eq('id', id).single();
  if (!room) return res.status(404).json({ message: 'Habitación no encontrada' });

  const { error } = await supabase.from('rooms').update({ status }).eq('id', id);
  if (error) return res.status(500).json({ message: error.message });

  // If status is not OCUPADA, clear session
  if (status !== 'OCUPADA') {
    await supabase.from('active_sessions').delete().eq('room_id', id);
  }

  // Add Log
  await supabase.from('room_logs').insert({
    room_id: id,
    room_number: room.number,
    type: 'STATUS_CHANGE',
    from_status: room.status,
    to_status: status,
    at: new Date().toISOString()
  });

  res.json({ ok: true });
});

// POST /api/tickets { roomId, minutes, entryType }
app.post('/api/tickets', async (req: Request, res: Response) => {
  const { roomId, minutes, entryType } = req.body;

  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room) return res.status(404).json({ message: 'Habitación no encontrada' });
  if (room.status === 'OCUPADA') return res.status(400).json({ message: 'La habitación ya está ocupada' });

  const now = new Date();
  const ends = new Date(now.getTime() + minutes * 60_000);
  const folio = `HL-${now.getTime()}`;
  const baseCost = room.cost;

  // Create Session
  const { data: session, error: sErr } = await supabase.from('active_sessions').insert({
    room_id: roomId,
    folio,
    started_at: now.toISOString(),
    ends_at: ends.toISOString(),
    minutes_initial: minutes,
    minutes_added: 0,
    entry_type: entryType,
    base_cost: baseCost,
    time_extra_cost: 0,
    extras_cost: 0,
    total_cost: baseCost
  }).select().single();

  if (sErr) return res.status(500).json({ message: sErr.message });

  // Create Ticket
  const { data: ticket, error: tErr } = await supabase.from('tickets').insert({
    room_id: roomId,
    room_number: room.number,
    folio,
    created_at: now.toISOString(),
    minutes,
    entry_type: entryType,
    base_cost: baseCost,
    time_extra_cost: 0,
    extras_cost: 0,
    total_cost: baseCost,
    status_at_issue: 'OCUPADA'
  }).select().single();

  if (tErr) return res.status(500).json({ message: tErr.message });

  // Update Room Status
  await supabase.from('rooms').update({ status: 'OCUPADA' }).eq('id', roomId);

  // Logs
  await supabase.from('room_logs').insert([
    {
      room_id: roomId,
      room_number: room.number,
      type: 'STATUS_CHANGE',
      from_status: room.status,
      to_status: 'OCUPADA',
      folio,
      at: now.toISOString(),
      note: 'Ocupada por emisión de ticket'
    },
    {
      room_id: roomId,
      room_number: room.number,
      type: 'TICKET_ISSUED',
      folio,
      amount: baseCost,
      at: now.toISOString(),
      note: `Tiempo: ${minutes} min, entrada: ${entryType}`
    }
  ]);

  res.status(201).json(ticket);
});

// GET /api/tickets/:folio
app.get('/api/tickets/:folio', async (req: Request, res: Response) => {
  const { folio } = req.params;
  const { data, error } = await supabase.from('tickets').select('*').eq('folio', folio).single();
  if (error) return res.status(404).json({ message: 'Ticket no encontrado' });
  res.json(data);
});

// POST /api/rooms/:id/extend { minutesToAdd }
app.post('/api/rooms/:id/extend', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { minutesToAdd } = req.body;

    const { data: room } = await supabase.from('rooms').select('*').eq('id', id).single();
    const { data: session } = await supabase.from('active_sessions').select('*').eq('room_id', id).single();

    if (!room || !session) return res.status(400).json({ message: 'No hay sesión activa' });

    const ratePerMinute = session.base_cost / session.minutes_initial;
    const extraCost = roundMoney(ratePerMinute * minutesToAdd);

    const newEnds = new Date(new Date(session.ends_at).getTime() + minutesToAdd * 60_000);
    
    const updatedSession = {
        minutes_added: session.minutes_added + minutesToAdd,
        ends_at: newEnds.toISOString(),
        time_extra_cost: roundMoney(session.time_extra_cost + extraCost),
        total_cost: roundMoney(session.base_cost + session.time_extra_cost + extraCost + session.extras_cost)
    };

    const { error: sErr } = await supabase.from('active_sessions').update(updatedSession).eq('room_id', id);
    if (sErr) return res.status(500).json({ message: sErr.message });

    // Update Ticket too
    await supabase.from('tickets').update({
        time_extra_cost: updatedSession.time_extra_cost,
        total_cost: updatedSession.total_cost
    }).eq('folio', session.folio);

    await supabase.from('room_logs').insert({
        room_id: id,
        room_number: room.number,
        type: 'TIME_EXTENDED',
        folio: session.folio,
        amount: extraCost,
        at: new Date().toISOString(),
        note: `Se agregaron ${minutesToAdd} min`
    });

    res.json({ ok: true, extraCost, endsAt: updatedSession.ends_at });
});

// GET /api/logs
app.get('/api/logs', async (req: Request, res: Response) => {
    const { roomId, from, to } = req.query;
    let query = supabase.from('room_logs').select('*').order('at', { ascending: false });

    if (roomId) query = query.eq('room_id', roomId);
    if (from) query = query.gte('at', from);
    if (to) query = query.lte('at', to);

    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
});

// POST /api/rooms/:id/vehicle { plate, photoDataUrl }
app.post('/api/rooms/:id/vehicle', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { plate, photoDataUrl } = req.body;

    const { data: room } = await supabase.from('rooms').select('*').eq('id', id).single();
    const { data: session } = await supabase.from('active_sessions').select('*').eq('room_id', id).single();

    if (!room || !session) return res.status(400).json({ message: 'No hay sesión activa' });
    if (!plate?.trim()) return res.status(400).json({ message: 'Placa requerida' });

    const vehicle = { plate: plate.trim(), photoDataUrl, takenAt: new Date().toISOString() };

    await supabase.from('active_sessions').update({ vehicle }).eq('room_id', id);
    await supabase.from('tickets').update({ vehicle }).eq('folio', session.folio);

    await supabase.from('room_logs').insert({
        room_id: id,
        room_number: room.number,
        type: 'EXTRA_SOLD', // or a new type if desired
        folio: session.folio,
        at: new Date().toISOString(),
        note: `Foto/placa capturada: ${vehicle.plate}`
    });

    res.json({ ok: true, vehicle });
});

// POST /api/rooms/:id/sales { description, amount }
app.post('/api/rooms/:id/sales', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { description, amount } = req.body;

    const { data: room } = await supabase.from('rooms').select('*').eq('id', id).single();
    const { data: session } = await supabase.from('active_sessions').select('*').eq('room_id', id).single();

    if (!room || !session) return res.status(400).json({ message: 'No hay sesión activa' });
    if (!description) return res.status(400).json({ message: 'Descripción requerida' });

    const total = roundMoney(amount);

    const { data: item } = await supabase.from('extra_items').insert({
        folio: session.folio,
        at: new Date().toISOString(),
        name: description,
        qty: 1,
        unit_price: total,
        total: total
    }).select().single();

    const newExtrasCost = roundMoney(session.extras_cost + total);
    const newTotalCost = roundMoney(session.base_cost + session.time_extra_cost + newExtrasCost);

    await supabase.from('active_sessions').update({
        extras_cost: newExtrasCost,
        total_cost: newTotalCost
    }).eq('room_id', id);

    await supabase.from('tickets').update({
        extras_cost: newExtrasCost,
        total_cost: newTotalCost
    }).eq('folio', session.folio);

    await supabase.from('room_logs').insert({
        room_id: id,
        room_number: room.number,
        type: 'EXTRA_SOLD',
        folio: session.folio,
        amount: total,
        at: new Date().toISOString(),
        note: description
    });

    res.json({ ok: true, item });
});

// GET /api/tickets/:folio/extras
app.get('/api/tickets/:folio/extras', async (req: Request, res: Response) => {
    const { folio } = req.params;
    const { data, error } = await supabase.from('extra_items').select('*').eq('folio', folio);
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
