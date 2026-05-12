import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, CircularProgress, Tooltip, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import supplierService from '../services/supplierService';
import { invalidateSuppliers } from '../store/slices/suppliersSlice';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import { TableSkeleton } from '../components/shared/LoadingSkeleton';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { supplierSchema } from '../validation/schemas';

const EMPTY_FORM = {
  name: '',
  unp: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
};

const SuppliersPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [busy, setBusy] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, item: null });

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await supplierService.list({ page, size: rowsPerPage, sort: 'name,asc' });
      setList(Array.isArray(res) ? res : (res?.content || []));
      setTotal(typeof res?.totalElements === 'number' ? res.totalElements : (res?.content?.length || 0));
    } catch (err) {
      notify(err.message || 'Не удалось загрузить поставщиков', 'error');
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, notify]);

  const refreshSuppliers = React.useCallback(async () => {
    dispatch(invalidateSuppliers());
    await fetchPage();
  }, [dispatch, fetchPage]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(supplierSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (user && !orgId) {
      navigate('/main/organization?firstTime=true', { replace: true });
    }
  }, [user, orgId, navigate]);

  useEffect(() => {
    if (orgId) fetchPage();
  }, [orgId, fetchPage]);

  const filtered = list.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q)
      || (s.unp || '').toLowerCase().includes(q)
      || (s.email || '').toLowerCase().includes(q)
      || (s.contactPerson || '').toLowerCase().includes(q);
  });

  const handleOpen = (item = null) => {
    if (item) {
      reset({
        name: item.name || '',
        unp: item.unp || '',
        contactPerson: item.contactPerson || '',
        phone: item.phone || '',
        email: item.email || '',
        address: item.address || '',
      });
    } else {
      reset(EMPTY_FORM);
    }
    setDialog({ open: true, editing: item });
  };

  const onSave = async (values) => {
    setBusy(true);
    try {
      const payload = {
        name: values.name.trim(),
        unp: values.unp || null,
        contactPerson: values.contactPerson || null,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
      };
      if (dialog.editing) {
        await supplierService.update(dialog.editing.supplierId, payload);
        notify('Поставщик обновлён');
      } else {
        await supplierService.create(payload);
        notify('Поставщик создан');
      }
      setDialog({ open: false, editing: null });
      await refreshSuppliers();
    } catch (err) {
      notify(err.message || 'Не удалось сохранить', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm.item) return;
    setBusy(true);
    try {
      await supplierService.delete(confirm.item.supplierId);
      notify('Поставщик удалён');
      setConfirm({ open: false, item: null });
      await refreshSuppliers();
    } catch (err) {
      notify(err.message || 'Не удалось удалить', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!user || !orgId) return null;

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Поставщики</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Добавить поставщика
          </Button>
        </Stack>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <TextField
            placeholder="Поиск: название, ИНН, email, контактное лицо"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon /></InputAdornment>
                ),
              },
            }}
          />
        </Paper>

        <Paper sx={{ borderRadius: 3 }}>
          {loading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : list.length === 0 ? (
            <EmptyState
              icon={AddIcon}
              title="Поставщиков пока нет"
              description="Добавьте первого поставщика — он будет доступен в форме приёмки товара"
              actionLabel="Добавить поставщика"
              onAction={() => handleOpen()}
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="По запросу ничего не найдено" sx={{ py: 6 }} />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Наименование</TableCell>
                      <TableCell>ИНН</TableCell>
                      <TableCell>Контактное лицо</TableCell>
                      <TableCell>Телефон</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.supplierId} hover>
                        <TableCell>
                          <Typography fontWeight={600}>{s.name}</Typography>
                          {s.address && (
                            <Typography variant="caption" color="text.secondary">{s.address}</Typography>
                          )}
                        </TableCell>
                        <TableCell>{s.unp || '—'}</TableCell>
                        <TableCell>{s.contactPerson || '—'}</TableCell>
                        <TableCell>{s.phone || '—'}</TableCell>
                        <TableCell>{s.email || '—'}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Редактировать">
                            <IconButton size="small" onClick={() => handleOpen(s)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirm({ open: true, item: s })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Строк на странице"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
              />
            </>
          )}
        </Paper>

        {}
        <Dialog
          open={dialog.open}
          onClose={() => !busy && setDialog({ open: false, editing: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{dialog.editing ? 'Редактировать поставщика' : 'Новый поставщик'}</DialogTitle>
          <form onSubmit={handleSubmit(onSave)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Наименование"
                  fullWidth
                  disabled={busy}
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
                <TextField
                  label="ИНН"
                  fullWidth
                  disabled={busy}
                  {...register('unp')}
                  error={!!errors.unp}
                  helperText={errors.unp?.message || '9 цифр (опционально)'}
                />
                <TextField
                  label="Контактное лицо"
                  fullWidth
                  disabled={busy}
                  {...register('contactPerson')}
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson?.message}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Телефон"
                    fullWidth
                    disabled={busy}
                    {...register('phone')}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    disabled={busy}
                    {...register('email')}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Stack>
                <TextField
                  label="Адрес"
                  fullWidth
                  disabled={busy}
                  {...register('address')}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false, editing: null })} disabled={busy}>
                Отмена
              </Button>
              <Button variant="contained" type="submit" disabled={busy}>
                {busy ? <CircularProgress size={20} color="inherit" /> : (dialog.editing ? 'Сохранить' : 'Создать')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <ConfirmDialog
          open={confirm.open}
          onClose={() => setConfirm({ open: false, item: null })}
          onConfirm={handleDelete}
          title="Удаление поставщика"
          message={<>Удалить поставщика <b>{confirm.item?.name}</b>?</>}
          confirmText="Удалить"
          confirmColor="error"
          busy={busy}
        />
      </Box>
    </Box>
  );
};

export default SuppliersPage;
