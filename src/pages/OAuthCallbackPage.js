import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { setUser, setOAuthRegistration } from '../store/slices/authSlice';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      // Получаем параметры
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const errorParam = searchParams.get('error');

      // Параметры для OAuth регистрации (новый пользователь)
      const registrationToken = searchParams.get('token');
      const email = searchParams.get('email');
      const name = searchParams.get('name');

      // Ошибка от провайдера
      if (errorParam) {
        console.error('OAuth error:', errorParam);
        setError(decodeURIComponent(errorParam));
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Новый пользователь - нужно завершить регистрацию (выбрать роль)
      if (registrationToken) {
        const oauthData = {
          temporaryToken: registrationToken,
          email: email ? decodeURIComponent(email) : null,
          fullName: name ? decodeURIComponent(name) : null,
        };

        dispatch(setOAuthRegistration(oauthData));
        localStorage.setItem('oauthRegistration', JSON.stringify(oauthData));

        // Редирект на выбор роли с параметрами
        navigate(`/role?token=${encodeURIComponent(registrationToken)}${email ? `&email=${encodeURIComponent(email)}` : ''}${name ? `&name=${encodeURIComponent(name)}` : ''}`);
        return;
      }

      // Существующий пользователь - успешная аутентификация
      if (accessToken && refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Декодируем JWT для получения информации о пользователе
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const user = {
            userId: payload.sub || payload.userId,
            email: payload.email,
            fullName: payload.fullName || payload.name || payload.full_name,
            roles: payload.roles || [],
          };
          localStorage.setItem('user', JSON.stringify(user));
          dispatch(setUser(user));
          navigate('/main');
        } catch (e) {
          console.error('Failed to decode token:', e);
          setError('Ошибка обработки токена авторизации');
          setTimeout(() => navigate('/login'), 3000);
        }
        return;
      }

      // Нет данных
      setError('Не удалось получить данные авторизации');
      setTimeout(() => navigate('/login'), 3000);
    };

    processCallback();
  }, [searchParams, navigate, dispatch]);

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Перенаправление на страницу входа...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3 }}>
        Выполняется вход...
      </Typography>
    </Box>
  );
};

export default OAuthCallbackPage;

