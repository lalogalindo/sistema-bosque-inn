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
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';

import { getCurrentUser } from '../../../features/auth/auth.store';

const mainListItems = [
  { text: 'Habitaciones', icon: <HomeRoundedIcon />, adminOnly: false },
  { text: 'Corte de Caja', icon: <AnalyticsRoundedIcon />, adminOnly: true },
  { text: 'Usuarios', icon: <PeopleRoundedIcon />, adminOnly: true },
  { text: 'Log de Actividad', icon: <AssignmentRoundedIcon />, adminOnly: true },
];

const secondaryListItems = [
  { text: 'Ajustes', icon: <SettingsRoundedIcon />, adminOnly: true },
  { text: 'Ayuda', icon: <HelpRoundedIcon />, adminOnly: false },
];

export default function MenuContent() {
  const user = getCurrentUser();
  // Forzamos a que sea mayúsculas para evitar errores entre 'Admin' y 'ADMIN'
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';

  const filteredMain = mainListItems.filter(item => !item.adminOnly || isAdmin);
  const filteredSecondary = secondaryListItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {filteredMain.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton selected={index === 0}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {filteredSecondary.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
