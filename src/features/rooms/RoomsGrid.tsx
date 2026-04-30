import { useEffect, useState, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import { useNavigate } from 'react-router-dom';
import RoomCard from './RoomCard';
import RoomModal from './RoomModal';
import type { RoomWithSession } from './api/rooms.client';

// IMPORTANTE: usa el servicio API-first (misma “fuente de verdad” que modal)
import { getRooms } from './services/rooms.service';

export default function RoomsGrid() {
  const nav = useNavigate();

  const [rooms, setRooms] = useState<RoomWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<RoomWithSession | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getRooms();
      const sortedRooms = [...data].sort((a, b) => a.number - b.number);
      setRooms(sortedRooms);

      // Si el modal está abierto y recargamos, sincroniza el "selected" con data fresca
      setSelected((prev) => {
        if (!prev) return null;
        return sortedRooms.find((r) => r.id === prev.id) ?? null;
      });
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando habitaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Habitaciones
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {rooms.map((room) => (
            <Grid key={room.id} size={{ xs: 12, md: 6 }}>
              <RoomCard room={room} onClick={() => setSelected(room)} />
            </Grid>
          ))}
        </Grid>
      )}

      {selected && (
        <RoomModal
          open={true}
          room={selected}
          onClose={() => setSelected(null)}
          onAfterChange={async (action) => {
            // Recarga SIEMPRE (esto apaga contador y borra sesión en UI)
            await load();

            if (action?.goToPrintFolio) {
              nav(`/print/${encodeURIComponent(action.goToPrintFolio)}`);
            }
          }}
        />
      )}
    </Box>
  );
}
