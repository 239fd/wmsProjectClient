import React from 'react';
import {
  Box, Paper, Typography, Button, Stack
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" bgcolor="background.default">
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, minWidth: 340, maxWidth: 480, width: '100%' }}>
        <Typography variant="h5" color="text.primary" fontWeight={700} mb={1} align="center">
          Регистрация в WMS
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} align="center">
          Выберите способ регистрации
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<MailOutlineIcon />}
            onClick={() => navigate('/register/invitation')}
            fullWidth
            sx={{ justifyContent: 'flex-start', py: 1.5, textTransform: 'none' }}
          >
            <Box sx={{ textAlign: 'left', flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                У меня есть приглашение
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Регистрация по токену из email от директора
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<BusinessIcon />}
            onClick={() => navigate('/register/director')}
            fullWidth
            sx={{ justifyContent: 'flex-start', py: 1.5, textTransform: 'none' }}
          >
            <Box sx={{ textAlign: 'left', flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Зарегистрировать новую компанию
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Стану директором и приглашу сотрудников
              </Typography>
            </Box>
          </Button>
        </Stack>

        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Уже есть аккаунт?{' '}
            <Button color="primary" onClick={() => navigate('/login')} sx={{ textTransform: 'none' }}>
              Войти
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
