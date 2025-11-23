import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  CalendarMonth,
  Dashboard,
  EventNote,
  School,
  MeetingRoom,
  People,
  Notifications,
  AccountCircle,
  Logout,
  Brightness4,
  Brightness7,
  Person,
  Groups,
  PersonAdd,
  SmartToy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import NotificationBell from './NotificationBell';

interface LayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, logout, hasRole } = useAuthStore();
  const { mode, toggleTheme } = useThemeStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const menuItems = [
    { text: 'Главная', icon: <Home />, path: '/', roles: ['guest', 'student', 'teacher', 'admin', 'superadmin'] },
    { text: 'Расписание', icon: <CalendarMonth />, path: '/schedule', roles: ['guest', 'student', 'teacher', 'admin', 'superadmin'] },
    { text: 'Расписание студентов', icon: <Groups />, path: '/schedule/student', roles: ['guest', 'student', 'teacher', 'admin', 'superadmin'] },
    { text: 'Расписание преподавателей', icon: <Person />, path: '/schedule/teacher', roles: ['guest', 'student', 'teacher', 'admin', 'superadmin'] },
    { text: 'Свободные аудитории', icon: <MeetingRoom />, path: '/rooms/available', roles: ['guest', 'student', 'teacher', 'admin', 'superadmin'] },
    { text: 'Алерты', icon: <Notifications />, path: '/alerts', roles: ['guest', 'student', 'teacher', 'admin', 'superadmin'] },
    { divider: true },
    { text: 'Панель управления', icon: <Dashboard />, path: '/admin', roles: ['admin', 'superadmin'] },
    { text: 'Занятия', icon: <EventNote />, path: '/admin/sessions', roles: ['admin', 'superadmin'] },
    { text: 'Курсы', icon: <School />, path: '/admin/courses', roles: ['admin', 'superadmin'] },
    { text: 'Аудитории', icon: <MeetingRoom />, path: '/admin/rooms', roles: ['admin', 'superadmin'] },
    { text: 'Пользователи', icon: <People />, path: '/admin/users', roles: ['admin', 'superadmin'] },
    { text: 'Преподаватели', icon: <PersonAdd />, path: '/admin/teachers', roles: ['admin', 'superadmin'] },
    { text: 'Уведомления', icon: <Notifications />, path: '/admin/notifications', roles: ['admin', 'superadmin'] },
    { text: 'AI Ассистент', icon: <SmartToy />, path: '/admin/ai', roles: ['admin', 'superadmin'] },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Smart Schedule
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item, index) =>
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          ) : (
            item.roles?.includes(user?.role || 'guest') && (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path!);
                    if (isMobile) handleDrawerToggle();
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            )
          )
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: theme.palette.mode === 'light' ? 'white' : undefined,
          color: theme.palette.mode === 'light' ? '#4f4f4f' : undefined,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {import.meta.env.VITE_APP_UNIVERSITY}
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {user && <NotificationBell />}
          {user && (
            <IconButton color="inherit" onClick={handleProfileMenuOpen}>
              <Avatar sx={{ width: 32, height: 32 }}>{user.name[0]}</Avatar>
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem disabled>
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText
            primary={user?.name}
            secondary={user?.email || user?.groupNumber}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText>Выйти</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;