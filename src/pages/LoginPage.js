import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider, Stack,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '../store/slices/authSlice';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8765';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Редирект при успешной авторизации
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/main');
    }
  }, [isAuthenticated, navigate]);

  // Показываем toast при ошибке
  useEffect(() => {
    if (error) {
      setToast({ open: true, message: error, severity: 'error' });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setToast({ open: true, message: 'Введите email и пароль', severity: 'warning' });
      return;
    }

    dispatch(login({ email: form.email, password: form.password }));
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/oauth/authorize/google?type=login`;
  };

  const handleYandexLogin = () => {
    window.location.href = `${API_BASE_URL}/api/oauth/authorize/yandex?type=login`;
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" bgcolor="background.default">
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, minWidth: 340, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" color="text.primary" fontWeight={700} mb={2} align="center">
          Вход в систему
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              required
              autoFocus
              disabled={loading}
              autoComplete="email"
            />
            <TextField
              label="Пароль"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ mt: 1 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
            </Button>
          </Stack>
        </form>
        <Divider sx={{ my: 3 }}>или</Divider>
        <Stack spacing={1}>
          <Button
            variant="outlined"
            startIcon={<img src={require('../assets/icons/icons8-google.svg').default} alt="Google" style={{width: 24, height: 24}} />}
            fullWidth
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
          >
            Войти через Google
          </Button>
          <Button
            variant="outlined"
            startIcon={<img src={require('../assets/icons/idjTYqBahg_1760536075578.png')} alt="Yandex" style={{width: 24, height: 24}} />}
            fullWidth
            onClick={handleYandexLogin}
            disabled={loading}
            type="button"
          >
            Войти через Яндекс
          </Button>
        </Stack>
        <Box mt={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Нет аккаунта?{' '}
            <Button color="primary" onClick={() => navigate('/register')} sx={{ textTransform: 'none' }}>
              Зарегистрироваться
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;

