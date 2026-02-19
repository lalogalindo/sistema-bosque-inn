import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';

import {
  getTicketByFolio,
  getExtrasForFolio,
  type Ticket,
  type ExtraItem,
} from '../rooms'; // si no usas alias, cámbialo a tu path real

export default function TicketPrintPage() {
  const { folio = '' } = useParams();

  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [extras, setExtras] = React.useState<ExtraItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const t = await getTicketByFolio(folio);
        const e = await getExtrasForFolio(folio);
        setTicket(t);
        setExtras(e);
      } catch (err: any) {
        setError(err?.message ?? 'No se pudo cargar el ticket');
      } finally {
        setLoading(false);
      }
    })();
  }, [folio]);

  if (loading) {
    return (
      <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ticket) {
    return <Alert severity="error">{error ?? 'Ticket no encontrado'}</Alert>;
  }

  const fmtMoney = (n: number) => `$${n.toLocaleString('es-MX')}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleString('es-MX');

  return (
    <Box>
      <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button component={Link} to="/" variant="outlined">
          Volver
        </Button>
        <Button onClick={() => window.print()} variant="contained">
          Imprimir / Guardar PDF
        </Button>
      </Box>

      <div className="ticket">
        <h2 style={{ margin: 0 }}>BOSQUE INN</h2>
        <div>Ticket de renta</div>
        <Divider sx={{ my: 1 }} />

        <div><strong>Folio:</strong> {ticket.folio}</div>
        <div><strong>Habitación:</strong> {ticket.roomNumber}</div>
        <div><strong>Fecha:</strong> {fmtDate(ticket.createdAt)}</div>
        <div><strong>Tiempo inicial:</strong> {Math.round(ticket.minutes / 60)} horas</div>
        <div><strong>Entrada:</strong> {ticket.entryType === 'CAR' ? 'En coche' : 'Caminando'}</div>

        <Divider sx={{ my: 1 }} />

        {/* DESGLOSE */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>Renta (base)</strong></span>
          <span>{fmtMoney(ticket.baseCost)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>Tiempo extra</strong></span>
          <span>{fmtMoney(ticket.timeExtraCost)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>Ventas / extras</strong></span>
          <span>{fmtMoney(ticket.extrasCost)}</span>
        </div>

        {/* Detalle de ventas abiertas */}
        {extras.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <div><strong>Detalle de ventas</strong></div>

            {extras.map((x) => (
              <div key={x.id} style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{x.name}</span>
                  <span>{fmtMoney(x.total)}</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {fmtDate(x.at)}
                </div>
              </div>
            ))}
          </>
        )}

        <Divider sx={{ my: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span><strong>TOTAL</strong></span>
          <span><strong>{fmtMoney(ticket.totalCost)}</strong></span>
        </div>

        <Divider sx={{ my: 1 }} />
        <div><strong>“Si no recibes tu ticket, la habitación es gratis.”</strong></div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 8 }}>
          Reimpresión válida con el mismo folio.
        </div>
      </div>
    </Box>
  );
}
