import { useNavigate } from 'react-router-dom';
import { clearSession } from './auth.store';

export function useLogout() {
  const navigate = useNavigate();

  return function logout() {
    clearSession();
    navigate('/login', { replace: true });
  };
}
