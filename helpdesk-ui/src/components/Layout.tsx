import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Avatar, Menu, MenuItem, Divider, Chip
} from '@mui/material';
import DashboardIcon  from '@mui/icons-material/Dashboard';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PeopleIcon     from '@mui/icons-material/People';
import LogoutIcon     from '@mui/icons-material/Logout';
import MenuIcon       from '@mui/icons-material/Menu';
import { useAuth }    from '../context/AuthContext';

const DRAWER_WIDTH = 240;

// Colores por rol para que sea visualmente claro quién está logueado
const ROLE_COLORS: Record<string, 'error' | 'warning' | 'success'> = {
  Administrator: 'error',
  Agent:         'warning',
  Requester:     'success'
};

const ROLE_LABELS: Record<string, string> = {
  Administrator: 'Administrador',
  Agent:         'Agente',
  Requester:     'Solicitante'
};

const Layout: React.FC = () => {
  const { user, logout }   = useAuth();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl]     = useState<null | HTMLElement>(null);

  // Menú lateral — los ítems se muestran según el rol
  const menuItems = [
    {
      text:  'Dashboard',
      icon:  <DashboardIcon />,
      path:  '/dashboard',
      roles: ['Administrator', 'Agent', 'Requester'] // todos
    },
    {
      text:  'Tickets',
      icon:  <ConfirmationNumberIcon />,
      path:  '/tickets',
      roles: ['Administrator', 'Agent', 'Requester'] // todos
    },
    {
      text:  'Usuarios',
      icon:  <PeopleIcon />,
      path:  '/users',
      roles: ['Administrator'] // solo admin
    }
  ];

  // Filtramos los ítems según el rol del usuario actual
  const visibleItems = menuItems.filter(
    item => user && item.roles.includes(user.role)
  );

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'primary.main' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
          🎫 HelpDesk
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {visibleItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Barra superior */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Mesa de Ayuda
          </Typography>

          {/* Chip con el rol del usuario */}
          <Chip
            label={ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            color={ROLE_COLORS[user?.role ?? ''] ?? 'default'}
            size="small"
            sx={{ mr: 2, color: 'white', fontWeight: 'bold' }}
          />

          {/* Avatar con menú de usuario */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.fullName?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.fullName}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={logout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Menú lateral */}
      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
