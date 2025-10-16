import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem, Tooltip, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const MainNavbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };
  const handleLogout = () => {
    handleClose();
    navigate('/');
  };

  return (
    <AppBar position="static" elevation={1} sx={{ mb: 4, bgcolor: '#fbe588', color: '#111' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, letterSpacing: 2, cursor: 'pointer', color: '#111' }}
          onClick={() => navigate('/main')}
        >
          WMS
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Личный кабинет">
            <IconButton onClick={() => navigate('/profile')} sx={{ color: '#111' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#fff', color: '#111', border: '1px solid #111' }}>ЛК</Avatar>
            </IconButton>
          </Tooltip>
          <Tooltip title="Меню настроек">
            <IconButton onClick={handleSettingsClick} sx={{ color: '#111' }}>
              <img src={require('../../assets/icons/settings-svgrepo-com.svg').default} alt="settings" style={{ width: 28, height: 28, filter: 'invert(0%)' }} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleSettings}>Настройки</MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Выйти</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MainNavbar;
