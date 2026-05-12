import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Stack, Chip, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  TextField, MenuItem, Select, InputLabel, FormControl,
  IconButton, CircularProgress, Alert, LinearProgress, Grid, Divider, Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import shipRequestService from '../services/shipRequestService';
import productService from '../services/productService';
import { useWarehouses } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import { TableSkeleton } from '../components/shared/LoadingSkeleton';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { shipRequestSchema } from '../validation/schemas';
import FormWizard from '../components/shared/FormWizard';

const STATUS = {
  PLANNED:   { label: 'Запланирована', color: 'default' },
  PICKING:   { label: 'Подбор',        color: 'warning' },
  COMPLETED: { label: 'Завершена',     color: 'success' },
  CANCELLED: { label: 'Отменена',      color: 'error'   },
};

const STRATEGY = [
  { value: 'AUTO', label: 'AUTO — авто-выбор партии' },
  { value: 'FEFO', label: 'FEFO — first expired first out' },
  { value: 'FIFO', label: 'FIFO — first in first out' },
];

const ITEM_STATUS = {
  PENDING:   { label: 'Ожидает',  color: 'default' },
  PICKING:   { label: 'Подбор',   color: 'warning' },
  PICKED:    { label: 'Подобран', color: 'success' },
};

const formatDate = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ShipPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const { data: warehouses } = useWarehouses();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const [detailRequest, setDetailRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [pickFormByItem, setPickFormByItem] = useState({});

  const [confirm, setConfirm] = useState({ open: false, action: null });

  useEffect(() => {
    if (user && !orgId) {
      navigate('/main/organization?firstTime=true', { replace: true });
    }
  }, [user, orgId, navigate]);

  const loadAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const list = await shipRequestService.list().catch(() => []);
      setRequests(Array.isArray(list) ? list : (list?.content || []));
    } catch (err) {
      notify(err.message || 'Не удалось загрузить заявки', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, notify]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadDetail = useCallback(async (requestId) => {
    setDetailLoading(true);
    try {
      const data = await shipRequestService.get(requestId);
      setDetailRequest(data);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить заявку', 'error');
    } finally {
      setDetailLoading(false);
    }
  }, [notify]);

  const filteredRequests = requests.filter((r) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  const handleDetail = (request) => {
    setDetailRequest({ ...request, items: request.items || [] });
    setPickFormByItem({});
    loadDetail(request.requestId);
  };

  const handlePick = async (item) => {
    const f = pickFormByItem[item.itemId] || {};
    if (!f.qty || Number(f.qty) <= 0) {
      notify('Укажите количество для подбора', 'warning');
      return;
    }
    setDetailBusy(true);
    try {
      await shipRequestService.pick(detailRequest.requestId, {
        unitSku: f.unitSku || item.unitSku || null,
        qty: f.qty,
      });
      notify('Подбор зафиксирован');
      setPickFormByItem((prev) => ({ ...prev, [item.itemId]: { qty: '', unitSku: '' } }));
      await loadDetail(detailRequest.requestId);
      await loadAll();
    } catch (err) {
      notify(err.message || 'Не удалось зафиксировать подбор', 'error');
    } finally {
      setDetailBusy(false);
    }
  };

  const handleUnpick = async (item) => {
    const f = pickFormByItem[item.itemId] || {};
    if (!f.qty || Number(f.qty) <= 0) {
      notify('Укажите количество для отката подбора', 'warning');
      return;
    }
    setDetailBusy(true);
    try {
      await shipRequestService.unpick(detailRequest.requestId, {
        unitSku: f.unitSku || item.unitSku || null,
        qty: f.qty,
      });
      notify('Откат подбора выполнен');
      setPickFormByItem((prev) => ({ ...prev, [item.itemId]: { qty: '', unitSku: '' } }));
      await loadDetail(detailRequest.requestId);
    } catch (err) {
      notify(err.message || 'Не удалось откатить подбор', 'error');
    } finally {
      setDetailBusy(false);
    }
  };

  const handleComplete = async () => {
    setDetailBusy(true);
    try {
      await shipRequestService.complete(detailRequest.requestId, {});
      notify('Заявка завершена, документы сгенерированы');
      setDetailRequest(null);
      setConfirm({ open: false, action: null });
      await loadAll();
    } catch (err) {
      notify(err.message || 'Не удалось завершить заявку', 'error');
    } finally {
      setDetailBusy(false);
    }
  };

  const handleCancel = async () => {
    setDetailBusy(true);
    try {
      await shipRequestService.cancel(detailRequest.requestId);
      notify('Заявка отменена');
      setDetailRequest(null);
      setConfirm({ open: false, action: null });
      await loadAll();
    } catch (err) {
      notify(err.message || 'Не удалось отменить заявку', 'error');
    } finally {
      setDetailBusy(false);
    }
  };

  if (!user || !orgId) return null;

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Заявки на отгрузку</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Создать заявку
          </Button>
        </Stack>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Статус</InputLabel>
            <Select
              value={statusFilter}
              label="Статус"
              variant="outlined"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Все</MenuItem>
              {Object.entries(STATUS).map(([v, s]) => (
                <MenuItem key={v} value={v}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ borderRadius: 3 }}>
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={LocalShippingIcon}
              title="Заявок на отгрузку нет"
              description="Создайте первую заявку — выберите склад и список товаров; система зарезервирует партии и подготовит подбор."
              actionLabel="Создать заявку"
              onAction={() => setCreateOpen(true)}
            />
          ) : filteredRequests.length === 0 ? (
            <EmptyState title="По выбранному статусу заявок нет" sx={{ py: 6 }} />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Получатель</TableCell>
                    <TableCell>Склад</TableCell>
                    <TableCell>Создана</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Прогресс</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((r) => {
                    const stat = STATUS[r.status] || { label: r.status, color: 'default' };
                    const whName = warehouses.find((w) => (w.warehouseId || w.id) === r.warehouseId)?.name || '—';
                    const progress = Number(r.progress ?? 0);
                    return (
                      <TableRow key={r.requestId} hover>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {String(r.requestId).slice(0, 8)}…
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{r.recipientName || '—'}</Typography>
                          {r.recipientInn && (
                            <Typography variant="caption" color="text.secondary">ИНН: {r.recipientInn}</Typography>
                          )}
                        </TableCell>
                        <TableCell>{whName}</TableCell>
                        <TableCell>{formatDate(r.createdAt)}</TableCell>
                        <TableCell>
                          <Chip label={stat.label} color={stat.color} size="small" />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(progress, 100)}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                            </Box>
                            <Typography variant="caption">{progress}%</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Открыть">
                            <IconButton size="small" onClick={() => handleDetail(r)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {}
        <CreateRequestDialog
          open={createOpen}
          onClose={() => !createBusy && setCreateOpen(false)}
          warehouses={warehouses}
          busy={createBusy}
          setBusy={setCreateBusy}
          onSuccess={async () => {
            setCreateOpen(false);
            await loadAll();
          }}
          notify={notify}
        />

        {}
        <Dialog
          open={!!detailRequest}
          onClose={() => !detailBusy && setDetailRequest(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Заявка{detailRequest?.recipientName ? ` · ${detailRequest.recipientName}` : ''}
          </DialogTitle>
          <DialogContent dividers>
            {detailLoading ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : !detailRequest ? null : (
              <>
                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">Получатель</Typography>
                    <Typography>{detailRequest.recipientName || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">Адрес</Typography>
                    <Typography>{detailRequest.recipientAddress || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">ИНН</Typography>
                    <Typography>{detailRequest.recipientInn || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Плановая дата</Typography>
                    <Typography>{detailRequest.plannedDate || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">Статус</Typography>
                    <Box>
                      <Chip
                        label={STATUS[detailRequest.status]?.label || detailRequest.status}
                        color={STATUS[detailRequest.status]?.color || 'default'}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  {detailRequest.comment && (
                    <Grid size={12}>
                      <Typography variant="caption" color="text.secondary">Комментарий</Typography>
                      <Typography>{detailRequest.comment}</Typography>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight={700} mb={1}>Позиции</Typography>

                {(detailRequest.items || []).length === 0 ? (
                  <EmptyState title="Позиций нет" sx={{ py: 2 }} />
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Товар</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell align="right">План</TableCell>
                          <TableCell align="right">Подобрано</TableCell>
                          <TableCell>Статус</TableCell>
                          {detailRequest.status === 'PICKING' && (
                            <TableCell align="right" sx={{ minWidth: 280 }}>Подбор</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailRequest.items.map((item) => {
                          const expected = Number(item.expectedQty ?? 0);
                          const picked = Number(item.pickedQty ?? 0);
                          const remaining = Math.max(0, expected - picked);
                          const itemStat = ITEM_STATUS[item.status] || { label: item.status, color: 'default' };
                          const f = pickFormByItem[item.itemId] || { qty: '', unitSku: '' };
                          return (
                            <TableRow key={item.itemId}>
                              <TableCell>
                                <Typography variant="body2">
                                  {item.productName || String(item.productId).slice(0, 8) + '…'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">{item.unitSku || '—'}</Typography>
                              </TableCell>
                              <TableCell align="right">{expected}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={picked >= expected ? 700 : 400}
                                  color={picked >= expected ? 'success.main' : 'inherit'}
                                >
                                  {picked} / {expected}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={itemStat.label} color={itemStat.color} size="small" />
                              </TableCell>
                              {detailRequest.status === 'PICKING' && (
                                <TableCell align="right">
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                                    <TextField
                                      size="small"
                                      placeholder="SKU единицы"
                                      value={f.unitSku}
                                      onChange={(e) => setPickFormByItem((p) => ({
                                        ...p,
                                        [item.itemId]: { ...p[item.itemId], unitSku: e.target.value },
                                      }))}
                                      sx={{ width: 110 }}
                                    />
                                    <TextField
                                      size="small"
                                      type="number"
                                      placeholder="Кол-во"
                                      value={f.qty}
                                      onChange={(e) => setPickFormByItem((p) => ({
                                        ...p,
                                        [item.itemId]: { ...p[item.itemId], qty: e.target.value },
                                      }))}
                                      sx={{ width: 90 }}
                                      inputProps={{ step: '0.01', min: '0', max: remaining }}
                                    />
                                    <Button
                                      size="small"
                                      variant="contained"
                                      disabled={detailBusy || remaining === 0}
                                      onClick={() => handlePick(item)}
                                    >
                                      +
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                      disabled={detailBusy || picked === 0}
                                      onClick={() => handleUnpick(item)}
                                    >
                                      −
                                    </Button>
                                  </Stack>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {detailRequest.progress != null && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">Общий прогресс</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(Number(detailRequest.progress), 100)}
                          sx={{ height: 10, borderRadius: 1 }}
                        />
                      </Box>
                      <Typography fontWeight={600}>{Number(detailRequest.progress)}%</Typography>
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailRequest(null)} disabled={detailBusy}>Закрыть</Button>
            {detailRequest && (detailRequest.status === 'PLANNED' || detailRequest.status === 'PICKING') && (
              <>
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirm({ open: true, action: 'cancel' })}
                  disabled={detailBusy}
                >
                  Отменить заявку
                </Button>
                {detailRequest.status === 'PICKING' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setConfirm({ open: true, action: 'complete' })}
                    disabled={detailBusy || Number(detailRequest.progress ?? 0) < 100}
                  >
                    Завершить
                  </Button>
                )}
              </>
            )}
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={confirm.open}
          onClose={() => setConfirm({ open: false, action: null })}
          onConfirm={confirm.action === 'complete' ? handleComplete : handleCancel}
          busy={detailBusy}
          title={confirm.action === 'complete' ? 'Завершить заявку' : 'Отменить заявку'}
          message={confirm.action === 'complete'
            ? 'Завершить заявку? Будет выполнена отгрузка с генерацией документов (waybill, release-order).'
            : 'Отменить заявку? Все резервы будут освобождены.'}
          confirmText={confirm.action === 'complete' ? 'Завершить' : 'Отменить заявку'}
          confirmColor={confirm.action === 'complete' ? 'success' : 'error'}
        />
      </Box>
    </Box>
  );
};

const CreateRequestDialog = ({ open, onClose, warehouses, busy, setBusy, onSuccess, notify }) => {
  const [productOptions, setProductOptions] = useState([]);
  const [productSearchBusy, setProductSearchBusy] = useState(false);

  const {
    register, handleSubmit, control, reset, getValues, watch, trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(shipRequestSchema),
    defaultValues: {
      warehouseId: '',
      recipientName: '', recipientAddress: '', recipientInn: '',
      plannedDate: '', comment: '', strategy: 'AUTO', items: [],
    },
    mode: 'onTouched',
  });
  const itemsField = useFieldArray({ control, name: 'items' });

  const [wizardKey, setWizardKey] = useState(0);

  useEffect(() => {
    if (open) {
      reset({
        warehouseId: warehouses[0]?.warehouseId || warehouses[0]?.id || '',
        recipientName: '', recipientAddress: '', recipientInn: '',
        plannedDate: '', comment: '', strategy: 'AUTO', items: [],
      });
      setWizardKey((k) => k + 1);
    }
  }, [open, warehouses, reset]);

  const handleProductSearch = async (q) => {
    if (!q || q.length < 2) { setProductOptions([]); return; }
    setProductSearchBusy(true);
    try {
      const res = await productService.searchProducts(q);
      setProductOptions(Array.isArray(res) ? res : (res?.content || []));
    } catch { setProductOptions([]); }
    finally { setProductSearchBusy(false); }
  };

  const handleAddItem = (product) => {
    if (!product) return;
    const existing = getValues('items') || [];
    if (existing.some((it) => it.productId === product.productId)) {
      notify('Товар уже добавлен', 'warning');
      return;
    }
    itemsField.append({
      productId: product.productId, name: product.name, sku: product.sku, expectedQty: '',
    });
  };

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      await shipRequestService.create({
        warehouseId: values.warehouseId,
        recipientName: values.recipientName || null,
        recipientAddress: values.recipientAddress || null,
        recipientInn: values.recipientInn || null,
        plannedDate: values.plannedDate || null,
        comment: values.comment || null,
        strategy: values.strategy,
        items: values.items.map((it) => ({
          productId: it.productId,
          expectedQty: it.expectedQty,
        })),
      });
      notify('Заявка создана');
      onSuccess?.();
    } catch (err) {
      notify(err.message || 'Не удалось создать заявку', 'error');
    } finally {
      setBusy(false);
    }
  };

  const watchedItems = watch('items');
  const watchedAll = watch();
  const warehouseName = (id) => warehouses.find((w) => (w.warehouseId || w.id) === id)?.name || '—';
  const strategyLabel = (v) => STRATEGY.find((s) => s.value === v)?.label || v;

  const renderStep1 = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Получатель"
          fullWidth disabled={busy}
          {...register('recipientName')}
          error={!!errors.recipientName}
          helperText={errors.recipientName?.message}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          label="ИНН получателя"
          fullWidth disabled={busy}
          {...register('recipientInn')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <TextField
          label="Плановая дата"
          type="date"
          fullWidth disabled={busy}
          slotProps={{ inputLabel: { shrink: true } }}
          {...register('plannedDate')}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          label="Адрес доставки"
          fullWidth disabled={busy}
          {...register('recipientAddress')}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          label="Комментарий"
          fullWidth disabled={busy}
          multiline rows={2}
          {...register('comment')}
        />
      </Grid>
    </Grid>
  );

  const renderStep2 = () => (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.warehouseId}>
                <InputLabel>Склад</InputLabel>
                <Select {...field} label="Склад" variant="outlined" disabled={busy}>
                  {warehouses.map((w) => (
                    <MenuItem key={w.warehouseId || w.id} value={w.warehouseId || w.id}>
                      {w.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="strategy"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Стратегия списания</InputLabel>
                <Select {...field} label="Стратегия списания" variant="outlined" disabled={busy}>
                  {STRATEGY.map((s) => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      <Divider><Chip label="Позиции заявки" size="small" /></Divider>

      <Autocomplete
        options={productOptions}
        getOptionLabel={(o) => `${o.name || ''}${o.sku ? ` (${o.sku})` : ''}`}
        loading={productSearchBusy}
        onInputChange={(_, q) => handleProductSearch(q)}
        onChange={(_, val) => { handleAddItem(val); }}
        renderInput={(params) => (
          <TextField {...params} label="Добавить товар" placeholder="≥2 символов" />
        )}
      />
      {errors.items && typeof errors.items.message === 'string' && (
        <Alert severity="warning">{errors.items.message}</Alert>
      )}

      {itemsField.fields.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Товар</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>Количество</TableCell>
                <TableCell align="right" sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsField.fields.map((it, i) => (
                <TableRow key={it.id}>
                  <TableCell>{it.name}</TableCell>
                  <TableCell>{it.sku || '—'}</TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      inputProps={{ step: '0.01', min: '0' }}
                      {...register(`items.${i}.expectedQty`)}
                      error={!!errors.items?.[i]?.expectedQty}
                      helperText={errors.items?.[i]?.expectedQty?.message}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => itemsField.remove(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );

  const renderStep3 = () => (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">Получатель</Typography>
            <Typography fontWeight={600}>{watchedAll.recipientName || '—'}</Typography>
            {watchedAll.recipientInn && (
              <Typography variant="caption" color="text.secondary">ИНН: {watchedAll.recipientInn}</Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">Адрес доставки</Typography>
            <Typography>{watchedAll.recipientAddress || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Плановая дата</Typography>
            <Typography>{watchedAll.plannedDate || '—'}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Склад</Typography>
            <Typography>{warehouseName(watchedAll.warehouseId)}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">Стратегия списания</Typography>
            <Typography>{strategyLabel(watchedAll.strategy)}</Typography>
          </Grid>
          {watchedAll.comment && (
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">Комментарий</Typography>
              <Typography>{watchedAll.comment}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Товар</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell align="right">Количество</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(watchedItems || []).map((it, i) => (
              <TableRow key={`${it.productId}-${i}`}>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.sku || '—'}</TableCell>
                <TableCell align="right">{it.expectedQty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  const steps = [
    { key: 'recipient', label: 'Получатель', fields: ['recipientName', 'recipientAddress', 'recipientInn', 'plannedDate', 'comment'], render: renderStep1 },
    { key: 'items', label: 'Состав заявки', fields: ['warehouseId', 'strategy', 'items'], render: renderStep2 },
    { key: 'review', label: 'Подтверждение', fields: [], render: renderStep3 },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Новая заявка на отгрузку</DialogTitle>
      <DialogContent dividers>
        <FormWizard
          key={wizardKey}
          steps={steps}
          trigger={trigger}
          busy={busy}
          submitLabel="Создать заявку"
          onSubmit={handleSubmit(onSubmit)}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShipPage;
