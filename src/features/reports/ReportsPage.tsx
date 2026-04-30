import { useEffect, useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { BarChart } from '@mui/x-charts/BarChart';

import { http } from '../../api/httpClient';

// ─── Types ──────────────────────────────────────────────────
type Ticket = {
  folio: string;
  room_id: string;
  room_number: number;
  created_at: string;
  base_cost: number;
  time_extra_cost: number;
  extras_cost: number;
  total_cost: number;
};

type RoomSnapshot = {
  id: string;
  number: number;
  status: 'DISPONIBLE' | 'OCUPADA' | 'POR ASEAR' | 'CERRADA';
};

// ─── Helpers ────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function weekAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  DISPONIBLE: '#4caf50',
  OCUPADA: '#f44336',
  'POR ASEAR': '#ff9800',
  CERRADA: '#9e9e9e',
};

const STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  OCUPADA: 'Ocupada',
  'POR ASEAR': 'Por Asear',
  CERRADA: 'Cerrada',
};

// ─── Summary Card ───────────────────────────────────────────
function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

// ─── Room Status Mini Grid ──────────────────────────────────
function RoomsStatusGrid({ rooms }: { rooms: RoomSnapshot[] }) {
  const counts = {
    DISPONIBLE: rooms.filter((r) => r.status === 'DISPONIBLE').length,
    OCUPADA: rooms.filter((r) => r.status === 'OCUPADA').length,
    'POR ASEAR': rooms.filter((r) => r.status === 'POR ASEAR').length,
    CERRADA: rooms.filter((r) => r.status === 'CERRADA').length,
  };

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Estado Actual de Habitaciones
      </Typography>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: STATUS_COLORS.OCUPADA }}>
        {counts.OCUPADA} <Typography component="span" variant="body2" color="text.secondary">ocupadas</Typography>
      </Typography>

      {/* Status counters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([status, count]) => (
          <Stack key={status} direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: STATUS_COLORS[status],
              }}
            />
            <Typography variant="body2">
              {STATUS_LABELS[status]}: {count}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {/* Mini grid: 2 columns, 5 rows */}
      <Grid container spacing={1}>
        {rooms
          .sort((a, b) => a.number - b.number)
          .map((room) => (
            <Grid key={room.id} size={{ xs: 6 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: STATUS_COLORS[room.status],
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${STATUS_COLORS[room.status]}80`,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Hab {room.number}
                </Typography>
              </Stack>
            </Grid>
          ))}
      </Grid>
    </Paper>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function ReportsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [rooms, setRooms] = useState<RoomSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [roomFilter, setRoomFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fromISO = `${dateFrom}T00:00:00`;
      const toISO = `${dateTo}T23:59:59`;
      let url = `/api/admin/reports/details?from=${fromISO}&to=${toISO}`;
      if (roomFilter) url += `&roomId=${roomFilter}`;

      const data = await http.get<{ tickets: Ticket[]; rooms: RoomSnapshot[] }>(url);
      setTickets(data.tickets);
      setRooms(data.rooms);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, roomFilter]);

  useEffect(() => { load(); }, [load]);

  // ── Computed summaries ──
  const summary = useMemo(() => {
    const total = tickets.reduce((s, t) => s + Number(t.total_cost), 0);
    const base = tickets.reduce((s, t) => s + Number(t.base_cost), 0);
    const extra = tickets.reduce((s, t) => s + Number(t.time_extra_cost), 0);
    const sales = tickets.reduce((s, t) => s + Number(t.extras_cost), 0);
    const count = tickets.length;
    const avg = count > 0 ? total / count : 0;
    return { total, base, extra, sales, count, avg };
  }, [tickets]);

  // ── Chart data: group by date ──
  const chartData = useMemo(() => {
    const byDate: Record<string, { base: number; extra: number; sales: number }> = {};
    tickets.forEach((t) => {
      const day = t.created_at.slice(0, 10);
      if (!byDate[day]) byDate[day] = { base: 0, extra: 0, sales: 0 };
      byDate[day].base += Number(t.base_cost);
      byDate[day].extra += Number(t.time_extra_cost);
      byDate[day].sales += Number(t.extras_cost);
    });
    const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: sorted.map(([d]) => fmtDate(d)),
      base: sorted.map(([, v]) => v.base),
      extra: sorted.map(([, v]) => v.extra),
      sales: sorted.map(([, v]) => v.sales),
    };
  }, [tickets]);

  // ── Quick date presets ──
  function setPreset(preset: 'today' | 'yesterday' | 'week') {
    if (preset === 'today') { setDateFrom(todayStr()); setDateTo(todayStr()); }
    else if (preset === 'yesterday') { setDateFrom(yesterdayStr()); setDateTo(yesterdayStr()); }
    else { setDateFrom(weekAgoStr()); setDateTo(todayStr()); }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Corte de Caja
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── FILTERS ── */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => setPreset('today')}>Hoy</Button>
            <Button onClick={() => setPreset('yesterday')}>Ayer</Button>
            <Button onClick={() => setPreset('week')}>Esta Semana</Button>
          </ButtonGroup>

          <TextField
            type="date"
            label="Desde"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="Hasta"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            select
            label="Habitación"
            size="small"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {rooms.map((r) => (
              <MenuItem key={r.id} value={r.id}>Hab {r.number}</MenuItem>
            ))}
          </TextField>

          <Button size="small" onClick={() => { setDateFrom(todayStr()); setDateTo(todayStr()); setRoomFilter(''); }}>
            Limpiar
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* ── SUMMARY CARDS ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 2 }}>
              <SummaryCard title="Ingreso Total" value={fmtMoney(summary.total)} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <SummaryCard title="Habitaciones" value={fmtMoney(summary.base)} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <SummaryCard title="Horas Extra" value={fmtMoney(summary.extra)} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <SummaryCard title="Ventas Generales" value={fmtMoney(summary.sales)} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <SummaryCard title="Entradas" value={String(summary.count)} />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <SummaryCard title="Ticket Promedio" value={fmtMoney(summary.avg)} />
            </Grid>
          </Grid>

          {/* ── CHART + ROOMS STATUS ── */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Ingresos por Día
                </Typography>
                {chartData.labels.length > 0 ? (
                  <BarChart
                    height={300}
                    xAxis={[{ data: chartData.labels, scaleType: 'band' }]}
                    series={[
                      { data: chartData.base, label: 'Habitaciones', stack: 'total', color: '#42a5f5' },
                      { data: chartData.extra, label: 'Horas Extra', stack: 'total', color: '#ffca28' },
                      { data: chartData.sales, label: 'Ventas', stack: 'total', color: '#66bb6a' },
                    ]}
                  />
                ) : (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">Sin datos para este periodo</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <RoomsStatusGrid rooms={rooms} />
            </Grid>
          </Grid>

          {/* ── DETAIL TABLE ── */}
          <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Habitación</TableCell>
                    <TableCell>Folio</TableCell>
                    <TableCell align="right">Base</TableCell>
                    <TableCell align="right">Hrs Extra</TableCell>
                    <TableCell align="right">Ventas</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((t) => (
                    <TableRow key={t.folio}>
                      <TableCell>{fmtDate(t.created_at)}</TableCell>
                      <TableCell>Hab {t.room_number}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.folio}</TableCell>
                      <TableCell align="right">{fmtMoney(Number(t.base_cost))}</TableCell>
                      <TableCell align="right">{fmtMoney(Number(t.time_extra_cost))}</TableCell>
                      <TableCell align="right">{fmtMoney(Number(t.extras_cost))}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{fmtMoney(Number(t.total_cost))}</TableCell>
                    </TableRow>
                  ))}
                  {tickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        No hay tickets en este periodo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                {tickets.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} sx={{ fontWeight: 700 }}>TOTALES</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoney(summary.base)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoney(summary.extra)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoney(summary.sales)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtMoney(summary.total)}</TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
