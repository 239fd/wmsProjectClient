import React, { useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  registerDirector,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  clearError,
} from '../store/slices/authSlice';
import { registerDirectorSchema } from '../validation/schemas';
import { useSnackbar } from '../context/SnackbarContext';
import OAuthButtons from '../components/shared/OAuthButtons';

const RegisterDirectorPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notify } = useSnackbar();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerDirectorSchema),
    defaultValues: {
      email: '', firstName: '', lastName: '', middleName: '',
      password: '', confirmPassword: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/main/organization?firstTime=true', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      notify(error, 'error');
      dispatch(clearError());
    }
  }, [error, dispatch, notify]);

  const onSubmit = (values) => {
    dispatch(registerDirector({
      email: values.email.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName?.trim() || null,
      password: values.password,
    }));
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" bgcolor="background.default">
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, minWidth: 340, maxWidth: 460, width: '100%' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/register')}
          sx={{ textTransform: 'none', mb: 1 }}
          size="small"
          color="inherit"
        >
          Назад
        </Button>
        <Typography variant="h5" color="text.primary" fontWeight={700} mb={1} align="center">
          Регистрация заведующего
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} align="center">
          После регистрации вы создадите свою организацию
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              disabled={loading}
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              label="Фамилия"
              fullWidth
              disabled={loading}
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
            <TextField
              label="Имя"
              fullWidth
              disabled={loading}
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              label="Отчество"
              fullWidth
              disabled={loading}
              {...register('middleName')}
              error={!!errors.middleName}
              helperText={errors.middleName?.message}
            />
            <TextField
              label="Пароль"
              type="password"
              fullWidth
              disabled={loading}
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message || 'Минимум 8 символов'}
            />
            <TextField
              label="Подтвердите пароль"
              type="password"
              fullWidth
              disabled={loading}
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Зарегистрироваться'}
            </Button>
          </Stack>
        </form>

        <OAuthButtons disabled={loading} intent={{ type: 'register-director' }} />
      </Paper>
    </Box>
  );
};

export default RegisterDirectorPage;
