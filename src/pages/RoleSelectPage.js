import React, { useState, useEffect } from 'react';
import {
  Button, Container, Typography, Box, FormControl, InputLabel, Select,
  MenuItem, TextField, Paper, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  register,
  completeOAuthRegistration,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  clearError,
  setOAuthRegistration
} from '../store/slices/authSlice';

const roles = [
  { value: 'WORKER', label: 'Работник', description: 'Приём и отгрузка товаров' },
  { value: 'ACCOUNTANT', label: 'Бухгалтер', description: 'Инвентаризация, списание, переоценка' },
  { value: 'DIRECTOR', label: 'Директор', description: 'Аналитика, управление сотрудниками' },
];

const RoleSelectPage = () => {
  const [role, setRole] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });
  const [registrationType, setRegistrationType] = useState(null); // 'standard' or 'oauth'
  const [registrationData, setRegistrationData] = useState(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Определяем тип регистрации при загрузке
  useEffect(() => {
    // Проверяем OAuth параметры из URL
    const oauthToken = searchParams.get('token');
    const oauthEmail = searchParams.get('email');
    const oauthName = searchParams.get('name');

    if (oauthToken) {
      // OAuth регистрация
      setRegistrationType('oauth');
      setRegistrationData({
        temporaryToken: oauthToken,
        email: oauthEmail,
        fullName: oauthName,
      });
      // Сохраняем в Redux для персистентности
      dispatch(setOAuthRegistration({
        temporaryToken: oauthToken,
        email: oauthEmail,
        fullName: oauthName,
      }));
      return;
    }

    // Проверяем стандартную регистрацию из localStorage
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    if (pendingRegistration) {
      try {
        const data = JSON.parse(pendingRegistration);
        setRegistrationType('standard');
        setRegistrationData(data);
      } catch (e) {
        console.error('Failed to parse pendingRegistration:', e);
        navigate('/register');
      }
      return;
    }

    // Проверяем OAuth данные из localStorage (если страница была перезагружена)
    const savedOAuth = localStorage.getItem('oauthRegistration');
    if (savedOAuth) {
      try {
        const data = JSON.parse(savedOAuth);
        setRegistrationType('oauth');
        setRegistrationData(data);
      } catch (e) {
        console.error('Failed to parse oauthRegistration:', e);
        navigate('/register');
      }
      return;
    }

    // Нет данных для регистрации - перенаправляем
    navigate('/register');
  }, [searchParams, navigate, dispatch]);

  // Редирект при успешной аутентификации
  useEffect(() => {
    if (isAuthenticated) {
      // Очищаем временные данные
      localStorage.removeItem('pendingRegistration');
      localStorage.removeItem('oauthRegistration');
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

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    if (e.target.value === 'DIRECTOR') {
      setOrganizationCode('');
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) {
      setToast({ open: true, message: 'Выберите роль', severity: 'warning' });
      return;
    }

    if ((role === 'WORKER' || role === 'ACCOUNTANT') && !organizationCode) {
      setToast({ open: true, message: 'Введите код организации', severity: 'warning' });
      return;
    }

    if (registrationType === 'standard' && registrationData) {
      // Стандартная регистрация
      dispatch(register({
        email: registrationData.email,
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        middleName: registrationData.middleName,
        password: registrationData.password,
        role: role,
        organizationCode: organizationCode || null,
      }));
    } else if (registrationType === 'oauth' && registrationData) {
      // OAuth регистрация
      dispatch(completeOAuthRegistration({
        temporaryToken: registrationData.temporaryToken,
        role: role,
        organizationId: organizationCode || null,
        warehouseId: null,
      }));
    }
  };

  const handleBack = () => {
    localStorage.removeItem('pendingRegistration');
    localStorage.removeItem('oauthRegistration');
    navigate('/register');
  };

  if (!registrationData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
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

      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" py={4}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4, width: '100%', maxWidth: 450 }}>
          <Typography variant="h5" gutterBottom align="center" fontWeight={700}>
            Выберите роль
          </Typography>

          {registrationData.email && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              {registrationData.fullName || registrationData.email}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Роль</InputLabel>
              <Select
                labelId="role-label"
                value={role}
                label="Роль"
                variant="outlined"
                onChange={handleRoleChange}
                disabled={loading}
              >
                {roles.map((r) => (
                  <MenuItem key={r.value} value={r.value}>
                    <Box>
                      <Typography>{r.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(role === 'WORKER' || role === 'ACCOUNTANT') && (
              <TextField
                label="Код организации"
                value={organizationCode}
                onChange={e => setOrganizationCode(e.target.value)}
                fullWidth
                margin="normal"
                disabled={loading}
                helperText="Получите код у директора вашей организации"
              />
            )}

            {role === 'DIRECTOR' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                После регистрации вы сможете создать организацию и пригласить сотрудников
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              disabled={loading || !role}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Завершить регистрацию'}
            </Button>

            <Button
              variant="text"
              color="inherit"
              fullWidth
              sx={{ mt: 1 }}
              onClick={handleBack}
              disabled={loading}
            >
              Назад
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RoleSelectPage;

