'use client';

import { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Avatar, Badge, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LanguageIcon from '@mui/icons-material/Language';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { toggleTheme, setLanguage } from '../../store/slices/settingsSlice';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user } = useAppSelector((state) => state.auth);
  const { theme, language } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    dispatch(logout());
    router.push('/auth/login');
  };

  const handleProfile = () => {
    handleClose();
    router.push('/profile');
  };

  const handleLanguageToggle = () => {
    dispatch(setLanguage(language === 'en' ? 'th' : 'en'));
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'background.paper', color: 'text.primary' }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {t('navbar.title', 'NatPrachum TCI')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <IconButton onClick={handleLanguageToggle} color="inherit" size="small" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LanguageIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{language === 'en' ? 'EN' : 'TH'}</Typography>
          </IconButton>
          
          <IconButton onClick={() => dispatch(toggleTheme())} color="inherit" size="small">
            {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={handleMenu}>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {user.first_name} {user.last_name}
              </Typography>
              {user.avatar_url ? (
                <Avatar src={user.avatar_url} alt={user.first_name} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircle sx={{ width: 32, height: 32, color: 'text.secondary' }} />
              )}
            </Box>
            
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleProfile}>{t('navbar.profile', 'Profile')}</MenuItem>
              <MenuItem onClick={handleLogout}>{t('navbar.logout', 'Logout')}</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
