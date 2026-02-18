import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import { getRooms } from './rooms.service';
import type { Room } from './rooms.types';
import RoomCard from './RoomCard';

export default function RoomsGrid() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setRooms(await getRooms());
      } catch (e: any) {
        setError(e?.message ?? 'Error cargando habitaciones');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Habitaciones
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} columns={12}>
          {rooms.map((room) => (
            <Grid key={room.id} size={{ xs: 12, md: 6 }}>
              <RoomCard room={room} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
