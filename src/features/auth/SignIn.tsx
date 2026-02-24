import { useNavigate, useLocation } from 'react-router-dom';
// import MuiSignIn from '../../template/sign-in/SignIn';
import CustomSignIn from '../signin/SignIn';
import { signIn } from './auth.service';
import { setSession } from './auth.store';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const redirectTo = location?.state?.from ?? '/';

  async function handleLogin(email: string, password: string) {
    const session = await signIn(email, password);
    setSession(session);
    navigate(redirectTo, { replace: true });
  }

  // return <MuiSignIn onSubmit={handleLogin} />;
  return <CustomSignIn onSubmit={handleLogin} />;
}
