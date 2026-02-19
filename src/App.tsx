import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './template/dashboard/Dashboard';
import SignIn from './features/auth/SignIn';
import RequireAuth from './features/auth/RequireAuth';
import { getSession } from './features/auth/auth.store';
import TicketPrintPage from './features/ticket/TicketPrintPage';

export default function App() {
  const session = getSession();

  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/login" element={<SignIn />} />

        {/* Dashboard protegido */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* Redirección automática */}
        <Route
          path="*"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* Página de impresión de tickets */}
        <Route
          path="/print/:folio"
          element={
            <RequireAuth>
              <TicketPrintPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
