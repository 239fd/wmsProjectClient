import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <AppBar position="static" color="inherit" elevation={1} sx={{ mb: 4, bgcolor: '#fde789', color: '#111' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 2, cursor: 'pointer', color: '#111' }} onClick={() => navigate('/')}>WMS</Typography>
        <Box>
          <Button sx={{ mr: 2, color: '#111', borderColor: '#111' }} variant="text" onClick={() => navigate('/login')}>Вход</Button>
          <Button sx={{ color: '#111', background: '#fff', border: '1px solid #111', '&:hover': { background: '#1e1f22' } }} variant="contained" onClick={() => navigate('/register')}>Регистрация</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
