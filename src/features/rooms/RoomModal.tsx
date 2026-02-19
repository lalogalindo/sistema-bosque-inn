import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import type { EntryType, TimeOption } from './rooms.api.types';
import type { RoomWithSession } from './api/rooms.client';

import {
  createTicket,
  getActiveTicketForRoom,
  logReprint,
  extendTimeForRoom,
  sellGeneralExtraForRoom,
  saveVehicleForRoom,
} from './services/tickets.service';

import { updateRoomStatus } from './services/rooms.service';
import { getRentalTimeOptions, getExtendTimeOptions } from './services/config.service';

import { readPlateFromImageDataUrl } from './plateOcr';

export default function RoomModal(props: {
  open: boolean;
  room: RoomWithSession;
  onClose: () => void;
  onAfterChange: (action?: { goToPrintFolio?: string }) => void;
}) {
  const { open, room, onClose, onAfterChange } = props;

  const [rentalOptions, setRentalOptions] = React.useState<TimeOption[]>([]);
  const [extendOptions, setExtendOptions] = React.useState<TimeOption[]>([]);

  const [minutes, setMinutes] = React.useState<number>(240);
  const [entryType, setEntryType] = React.useState<EntryType>('CAR');

  const [minutesToAdd, setMinutesToAdd] = React.useState<number>(120);

  // venta abierta
  const [saleDesc, setSaleDesc] = React.useState('');
  const [saleAmount, setSaleAmount] = React.useState<number>(50);

  // placas
  const [vehiclePhoto, setVehiclePhoto] = React.useState<string>(''); // dataURL
  const [plate, setPlate] = React.useState<string>('');
  const [readingPlate, setReadingPlate] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isDisponible = room.status === 'DISPONIBLE';
  const isOcupada = room.status === 'OCUPADA';

  React.useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const [r, e] = await Promise.all([getRentalTimeOptions(), getExtendTimeOptions()]);
        setRentalOptions(r);
        setExtendOptions(e);

        setMinutes(r[1]?.minutes ?? r[0]?.minutes ?? 240);
        setMinutesToAdd(e[2]?.minutes ?? e[0]?.minutes ?? 120);
      } catch {
        // dejamos defaults
      }
    })();

    setError(null);
    setLoading(false);
    setEntryType('CAR');

    setSaleDesc('');
    setSaleAmount(50);

    // si ya hay vehículo guardado (ocupada), lo precargamos para ver/retomar
    const existingVehicle = room.activeSession?.vehicle;
    setVehiclePhoto(existingVehicle?.photoDataUrl ?? '');
    setPlate(existingVehicle?.plate ?? '');
    setReadingPlate(false);
  }, [open, room.id]);

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function handleVehiclePhotoChange(file?: File) {
    if (!file) return;
    setError(null);

    try {
      const dataUrl = await fileToDataUrl(file);
      setVehiclePhoto(dataUrl);

      // OCR automático
      setReadingPlate(true);
      const p = await readPlateFromImageDataUrl(dataUrl);
      setPlate(p);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo procesar la foto');
    } finally {
      setReadingPlate(false);
    }
  }

  async function handleReadPlateAgain() {
    if (!vehiclePhoto) return;
    setError(null);
    setReadingPlate(true);
    try {
      const p = await readPlateFromImageDataUrl(vehiclePhoto);
      setPlate(p);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo leer la placa');
    } finally {
      setReadingPlate(false);
    }
  }

  async function handleSaveVehicleNow() {
    setError(null);
    setLoading(true);
    try {
      if (!vehiclePhoto) throw new Error('Toma una foto primero');
      if (!plate.trim()) throw new Error('Placa requerida');

      await saveVehicleForRoom({
        roomId: room.id,
        plate: plate.trim(),
        photoDataUrl: vehiclePhoto,
      });

      const ticket = await getActiveTicketForRoom(room.id);
      onAfterChange(ticket?.folio ? { goToPrintFolio: ticket.folio } : undefined);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar la placa/foto');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const ticket = await createTicket({
        roomId: room.id,
        minutes,
        entryType,
      });

      // Si es con coche y ya capturaron algo, lo guardamos ligado al folio/sesión
      if (entryType === 'CAR' && vehiclePhoto && plate.trim()) {
        await saveVehicleForRoom({
          roomId: room.id,
          plate: plate.trim(),
          photoDataUrl: vehiclePhoto,
        });
      }

      onAfterChange({ goToPrintFolio: ticket.folio });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo generar el ticket.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReprint() {
    setError(null);
    setLoading(true);
    try {
      const ticket = await getActiveTicketForRoom(room.id);
      if (!ticket) throw new Error('No hay ticket activo para esta habitación.');

      await logReprint(room.id);
      onAfterChange({ goToPrintFolio: ticket.folio });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo reimprimir.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExtendTime() {
    setError(null);
    setLoading(true);
    try {
      await extendTimeForRoom({ roomId: room.id, minutesToAdd });
      const ticket = await getActiveTicketForRoom(room.id);
      onAfterChange(ticket?.folio ? { goToPrintFolio: ticket.folio } : undefined);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo agregar tiempo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneralSale() {
    setError(null);
    setLoading(true);
    try {
      await sellGeneralExtraForRoom({
        roomId: room.id,
        description: saleDesc,
        amount: Number(saleAmount),
      });
      const ticket = await getActiveTicketForRoom(room.id);
      onAfterChange(ticket?.folio ? { goToPrintFolio: ticket.folio } : undefined);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo registrar la venta.');
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(status: RoomWithSession['status']) {
    setError(null);
    setLoading(true);
    try {
      await updateRoomStatus(room.id, status);
      onAfterChange();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo actualizar el estado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Habitación {room.number} — {room.status}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Costo base: <strong>${room.cost.toLocaleString('es-MX')}</strong>
          </Typography>

          {isOcupada && room.activeSession && (
            <Alert severity="info">
              <div>
                Folio: <strong>{room.activeSession.folio}</strong>
              </div>
              <div>
                Total acumulado:{' '}
                <strong>${(room.activeSession.totalCost ?? 0).toLocaleString('es-MX')}</strong>
              </div>
              <div>
                Tiempo extra:{' '}
                <strong>${(room.activeSession.timeExtraCost ?? 0).toLocaleString('es-MX')}</strong>
              </div>
              <div>
                Ventas/extras:{' '}
                <strong>${(room.activeSession.extrasCost ?? 0).toLocaleString('es-MX')}</strong>
              </div>
            </Alert>
          )}

          {isDisponible && (
            <>
              <Divider />
              <Typography fontWeight={700}>Generar ticket</Typography>

              <TextField
                select
                label="Tiempo"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                fullWidth
              >
                {(rentalOptions.length
                  ? rentalOptions
                  : [{ id: '4h', label: '4 horas', minutes: 240 }]
                ).map((opt) => (
                  <MenuItem key={opt.id} value={opt.minutes}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              <FormControl>
                <FormLabel>Entrada</FormLabel>
                <RadioGroup
                  row
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as EntryType)}
                >
                  <FormControlLabel value="CAR" control={<Radio />} label="En coche" />
                  <FormControlLabel value="WALKIN" control={<Radio />} label="Caminando" />
                </RadioGroup>
              </FormControl>

              {/* Placas sólo si es coche */}
              {entryType === 'CAR' && (
                <>
                  <Divider />
                  <Typography fontWeight={700}>Placas (coche)</Typography>

                  <Button
                    variant="outlined"
                    component="label"
                    disabled={loading || readingPlate}
                  >
                    Tomar foto de placas
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.currentTarget.value = '';
                        await handleVehiclePhotoChange(f);
                      }}
                    />
                  </Button>

                  {vehiclePhoto && (
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={vehiclePhoto}
                        alt="Foto de placas"
                        style={{
                          width: '100%',
                          borderRadius: 12,
                          border: '1px solid rgba(0,0,0,0.12)',
                        }}
                      />

                      <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          component="label"
                          disabled={loading || readingPlate}
                        >
                          Volver a tomar
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              e.currentTarget.value = '';
                              await handleVehiclePhotoChange(f);
                            }}
                          />
                        </Button>

                        <Button
                          variant="outlined"
                          disabled={!vehiclePhoto || loading || readingPlate}
                          onClick={handleReadPlateAgain}
                        >
                          Leer placa
                        </Button>

                        {readingPlate && <CircularProgress size={18} />}
                      </Stack>
                    </Box>
                  )}

                  <TextField
                    label="Placa detectada"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    fullWidth
                    helperText={
                      readingPlate
                        ? 'Leyendo placa...'
                        : 'Puedes corregirla manualmente si hace falta'
                    }
                  />
                </>
              )}

              <Alert severity="info">
                Al generar el ticket, la habitación cambiará a <strong>OCUPADA</strong>.
              </Alert>
            </>
          )}

          {isOcupada && (
            <>
              <Divider />
              <Typography fontWeight={700}>Acciones</Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button variant="outlined" onClick={handleReprint} disabled={loading}>
                  Reimprimir ticket
                </Button>
              </Stack>

              <Divider />
              <Typography fontWeight={700}>Agregar tiempo</Typography>

              <TextField
                select
                label="Tiempo a agregar"
                value={minutesToAdd}
                onChange={(e) => setMinutesToAdd(Number(e.target.value))}
                fullWidth
              >
                {(extendOptions.length
                  ? extendOptions
                  : [{ id: '120m', label: '120 min', minutes: 120 }]
                ).map((opt) => (
                  <MenuItem key={opt.id} value={opt.minutes}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button variant="contained" onClick={handleExtendTime} disabled={loading}>
                Agregar tiempo (cobra)
              </Button>

              <Divider />
              <Typography fontWeight={700}>Venta general</Typography>

              <TextField
                label="¿Qué se vendió?"
                value={saleDesc}
                onChange={(e) => setSaleDesc(e.target.value)}
                fullWidth
                placeholder="Ej. 2 refrescos y papas, comida, etc..."
              />

              <TextField
                label="¿Cuánto se cobró?"
                type="number"
                value={saleAmount}
                onChange={(e) => setSaleAmount(Number(e.target.value))}
                inputProps={{ min: 1, step: 1 }}
                fullWidth
              />

              <Button variant="contained" onClick={handleGeneralSale} disabled={loading}>
                Registrar venta (cobra)
              </Button>

              <Divider />
              <Typography fontWeight={700}>Placas (coche)</Typography>

              <Button
                variant="outlined"
                component="label"
                disabled={loading || readingPlate}
              >
                Tomar / cambiar foto
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.currentTarget.value = '';
                    await handleVehiclePhotoChange(f);
                  }}
                />
              </Button>

              {vehiclePhoto && (
                <Box sx={{ mt: 1 }}>
                  <img
                    src={vehiclePhoto}
                    alt="Foto de placas"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.12)',
                    }}
                  />

                  <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      disabled={!vehiclePhoto || loading || readingPlate}
                      onClick={handleReadPlateAgain}
                    >
                      Leer placa
                    </Button>
                    {readingPlate && <CircularProgress size={18} />}
                  </Stack>
                </Box>
              )}

              <TextField
                label="Placa"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                fullWidth
              />

              <Button
                variant="contained"
                onClick={handleSaveVehicleNow}
                disabled={loading || readingPlate}
              >
                Guardar placa y foto
              </Button>

              <Divider />
              <Typography fontWeight={700}>Cambiar estado</Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setStatus('POR ASEAR')}
                  disabled={loading}
                >
                  Marcar POR ASEAR
                </Button>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => setStatus('DISPONIBLE')}
                  disabled={loading}
                >
                  Liberar (DISPONIBLE)
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setStatus('CERRADA')}
                  disabled={loading}
                >
                  CERRADA
                </Button>
              </Stack>
            </>
          )}

          {!isDisponible && !isOcupada && (
            <>
              <Divider />
              <Typography fontWeight={700}>Cambiar estado</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button onClick={() => setStatus('DISPONIBLE')} disabled={loading}>
                  DISPONIBLE
                </Button>
                <Button onClick={() => setStatus('POR ASEAR')} disabled={loading}>
                  POR ASEAR
                </Button>
                <Button color="error" onClick={() => setStatus('CERRADA')} disabled={loading}>
                  CERRADA
                </Button>
              </Stack>
            </>
          )}

          {room.activeSession?.folio && (
            <Typography variant="caption" color="text.secondary">
              Tiempo extra, ventas y placas se asocian al folio.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cerrar
        </Button>

        {isDisponible && (
          <Button onClick={handleGenerate} variant="contained" disabled={loading}>
            Generar ticket
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
