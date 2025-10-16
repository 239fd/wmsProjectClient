import React from 'react';
import { Box, Typography } from '@mui/material';

const MainPage = () => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
      <Typography variant="h4" fontWeight={700} mb={2}>
        Добро пожаловать в систему WMS!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Это главная страница для аутентифицированных пользователей.
      </Typography>
    </Box>
  );
};

export default MainPage;

