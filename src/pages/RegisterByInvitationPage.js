import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack,
  CircularProgress, Alert, Chip, InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  registerByInvitation,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  clearError,
} from '../store/slices/authSlice';
import { registerInvitationSchema } from '../validation/schemas';
import { useSnackbar } from '../context/SnackbarContext';
import httpService from '../services/httpService';
import { API_ENDPOINTS } from '../config/api';
import OAuthButtons from '../components/shared/OAuthButtons';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLE_LABELS = {
  WORKER: 'Работник',
  ACCOUNTANT: 'Бухгалтер',
  DIRECTOR: 'Директор',
};

const RegisterByInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notify } = useSnackbar();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [validation, setValidation] = useState({ status: 'idle', data: null, message: '' });
  const debounceRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerInvitationSchema),
    defaultValues: {
      invitationToken: tokenFromUrl,
      email: '', firstName: '', lastName: '', middleName: '',
      password: '', confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const invitationToken = watch('invitationToken');

  useEffect(() => {
    if (isAuthenticated) navigate('/main', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      notify(error, 'error');
      dispatch(clearError());
    }
  }, [error, dispatch, notify]);

  useEffect(() => {
    const token = (invitationToken || '').trim();

    if (!token) {
      setValidation({ status: 'idle', data: null, message: '' });
      return undefined;
    }

    if (!UUID_REGEX.test(token)) {
      setValidation({ status: 'invalid', data: null, message: 'Некорректный формат токена' });
      return undefined;
    }

    setValidation((prev) => ({ ...prev, status: 'checking' }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await httpService.get(
          `${API_ENDPOINTS.INVITATIONS.VALIDATE}?token=${encodeURIComponent(token)}`,
          { includeAuth: false }
        );
        if (res?.valid) {
          setValidation({ status: 'valid', data: res, message: '' });

          if (!watch('email')) setValue('email', res.email || '', { shouldValidate: true });
        } else {
          setValidation({
            status: 'invalid',
            data: null,
            message: res?.message || 'Приглашение недействительно или просрочено',
          });
        }
      } catch (err) {
        setValidation({
          status: 'invalid',
          data: null,
          message: err?.message || 'Не удалось проверить токен',
        });
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };

  }, [invitationToken]);

  const onSubmit = (values) => {
    if (validation.status !== 'valid') {
      notify('Сначала проверьте токен приглашения', 'warning');
      return;
    }
    dispatch(registerByInvitation({
      invitationToken: values.invitationToken.trim(),
      email: values.email.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName?.trim() || null,
      password: values.password,
    }));
  };

  const tokenAdornment = (() => {
    if (validation.status === 'checking') return <CircularProgress size={20} />;
    if (validation.status === 'valid') return <CheckCircleIcon color="success" />;
    if (validation.status === 'invalid') return <ErrorOutlineIcon color="error" />;
    return null;
  })();

  const submitDisabled = loading || validation.status !== 'valid';

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
        <Typography variant="h5" color="text.primary" fontWeight={700} mb={3} align="center">
          Регистрация по приглашению
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Токен приглашения"
              fullWidth
              disabled={loading || !!tokenFromUrl}
              placeholder="00000000-0000-0000-0000-000000000000"
              {...register('invitationToken')}
              error={!!errors.invitationToken || validation.status === 'invalid'}
              helperText={
                errors.invitationToken?.message
                || (tokenFromUrl ? 'Токен подставлен из ссылки' : 'UUID из email-приглашения')
              }
              InputProps={tokenAdornment ? {
                endAdornment: <InputAdornment position="end">{tokenAdornment}</InputAdornment>,
              } : undefined}
            />

            {validation.status === 'valid' && validation.data && (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ alignItems: 'center' }}>
                <Typography variant="body2">
                  Приглашение от <b>{validation.data.organizationName || 'организации'}</b> на роль:{' '}
                </Typography>
                <Chip
                  label={ROLE_LABELS[validation.data.role] || validation.data.role}
                  color="success"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Alert>
            )}

            {validation.status === 'invalid' && (
              <Alert severity="error" icon={<ErrorOutlineIcon />}>
                {validation.message}
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              fullWidth
              disabled={loading || validation.status === 'valid'}
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              slotProps={{
                inputLabel: { shrink: !!watch('email') || validation.status === 'valid' },
              }}
              helperText={
                errors.email?.message
                || (validation.status === 'valid'
                  ? 'Email из приглашения, изменить нельзя'
                  : 'Должен совпадать с email из приглашения')
              }
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
              disabled={submitDisabled}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Зарегистрироваться'}
            </Button>
          </Stack>
        </form>

        {validation.status === 'valid' && validation.data && (
          <>
            <OAuthButtons
              disabled={loading}
              intent={{
                type: 'register-invitation',
                invitationToken: (invitationToken || '').trim(),
              }}
            />
            {validation.data.email && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1.5, textAlign: 'center' }}
              >
                Войдите через ту же почту: <b>{validation.data.email}</b>
              </Typography>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default RegisterByInvitationPage;
