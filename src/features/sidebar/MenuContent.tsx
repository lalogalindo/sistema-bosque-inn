import { NavLink, useLocation } from 'react-router-dom';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';

import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';

import LogoutIcon from '@mui/icons-material/Logout';

import { useLogout } from '../auth/useLogout';
import { getCurrentUser } from '../auth/auth.store';

type MenuItem = {
  text: string;
  to: string;
  icon: React.ReactNode;
  adminOnly: boolean;
};

const mainListItems: MenuItem[] = [
  { text: 'Habitaciones', to: '/', icon: <HomeRoundedIcon />, adminOnly: false },
  { text: 'Corte de Caja', to: '/reports', icon: <AnalyticsRoundedIcon />, adminOnly: true },
  { text: 'Usuarios', to: '/users', icon: <PeopleRoundedIcon />, adminOnly: true },
];

export default function MenuContent() {
  const logout = useLogout();
  const { pathname } = useLocation();
  const user = getCurrentUser();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const visibleItems = mainListItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {visibleItems.map((item) => {
          const selected = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));

          return (
            <ListItem key={item.to} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                selected={selected}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <List dense>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={logout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </Stack>
  );
}