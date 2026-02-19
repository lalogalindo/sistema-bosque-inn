import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CardActionArea from '@mui/material/CardActionArea';

import type { Room } from './rooms.types';
import type { RoomWithSession } from './api/rooms.client';

export default function RoomCard(props: { room: RoomWithSession; onClick: () => void }) {
  const { room, onClick } = props;

  const endsAt = room.activeSession?.endsAt
    ? new Date(room.activeSession.endsAt).getTime()
    : null;

  const folio = room.activeSession?.folio ?? null;

  const [remainingMs, setRemainingMs] = React.useState<number | null>(() => {
    if (room.status !== 'OCUPADA' || !endsAt) return null;
    return Math.max(0, endsAt - Date.now());
  });

  // Contador: actualiza cada 1s si está ocupada y hay fin
  React.useEffect(() => {
    // si cambia a DISPONIBLE/POR ASEAR/CERRADA -> apaga contador
    if (room.status !== 'OCUPADA' || !endsAt) {
      setRemainingMs(null);
      return;
    }

    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();

    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [room.status, endsAt]);

  // Alert a 15 min: una sola vez por folio (persistente en localStorage)
  React.useEffect(() => {
    if (room.status !== 'OCUPADA' || !endsAt || !folio) return;

    const key = `alert15_${folio}`;
    const already = localStorage.getItem(key);

    const msLeft = endsAt - Date.now();
    const fifteen = 15 * 60 * 1000;

    if (!already && msLeft > 0 && msLeft <= fifteen) {
      localStorage.setItem(key, '1');
      alert(`Habitación ${room.number}: quedan 15 minutos (folio ${folio}).`);
    }
  }, [room.status, endsAt, folio, room.number, remainingMs]);

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea onClick={onClick} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Habitación {room.number}
            </Typography>

            <Chip label={room.status} color={statusColor(room.status)} size="small" />
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ mt: 2 }}>
            ${room.cost.toLocaleString('es-MX')}
          </Typography>

          {room.status === 'OCUPADA' && folio && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Folio: <strong>{folio}</strong>
            </Typography>
          )}

          {room.status === 'OCUPADA' && remainingMs !== null && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Tiempo restante: <strong>{formatRemaining(remainingMs)}</strong>
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function statusColor(
  status: Room['status']
): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'DISPONIBLE':
      return 'success';
    case 'OCUPADA':
      return 'warning';
    case 'POR ASEAR':
      return 'default';
    case 'CERRADA':
      return 'error';
    default:
      return 'default';
  }
}

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));

  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}
