import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Dashboard from './features/dashboard/Dashboard';
import SignIn from './features/auth/SignIn';
import RequireAuth from './features/auth/RequireAuth';
import { getSession } from './features/auth/auth.store';
import TicketPrintPage from './features/ticket/TicketPrintPage';
import RoomsGrid from './features/rooms/RoomsGrid';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const UsersPage = lazy(() => import('./features/users/UsersPage'));
const ReportsPage = lazy(() => import('./features/reports/ReportsPage'));

function Loading() {
  return (
    <Box sx={{ py: 6, display: 'flex', justifyContent: 'center', width: '100%' }}>
      <CircularProgress />
    </Box>
  );
}

export default function App() {
  const session = getSession();

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<SignIn />} />

        {/* Dashboard layout — protegido */}
        <Route
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        >
          {/* Home: Habitaciones (todos) */}
          <Route path="/" element={<RoomsGrid />} />

          {/* Admin pages */}
          <Route path="/users" element={<Suspense fallback={<Loading />}><UsersPage /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<Loading />}><ReportsPage /></Suspense>} />
        </Route>

        {/* Página de impresión de tickets */}
        <Route
          path="/print/:folio"
          element={
            <RequireAuth>
              <TicketPrintPage />
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
      </Routes>
    </BrowserRouter>
  );
}
