import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CardActionArea from '@mui/material/CardActionArea';

import type { Room } from './rooms.types';

export default function RoomCard({ room }: { room: Room }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea
        onClick={() => {
          // TODO: abrir modal / acciones (ocupar, reimprimir, etc.)
          console.log('clicked room', room.id);
        }}
        sx={{ borderRadius: 3 }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              Habitación {room.number}
            </Typography>

            <Chip
              label={room.status}
              color={statusColor(room.status)}
              size="small"
              variant="filled"
            />
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ mt: 2 }}>
            ${room.cost.toLocaleString('es-MX')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Costo por tiempo
          </Typography>
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
