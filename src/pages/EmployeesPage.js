import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText,
  Chip, InputAdornment, Tooltip, Alert, CircularProgress, Stack
} from '@mui/material';
import {
  PersonOff as PersonOffIcon,
  Block as BlockIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Search as SearchIcon,
  PersonAddAlt1 as PersonAddIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import organizationService from '../services/organizationService';
import { useWarehouses, useEmployees } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import { TableSkeleton } from '../components/shared/LoadingSkeleton';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { invitationSchema } from '../validation/schemas';

const ROLE_LABELS = { WORKER: 'Работник', ACCOUNTANT: 'Бухгалтер', DIRECTOR: 'Директор' };
const ROLE_COLORS = { WORKER: 'primary', ACCOUNTANT: 'secondary', DIRECTOR: 'error' };

const STATUS_FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'blocked', label: 'Отстранённые' },
];

const EmployeesPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const { data: employees, loading, error, refresh: refreshEmployees } = useEmployees();
  const { data: warehouses } = useWarehouses();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, action: null });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const {
    register: regInvite,
    handleSubmit: handleInviteSubmitRHF,
    control: inviteControl,
    reset: resetInvite,
    formState: { errors: inviteErrors },
  } = useForm({
    resolver: yupResolver(invitationSchema),
    defaultValues: { email: '', role: 'WORKER', warehouseId: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (user && !orgId) {
      navigate('/main/organization?firstTime=true', { replace: true });
    }
  }, [user, orgId, navigate]);

  const filtered = employees.filter((emp) => {
    const name = (emp.username || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    if (q && !name.includes(q) && !email.includes(q)) return false;
    if (roleFilter && emp.role !== roleFilter) return false;
    if (statusFilter === 'active' && (emp.isBlocked || emp.isActive === false)) return false;
    if (statusFilter === 'blocked' && !emp.isBlocked) return false;
    return true;
  });

  const askConfirm = (employee, action) => {
    setSelected(employee);
    setConfirm({ open: true, action });
  };

  const handleAction = async () => {
    if (!selected || !confirm.action) return;
    setBusyId(selected.userId);
    try {
      if (confirm.action === 'block') {
        await organizationService.setEmployeeBlocked(orgId, selected.userId, true);
        notify('Сотрудник отстранён');
      } else if (confirm.action === 'unblock') {
        await organizationService.setEmployeeBlocked(orgId, selected.userId, false);
        notify('Сотрудник восстановлен');
      } else if (confirm.action === 'fire') {
        await organizationService.deleteEmployee(orgId, selected.userId);
        notify('Сотрудник уволен');
      }
      await refreshEmployees();
    } catch (err) {
      notify(err.message || 'Не удалось выполнить операцию', 'error');
    } finally {
      setBusyId(null);
      setConfirm({ open: false, action: null });
      setSelected(null);
    }
  };

  const handleInviteOpen = () => {
    resetInvite({ email: '', role: 'WORKER', warehouseId: '' });
    setInviteResult(null);
    setInviteOpen(true);
  };

  const onInviteSubmit = async (values) => {
    setInviteBusy(true);
    try {
      const payload = { email: values.email.trim(), role: values.role };
      if (values.warehouseId) payload.warehouseId = values.warehouseId;
      const res = await organizationService.createInvitation(orgId, payload);
      setInviteResult({
        token: res.invitationToken || res.token,
        email: values.email,
        role: values.role,
        emailSent: res.emailSent,
      });
      if (res.emailSent === false) {
        const detail = res.emailError ? ` Причина: ${res.emailError}` : '';
        notify(`Приглашение создано, но письмо отправить не удалось. Скопируйте ссылку вручную.${detail}`, 'warning', { duration: 12000 });
      } else if (res.emailSent === true) {
        notify('Приглашение отправлено на email');
      }
    } catch (err) {
      notify(err.message || 'Не удалось создать приглашение', 'error');
    } finally {
      setInviteBusy(false);
    }
  };

  const handleInviteClose = () => {
    setInviteOpen(false);
    setInviteResult(null);
  };

  const handleCopyLink = async (token) => {
    const link = `${window.location.origin}/register/invitation?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      notify('Ссылка скопирована');
    } catch {
      notify('Не удалось скопировать. Скопируйте вручную.', 'warning');
    }
  };

  if (!user) return null;
  if (!orgId) return null;

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h4" fontWeight={700}>Сотрудники</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleInviteOpen}
            sx={{ textTransform: 'none' }}
          >
            Пригласить
          </Button>
        </Stack>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Поиск по имени или email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 280, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon /></InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Роль</InputLabel>
              <Select
                value={roleFilter}
                label="Роль"
                onChange={(e) => setRoleFilter(e.target.value)}
                variant="outlined"
              >
                <MenuItem value="">Все роли</MenuItem>
                <MenuItem value="WORKER">Работник</MenuItem>
                <MenuItem value="ACCOUNTANT">Бухгалтер</MenuItem>
                <MenuItem value="DIRECTOR">Директор</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                label="Статус"
                onChange={(e) => setStatusFilter(e.target.value)}
                variant="outlined"
              >
                {STATUS_FILTERS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {loading ? (
          <Paper sx={{ borderRadius: 3 }}><TableSkeleton rows={5} columns={5} /></Paper>
        ) : error ? (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={refreshEmployees}>Повторить</Button>}
          >
            {error?.message || 'Не удалось загрузить сотрудников'}
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ФИО</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary" py={3}>
                        Сотрудники не найдены
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((emp) => {
                    const isBlocked = !!emp.isBlocked;
                    const isActive = emp.isActive !== false && !isBlocked;
                    const busy = busyId === emp.userId;
                    return (
                      <TableRow key={emp.userId} hover>
                        <TableCell>{emp.username || '—'}</TableCell>
                        <TableCell>{emp.email || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={ROLE_LABELS[emp.role] || emp.role}
                            color={ROLE_COLORS[emp.role] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {isBlocked ? (
                            <Chip label="Отстранён" color="warning" size="small" />
                          ) : isActive ? (
                            <Chip label="Активен" color="success" size="small" />
                          ) : (
                            <Chip label="Неактивен" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {emp.role !== 'DIRECTOR' && (
                            <>
                              {isBlocked ? (
                                <Tooltip title="Восстановить">
                                  <span>
                                    <IconButton
                                      onClick={() => askConfirm(emp, 'unblock')}
                                      color="success"
                                      size="small"
                                      disabled={busy}
                                    >
                                      <CheckCircleOutlineIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Отстранить">
                                  <span>
                                    <IconButton
                                      onClick={() => askConfirm(emp, 'block')}
                                      color="warning"
                                      size="small"
                                      disabled={busy}
                                    >
                                      <BlockIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )}
                              <Tooltip title="Уволить">
                                <span>
                                  <IconButton
                                    onClick={() => askConfirm(emp, 'fire')}
                                    color="error"
                                    size="small"
                                    disabled={busy}
                                  >
                                    <PersonOffIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {}
      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, action: null })}
        onConfirm={handleAction}
        busy={busyId === selected?.userId}
        title={
          confirm.action === 'block' ? 'Отстранение сотрудника'
          : confirm.action === 'unblock' ? 'Восстановление сотрудника'
          : confirm.action === 'fire' ? 'Увольнение сотрудника'
          : ''
        }
        message={
          confirm.action === 'block' ? <>Заблокировать <b>{selected?.username}</b>? Сотрудник не сможет входить в систему до восстановления.</>
          : confirm.action === 'unblock' ? <>Восстановить доступ <b>{selected?.username}</b>?</>
          : confirm.action === 'fire' ? <>Уволить <b>{selected?.username}</b>? Это действие необратимо — связь сотрудника с организацией будет удалена.</>
          : ''
        }
        confirmText={
          confirm.action === 'block' ? 'Отстранить'
          : confirm.action === 'unblock' ? 'Восстановить'
          : confirm.action === 'fire' ? 'Уволить'
          : 'Подтвердить'
        }
        confirmColor={confirm.action === 'fire' ? 'error' : confirm.action === 'unblock' ? 'success' : 'warning'}
      />

      {}
      <Dialog open={inviteOpen} onClose={handleInviteClose} maxWidth="xs" fullWidth>
        <DialogTitle>{inviteResult ? 'Приглашение создано' : 'Пригласить сотрудника'}</DialogTitle>
        {!inviteResult ? (
          <form onSubmit={handleInviteSubmitRHF(onInviteSubmit)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  disabled={inviteBusy}
                  {...regInvite('email')}
                  error={!!inviteErrors.email}
                  helperText={inviteErrors.email?.message}
                />
                <Controller
                  name="role"
                  control={inviteControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!inviteErrors.role}>
                      <InputLabel>Роль</InputLabel>
                      <Select {...field} label="Роль" variant="outlined" disabled={inviteBusy}>
                        <MenuItem value="WORKER">Работник</MenuItem>
                        <MenuItem value="ACCOUNTANT">Бухгалтер</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="warehouseId"
                  control={inviteControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!inviteErrors.warehouseId}>
                      <InputLabel>Склад</InputLabel>
                      <Select {...field} label="Склад" variant="outlined" disabled={inviteBusy}>
                        {warehouses.map((w) => (
                          <MenuItem key={w.warehouseId || w.id} value={w.warehouseId || w.id}>
                            {w.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {inviteErrors.warehouseId && (
                        <FormHelperText>{inviteErrors.warehouseId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleInviteClose} disabled={inviteBusy}>Отмена</Button>
              <Button variant="contained" type="submit" disabled={inviteBusy}>
                {inviteBusy ? <CircularProgress size={20} color="inherit" /> : 'Создать приглашение'}
              </Button>
            </DialogActions>
          </form>
        ) : (
          <>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <Alert severity="success">
                  Приглашение отправлено на <b>{inviteResult.email}</b>. Если письмо не дошло — поделитесь ссылкой ниже.
                </Alert>
                <TextField
                  label="Ссылка для регистрации"
                  value={`${window.location.origin}/register/invitation?token=${inviteResult.token}`}
                  fullWidth
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopyLink(inviteResult.token)}
                >
                  Скопировать ссылку
                </Button>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={handleInviteClose}>Готово</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;
