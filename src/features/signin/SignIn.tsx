import * as React from 'react';
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';

import ForgotPassword from '../../template/sign-in/components/ForgotPassword';
import AppTheme from '../../template/shared-theme/AppTheme';

import Logo from '../../assets/images/logo.png';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export type SignInProps = {
  disableCustomTheme?: boolean;
  onSubmit: (username: string, password: string) => Promise<void>;
};

export default function SignIn(props: SignInProps) {
  const { onSubmit } = props;

  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleClose = () => setOpen(false);

  const validateInputs = () => {
    const username = document.getElementById('user') as HTMLInputElement | null;
    const password = document.getElementById('password') as HTMLInputElement | null;

    let isValid = true;

    const usernameValue = username?.value.trim() ?? '';
    const passwordValue = password?.value ?? '';

    if (!usernameValue) {
      setUsernameError(true);
      setUsernameErrorMessage('Ingresa un usuario.');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!passwordValue || passwordValue.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  // NOTE: using React.FormEvent (no <HTMLFormElement>) to avoid your TS deprecation warning
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateInputs()) return;

    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    const username = String(data.get('user') ?? '').trim();
    const password = String(data.get('password') ?? '');

    try {
      setLoading(true);
      await onSubmit(username, password);
    } catch (err: unknown) {
      setPasswordError(true);
      setPasswordErrorMessage(err instanceof Error ? err.message : 'Credenciales incorrectas');
      console.warn(`Error -> ${err instanceof Error ? err.message : err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('fullwidth-root');
    return () => {
      document.body.classList.remove('fullwidth-root');
    };
  }, []);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer justifyContent="center" alignContent="center">
        {/* <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} /> */}
        <Card variant="outlined">
          <Box
            component="img"
            src={Logo}
            alt="Logo"
            sx={{
              width: 150,
              m: '0 auto',
            }}
          />

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="user">Usuario</FormLabel>
              <TextField
                error={usernameError}
                helperText={usernameErrorMessage}
                id="user"
                type="text"
                name="user"
                placeholder="usuario"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={usernameError ? 'error' : 'primary'}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>

            <ForgotPassword open={open} handleClose={handleClose} />

            <Button type="submit" fullWidth variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}