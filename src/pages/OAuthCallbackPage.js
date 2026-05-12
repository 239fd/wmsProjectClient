import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import {
  setUser,
  completeOAuthRegistration,
} from '../store/slices/authSlice';

const INTENT_TTL_MS = 10 * 60 * 1000;

const consumeOAuthIntent = () => {
  const raw = localStorage.getItem('oauthIntent');
  if (!raw) return null;
  localStorage.removeItem('oauthIntent');
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.ts && Date.now() - parsed.ts > INTENT_TTL_MS) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse oauthIntent:', e);
    return null;
  }
};

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const processCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const errorParam = searchParams.get('error');

      const registrationToken = searchParams.get('token');

      if (accessToken || refreshToken || registrationToken || errorParam) {
        try {
          window.history.replaceState({}, '', '/auth/callback');
        } catch (e) {

        }
      }

      if (errorParam) {
        console.error('OAuth error:', errorParam);
        setError(decodeURIComponent(errorParam));
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (accessToken && refreshToken) {
        const intent = consumeOAuthIntent();
        const wasRegisterAttempt = intent?.type === 'register-director'
          || intent?.type === 'register-invitation';

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const user = {
            userId: payload.sub || payload.userId,
            email: payload.email,
            fullName: payload.fullName || payload.name || payload.full_name,
            role: payload.role,
          };
          localStorage.setItem('user', JSON.stringify(user));
          dispatch(setUser(user));

          if (wasRegisterAttempt) {

            setInfo('У вас уже есть аккаунт — выполняем вход');
            setTimeout(() => navigate('/main', { replace: true }), 1800);
          } else {
            navigate('/main', { replace: true });
          }
        } catch (e) {
          console.error('Failed to decode token:', e);
          setError('Ошибка обработки токена авторизации');
          setTimeout(() => navigate('/login'), 3000);
        }
        return;
      }

      if (registrationToken) {
        const intent = consumeOAuthIntent();

        if (intent?.type === 'register-director') {
          try {
            await dispatch(completeOAuthRegistration({
              temporaryToken: registrationToken,
              role: 'DIRECTOR',
            })).unwrap();
            navigate('/main/organization?firstTime=true', { replace: true });
            return;
          } catch (e) {
            console.error('OAuth director auto-complete failed:', e);
            setError(typeof e === 'string' ? e : 'Не удалось завершить OAuth-регистрацию директора');
            setTimeout(() => navigate('/register'), 3000);
            return;
          }
        }

        if (intent?.type === 'register-invitation' && intent?.invitationToken) {
          try {
            await dispatch(completeOAuthRegistration({
              temporaryToken: registrationToken,
              invitationToken: intent.invitationToken,
            })).unwrap();
            navigate('/main', { replace: true });
            return;
          } catch (e) {
            console.error('OAuth invitation auto-complete failed:', e);
            setError(typeof e === 'string' ? e : 'Не удалось завершить OAuth-регистрацию по приглашению');
            setTimeout(
              () => navigate(`/register/invitation?token=${encodeURIComponent(intent.invitationToken)}`),
              3000,
            );
            return;
          }
        }

        setError('Регистрация была прервана. Начните заново.');
        setTimeout(() => navigate('/register'), 3000);
        return;
      }

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
          Перенаправление...
        </Typography>
      </Box>
    );
  }

  if (info) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={3}
      >
        <Alert severity="info" sx={{ mb: 2, maxWidth: 400 }}>
          {info}
        </Alert>
        <CircularProgress size={28} />
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
        Завершаем регистрацию...
      </Typography>
    </Box>
  );
};

export default OAuthCallbackPage;
