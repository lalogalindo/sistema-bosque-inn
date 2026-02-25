import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import MenuContent from '../sidebar/MenuContent';
import { getSession } from '../auth/auth.store';

interface SideMenuMobileProps {
  open: boolean | undefined;
  toggleDrawer: (newOpen: boolean) => () => void;
}

export default function SideMenuMobile({ open, toggleDrawer }: SideMenuMobileProps) {
  const session = getSession();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: {
          backgroundImage: 'none',
          backgroundColor: 'background.paper',
          width: '70dvw',
          maxWidth: 320,
        },
      }}
    >
      <Stack sx={{ height: '100%' }}>
        {/* Header igual a desktop */}
        <Stack
          direction="row"
          sx={{
            p: 2,
            gap: 1,
            alignItems: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Avatar
            sizes="small"
            alt={session?.name ?? session?.username ?? 'Usuario'}
            src="/static/images/avatar/7.jpg"
            sx={{ width: 36, height: 36 }}
          />
          <Box sx={{ mr: 'auto' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
              {session?.name ?? session?.username ?? 'Usuario'}
            </Typography>
          </Box>
        </Stack>

        <Divider />

        {/* Contenido igual a desktop */}
        <Box
          sx={{
            overflow: 'auto',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
          // Bonus: cerrar drawer al hacer click en cualquier opción del menú
          onClick={toggleDrawer(false)}
        >
          <MenuContent />
        </Box>
      </Stack>
    </Drawer>
  );
}