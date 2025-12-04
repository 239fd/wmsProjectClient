import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider, Stack,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8765';

const RegisterPage = () => {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    password: '',
    confirmPassword: ''
  });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валидация
    if (!form.email || !form.lastName || !form.firstName || !form.password) {
      setToast({ open: true, message: 'Заполните обязательные поля', severity: 'warning' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setToast({ open: true, message: 'Пароли не совпадают', severity: 'warning' });
      return;
    }

    if (form.password.length < 8) {
      setToast({ open: true, message: 'Пароль должен быть не менее 8 символов', severity: 'warning' });
      return;
    }

    // Сохраняем данные регистрации и переходим на выбор роли
    const registrationData = {
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      middleName: form.middleName || null,
      password: form.password,
      type: 'standard' // Отличаем от OAuth
    };

    localStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
    navigate('/role');
  };

  const handleGoogleRegister = () => {
    window.location.href = `${API_BASE_URL}/api/oauth/authorize/google?type=register`;
  };

  const handleYandexRegister = () => {
    window.location.href = `${API_BASE_URL}/api/oauth/authorize/yandex?type=register`;
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
          Регистрация
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
              disabled={loading}
              autoComplete="email"
            />
            <TextField
              label="Фамилия"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
            />
            <TextField
              label="Имя"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
            />
            <TextField
              label="Отчество"
              name="middleName"
              value={form.middleName}
              onChange={handleChange}
              fullWidth
              disabled={loading}
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
              autoComplete="new-password"
              helperText="Минимум 8 символов"
            />
            <TextField
              label="Подтвердите пароль"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              fullWidth
              required
              disabled={loading}
              autoComplete="new-password"
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Далее'}
            </Button>
          </Stack>
        </form>
        <Divider sx={{ my: 3 }}>или</Divider>
        <Stack spacing={1}>
          <Button
            variant="outlined"
            startIcon={<img src={require('../assets/icons/icons8-google.svg').default} alt="Google" style={{width: 24, height: 24}} />}
            fullWidth
            onClick={handleGoogleRegister}
            disabled={loading}
            type="button"
          >
            Регистрация через Google
          </Button>
          <Button
            variant="outlined"
            startIcon={<img src={require('../assets/icons/idjTYqBahg_1760536075578.png')} alt="Yandex" style={{width: 24, height: 24}} />}
            fullWidth
            onClick={handleYandexRegister}
            disabled={loading}
            type="button"
          >
            Регистрация через Яндекс
          </Button>
        </Stack>
        <Box mt={2} textAlign="center">
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

