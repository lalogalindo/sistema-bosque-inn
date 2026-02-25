import { useNavigate, useLocation } from 'react-router-dom';
import CustomSignIn from '../signin/SignIn';
import { signIn } from './auth.service';
import { setSession } from './auth.store';

type LocationState = { from?: string };

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: LocationState };
  const redirectTo = location.state?.from ?? '/';

  async function handleLogin(username: string, password: string) {
    const session = await signIn(username, password);
    setSession(session);
    navigate(redirectTo, { replace: true });
  }

  // return <MuiSignIn onSubmit={handleLogin} />;
  return <CustomSignIn onSubmit={handleLogin} />;
}