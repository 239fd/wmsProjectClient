import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Stack, IconButton, Tooltip, Divider,
  Grid, TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText,
  Autocomplete, CircularProgress, Alert, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, FormControlLabel, Checkbox,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmptyState from '../components/shared/EmptyState';
import { TableSkeleton } from '../components/shared/LoadingSkeleton';
import DocumentDownloadButton from '../components/shared/DocumentDownloadButton';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import productService from '../services/productService';
import { useWarehouses, useSuppliers, useDraft } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import { receiveWizardSchema } from '../validation/schemas';
import FormWizard from '../components/shared/FormWizard';

const EMPTY_ITEM = {
  productId: '',
  productName: '',
  productSku: '',
  quantity: '',
  pricePerUnit: '0',
  batchId: '',
  batchNumber: '',
  expiryDate: '',
  cellId: '',
  notes: '',
};

const ReceivePage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;
  const userId = user?.userId;

  const { data: warehouses, loading: whLoading } = useWarehouses();
  const { data: suppliers } = useSuppliers();

  const [productOptions, setProductOptions] = useState([]);
  const [productSearchBusy, setProductSearchBusy] = useState(false);

  const [busy, setBusy] = useState(false);

  const [progress, setProgress] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const {
    control, register, handleSubmit, watch, getValues, setValue, reset, trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(receiveWizardSchema),
    defaultValues: {
      warehouseId: '',
      supplierId: '',
      supplyId: '',
      items: [],
    },
    mode: 'onTouched',
  });
  const itemsField = useFieldArray({ control, name: 'items' });

  const {
    hasDraft,
    draftTimestamp,
    restore: restoreDraft,
    discard: discardDraft,
    clear: clearDraft,
  } = useDraft({
    formId: 'receive-wizard',
    userId,
    watch,
    reset,
    getValues,
    isEmpty: (v) => !v?.items?.length,
    enabled: !!userId,
  });

  useEffect(() => {
    if (user && !orgId) navigate('/main/organization?firstTime=true', { replace: true });
  }, [user, orgId, navigate]);

  useEffect(() => {
    if (warehouses.length > 0 && !getValues('warehouseId')) {
      setValue('warehouseId', warehouses[0].warehouseId || warehouses[0].id);
    }

  }, [warehouses]);

  const handleProductSearch = useCallback(async (query) => {
    if (!query || query.length < 2) { setProductOptions([]); return; }
    setProductSearchBusy(true);
    try {
      const res = await productService.searchProducts(query);
      setProductOptions(Array.isArray(res) ? res : (res?.content || []));
    } catch { setProductOptions([]); }
    finally { setProductSearchBusy(false); }
  }, []);

  const handleAddItem = (product) => {
    if (!product) return;
    const existing = getValues('items') || [];
    if (existing.some((it) => it.productId === product.productId)) {
      notify('Товар уже добавлен', 'warning');
      return;
    }
    itemsField.append({
      ...EMPTY_ITEM,
      productId: product.productId,
      productName: product.name,
      productSku: product.sku,
    });
  };

  const onSubmit = async (values) => {
    setBusy(true);
    setProgress({ current: 0, total: values.items.length, succeeded: 0, failed: [] });
    const failed = [];
    const documents = [];
    let succeeded = 0;
    for (let i = 0; i < values.items.length; i++) {
      const it = values.items[i];
      setProgress({ current: i, total: values.items.length, succeeded, failed: [...failed] });
      try {
        const res = await productService.receiveProduct({
          productId: it.productId,
          warehouseId: values.warehouseId,
          quantity: it.quantity,
          userId,
          batchId: it.batchId || null,
          cellId: it.cellId || null,
          pricePerUnit: it.pricePerUnit ?? 0,
          supplierId: values.supplierId || null,
          supplyId: values.supplyId || null,
          expiryDate: it.expiryDate || null,
          batchNumber: it.batchNumber || null,
          notes: it.notes || null,
        });
        succeeded += 1;
        if (res?.documentId) {
          documents.push({
            productName: it.productName,
            documentId: res.documentId,
            operationId: res.operationId,
          });
        }
      } catch (err) {
        failed.push({ idx: i, productName: it.productName, error: err.message || 'Ошибка' });
      }
    }
    setProgress({ current: values.items.length, total: values.items.length, succeeded, failed });
    setBusy(false);

    if (failed.length === 0) {
      notify(`Принято позиций: ${succeeded}`);
      setLastResult({
        succeeded,
        failed,
        documents,
        warehouseName: warehouses.find((w) => (w.warehouseId || w.id) === values.warehouseId)?.name,
      });
      clearDraft();
      reset({
        warehouseId: values.warehouseId,
        supplierId: values.supplierId,
        supplyId: '',
        items: [],
      });

      setWizardKey((k) => k + 1);
    } else if (succeeded === 0) {
      notify(`Все ${failed.length} позиций отклонены — см. список ошибок`, 'error');
    } else {
      notify(`Принято: ${succeeded}, отклонено: ${failed.length}`, 'warning');
      setLastResult({
        succeeded,
        failed,
        documents,
        warehouseName: warehouses.find((w) => (w.warehouseId || w.id) === values.warehouseId)?.name,
      });
    }
  };

  const [wizardKey, setWizardKey] = useState(0);

  const [tab, setTab] = useState(0);

  if (!user || !orgId) return null;
  if (whLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const watchedItems = watch('items');
  const watchedWh = watch('warehouseId');
  const watchedSupplierId = watch('supplierId');
  const totalSum = (watchedItems || []).reduce(
    (s, it) => s + (Number(it.quantity || 0) * Number(it.pricePerUnit || 0)),
    0,
  );

  const supplierName = (id) => suppliers.find((s) => s.supplierId === id)?.name || '—';
  const warehouseName = (id) => warehouses.find((w) => (w.warehouseId || w.id) === id)?.name || '—';

  const renderStep1 = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="warehouseId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.warehouseId}>
              <InputLabel>Склад</InputLabel>
              <Select {...field} label="Склад" variant="outlined" disabled={busy}>
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
              {errors.warehouseId && <FormHelperText>{errors.warehouseId.message}</FormHelperText>}
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="supplierId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Поставщик (опционально)</InputLabel>
              <Select {...field} label="Поставщик (опционально)" variant="outlined" disabled={busy}>
                <MenuItem value="">— не указан —</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.supplierId} value={s.supplierId}>
                    {s.name}{s.unp ? ` (ИНН ${s.unp})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={12}>
        <TextField
          label="ID плановой поставки (опционально)"
          fullWidth
          disabled={busy}
          {...register('supplyId')}
          helperText="UUID плановой поставки, если приёмка фиксируется по конкретной"
        />
      </Grid>
    </Grid>
  );

  const renderStep2 = () => (
    <Stack spacing={2}>
      <Autocomplete
        options={productOptions}
        getOptionLabel={(o) => `${o.name || ''}${o.sku ? ` (${o.sku})` : ''}`}
        loading={productSearchBusy}
        onInputChange={(_, q) => handleProductSearch(q)}
        onChange={(_, val) => handleAddItem(val)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Добавить товар"
            placeholder="≥2 символа для поиска по SKU или названию"
          />
        )}
      />

      {errors.items && typeof errors.items.message === 'string' && (
        <Alert severity="warning">{errors.items.message}</Alert>
      )}

      {itemsField.fields.length === 0 ? (
        <Alert severity="info">
          Найдите товар через поле выше — он добавится в список с полями для количества/партии/цены.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}>Товар</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Кол-во *</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Цена *</TableCell>
                <TableCell sx={{ width: 130 }}>№ партии</TableCell>
                <TableCell sx={{ width: 150 }}>Срок годности</TableCell>
                <TableCell sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsField.fields.map((it, i) => (
                <React.Fragment key={it.id}>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{it.productName}</Typography>
                      <Typography variant="caption" color="text.secondary">{it.productSku}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" fullWidth
                        inputProps={{ step: '0.01', min: '0' }}
                        {...register(`items.${i}.quantity`)}
                        error={!!errors.items?.[i]?.quantity}
                        helperText={errors.items?.[i]?.quantity?.message}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" fullWidth
                        inputProps={{ step: '0.01', min: '0' }}
                        {...register(`items.${i}.pricePerUnit`)}
                        error={!!errors.items?.[i]?.pricePerUnit}
                        helperText={errors.items?.[i]?.pricePerUnit?.message}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" fullWidth
                        {...register(`items.${i}.batchNumber`)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" type="date" fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        {...register(`items.${i}.expiryDate`)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Удалить">
                        <IconButton size="small" color="error" onClick={() => itemsField.remove(i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ pt: 0 }}>
                      <Stack direction="row" spacing={2}>
                        <TextField
                          size="small" label="ID ячейки" sx={{ flex: 1 }}
                          {...register(`items.${i}.cellId`)}
                          helperText="Если пусто — auto-placement"
                        />
                        <TextField
                          size="small" label="Примечание" sx={{ flex: 2 }}
                          {...register(`items.${i}.notes`)}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
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
            <Typography variant="caption" color="text.secondary">Склад</Typography>
            <Typography fontWeight={600}>{warehouseName(watchedWh)}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">Поставщик</Typography>
            <Typography>{watchedSupplierId ? supplierName(watchedSupplierId) : '—'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Товар</TableCell>
              <TableCell align="right">Кол-во</TableCell>
              <TableCell align="right">Цена</TableCell>
              <TableCell align="right">Сумма</TableCell>
              <TableCell>Партия</TableCell>
              <TableCell>Срок годности</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(watchedItems || []).map((it, i) => {
              const sum = Number(it.quantity || 0) * Number(it.pricePerUnit || 0);
              return (
                <TableRow key={`${it.productId}-${i}`}>
                  <TableCell>
                    <Typography variant="body2">{it.productName}</Typography>
                    <Typography variant="caption" color="text.secondary">{it.productSku}</Typography>
                  </TableCell>
                  <TableCell align="right">{it.quantity}</TableCell>
                  <TableCell align="right">{it.pricePerUnit}</TableCell>
                  <TableCell align="right">{sum.toFixed(2)}</TableCell>
                  <TableCell>{it.batchNumber || '—'}</TableCell>
                  <TableCell>{it.expiryDate || '—'}</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={3} sx={{ borderBottom: 0 }} />
              <TableCell align="right" sx={{ borderBottom: 0 }}>
                <Typography variant="body2" fontWeight={700}>Итого: {totalSum.toFixed(2)}</Typography>
              </TableCell>
              <TableCell colSpan={2} sx={{ borderBottom: 0 }} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {progress && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" mb={1}>
            Обработка позиций: {progress.current} / {progress.total}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress.total ? (progress.current / progress.total) * 100 : 0}
            sx={{ height: 8, borderRadius: 1 }}
          />
          {progress.failed.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Ошибки ({progress.failed.length}):
              {progress.failed.slice(0, 5).map((f, idx) => (
                <Box key={idx}>
                  • {f.productName}: {f.error}
                </Box>
              ))}
              {progress.failed.length > 5 && <Box>… и ещё {progress.failed.length - 5}</Box>}
            </Alert>
          )}
        </Paper>
      )}
    </Stack>
  );

  const steps = [
    { key: 'context', label: 'Параметры приёмки', fields: ['warehouseId'], render: renderStep1 },
    { key: 'items', label: 'Товары', fields: ['items'], render: renderStep2 },
    { key: 'review', label: 'Подтверждение', fields: [], render: renderStep3 },
  ];

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} mb={3}>Приёмка товара</Typography>

        {lastResult && (
          <Alert
            severity={lastResult.failed?.length ? 'warning' : 'success'}
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setLastResult(null)}
          >
            <Box>
              На склад <b>{lastResult.warehouseName || '—'}</b> принято позиций:{' '}
              <b>{lastResult.succeeded}</b>
              {lastResult.failed?.length > 0 && <> · отклонено: <b>{lastResult.failed.length}</b></>}
            </Box>
            {lastResult.documents?.length > 0 && (
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
                {lastResult.documents.map((d) => (
                  <DocumentDownloadButton
                    key={d.operationId}
                    documentId={d.documentId}
                    filename={`receipt-${d.operationId}.pdf`}
                    label={`Акт: ${d.productName}`}
                  />
                ))}
              </Stack>
            )}
          </Alert>
        )}

        <Paper sx={{ borderRadius: 3, mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<LocalShippingIcon />} iconPosition="start" label="Новая приёмка" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="История" />
          </Tabs>

          {tab === 0 ? (
            <Box sx={{ p: 4 }}>
              {hasDraft && (
                <Alert
                  severity="info"
                  sx={{ mb: 3, borderRadius: 2 }}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Button color="inherit" size="small" onClick={restoreDraft}>
                        Восстановить
                      </Button>
                      <Button color="inherit" size="small" onClick={discardDraft}>
                        Очистить
                      </Button>
                    </Stack>
                  }
                >
                  Найден сохранённый черновик приёмки от{' '}
                  <b>{new Date(draftTimestamp).toLocaleString('ru-RU')}</b>. Восстановить?
                </Alert>
              )}
              <FormWizard
                key={wizardKey}
                steps={steps}
                trigger={trigger}
                busy={busy}
                submitLabel={`Принять ${itemsField.fields.length || ''} ${itemsField.fields.length === 1 ? 'позицию' : 'позиций'}`}
                onSubmit={handleSubmit(onSubmit)}
              />
            </Box>
          ) : (
            <ReceiveHistoryTab warehouses={warehouses} userId={userId} notify={notify} />
          )}
        </Paper>

        {tab === 0 && (
          <Alert severity="info">
            После приёмки автоматически генерируется приходный ордер. Скачать акт PDF можно будет
            в разделе «Документы» (после расширения бэкенд-ответа `documentId`).
          </Alert>
        )}
      </Box>
    </Box>
  );
};

const ReceiveHistoryTab = ({ warehouses, userId, notify }) => {
  const [warehouseId, setWarehouseId] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0].warehouseId || warehouses[0].id);
    }
  }, [warehouses, warehouseId]);

  const load = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    setError(null);
    try {
      const params = { type: 'RECEIVE', warehouseId };
      if (onlyMine && userId) params.userId = userId;
      const data = await productService.getOperationsHistory(params);
      const list = Array.isArray(data) ? data : (data?.content || []);

      list.sort((a, b) => {
        const ta = new Date(a.createdAt || a.timestamp || a.operationTime || 0).getTime();
        const tb = new Date(b.createdAt || b.timestamp || b.operationTime || 0).getTime();
        return tb - ta;
      });
      setHistory(list);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить историю');
      setHistory([]);
      notify(err.message || 'Не удалось загрузить историю', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, onlyMine, userId, notify]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (raw) => {
    if (!raw) return '—';
    try {
      const d = new Date(raw);
      return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return String(raw);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" mb={3} flexWrap="wrap" gap={2}>
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
        <FormControlLabel
          control={
            <Checkbox checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          }
          label="Только мои приёмки"
        />
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading || !warehouseId}>
          Обновить
        </Button>
      </Stack>

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : error ? (
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={load}>Повторить</Button>
        }>
          {error}
        </Alert>
      ) : history.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="История приёмок пуста"
          description="На этом складе пока не было приёмок (или они скрыты фильтром «Только мои»)."
        />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Товар</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Количество</TableCell>
                <TableCell align="right">Цена ед.</TableCell>
                <TableCell>Партия</TableCell>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Operation ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((op, idx) => (
                <TableRow
                  key={op.operationId || op.id || idx}
                  hover
                >
                  <TableCell>{formatDate(op.createdAt || op.timestamp || op.operationTime)}</TableCell>
                  <TableCell>{op.productName || op.productNameRu || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{op.sku || op.unitSku || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">{op.quantity ?? '—'}</TableCell>
                  <TableCell align="right">{op.pricePerUnit ?? '—'}</TableCell>
                  <TableCell>{op.batchNumber || (op.batchId ? String(op.batchId).slice(0, 8) + '…' : '—')}</TableCell>
                  <TableCell>{op.userName || op.username || (op.userId ? String(op.userId).slice(0, 8) + '…' : '—')}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {op.operationId ? String(op.operationId).slice(0, 8) + '…' : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ReceivePage;
