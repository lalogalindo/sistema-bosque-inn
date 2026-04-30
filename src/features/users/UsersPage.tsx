import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { http } from '../../api/httpClient';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type Schedule = {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
};

type User = {
  id: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  is_active: boolean;
  allow_any_time: boolean;
  user_schedules: Schedule[];
};

function defaultSchedules(): Schedule[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    is_working: i >= 1 && i <= 5, // Lun-Vie por defecto
    start_time: '08:00',
    end_time: '16:00',
  }));
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number): string {
  const wrapped = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getDuration(start: string, end: string): number {
  let diff = toMinutes(end) - toMinutes(start);
  if (diff <= 0) diff += 24 * 60; // cruza medianoche
  return diff;
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Edit/Create Dialog ──────────────────────────────────────
function UserDialog({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: User | null; // null = creating
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !user;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [isActive, setIsActive] = useState(true);
  const [allowAnyTime, setAllowAnyTime] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>(defaultSchedules());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setPassword(user.password);
      setRole(user.role);
      setIsActive(user.is_active);
      setAllowAnyTime(user.allow_any_time);
      const merged = defaultSchedules().map((def) => {
        const existing = user.user_schedules.find((s) => s.day_of_week === def.day_of_week);
        return existing ?? def;
      });
      setSchedules(merged);
    } else {
      setUsername('');
      setPassword('');
      setRole('STAFF');
      setIsActive(true);
      setAllowAnyTime(false);
      setSchedules(defaultSchedules());
    }
    setError('');
  }, [user, open]);

  function updateSchedule(day: number, patch: Partial<Schedule>) {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === day ? { ...s, ...patch } : s))
    );
  }

  // Cambiar hora de entrada → recalcular hora de salida manteniendo la duración actual
  function handleStartChange(day: number, newStart: string, currentEnd: string) {
    const currentDuration = getDuration(schedules.find(s => s.day_of_week === day)!.start_time, currentEnd);
    const newEnd = fromMinutes(toMinutes(newStart) + currentDuration);
    updateSchedule(day, { start_time: newStart, end_time: newEnd });
  }

  // Cambiar hora de salida → la duración se recalcula sola (es derivada)
  function handleEndChange(day: number, newEnd: string) {
    updateSchedule(day, { end_time: newEnd });
  }

  // Cambiar duración → recalcular hora de salida
  function handleDurationChange(day: number, newDurationHours: number, startTime: string) {
    const mins = Math.max(0, Math.round(newDurationHours * 60));
    const newEnd = fromMinutes(toMinutes(startTime) + mins);
    updateSchedule(day, { end_time: newEnd });
  }


  async function handleSave() {
    if (!username.trim() || !password.trim()) {
      setError('Usuario y contraseña son requeridos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await http.post('/api/admin/users', { username, password, role, schedules });
      } else {
        await http.patch(`/api/admin/users/${user!.id}`, {
          password,
          role,
          is_active: isActive,
          allow_any_time: allowAnyTime,
          schedules,
        });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isNew ? 'Nuevo Usuario' : `Editar: ${user!.username}`}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Usuario"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isNew}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Contraseña"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Rol"
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'STAFF')}
            >
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="STAFF">Staff</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {!isNew && (
          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(_, v) => setIsActive(v)} />}
              label="Activo"
            />
            <FormControlLabel
              control={<Switch checked={allowAnyTime} onChange={(_, v) => setAllowAnyTime(v)} />}
              label="Ingreso Libre (fuera de turno)"
            />
          </Stack>
        )}

        {/* ── Schedule Grid ── */}
        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
          Horario Semanal
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Día</TableCell>
                <TableCell align="center">Trabaja</TableCell>
                <TableCell>Entrada</TableCell>
                <TableCell>Salida</TableCell>
                <TableCell align="center">Duración (hrs)</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s) => {
                const duration = getDuration(s.start_time, s.end_time);
                const durationHours = +(duration / 60).toFixed(2);

                return (
                  <TableRow
                    key={s.day_of_week}
                    sx={{ opacity: s.is_working ? 1 : 0.4 }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {DAY_NAMES[s.day_of_week]}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={s.is_working}
                        onChange={(_, v) => updateSchedule(s.day_of_week, { is_working: v })}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="time"
                        size="small"
                        value={s.start_time}
                        disabled={!s.is_working}
                        onChange={(e) => handleStartChange(s.day_of_week, e.target.value, s.end_time)}
                        slotProps={{ htmlInput: { step: 300 } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="time"
                        size="small"
                        value={s.end_time}
                        disabled={!s.is_working}
                        onChange={(e) => handleEndChange(s.day_of_week, e.target.value)}
                        slotProps={{ htmlInput: { step: 300 } }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {s.is_working ? (
                        <TextField
                          type="number"
                          size="small"
                          value={durationHours}
                          onChange={(e) => handleDurationChange(s.day_of_week, Number(e.target.value), s.start_time)}
                          slotProps={{ htmlInput: { min: 0.5, max: 24, step: 0.5 } }}
                          sx={{ width: 90 }}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {s.is_working ? fmtDuration(duration) : ''}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : isNew ? 'Crear' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await http.get<User[]>('/api/admin/users');
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setDialogOpen(true);
  }

  async function toggleAllowAnyTime(u: User) {
    try {
      await http.patch(`/api/admin/users/${u.id}`, {
        allow_any_time: !u.allow_any_time,
      });
      // Actualizar localmente sin recargar todo
      setUsers((prev) =>
        prev.map((x) => x.id === u.id ? { ...x, allow_any_time: !x.allow_any_time } : x)
      );
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await http.del(`/api/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1200px' } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography component="h2" variant="h6">
          Usuarios
        </Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openNew}>
          Nuevo Usuario
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Ingreso Libre</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  sx={{
                    opacity: u.is_active ? 1 : 0.5,
                    textDecoration: u.is_active ? 'none' : 'line-through',
                  }}
                >
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      size="small"
                      color={u.role === 'ADMIN' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={u.is_active ? 'Activo' : 'Deshabilitado'}
                      size="small"
                      color={u.is_active ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      checked={u.allow_any_time}
                      onChange={() => toggleAllowAnyTime(u)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <IconButton size="small" onClick={() => openEdit(u)} title="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteTarget(u)} title="Eliminar" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <UserDialog
        open={dialogOpen}
        user={editing}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
      />

      {/* ── Delete Confirmation Modal ── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>¿Eliminar usuario?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteTarget?.username}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
