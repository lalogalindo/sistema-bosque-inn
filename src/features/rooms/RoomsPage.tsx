import { useEffect, useMemo, useState } from 'react';
import type { Room } from './rooms.types';
import { getRooms, updateRoomCost } from './rooms.service';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state para edición por fila
  const [draftCosts, setDraftCosts] = useState<Record<string, string>>({});

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await getRooms();
      setRooms(data);
      // inicializa drafts con costos actuales
      const drafts: Record<string, string> = {};
      data.forEach(r => (drafts[r.id] = String(r.cost)));
      setDraftCosts(drafts);
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando habitaciones.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => rooms.length, [rooms.length]);

  async function saveCost(roomId: string) {
    setError(null);
    setSavingId(roomId);
    try {
      const raw = draftCosts[roomId] ?? '';
      const newCost = Number(raw);

      await updateRoomCost(roomId, newCost);

      setRooms(prev =>
        prev.map(r => (r.id === roomId ? { ...r, cost: newCost } : r))
      );

      setDraftCosts(prev => ({ ...prev, [roomId]: String(newCost) }));

    } catch (e: any) {
      setError(e?.message ?? 'Error guardando costo.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <div>
          <Typography variant="h5" fontWeight={700}>
            Habitaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total: {total}
          </Typography>
        </div>

        <Tooltip title="Recargar">
          <span>
            <IconButton onClick={load} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={140}><strong>No. Habitación</strong></TableCell>
                <TableCell width={180}><strong>Estado</strong></TableCell>
                <TableCell><strong>Costo</strong></TableCell>
                <TableCell width={90} align="right"><strong>Guardar</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rooms.map(room => {
                const isSaving = savingId === room.id;
                return (
                  <TableRow key={room.id} hover>
                    <TableCell>#{room.number}</TableCell>
                    <TableCell>{statusLabel(room.status)}</TableCell>

                    <TableCell>
                      <TextField
                        value={draftCosts[room.id] ?? ''}
                        onChange={(e) =>
                          setDraftCosts(prev => ({ ...prev, [room.id]: e.target.value }))
                        }
                        type="number"
                        size="small"
                        inputProps={{ min: 1, step: 1 }}
                        sx={{ maxWidth: 180 }}
                        label="MXN"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Guardar costo">
                        <span>
                          <IconButton
                            onClick={() => saveCost(room.id)}
                            disabled={isSaving || loading}
                          >
                            <SaveIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}

function statusLabel(status: Room['status']) {
    switch (status) {
      case 'DISPONIBLE':
        return 'Disponible';
      case 'OCUPADA':
        return 'Ocupada';
      case 'POR ASEAR':
        return 'Por asear';
      case 'CERRADA':
        return 'Cerrada';
      default:
        return status;
    }
  }
  
