import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Stack, MenuItem, Select, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import productService from '../services/productService';
import { useWarehouses, useEmployees } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import DocumentDownloadButton from '../components/shared/DocumentDownloadButton';
import GenerationModeCheckbox from '../components/shared/GenerationModeCheckbox';
import { revaluationSchema } from '../validation/schemas';
import { enumLabel } from '../utils/enumLabels';

const REASONS = [
  'Изменение рыночной стоимости',
  'Решение об уценке',
  'Решение о дооценке',
  'Переоценка в связи с износом',
  'Изменение нормативных требований',
];

const EMPTY_FORM = {
  newPrice: '',
  reason: REASONS[0],
  basis: '',
  responsibleUserId: '',
  commissionMembers: [],
  notes: '',
};

const RevaluationPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;
  const userId = user?.userId;

  const { data: warehouses, loading: whLoading } = useWarehouses();
  const { data: employees } = useEmployees();
  const [warehouseId, setWarehouseId] = useState('');
  const [inventory, setInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(false);

  const [dialog, setDialog] = useState({ open: false, item: null });
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(revaluationSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (user && !orgId) navigate('/main/organization?firstTime=true', { replace: true });
  }, [user, orgId, navigate]);

  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) {
      setWarehouseId(warehouses[0].warehouseId || warehouses[0].id);
    }
  }, [warehouses, warehouseId]);

  const loadInventory = useCallback(async () => {
    if (!warehouseId) return;
    setInvLoading(true);
    try {
      const data = await productService.getInventory(warehouseId);
      setInventory(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      notify(err.message || 'Не удалось загрузить остатки', 'error');
      setInventory([]);
    } finally {
      setInvLoading(false);
    }
  }, [warehouseId, notify]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const handleOpen = (item) => {
    reset({ ...EMPTY_FORM, responsibleUserId: userId || '' });
    setDialog({ open: true, item });
  };

  const onSubmit = async (values) => {
    if (!dialog.item) return;
    setBusy(true);
    try {
      const res = await productService.revaluate({
        productId: dialog.item.productId,
        warehouseId,
        newPrice: values.newPrice,
        reason: values.reason || null,
        basis: values.basis || null,
        responsibleUserId: values.responsibleUserId || null,
        commissionMembers: values.commissionMembers?.length > 0 ? values.commissionMembers : null,
        userId,
        notes: values.notes || null,
      });
      notify('Переоценка зафиксирована');
      setLastResult({
        productName: dialog.item?.productName,
        newPrice: values.newPrice,
        operationId: res?.operationId,
        documentId: res?.documentId,
      });
      setDialog({ open: false, item: null });
      await loadInventory();
    } catch (err) {
      notify(err.message || 'Не удалось выполнить переоценку', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!user || !orgId) return null;

  if (whLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} mb={3}>Переоценка товаров</Typography>

        {lastResult && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setLastResult(null)}
            action={
              <DocumentDownloadButton
                documentId={lastResult.documentId}
                filename={`revaluation-${lastResult.operationId}.pdf`}
              />
            }
          >
            Переоценено: <b>{lastResult.productName || '—'}</b> · новая цена: {lastResult.newPrice} BYN
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Склад</InputLabel>
            <Select
              value={warehouseId}
              label="Склад"
              variant="outlined"
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {warehouses.length === 0 ? (
                <MenuItem value="" disabled>Нет складов</MenuItem>
              ) : (
                warehouses.map((w) => (
                  <MenuItem key={w.warehouseId || w.id} value={w.warehouseId || w.id}>
                    {w.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ borderRadius: 3 }}>
          {invLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : inventory.length === 0 ? (
            <EmptyState title="На этом складе нет товаров" />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Товар</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell align="right">Остаток</TableCell>
                    <TableCell align="right">Доступно</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => {
                    const INV_STATUS = {
                      AVAILABLE: { label: 'Доступен', color: 'success' },
                      RESERVED: { label: 'Зарезервирован', color: 'warning' },
                      STAGED: { label: 'Подобран', color: 'info' },
                      BLOCKED: { label: 'Заблокирован', color: 'error' },
                      WRITE_OFF: { label: 'Списано', color: 'default' },
                      EXPIRED: { label: 'Просрочено', color: 'error' },
                    };
                    const st = INV_STATUS[item.status] || { label: item.status || '—', color: 'default' };
                    const shortId = item.productId ? `${String(item.productId).slice(0, 8)}…` : '—';
                    return (
                    <TableRow key={item.inventoryId} hover>
                      <TableCell>{item.productName || shortId}</TableCell>
                      <TableCell>{item.productSku || item.unitSku || '—'}</TableCell>
                      <TableCell align="right">{item.quantity ?? 0}</TableCell>
                      <TableCell align="right">{item.availableQuantity ?? 0}</TableCell>
                      <TableCell>
                        {item.status && <Chip label={st.label} color={st.color} size="small" />}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpen(item)}
                        >
                          Переоценить
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Dialog
          open={dialog.open}
          onClose={() => !busy && setDialog({ open: false, item: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Переоценка: {dialog.item?.productName || dialog.item?.productId}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Новая цена за единицу, BYN"
                  type="number"
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                  disabled={busy}
                  {...register('newPrice')}
                  error={!!errors.newPrice}
                  helperText={errors.newPrice?.message}
                />
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Причина</InputLabel>
                      <Select {...field} label="Причина" variant="outlined" disabled={busy}>
                        {REASONS.map((r) => (
                          <MenuItem key={r} value={r}>{r}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <TextField
                  label="Основание (приказ/документ)"
                  fullWidth
                  disabled={busy}
                  {...register('basis')}
                  error={!!errors.basis}
                  helperText={errors.basis?.message}
                />
                <Controller
                  name="responsibleUserId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Ответственный</InputLabel>
                      <Select {...field} label="Ответственный" variant="outlined" disabled={busy}>
                        <MenuItem value="">— не назначен —</MenuItem>
                        {employees.map((emp) => (
                          <MenuItem key={emp.userId} value={emp.userId}>
                            {emp.username || emp.email} · {enumLabel('UserRole', emp.role)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="commissionMembers"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Комиссия</InputLabel>
                      <Select
                        {...field}
                        value={Array.isArray(field.value) ? field.value : []}
                        multiple
                        label="Комиссия"
                        variant="outlined"
                        disabled={busy}
                        renderValue={(selected) => `${(selected || []).length} участник(а)`}
                      >
                        {employees.map((emp) => (
                          <MenuItem key={emp.userId} value={emp.userId}>
                            {emp.username || emp.email} · {enumLabel('UserRole', emp.role)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                <TextField
                  label="Примечания"
                  multiline
                  rows={2}
                  fullWidth
                  disabled={busy}
                  {...register('notes')}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
                <GenerationModeCheckbox docType="revaluation-act" />
                <Alert severity="info" sx={{ mt: 1 }}>
                  После переоценки автоматически генерируется акт (ПЕР). Скачать акт можно
                  в разделе «Документы».
                </Alert>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false, item: null })} disabled={busy}>
                Отмена
              </Button>
              <Button variant="contained" type="submit" disabled={busy}>
                {busy ? <CircularProgress size={20} color="inherit" /> : 'Зафиксировать'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
};

export default RevaluationPage;
