import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <AppBar position="static" color="inherit" elevation={1} sx={{ mb: 4 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700, letterSpacing: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>WMS</Typography>
        <Box>
          <Button color="primary" variant="text" sx={{ mr: 2 }} onClick={() => navigate('/login')}>Вход</Button>
          <Button color="primary" variant="contained" onClick={() => navigate('/register')}>Регистрация</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

