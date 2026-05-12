import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  CircularProgress, Alert, Chip, Divider
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
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return iso;
  }
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
  const [deleteTimer, setDeleteTimer] = useState(10);
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

  useEffect(() => {
    if (!openDelete) return undefined;
    setDeleteTimer(10);
    const id = setInterval(() => {
      setDeleteTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [openDelete]);

  const handleTerminate = async (sessionId) => {
    setTerminatingId(sessionId);
    try {
      await profileService.terminateSession(sessionId);
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
              const device = session.userAgent || session.device || 'Неизвестное устройство';
              const ip = session.ipAddress || session.ip || '—';
              const when = formatDateTime(session.loginTime || session.createdAt || session.date);
              const location = session.location || null;

              return (
                <React.Fragment key={sessionId}>
                  <ListItem
                    disableGutters
                    sx={{ py: 1.5 }}
                    secondaryAction={
                      isCurrent ? (
                        <Chip label="Текущая" color="primary" size="small" />
                      ) : (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleTerminate(sessionId)}
                          disabled={terminatingId === sessionId}
                        >
                          {terminatingId === sessionId ? <CircularProgress size={16} /> : 'Завершить'}
                        </Button>
                      )
                    }
                  >
                    <ListItemText
                      primary={device}
                      secondary={
                        <>
                          IP: {ip} · {when}
                          {location ? ` · ${location}` : ''}
                        </>
                      }
                      primaryTypographyProps={{ fontWeight: isCurrent ? 600 : 400, noWrap: true }}
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
            Если вы директор — организация будет архивирована, склады удалены, сотрудники отвязаны.
          </Typography>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDeleteAccount}
        busy={deleting || deleteTimer > 0}
        title="Удаление аккаунта"
        message={<>Вы уверены, что хотите удалить аккаунт? <b>Восстановить будет невозможно.</b></>}
        confirmText={deleteTimer > 0 ? `Удалить (${deleteTimer})` : 'Удалить'}
        confirmColor="error"
      />
    </Box>
  );
};

export default SettingsPage;
