import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Button, TextField, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Chip, Divider, MenuItem, Select,
  InputLabel, FormControl, Autocomplete, FormHelperText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import {
  PlayArrow as PlayArrowIcon,
  StopCircle as StopIcon,
  Cancel as CancelIcon,
  AddCircle as AddCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import productService from '../services/productService';
import { useWarehouses } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { inventoryStartSchema, inventoryRecordSchema } from '../validation/schemas';

const STATUS_LABEL = {
  ACTIVE: { label: 'Активна', color: 'success' },
  COMPLETED: { label: 'Завершена', color: 'default' },
  CANCELLED: { label: 'Отменена', color: 'default' },
  CANCELED: { label: 'Отменена', color: 'default' },
};

const ACTIVE_SESSION_KEY = (userId) => `wms_inventory_active_${userId}`;
const EMPTY_RECORD = { productId: '', cellId: '', actualQuantity: '', notes: '' };

const InventoryPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;
  const userId = user?.userId;

  const [bootLoading, setBootLoading] = useState(true);
  const { data: warehouses } = useWarehouses();

  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const [startOpen, setStartOpen] = useState(false);
  const [startBusy, setStartBusy] = useState(false);
  const startForm = useForm({
    resolver: yupResolver(inventoryStartSchema),
    defaultValues: { warehouseId: '', notes: '' },
    mode: 'onTouched',
  });

  const [products, setProducts] = useState([]);
  const [productSearchBusy, setProductSearchBusy] = useState(false);
  const [recordBusy, setRecordBusy] = useState(false);
  const recordForm = useForm({
    resolver: yupResolver(inventoryRecordSchema),
    defaultValues: EMPTY_RECORD,
    mode: 'onTouched',
  });

  const [confirm, setConfirm] = useState({ open: false, action: null });

  useEffect(() => {
    if (user && !orgId) navigate('/main/organization?firstTime=true', { replace: true });
  }, [user, orgId, navigate]);

  const loadSession = useCallback(async (sessionId) => {
    setSessionLoading(true);
    try {
      const data = await productService.getInventorySession(sessionId);
      if (data?.status === 'IN_PROGRESS' || data?.status === 'ACTIVE') {
        setSession(data);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY(userId));
        setSession(null);
      }
    } catch (err) {
      localStorage.removeItem(ACTIVE_SESSION_KEY(userId));
      setSession(null);
    } finally {
      setSessionLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!orgId || !userId) return;
    let cancelled = false;
    (async () => {
      setBootLoading(true);
      const storedSid = localStorage.getItem(ACTIVE_SESSION_KEY(userId));
      if (storedSid && !cancelled) await loadSession(storedSid);
      if (!cancelled) setBootLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orgId, userId, loadSession]);

  const handleStartOpen = () => {
    startForm.reset({ warehouseId: warehouses[0]?.warehouseId || '', notes: '' });
    setStartOpen(true);
  };

  const onStart = async (values) => {
    setStartBusy(true);
    try {
      const res = await productService.startInventoryCheck({
        warehouseId: values.warehouseId,
        userId,
        notes: values.notes || null,
      });
      const sid = res?.sessionId;
      if (!sid) throw new Error('Сервер не вернул sessionId');
      localStorage.setItem(ACTIVE_SESSION_KEY(userId), sid);
      notify('Сессия инвентаризации начата');
      setStartOpen(false);
      await loadSession(sid);
    } catch (err) {
      notify(err.message || 'Не удалось начать сессию', 'error');
    } finally {
      setStartBusy(false);
    }
  };

  const handleProductSearch = async (query) => {
    if (!query || query.length < 2) return;
    setProductSearchBusy(true);
    try {
      const res = await productService.searchProducts(query);
      const list = Array.isArray(res) ? res : (res?.content || []);
      setProducts(list);
    } catch (err) {

    } finally {
      setProductSearchBusy(false);
    }
  };

  const onRecord = async (values) => {
    setRecordBusy(true);
    try {
      await productService.recordInventoryCount(session.sessionId, {
        productId: values.productId,
        cellId: values.cellId || null,
        actualQuantity: values.actualQuantity,
        notes: values.notes || null,
      });
      notify('Подсчёт записан');
      recordForm.reset(EMPTY_RECORD);
      await loadSession(session.sessionId);
    } catch (err) {
      notify(err.message || 'Не удалось записать подсчёт', 'error');
    } finally {
      setRecordBusy(false);
    }
  };

  const handleComplete = async () => {
    setRecordBusy(true);
    try {
      await productService.completeInventoryCheck(session.sessionId, userId);
      localStorage.removeItem(ACTIVE_SESSION_KEY(userId));
      notify('Сессия инвентаризации завершена');
      setSession(null);
    } catch (err) {
      notify(err.message || 'Не удалось завершить сессию', 'error');
    } finally {
      setRecordBusy(false);
      setConfirm({ open: false, action: null });
    }
  };

  const handleCancel = async () => {
    setRecordBusy(true);
    try {
      await productService.cancelInventoryCheck(session.sessionId);
      localStorage.removeItem(ACTIVE_SESSION_KEY(userId));
      notify('Сессия отменена');
      setSession(null);
    } catch (err) {
      notify(err.message || 'Не удалось отменить сессию', 'error');
    } finally {
      setRecordBusy(false);
      setConfirm({ open: false, action: null });
    }
  };

  if (!user || !orgId) return null;

  const warehouseName = (id) => warehouses.find((w) => (w.warehouseId || w.id) === id)?.name || id;

  if (bootLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} mb={3}>Инвентаризация</Typography>

        {!session ? (
          <Paper sx={{ borderRadius: 3, p: 4 }}>
            <EmptyState
              icon={PlayArrowIcon}
              title="Активной сессии нет"
              description="Начните сессию инвентаризации для одного из складов. Во время сессии вы будете записывать фактические остатки товаров; по завершении система сравнит их с учётными."
            />
            <Box sx={{ textAlign: 'center', pb: 4 }}>
              <Tooltip
                arrow
                placement="bottom"
                title={(
                  <Box sx={{ p: 0.5, maxWidth: 360 }}>
                    <Typography variant="caption" component="div" fontWeight={700} mb={0.5}>
                      По НСБУ № 126 (Беларусь):
                    </Typography>
                    <Typography variant="caption" component="div">
                      • не ранее <b>30 сентября</b> для активов;<br />
                      • не ранее <b>30 ноября</b> для денежных средств;<br />
                      • обязательна перед годовой отчётностью, при реорганизации,
                      смене материально-ответственного лица, факте хищения.
                    </Typography>
                  </Box>
                )}
              >
                <Button variant="contained" onClick={handleStartOpen}>
                  Начать сессию
                </Button>
              </Tooltip>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 3, p: 4, mb: 3 }}>
            {sessionLoading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="h6" fontWeight={700}>
                        Активная сессия
                      </Typography>
                      <Chip
                        label={STATUS_LABEL[session.status]?.label || session.status}
                        color={STATUS_LABEL[session.status]?.color || 'default'}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      Склад: <b>{warehouseName(session.warehouseId)}</b>
                      {session.startedAt && <> · Начата: {new Date(session.startedAt).toLocaleString('ru-RU')}</>}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<StopIcon />}
                      onClick={() => setConfirm({ open: true, action: 'complete' })}
                    >
                      Завершить
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => setConfirm({ open: true, action: 'cancel' })}
                    >
                      Отменить
                    </Button>
                  </Stack>
                </Stack>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">Записано подсчётов</Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {session.filledRecords ?? 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">Всего записей</Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {session.totalRecords ?? 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={700} mb={2}>Записать подсчёт</Typography>

                <form onSubmit={recordForm.handleSubmit(onRecord)} noValidate>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Controller
                        name="productId"
                        control={recordForm.control}
                        render={({ field, fieldState }) => (
                          <Autocomplete
                            options={products}
                            getOptionLabel={(o) => `${o.name || ''} (${o.sku || ''})`}
                            loading={productSearchBusy}
                            onInputChange={(_, q) => handleProductSearch(q)}
                            onChange={(_, val) => field.onChange(val?.productId || val?.id || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Товар"
                                size="small"
                                fullWidth
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                              />
                            )}
                            size="small"
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        label="Cell ID (опционально)"
                        size="small"
                        fullWidth
                        helperText={recordForm.formState.errors.cellId?.message || 'UUID ячейки, если применимо'}
                        error={!!recordForm.formState.errors.cellId}
                        {...recordForm.register('cellId')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                      <TextField
                        label="Факт. количество"
                        type="number"
                        size="small"
                        fullWidth
                        inputProps={{ step: 'any', min: '0' }}
                        placeholder="например 12.5"
                        {...recordForm.register('actualQuantity')}
                        error={!!recordForm.formState.errors.actualQuantity}
                        helperText={recordForm.formState.errors.actualQuantity?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        fullWidth
                        sx={{ height: 40 }}
                        disabled={recordBusy}
                      >
                        {recordBusy ? <CircularProgress size={20} color="inherit" /> : 'Записать'}
                      </Button>
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        label="Примечание"
                        size="small"
                        fullWidth
                        {...recordForm.register('notes')}
                      />
                    </Grid>
                  </Grid>
                </form>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={700} mb={2}>
                  Записи сессии
                </Typography>

                {(session.records || []).length === 0 ? (
                  <Alert severity="info">
                    На складе нет товаров — записывать нечего.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Товар</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Ячейка</TableCell>
                          <TableCell align="right">Ожидалось</TableCell>
                          <TableCell align="right">Фактически</TableCell>
                          <TableCell align="right">Расхождение</TableCell>
                          <TableCell>Статус</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {session.records.map((rec) => {
                          const filled = rec.isFilled ?? rec.actualQuantity != null;
                          const discrepancy = Number(rec.discrepancy ?? 0);
                          const hasDiscrepancy = filled && discrepancy !== 0;
                          return (
                            <TableRow key={rec.countId} hover>
                              <TableCell>{rec.productName || (rec.productId ? String(rec.productId).slice(0, 8) + '…' : '—')}</TableCell>
                              <TableCell>
                                <Typography variant="caption">{rec.productSku || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                  {rec.cellId ? String(rec.cellId).slice(0, 8) + '…' : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{rec.expectedQuantity ?? '—'}</TableCell>
                              <TableCell align="right">
                                {filled ? (
                                  <Typography
                                    variant="body2"
                                    fontWeight={hasDiscrepancy ? 700 : 400}
                                    color={hasDiscrepancy ? (discrepancy < 0 ? 'error.main' : 'warning.main') : 'inherit'}
                                  >
                                    {rec.actualQuantity}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">—</Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">
                                {filled ? (
                                  <Typography
                                    variant="body2"
                                    color={hasDiscrepancy ? (discrepancy < 0 ? 'error.main' : 'warning.main') : 'success.main'}
                                  >
                                    {discrepancy > 0 ? `+${discrepancy}` : discrepancy}
                                  </Typography>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                {!filled ? (
                                  <Chip icon={<HourglassEmptyIcon />} label="Не записано" size="small" />
                                ) : rec.markedForWriteoff ? (
                                  <Tooltip title="Помечено к списанию (фактическое < ожидаемого)">
                                    <Chip
                                      icon={<WarningAmberIcon />}
                                      label="К списанию"
                                      color="warning"
                                      size="small"
                                    />
                                  </Tooltip>
                                ) : hasDiscrepancy ? (
                                  <Chip label="Расхождение" color={discrepancy < 0 ? 'error' : 'warning'} size="small" />
                                ) : (
                                  <Chip icon={<CheckCircleIcon />} label="OK" color="success" size="small" />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Paper>
        )}
      </Box>

      {}
      <Dialog open={startOpen} onClose={() => !startBusy && setStartOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Начать сессию инвентаризации</DialogTitle>
        <form onSubmit={startForm.handleSubmit(onStart)} noValidate>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <Controller
                name="warehouseId"
                control={startForm.control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!startForm.formState.errors.warehouseId}>
                    <InputLabel>Склад</InputLabel>
                    <Select {...field} label="Склад" variant="outlined" disabled={startBusy}>
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
                    {startForm.formState.errors.warehouseId && (
                      <FormHelperText>{startForm.formState.errors.warehouseId.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
              <TextField
                label="Примечания"
                multiline
                rows={2}
                fullWidth
                disabled={startBusy}
                {...startForm.register('notes')}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStartOpen(false)} disabled={startBusy}>Отмена</Button>
            <Button variant="contained" type="submit" disabled={startBusy}>
              {startBusy ? <CircularProgress size={20} color="inherit" /> : 'Начать'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, action: null })}
        onConfirm={confirm.action === 'complete' ? handleComplete : handleCancel}
        busy={recordBusy}
        title={confirm.action === 'complete' ? 'Завершение сессии' : 'Отмена сессии'}
        message={confirm.action === 'complete'
          ? 'Завершить сессию инвентаризации? Будет сформирован отчёт о расхождениях.'
          : 'Отменить сессию? Все записанные подсчёты будут отброшены.'}
        confirmText={confirm.action === 'complete' ? 'Завершить' : 'Отменить сессию'}
        confirmColor={confirm.action === 'complete' ? 'success' : 'error'}
      />
    </Box>
  );
};

export default InventoryPage;
