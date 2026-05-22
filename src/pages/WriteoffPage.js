import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Stack, MenuItem, Select, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Chip, Tabs, Tab, FormHelperText,
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
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
import { writeOffSchema } from '../validation/schemas';
import { enumLabel } from '../utils/enumLabels';
import GenerationModeCheckbox from '../components/shared/GenerationModeCheckbox';

const REASONS = [
  { value: 'DAMAGE', label: 'Порча' },
  { value: 'EXPIRED', label: 'Истёк срок годности' },
  { value: 'SHORTAGE', label: 'Недостача' },
  { value: 'OTHER', label: 'Другое' },
];

const INV_STATUS = {
  AVAILABLE: { label: 'Доступен', color: 'success' },
  RESERVED: { label: 'Зарезервирован', color: 'warning' },
  STAGED: { label: 'Подобран', color: 'info' },
  BLOCKED: { label: 'Заблокирован', color: 'error' },
  WRITE_OFF: { label: 'Списано', color: 'default' },
  EXPIRED: { label: 'Просрочено', color: 'error' },
};

const shortId = (uuid) => (uuid ? `${String(uuid).slice(0, 8)}…` : '—');

const EMPTY_FORM = {
  quantity: '',
  reason: 'DAMAGE',
  basis: '',
  responsibleUserId: '',
  commissionMembers: [],
  cellId: '',
  batchId: '',
  notes: '',
};

const WriteoffPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;
  const userId = user?.userId;

  const { data: warehouses, loading: whLoading } = useWarehouses();
  const { data: employees } = useEmployees();
  const [warehouseId, setWarehouseId] = useState('');
  const [tab, setTab] = useState(0);

  const [inventory, setInventory] = useState([]);
  const [marked, setMarked] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [dialog, setDialog] = useState({ open: false, item: null });
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const {
    register, handleSubmit, control, reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(writeOffSchema),
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

  const loadList = useCallback(async () => {
    if (!warehouseId) return;
    setListLoading(true);
    try {
      if (tab === 0) {
        const data = await productService.getInventory(warehouseId);
        setInventory(Array.isArray(data) ? data : (data?.content || []));
      } else {
        const data = await productService.getMarkedForWriteOff(warehouseId);
        setMarked(Array.isArray(data) ? data : (data?.content || []));
      }
    } catch (err) {
      notify(err.message || 'Не удалось загрузить список', 'error');
      if (tab === 0) setInventory([]); else setMarked([]);
    } finally {
      setListLoading(false);
    }
  }, [warehouseId, tab, notify]);

  useEffect(() => { loadList(); }, [loadList]);

  const handleOpen = (item) => {
    reset({
      ...EMPTY_FORM,
      responsibleUserId: userId || '',
      cellId: item.cellId || '',
      batchId: item.batchId || '',
    });
    setDialog({ open: true, item });
  };

  const onSubmit = async (values) => {
    if (!dialog.item) return;
    setBusy(true);
    try {
      const res = await productService.writeOff({
        productId: dialog.item.productId,
        warehouseId,
        batchId: values.batchId || null,
        cellId: values.cellId || null,
        quantity: values.quantity,
        reason: values.reason,
        basis: values.basis || null,
        responsibleUserId: values.responsibleUserId || null,
        commissionMembers: values.commissionMembers?.length > 0 ? values.commissionMembers : null,
        userId,
        notes: values.notes || null,
      });
      notify('Списание зафиксировано');
      setLastResult({
        productName: dialog.item?.productName,
        quantity: values.quantity,
        operationId: res?.operationId,
        documentId: res?.documentId,
      });
      setDialog({ open: false, item: null });
      await loadList();
    } catch (err) {
      notify(err.message || 'Не удалось выполнить списание', 'error');
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
        <Typography variant="h4" fontWeight={700} mb={3}>Списание товаров</Typography>

        {lastResult && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setLastResult(null)}
            action={
              <DocumentDownloadButton
                documentId={lastResult.documentId}
                filename={`writeoff-${lastResult.operationId}.pdf`}
              />
            }
          >
            Списано: <b>{lastResult.productName || '—'}</b> · {lastResult.quantity}
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
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Все остатки" />
            <Tab label="Помеченные к списанию" />
          </Tabs>

          {listLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : tab === 0 ? (
            inventory.length === 0 ? (
              <EmptyState title="На этом складе нет товаров" sx={{ py: 6 }} />
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
                      const st = INV_STATUS[item.status] || { label: item.status || '—', color: 'default' };
                      return (
                      <TableRow key={item.inventoryId} hover>
                        <TableCell>{item.productName || shortId(item.productId)}</TableCell>
                        <TableCell>{item.productSku || item.unitSku || '—'}</TableCell>
                        <TableCell align="right">{item.quantity ?? 0}</TableCell>
                        <TableCell align="right">{item.availableQuantity ?? 0}</TableCell>
                        <TableCell>{item.status && <Chip label={st.label} color={st.color} size="small" />}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RemoveCircleOutlineIcon />}
                            onClick={() => handleOpen(item)}
                          >
                            Списать
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            marked.length === 0 ? (
              <EmptyState
                title="Помеченных к списанию позиций нет"
                description="Сюда попадают товары с инвентаризации, помеченные флагом 'списать' при подсчёте"
                sx={{ py: 6 }}
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Товар</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell align="right">Количество</TableCell>
                      <TableCell>Причина</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marked.map((item, i) => (
                      <TableRow key={item.inventoryId || item.productId || i} hover>
                        <TableCell>{item.productName || shortId(item.productId)}</TableCell>
                        <TableCell>{item.productSku || item.unitSku || item.sku || '—'}</TableCell>
                        <TableCell align="right">{item.quantity ?? '—'}</TableCell>
                        <TableCell>{item.reason || '—'}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleOpen({ ...item, productId: item.productId })}
                          >
                            Списать
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </Paper>

        {}
        <Dialog
          open={dialog.open}
          onClose={() => !busy && setDialog({ open: false, item: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Списание: {dialog.item?.productName || dialog.item?.productId}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Количество"
                  type="number"
                  fullWidth
                  inputProps={{ step: '0.01', min: '0' }}
                  disabled={busy}
                  {...register('quantity')}
                  error={!!errors.quantity}
                  helperText={
                    errors.quantity?.message
                    || (dialog.item?.availableQuantity != null ? `Доступно: ${dialog.item.availableQuantity}` : null)
                  }
                />
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.reason}>
                      <InputLabel>Причина</InputLabel>
                      <Select {...field} label="Причина" variant="outlined" disabled={busy}>
                        {REASONS.map((r) => (
                          <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                        ))}
                      </Select>
                      {errors.reason && <FormHelperText>{errors.reason.message}</FormHelperText>}
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
                        multiple
                        label="Комиссия"
                        variant="outlined"
                        disabled={busy}
                        renderValue={(selected) => `${selected.length} участник(а)`}
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
                <GenerationModeCheckbox />
                <Alert severity="warning">
                  Списание необратимо. Будет сформирован акт (СПС); скачать его можно
                  в разделе «Документы».
                </Alert>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false, item: null })} disabled={busy}>
                Отмена
              </Button>
              <Button variant="contained" color="error" type="submit" disabled={busy}>
                {busy ? <CircularProgress size={20} color="inherit" /> : 'Списать'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
};

export default WriteoffPage;
