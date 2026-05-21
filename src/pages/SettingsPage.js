import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button, Stack,
  CircularProgress, Alert, Chip, Divider,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, resetAuth } from '../store/slices/authSlice';
import profileService from '../services/profileService';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import { ListSkeleton } from '../components/shared/LoadingSkeleton';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const formatDateTime = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return iso;
  }
};

const parseUserAgent = (ua) => {
  if (!ua) return { browser: 'Неизвестное устройство', os: null };
  const browserMatch = ua.match(/(Firefox|Chrome|Edg|Safari|Opera|OPR)\/([\d.]+)/);
  const browser = browserMatch
    ? `${browserMatch[1] === 'Edg' ? 'Edge' : browserMatch[1] === 'OPR' ? 'Opera' : browserMatch[1]} ${browserMatch[2].split('.')[0]}`
    : 'Браузер';
  let os = null;
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/.test(ua)) os = 'Windows 8.1';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  return { browser, os };
};

const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notify } = useSnackbar();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terminatingId, setTerminatingId] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getSessions();

      const list = Array.isArray(data) ? data : (data?.content || []);
      setSessions(list);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить сессии');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleTerminate = async (sessionId, { isCurrent = false } = {}) => {
    setTerminatingId(sessionId);
    try {
      await profileService.terminateSession(sessionId);
      if (isCurrent) {
        notify('Текущая сессия завершена, выход из аккаунта');
        await dispatch(logout());
        navigate('/login', { replace: true });
        return;
      }
      notify('Сессия завершена');
      await loadSessions();
    } catch (err) {
      notify(err.message || 'Не удалось завершить сессию', 'error');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleTerminateAll = async () => {
    setTerminatingId('all');
    try {
      await profileService.terminateAllSessions();
      notify('Все остальные сессии завершены');
      await loadSessions();
    } catch (err) {
      notify(err.message || 'Не удалось завершить сессии', 'error');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await profileService.deleteAccount();

      dispatch(resetAuth());
      notify('Аккаунт удалён');
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch (err) {
      notify(err.message || 'Не удалось удалить аккаунт', 'error');
      setDeleting(false);
      setOpenDelete(false);
    }
  };

  return (
    <Box maxWidth={680} mx="auto" mt={4}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Настройки
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 4, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Активные сессии
          </Typography>
          {sessions.length > 1 && (
            <Button
              size="small"
              color="error"
              onClick={handleTerminateAll}
              disabled={terminatingId === 'all'}
            >
              {terminatingId === 'all' ? <CircularProgress size={16} /> : 'Завершить все остальные'}
            </Button>
          )}
        </Stack>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : error ? (
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={loadSessions}>Повторить</Button>
          }>
            {error}
          </Alert>
        ) : sessions.length === 0 ? (
          <EmptyState title="Активных сессий нет" sx={{ py: 4 }} />
        ) : (
          <List disablePadding>
            {sessions.map((session) => {
              const sessionId = session.sessionId || session.id;
              const isCurrent = session.current === true || session.isCurrent === true;
              const rawUa = session.userAgent || session.device || '';
              const { browser, os } = parseUserAgent(rawUa);
              const ip = session.ipAddress || session.ip || null;
              const when = formatDateTime(session.loginTime || session.createdAt || session.date);
              const location = session.location || null;
              const secondaryParts = [
                os,
                ip ? `IP: ${ip}` : null,
                when,
                location,
              ].filter(Boolean);

              return (
                <React.Fragment key={sessionId}>
                  <ListItem
                    disableGutters
                    sx={{ py: 1.5, pr: 22, alignItems: 'flex-start' }}
                    secondaryAction={
                      <Stack direction="row" spacing={1} alignItems="center">
                        {isCurrent && (
                          <Chip label="Текущая" color="primary" size="small" />
                        )}
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleTerminate(sessionId, { isCurrent })}
                          disabled={terminatingId === sessionId}
                        >
                          {terminatingId === sessionId ? <CircularProgress size={16} /> : (isCurrent ? 'Завершить и выйти' : 'Завершить')}
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={browser}
                      secondary={secondaryParts.join(' · ') || '—'}
                      primaryTypographyProps={{
                        fontWeight: isCurrent ? 600 : 500,
                        noWrap: true,
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                        sx: { wordBreak: 'break-word' },
                      }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Аккаунт
        </Typography>
        <Stack spacing={2} alignItems="flex-start">
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Выйти из аккаунта
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setOpenDelete(true)}
          >
            Удалить аккаунт
          </Button>
          <Typography variant="caption" color="text.secondary">
            При удалении аккаунта все ваши данные будут стёрты безвозвратно.
            Если вы директор — организация, склады, товары, документы и список сотрудников будут удалены.
            После удаления можно зарегистрироваться заново с тем же email.
          </Typography>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDeleteAccount}
        busy={deleting}
        countdownSeconds={10}
        title="Удаление аккаунта"
        message={(
          <>
            Аккаунт и все привязанные данные будут <b>удалены безвозвратно</b>.
            {' '}Если вы директор — организация, склады, товары, документы и список сотрудников будут удалены без возможности восстановления.
            {' '}После удаления вы сможете зарегистрироваться заново с тем же email.
          </>
        )}
        confirmText="Удалить аккаунт"
        confirmColor="error"
      />
    </Box>
  );
};

export default SettingsPage;
