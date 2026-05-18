import React, { useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider, Stack,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { login, clearError, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '../store/slices/authSlice';
import { loginSchema } from '../validation/schemas';
import { useSnackbar } from '../context/SnackbarContext';
import { BACKEND_URL as API_BASE_URL } from '../config/api';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notify } = useSnackbar();

  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/main');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      notify(error, 'error');
      dispatch(clearError());
    }
  }, [error, dispatch, notify]);

  const onSubmit = (values) => {
    dispatch(login({ email: values.email.trim(), password: values.password }));
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/oauth/authorize/google?type=login`;
  };

  const handleYandexLogin = () => {
    window.location.href = `${API_BASE_URL}/api/oauth/authorize/yandex?type=login`;
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" bgcolor="background.default">
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, minWidth: 340, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" color="text.primary" fontWeight={700} mb={2} align="center">
          Вход в систему
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoFocus
              disabled={loading}
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Пароль"
              type="password"
              fullWidth
              disabled={loading}
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
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
