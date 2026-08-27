'use client';

import * as React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Toolbar, Badge } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import api from '../../services/api';

import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DevicesIcon from '@mui/icons-material/Devices';
import HistoryIcon from '@mui/icons-material/History';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector } from '../../store/hooks';
import { useTranslation } from 'react-i18next';

const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Admin';
  const isManager = user?.role === 'Manager';

  
  const [badges, setBadges] = React.useState({ room_approvals: 0, equipment_approvals: 0, food_approvals: 0 });

  React.useEffect(() => {
    if (isAdmin || isManager) {
      const fetchBadges = async () => {
        try {
          const res = await api.get<any, any>('/approvals/badges');
          if (res.success && res.data) {
            setBadges(res.data);
          }
        } catch (error) {
          console.error('Failed to fetch badges', error);
        }
      };
      fetchBadges();
    }
  }, [isAdmin, isManager]);

  const menuItems: Array<{title: string, path: string, icon: React.ReactNode, badge?: number}> = [
    { title: t('sidebar.bookings', 'Bookings'), path: '/bookings', icon: <EventIcon /> },
    { title: t('sidebar.calendar', 'Calendar'), path: '/calendar', icon: <CalendarMonthIcon /> },
    { title: t('sidebar.rooms', 'Rooms'), path: '/rooms', icon: <MeetingRoomIcon /> },
  ];

  if (isAdmin || isManager) {
    menuItems.push(
      { title: t('sidebar.food_approvals', 'Food Approvals'), path: '/food-approvals', icon: <RestaurantIcon />, badge: badges.food_approvals },
      { title: t('sidebar.equipment_approvals', 'Equipment Approvals'), path: '/equipment-approvals', icon: <DevicesIcon />, badge: badges.equipment_approvals }
    );
  }

  if (isAdmin) {
    menuItems.unshift(
      { title: t('sidebar.dashboard', 'Dashboard'), path: '/dashboard', icon: <DashboardIcon /> }
    );
    menuItems.push(
      { title: t('sidebar.approvals', 'Approvals'), path: '/approvals', icon: <CheckCircleIcon />, badge: badges.room_approvals },
      { title: t('sidebar.reports', 'Reports'), path: '/reports', icon: <AssessmentIcon /> },
      { title: t('sidebar.users_roles', 'Users & Roles'), path: '/users', icon: <PeopleIcon /> },
      { title: t('sidebar.system_settings', 'Settings'), path: '/settings', icon: <SettingsIcon /> }
    );
  }

  if (user?.role === 'SuperAdmin') {
    menuItems.push(
      { title: t('sidebar.system_logs', 'System Logs'), path: '/logs', icon: <HistoryIcon /> }
    );
  }

  const drawerContent = (
    <div>
      <Toolbar />
      <Divider />
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <ListItem key={item.title} disablePadding sx={{ mb: 1, px: 2 }}>
              <ListItemButton
                onClick={() => {
                  router.push(item.path);
                  onClose();
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.main' : 'action.hover',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '& .MuiListItemIcon-root': {
                      color: isActive ? 'primary.contrastText' : 'primary.main',
                    }
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  minWidth: 40 
                }}>
                  {item.badge ? <Badge badgeContent={item.badge} color="error">{item.icon}</Badge> : item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  slotProps={{
                    primary: {
                      sx: {
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.95rem'
                      }
                    }
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px dashed rgba(145, 158, 171, 0.24)' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
