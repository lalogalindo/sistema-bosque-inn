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
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import LogoutIcon from '@mui/icons-material/Logout';

import { useLogout } from '../auth/useLogout';

type MenuItem = {
  text: string;
  to: string;
  icon: React.ReactNode;
  // si luego quieres controlar por rol:
  // roles?: Array<'ADMIN' | 'STAFF'>;
};

const mainListItems: MenuItem[] = [
  { text: 'Home', to: '/', icon: <HomeRoundedIcon /> },
  { text: 'Analytics', to: '/reports', icon: <AnalyticsRoundedIcon /> },
  { text: 'Clients', to: '/clients', icon: <PeopleRoundedIcon /> },
  { text: 'Tasks', to: '/tasks', icon: <AssignmentRoundedIcon /> },
];

export default function MenuContent() {
  const logout = useLogout();
  const { pathname } = useLocation();

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item) => {
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