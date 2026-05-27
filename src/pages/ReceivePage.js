import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Stack, IconButton, Tooltip, Divider,
  Grid, TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText,
  Autocomplete, CircularProgress, Alert, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  LinearProgress, FormControlLabel, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmptyState from '../components/shared/EmptyState';
import { TableSkeleton } from '../components/shared/LoadingSkeleton';
import DocumentDownloadButton from '../components/shared/DocumentDownloadButton';
import GenerationModeCheckbox from '../components/shared/GenerationModeCheckbox';
import SuppliesSection from '../components/receive/SuppliesSection';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import productService from '../services/productService';
import supplierService from '../services/supplierService';
import warehouseService from '../services/warehouseService';
import { useWarehouses, useSuppliers, useEmployees, useDraft } from '../hooks';
import { enumLabel } from '../utils/enumLabels';
import { useSnackbar } from '../context/SnackbarContext';
import { receiveWizardSchema, supplierSchema, productCreateSchema } from '../validation/schemas';
import FormWizard from '../components/shared/FormWizard';

const OPERATION_STATUS_LABEL = {
  PENDING: 'Ожидает',
  RECEIVED: 'Принята',
  PAUSED: 'На утверждении',
  COMPLETED: 'Завершена',
  COMPLETED_WITH_DISCREPANCY: 'Завершена с расхождением',
  CANCELLED: 'Отменена',
};
const statusLabel = (s) => OPERATION_STATUS_LABEL[s] || s || '—';

const EMPTY_ITEM = {
  productId: '',
  productName: '',
  productSku: '',
  quantityPackages: '',
  unitsPerPackage: '1',
  pricePerUnit: '',
  batchId: '',
  batchNumber: '',
  expiryDate: '',
  packagingType: 'BOX',
  palletType: '',
  packageLengthCm: '',
  packageWidthCm: '',
  packageHeightCm: '',
  packageWeightKg: '',
  storageConditions: 'ROOM',
  cellId: '',
  palletPlaceId: '',
  notes: '',
};

const PALLET_DIMS = {
  EUR:  { lengthCm: 80,  widthCm: 120, heightCm: 14.5, label: 'EUR · 80×120' },
  FIN:  { lengthCm: 100, widthCm: 120, heightCm: 14.5, label: 'FIN · 100×120' },
  US:   { lengthCm: 120, widthCm: 120, heightCm: 14.5, label: 'US · 120×120'  },
  ASIA: { lengthCm: 110, widthCm: 110, heightCm: 14.5, label: 'ASIA · 110×110' },
};

const STORAGE_OPTIONS = [
  { value: 'ROOM', label: 'Комнатная' },
  { value: 'COOL', label: 'Прохладная' },
  { value: 'FRIDGE', label: 'Холодильник' },
  { value: 'FREEZER', label: 'Морозильник' },
];

const FIELD_LABELS = {
  productId: 'Товар',
  quantityPackages: 'Кол-во упаковок',
  pricePerUnit: 'Цена за единицу',
  batchNumber: '№ партии',
  expiryDate: 'Срок годности',
  unitsPerPackage: 'Шт./упак.',
  packageLengthCm: 'Длина упаковки',
  packageWidthCm: 'Ширина упаковки',
  packageHeightCm: 'Высота упаковки',
  packageWeightKg: 'Вес упаковки',
  storageConditions: 'Условия хранения',
  cellId: 'Ячейка',
  palletPlaceId: 'Паллет-место',
  notes: 'Примечание',
};

const PACKAGING_OPTIONS = [
  { value: 'PALLET', label: 'Паллет' },
  { value: 'BOX', label: 'Коробка' },
  { value: 'CRATE', label: 'Ящик' },
  { value: 'EACH', label: 'Поштучно' },
];

const RACK_KIND_RU = {
  SHELF: 'Стеллаж',
  CELL: 'Ячейка',
  PALLET: 'Паллет-место',
};

const STORAGE_RU = {
  ROOM: 'Комнатная',
  COOL: 'Прохладная',
  FRIDGE: 'Холодильник',
  FREEZER: 'Морозильник',
};

function capacityByDims(cellL, cellW, cellH, pkgL, pkgW, pkgH) {
  if (!cellL || !cellW || !cellH || !pkgL || !pkgW || !pkgH) return null;
  const c = [cellL, cellW, cellH].sort((a, b) => a - b);
  const p = [pkgL, pkgW, pkgH].sort((a, b) => a - b);
  if (p[0] > c[0] || p[1] > c[1] || p[2] > c[2]) return 0;
  return Math.floor(c[0] / p[0]) * Math.floor(c[1] / p[1]) * Math.floor(c[2] / p[2]);
}

const ReceivePage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;
  const userId = user?.userId;

  const { data: warehouses, loading: whLoading } = useWarehouses();
  const { data: suppliers, refresh: refreshSuppliers } = useSuppliers();
  const { data: employees } = useEmployees();

  const [productOptions, setProductOptions] = useState([]);
  const [productSearchBusy, setProductSearchBusy] = useState(false);
  const [cellsFlat, setCellsFlat] = useState([]);

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

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
      contractNumber: '',
      contractDate: '',
      responsibleUserId: '',
      commissionMembers: [],
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
    if (user?.warehouseId) {
      if (getValues('warehouseId') !== user.warehouseId) {
        setValue('warehouseId', user.warehouseId);
      }
      return;
    }
    if (warehouses.length > 0 && !getValues('warehouseId')) {
      setValue('warehouseId', warehouses[0].warehouseId || warehouses[0].id);
    }

  }, [warehouses, user]);

  const watchedWhId = watch('warehouseId');
  useEffect(() => {
    if (!watchedWhId) {
      setCellsFlat([]);
      return;
    }
    let cancelled = false;
    warehouseService.getAllCellsFlat(watchedWhId)
      .then((list) => { if (!cancelled) setCellsFlat(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setCellsFlat([]); });
    return () => { cancelled = true; };
  }, [watchedWhId]);

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
    const productId = product.productId || product.id;
    if (!productId) {
      notify('У товара нет productId — обновите страницу', 'error');
      return;
    }
    const existing = getValues('items') || [];
    if (existing.some((it) => String(it.productId) === String(productId))) {
      notify('Товар уже добавлен', 'warning');
      return;
    }
    const prefilledPrice = product.price != null && product.price !== ''
      ? String(product.price) : '';
    itemsField.append({
      ...EMPTY_ITEM,
      productId,
      productName: product.name || '',
      productSku: product.sku || '',
      pricePerUnit: prefilledPrice,
    });
    const nextIdx = (getValues('items') || []).length - 1;
    setValue(`items.${nextIdx}.productId`, productId, { shouldValidate: false });
    setValue(`items.${nextIdx}.productName`, product.name || '', { shouldValidate: false });
    setValue(`items.${nextIdx}.productSku`, product.sku || '', { shouldValidate: false });
    if (prefilledPrice) {
      setValue(`items.${nextIdx}.pricePerUnit`, prefilledPrice, { shouldValidate: false });
    }
  };

  const handleSupplierCreated = async (created) => {
    if (created?.supplierId) {
      await refreshSuppliers();
      setValue('supplierId', created.supplierId, { shouldValidate: true });
      notify('Поставщик создан и выбран');
    }
    setSupplierDialogOpen(false);
  };

  const handleProductCreated = (created) => {
    if (created?.productId) {
      handleAddItem(created);
      notify('Товар создан и добавлен в приёмку');
    }
    setProductDialogOpen(false);
  };

  const onSubmit = async (values) => {
    setBusy(true);
    setProgress({ current: 0, total: values.items.length, succeeded: 0, failed: [] });
    try {
      localStorage.setItem('generationMode', genMode);
      const session = await productService.createReceiptSession({
        warehouseId: values.warehouseId,
        supplierId: values.supplierId || null,
        supplyId: values.supplyId || null,
        userId,
        generalNotes: null,
        contractNumber: values.contractNumber || null,
        contractDate: values.contractDate || null,
        responsibleUserId: values.responsibleUserId || userId,
        commissionMembers: values.commissionMembers?.length > 0 ? values.commissionMembers : null,
        items: values.items.map((it) => {
          const upp = Number(it.unitsPerPackage) || 1;
          const packs = Number(it.quantityPackages) || 0;
          const totalUnits = packs * upp;
          return {
            productId: it.productId,
            batchId: it.batchId || null,
            cellId: it.cellId || null,
            palletPlaceId: it.palletPlaceId || null,
            quantity: totalUnits,
            pricePerUnit: it.pricePerUnit ?? 0,
            batchNumber: it.batchNumber || null,
            expiryDate: it.expiryDate || null,
            packagingType: it.packagingType || null,
            unitsPerPackage: upp,
            packageLengthCm: it.packageLengthCm ? Number(it.packageLengthCm) : null,
            packageWidthCm: it.packageWidthCm ? Number(it.packageWidthCm) : null,
            packageHeightCm: it.packageHeightCm ? Number(it.packageHeightCm) : null,
            packageWeightKg: it.packageWeightKg ? Number(it.packageWeightKg) : null,
            storageConditions: it.storageConditions || null,
            palletType: it.palletType || null,
            notes: it.notes || null,
          };
        }),
      });

      const formByProduct = new Map();
      (values.items || []).forEach((fi) => {
        if (fi.productId && !formByProduct.has(fi.productId)) {
          formByProduct.set(fi.productId, fi);
        }
      });
      const sessionItems = (session.items || []).map((opItem, idx) => {
        const formItem = formByProduct.get(opItem.productId) || values.items[idx] || {};
        return {
          operationId: opItem.operationId,
          productId: opItem.productId,
          productName: formItem.productName || '—',
          productSku: formItem.productSku || '',
          expectedQty: opItem.quantity,
        };
      });

      setLastResult({
        session: {
          sessionId: session.sessionId,
          status: session.status || 'PAUSED',
          receiptOrderDocId: session.receiptOrderDocId || null,
          receiptActDocId: session.receiptActDocId || null,
          placementListDocId: session.placementListDocId || null,
          documentError: session.documentError || null,
          items: sessionItems,
        },
        warehouseName: warehouses.find((w) => (w.warehouseId || w.id) === values.warehouseId)?.name,
      });
      setProgress({ current: values.items.length, total: values.items.length, succeeded: values.items.length, failed: [] });
      notify(`Сессия приёмки создана: ${sessionItems.length} позиций · ожидает утверждения`);

      clearDraft();
      reset({
        warehouseId: values.warehouseId,
        supplierId: values.supplierId,
        supplyId: '',
        items: [],
      });
      setWizardKey((k) => k + 1);
      setSuppliesRefresh((n) => n + 1);
    } catch (err) {
      notify(err.message || 'Не удалось создать сессию приёмки', 'error');
      setProgress({ current: 0, total: values.items.length, succeeded: 0, failed: [{ idx: 0, productName: '—', error: err.message || 'Ошибка' }] });
    } finally {
      setBusy(false);
    }
  };

  const [wizardKey, setWizardKey] = useState(0);
  const [suppliesRefresh, setSuppliesRefresh] = useState(0);

  const [tab, setTab] = useState(0);
  const [discrepancyDialog, setDiscrepancyDialog] = useState(null);
  const [genMode, setGenMode] = useState(
    () => (localStorage.getItem('generationMode') === 'rpa' ? 'rpa' : 'auto'),
  );

  const handleCompleteSession = useCallback(async (sessionId) => {
    try {
      await productService.completeReceiptSession(sessionId, { mode: genMode });
      notify('Приёмка завершена');
      setLastResult((prev) => (prev?.session?.sessionId === sessionId
        ? { ...prev, session: { ...prev.session, status: 'COMPLETED' } }
        : prev));
      setSuppliesRefresh((n) => n + 1);
    } catch (err) {
      notify(err.message || 'Не удалось завершить приёмку', 'error');
    }
  }, [notify, genMode]);

  const handleSessionDiscrepancySubmit = useCallback(async (sessionId, payload) => {
    try {
      const res = await productService.recordSessionDiscrepancy(sessionId, payload);
      notify('Расхождение зафиксировано, приёмка завершена');
      setLastResult((prev) => (prev?.session?.sessionId === sessionId
        ? { ...prev, session: {
            ...prev.session,
            status: 'COMPLETED_WITH_DISCREPANCY',
            receiptActDocId: res?.receiptActDocId || prev.session.receiptActDocId,
          } }
        : prev));
      setDiscrepancyDialog(null);
      setSuppliesRefresh((n) => n + 1);
    } catch (err) {
      notify(err.message || 'Не удалось зафиксировать расхождение', 'error');
    }
  }, [notify]);

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
  const lineTotal = (it) => {
    const packs = Number(it?.quantityPackages || 0);
    const upp = Number(it?.unitsPerPackage || 1) || 1;
    const price = Number(it?.pricePerUnit || 0);
    return packs * upp * price;
  };
  const totalSum = (watchedItems || []).reduce((s, it) => s + lineTotal(it), 0);

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
              <Select
                {...field}
                label="Склад"
                variant="outlined"
                disabled={busy || !!user?.warehouseId}
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
              {errors.warehouseId
                ? <FormHelperText>{errors.warehouseId.message}</FormHelperText>
                : user?.warehouseId && <FormHelperText>Вы привязаны к этому складу</FormHelperText>}
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
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
                      {s.name}{s.unp ? ` (УНП ${s.unp})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Tooltip title="Создать нового поставщика">
            <span>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ whiteSpace: 'nowrap', height: 56 }}
                disabled={busy}
                onClick={() => setSupplierDialogOpen(true)}
              >
                Создать
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Grid>

      <Grid size={12}>
        <TextField
          label="ID плановой поставки (опционально)"
          fullWidth
          disabled={busy}
          {...register('supplyId')}
          InputLabelProps={{ shrink: true }}
          helperText="UUID плановой поставки, если приёмка фиксируется по конкретной"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Номер договора (опционально)"
          fullWidth
          disabled={busy}
          {...register('contractNumber')}
          helperText="Попадёт в акт приёмки / приходный ордер"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          label="Дата договора (опционально)"
          type="date"
          fullWidth
          disabled={busy}
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: new Date().toISOString().slice(0, 10) }}
          {...register('contractDate')}
          error={!!errors.contractDate}
          helperText={errors.contractDate?.message}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="responsibleUserId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Ответственный за приёмку (МОЛ)</InputLabel>
              <Select {...field} label="Ответственный за приёмку (МОЛ)" disabled={busy}>
                <MenuItem value="">— по умолчанию текущий пользователь —</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.userId} value={emp.userId}>
                    {emp.username || emp.email} · {enumLabel('UserRole', emp.role)}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Председатель комиссии, попадёт в подпись акта приёмки.
              </FormHelperText>
            </FormControl>
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="commissionMembers"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Комиссия (опционально)</InputLabel>
              <Select
                {...field}
                value={Array.isArray(field.value) ? field.value : []}
                multiple
                label="Комиссия (опционально)"
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
      </Grid>
    </Grid>
  );

  const renderStep2 = () => (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Autocomplete
          sx={{ flex: 1 }}
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
        <Tooltip title="Создать новый товар">
          <span>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ whiteSpace: 'nowrap', height: 56 }}
              disabled={busy}
              onClick={() => setProductDialogOpen(true)}
            >
              Создать
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {errors.items && typeof errors.items.message === 'string' && (
        <Alert severity="warning">{errors.items.message}</Alert>
      )}

      {Array.isArray(errors.items) && errors.items.some(Boolean) && (
        <Alert severity="warning">
          Заполните все обязательные поля в позициях ниже:
          <Box component="ul" sx={{ m: 0, pl: 3 }}>
            {errors.items.map((rowErr, rowIdx) => {
              if (!rowErr) return null;
              const fields = Object.entries(rowErr)
                .filter(([, v]) => v && v.message)
                .map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v.message}`);
              if (!fields.length) return null;
              const name = watchedItems?.[rowIdx]?.productName || `Позиция ${rowIdx + 1}`;
              return (
                <li key={rowIdx}>
                  <b>{name}</b>: {fields.join('; ')}
                </li>
              );
            })}
          </Box>
        </Alert>
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
                <TableCell align="right" sx={{ width: 110 }}>Упак. *</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Шт./упак. *</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Цена</TableCell>
                <TableCell sx={{ width: 130 }}>№ партии *</TableCell>
                <TableCell sx={{ width: 150 }}>Срок годности *</TableCell>
                <TableCell sx={{ width: 130 }}>Упаковка</TableCell>
                <TableCell sx={{ width: 140 }}>Условия хран.</TableCell>
                <TableCell sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsField.fields.map((it, i) => (
                <React.Fragment key={it.id}>
                  <TableRow>
                    <TableCell>
                      <input type="hidden" {...register(`items.${i}.productId`)} />
                      <input type="hidden" {...register(`items.${i}.productName`)} />
                      <input type="hidden" {...register(`items.${i}.productSku`)} />
                      <Typography variant="body2" fontWeight={600}>{watchedItems?.[i]?.productName || it.productName}</Typography>
                      <Typography variant="caption" color="text.secondary">{watchedItems?.[i]?.productSku || it.productSku}</Typography>
                      {!(watchedItems?.[i]?.productId || it.productId) && (
                        <Chip
                          size="small"
                          color="error"
                          icon={<ReportProblemIcon />}
                          label="Не сопоставлен — удалите строку и выберите товар выше"
                          sx={{ mt: 0.5, maxWidth: '100%', '& .MuiChip-label': { whiteSpace: 'normal' } }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" fullWidth
                        inputProps={{ step: '1', min: '0' }}
                        {...register(`items.${i}.quantityPackages`)}
                        error={!!errors.items?.[i]?.quantityPackages}
                        helperText={(() => {
                          const packs = Number(watchedItems?.[i]?.quantityPackages) || 0;
                          const upp = Number(watchedItems?.[i]?.unitsPerPackage) || 1;
                          if (errors.items?.[i]?.quantityPackages) return errors.items[i].quantityPackages.message;
                          return packs > 0 ? `= ${packs * upp} шт.` : ' ';
                        })()}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" fullWidth
                        inputProps={{ step: '1', min: '1' }}
                        {...register(`items.${i}.unitsPerPackage`)}
                        error={!!errors.items?.[i]?.unitsPerPackage}
                        helperText={errors.items?.[i]?.unitsPerPackage?.message || 'шт./уп.'}
                        FormHelperTextProps={{ sx: { whiteSpace: 'nowrap', mx: 0 } }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" fullWidth
                        inputProps={{ step: '0.01', min: '0' }}
                        placeholder="из карточки"
                        {...register(`items.${i}.pricePerUnit`)}
                        error={!!errors.items?.[i]?.pricePerUnit}
                        helperText={errors.items?.[i]?.pricePerUnit?.message}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" fullWidth
                        {...register(`items.${i}.batchNumber`)}
                        error={!!errors.items?.[i]?.batchNumber}
                        helperText={errors.items?.[i]?.batchNumber?.message}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" type="date" fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        {...register(`items.${i}.expiryDate`)}
                        error={!!errors.items?.[i]?.expiryDate}
                        helperText={errors.items?.[i]?.expiryDate?.message}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`items.${i}.packagingType`}
                        render={({ field }) => (
                          <FormControl size="small" fullWidth>
                            <Select {...field} displayEmpty>
                              {PACKAGING_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`items.${i}.storageConditions`}
                        render={({ field }) => (
                          <FormControl size="small" fullWidth>
                            <Select {...field} displayEmpty>
                              {STORAGE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Дублировать (новая партия того же товара)">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const src = getValues(`items.${i}`);
                              itemsField.append({
                                ...src,
                                batchId: '',
                                batchNumber: '',
                                expiryDate: '',
                                quantity: '',
                              });
                            }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error" onClick={() => itemsField.remove(i)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9} sx={{ pt: 0 }}>
                      {watchedItems?.[i]?.packagingType === 'PALLET' ? (
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
                          <Controller
                            control={control}
                            name={`items.${i}.palletType`}
                            render={({ field }) => (
                              <FormControl size="small" sx={{ minWidth: 220 }}
                                error={!!errors.items?.[i]?.palletType}>
                                <InputLabel>Тип паллета *</InputLabel>
                                <Select
                                  {...field}
                                  label="Тип паллета *"
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    field.onChange(v);
                                    const d = PALLET_DIMS[v];
                                    if (d) {
                                      setValue(`items.${i}.packageLengthCm`, String(d.lengthCm),
                                        { shouldValidate: false });
                                      setValue(`items.${i}.packageWidthCm`, String(d.widthCm),
                                        { shouldValidate: false });
                                    }
                                  }}
                                >
                                  {Object.entries(PALLET_DIMS).map(([k, d]) => (
                                    <MenuItem key={k} value={k}>{d.label}</MenuItem>
                                  ))}
                                </Select>
                                {errors.items?.[i]?.palletType && (
                                  <FormHelperText>{errors.items[i].palletType.message}</FormHelperText>
                                )}
                              </FormControl>
                            )}
                          />
                          <TextField
                            size="small" label="Высота груза (см) *" type="number" sx={{ width: 160 }}
                            inputProps={{ step: '0.1', min: '0' }}
                            {...register(`items.${i}.packageHeightCm`)}
                            error={!!errors.items?.[i]?.packageHeightCm}
                            helperText={errors.items?.[i]?.packageHeightCm?.message
                              || 'Полная высота загруженного паллета'}
                          />
                          <TextField
                            size="small" label="Вес паллета (кг) *" type="number" sx={{ width: 160 }}
                            inputProps={{ step: '0.001', min: '0' }}
                            {...register(`items.${i}.packageWeightKg`)}
                            error={!!errors.items?.[i]?.packageWeightKg}
                            helperText={errors.items?.[i]?.packageWeightKg?.message
                              || 'Вес одного загруженного паллета'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Габариты основания — из типа паллета. Выберите паллет-место ниже.
                          </Typography>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <TextField
                            size="small" label="Длина упак. (см) *" type="number" sx={{ width: 140 }}
                            inputProps={{ step: '0.1', min: '0' }}
                            {...register(`items.${i}.packageLengthCm`)}
                            error={!!errors.items?.[i]?.packageLengthCm}
                            helperText={errors.items?.[i]?.packageLengthCm?.message}
                          />
                          <TextField
                            size="small" label="Ширина упак. (см) *" type="number" sx={{ width: 140 }}
                            inputProps={{ step: '0.1', min: '0' }}
                            {...register(`items.${i}.packageWidthCm`)}
                            error={!!errors.items?.[i]?.packageWidthCm}
                            helperText={errors.items?.[i]?.packageWidthCm?.message}
                          />
                          <TextField
                            size="small" label="Высота упак. (см) *" type="number" sx={{ width: 140 }}
                            inputProps={{ step: '0.1', min: '0' }}
                            {...register(`items.${i}.packageHeightCm`)}
                            error={!!errors.items?.[i]?.packageHeightCm}
                            helperText={errors.items?.[i]?.packageHeightCm?.message}
                          />
                          <TextField
                            size="small" label="Вес упак. (кг) *" type="number" sx={{ width: 140 }}
                            inputProps={{ step: '0.001', min: '0' }}
                            {...register(`items.${i}.packageWeightKg`)}
                            error={!!errors.items?.[i]?.packageWeightKg}
                            helperText={errors.items?.[i]?.packageWeightKg?.message}
                          />
                        </Stack>
                      )}
                      <Stack direction="row" spacing={2}>
                        {watchedItems?.[i]?.packagingType === 'PALLET' ? (
                          <Controller
                            control={control}
                            name={`items.${i}.palletPlaceId`}
                            render={({ field }) => {
                              const itemCond = watchedItems?.[i]?.storageConditions;
                              const pkg = watchedItems?.[i] || {};
                              const fitsPallet = (c) => {
                                const pL = Number(pkg.packageLengthCm) || 0;
                                const pW = Number(pkg.packageWidthCm) || 0;
                                const pH = Number(pkg.packageHeightCm) || 0;
                                if (pL && pW && c.lengthCm && c.widthCm) {
                                  const pkgArr = [pL, pW].sort((a, b) => a - b);
                                  const celArr = [Number(c.lengthCm), Number(c.widthCm)].sort((a, b) => a - b);
                                  if (pkgArr[0] > celArr[0] || pkgArr[1] > celArr[1]) return false;
                                }
                                const effH = c.remainingHeightCm != null
                                  ? Number(c.remainingHeightCm)
                                  : (c.maxHeightCm ? Number(c.maxHeightCm)
                                      : (c.heightCm ? Number(c.heightCm) : 0));
                                if (pH && effH && pH > effH) return false;
                                return true;
                              };
                              const pickedType = watchedItems?.[i]?.palletType;
                              const palletPlaces = cellsFlat.filter((c) => !c.occupied
                                && c.rackKind === 'PALLET'
                                && (!itemCond || c.rackStorageConditions === itemCond)
                                && (!pickedType || !c.palletType || c.palletType === pickedType)
                                && fitsPallet(c));
                              const selected = palletPlaces.find((c) => String(c.id) === String(field.value)) || null;
                              return (
                                <Autocomplete
                                  sx={{ flex: 1 }}
                                  size="small"
                                  options={palletPlaces}
                                  value={selected}
                                  onChange={(_, val) => field.onChange(val?.id || '')}
                                  groupBy={(opt) => `${opt.rackName} · ${STORAGE_RU[opt.rackStorageConditions] || opt.rackStorageConditions || '—'}`}
                                  getOptionLabel={(opt) => {
                                    if (!opt) return '';
                                    const type = opt.palletType ? `${opt.palletType} · ` : '';
                                    const code = opt.slotCode || opt.cellCode || String(opt.id).slice(0, 8);
                                    const remH = opt.remainingHeightCm != null
                                      ? ` · до ${opt.remainingHeightCm}см осталось`
                                      : (opt.maxHeightCm ? ` · maxH ${opt.maxHeightCm}см` : '');
                                    return `${type}${code} · ${opt.lengthCm}×${opt.widthCm}см${remH}`;
                                  }}
                                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                                  renderInput={(params) => (
                                    <TextField {...params} label="Паллет-место (упаковка PALLET)"
                                      helperText={palletPlaces.length === 0
                                        ? 'Нет паллет-мест по габаритам — будет auto'
                                        : `Доступно ${palletPlaces.length} паллет-мест`}
                                    />
                                  )}
                                />
                              );
                            }}
                          />
                        ) : (
                          <Controller
                            control={control}
                            name={`items.${i}.cellId`}
                            render={({ field }) => {
                              const itemCond = watchedItems?.[i]?.storageConditions;
                              const pkg = watchedItems?.[i] || {};
                              const fitsBox = (c) => {
                                const pL = Number(pkg.packageLengthCm) || 0;
                                const pW = Number(pkg.packageWidthCm) || 0;
                                const pH = Number(pkg.packageHeightCm) || 0;
                                if (!pL || !pW || !pH) return true;
                                if (!c.lengthCm || !c.widthCm) return true;
                                const effH = c.remainingHeightCm != null
                                  ? Number(c.remainingHeightCm)
                                  : (c.heightCm ? Number(c.heightCm) : 0);
                                if (!effH) return true;
                                const cap = capacityByDims(
                                  Number(c.lengthCm), Number(c.widthCm), effH, pL, pW, pH,
                                );
                                if (cap === null) return true;
                                // ячейка подходит, если влезает хотя бы одна упаковка
                                // (вся партия в одну ячейку класть не требуется)
                                return cap > 0;
                              };
                              const matching = cellsFlat.filter((c) => !c.occupied
                                && (!itemCond || c.rackStorageConditions === itemCond)
                                && c.rackKind !== 'PALLET'
                                && fitsBox(c));
                              const selected = cellsFlat.find((c) => String(c.id) === String(field.value)) || null;
                              const pL = Number(pkg.packageLengthCm) || 0;
                              const pW = Number(pkg.packageWidthCm) || 0;
                              const pH = Number(pkg.packageHeightCm) || 0;
                              return (
                                <Autocomplete
                                  sx={{ flex: 1 }}
                                  size="small"
                                  options={matching}
                                  value={selected}
                                  onChange={(_, val) => field.onChange(val?.id || '')}
                                  groupBy={(opt) => `${opt.rackName} · ${RACK_KIND_RU[opt.rackKind] || opt.rackKind} · ${STORAGE_RU[opt.rackStorageConditions] || opt.rackStorageConditions || '—'}`}
                                  getOptionLabel={(opt) => {
                                    if (!opt) return '';
                                    const effH = opt.remainingHeightCm != null
                                      ? Number(opt.remainingHeightCm)
                                      : (opt.heightCm ? Number(opt.heightCm) : 0);
                                    const remH = opt.remainingHeightCm != null
                                      ? ` · до ${opt.remainingHeightCm}см осталось`
                                      : (opt.heightCm ? ` · до ${opt.heightCm}см` : '');
                                    const sz = opt.lengthCm
                                      ? ` · ${opt.lengthCm}×${opt.widthCm}см` : '';
                                    const cap = (pL && pW && pH && opt.lengthCm)
                                      ? capacityByDims(Number(opt.lengthCm), Number(opt.widthCm), effH, pL, pW, pH)
                                      : null;
                                    const capLabel = cap != null && cap > 0 ? ` · вместит ~${cap} ед.` : '';
                                    const code = opt.slotCode || opt.cellCode || String(opt.id).slice(0, 8);
                                    return `${code}${sz}${remH}${capLabel}`;
                                  }}
                                  isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
                                  renderInput={(params) => (
                                    <TextField {...params} label="Ячейка/полка"
                                      helperText={matching.length === 0
                                        ? 'Нет ячеек по габаритам — будет auto'
                                        : `Доступно ${matching.length} ячеек${itemCond ? ` · ${STORAGE_RU[itemCond] || itemCond}` : ''}`}
                                    />
                                  )}
                                />
                              );
                            }}
                          />
                        )}
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

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" mb={1}>Генерация документов приёмки</Typography>
        <GenerationModeCheckbox value={genMode} onChange={(v) => {
          setGenMode(v);
          localStorage.setItem('generationMode', v);
        }} />
        <Typography variant="caption" color="text.secondary">
          При включённом РПА — документы заполняются роботом через Office (Excel/Word).
          Иначе генерируется PDF серверным движком (быстрее).
        </Typography>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Товар</TableCell>
              <TableCell align="right">Упак.</TableCell>
              <TableCell align="right">Шт./упак.</TableCell>
              <TableCell align="right">Всего шт.</TableCell>
              <TableCell align="right">Цена</TableCell>
              <TableCell align="right">Сумма</TableCell>
              <TableCell>Партия</TableCell>
              <TableCell>Срок годности</TableCell>
              <TableCell>Упаковка</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(watchedItems || []).map((it, i) => {
              const packs = Number(it.quantityPackages || 0);
              const upp = Number(it.unitsPerPackage || 1) || 1;
              const sum = lineTotal(it);
              return (
                <TableRow key={`${it.productId}-${i}`}>
                  <TableCell>
                    <Typography variant="body2">{it.productName}</Typography>
                    <Typography variant="caption" color="text.secondary">{it.productSku}</Typography>
                  </TableCell>
                  <TableCell align="right">{packs}</TableCell>
                  <TableCell align="right">{upp}</TableCell>
                  <TableCell align="right">{packs * upp}</TableCell>
                  <TableCell align="right">{Number(it.pricePerUnit || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{sum.toFixed(2)}</TableCell>
                  <TableCell>{it.batchNumber || '—'}</TableCell>
                  <TableCell>{it.expiryDate || '—'}</TableCell>
                  <TableCell>{PACKAGING_OPTIONS.find((p) => p.value === it.packagingType)?.label || '—'}</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell colSpan={3} sx={{ borderBottom: 0 }} />
              <TableCell align="right" sx={{ borderBottom: 0 }}>
                <Typography variant="body2" fontWeight={700}>Итого: {totalSum.toFixed(2)}</Typography>
              </TableCell>
              <TableCell colSpan={3} sx={{ borderBottom: 0 }} />
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
              {progress.failed.slice(0, 5).map((f, idx) => {
                const hasName = f.productName && f.productName !== '—';
                return (
                  <Box key={idx}>
                    • {hasName ? `${f.productName}: ${f.error}` : f.error}
                  </Box>
                );
              })}
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
        <Typography variant="h4" fontWeight={700} mb={3}>Поставки и приёмка</Typography>

        <SuppliesSection
          refreshSignal={suppliesRefresh}
          onPickReceive={(supply) => {
            if (supply?.warehouseId) setValue('warehouseId', supply.warehouseId);
            const id = supply?.supplyId || supply?.id;
            if (id) setValue('supplyId', id);
            const applySupplier = () => {
              if (supply?.supplierId) {
                setValue('supplierId', String(supply.supplierId), { shouldValidate: false });
              }
            };
            if (supply?.supplierId
                && !suppliers.some((s) => String(s.supplierId) === String(supply.supplierId))) {
              Promise.resolve(refreshSuppliers?.()).finally(applySupplier);
            } else {
              applySupplier();
            }
            const rawItems = Array.isArray(supply?.items) ? supply.items : [];
            if (rawItems.length > 0) {
              const prefilledItems = rawItems.map((it) => ({
                ...EMPTY_ITEM,
                productId: it.productId || it.product_id || '',
                productName: it.productName || it.product_name || '',
                productSku: it.sku || it.product_sku || '',
                quantity: (it.expectedQty ?? it.expected_qty) != null
                  ? String(it.expectedQty ?? it.expected_qty) : '',
                pricePerUnit: (it.unitPrice ?? it.unit_price) != null
                  ? String(it.unitPrice ?? it.unit_price) : '',
                packagingType: it.packagingType || it.packaging_type || 'BOX',
                unitsPerPackage: (it.unitsPerPackage ?? it.units_per_package) != null
                  ? String(it.unitsPerPackage ?? it.units_per_package) : '1',
                storageConditions: it.storageConditions || it.storage_conditions || 'ROOM',
              }));
              setValue('items', prefilledItems);
              const unmatched = prefilledItems.filter((it) => !it.productId).length;
              if (unmatched > 0) {
                notify(
                  `Подтянуто ${prefilledItems.length} позиций, но ${unmatched} из них не сопоставлены с номенклатурой — `
                    + 'выберите товар вручную в этих строках перед приёмкой',
                  'warning',
                  { duration: 8000 },
                );
              } else {
                notify(`Поставка выбрана — подтянуто ${prefilledItems.length} позиций, дозаполните партию/срок`, 'info');
              }
            } else {
              notify('Поставка выбрана — заполните позиции ниже', 'info');
            }
            try {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            } catch {
            }
          }}
        />

        {lastResult?.session && (
          <Paper sx={{ mb: 3, borderRadius: 2, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight={700}>
                Приёмка на утверждении · {lastResult.session.items.length} позиций
              </Typography>
              <Box>
                {lastResult.session.status === 'COMPLETED' && (
                  <Chip label={statusLabel('COMPLETED')} color="success" size="small" icon={<CheckCircleIcon />} sx={{mr:1}} />
                )}
                {lastResult.session.status === 'COMPLETED_WITH_DISCREPANCY' && (
                  <Chip label={statusLabel('COMPLETED_WITH_DISCREPANCY')} color="warning" size="small" icon={<ReportProblemIcon />} sx={{mr:1}} />
                )}
                {lastResult.session.status === 'PAUSED' && (
                  <Chip label={`${statusLabel('PAUSED')} — утверждение для всей поставки одной кнопкой`} color="default" size="small" sx={{mr:1}} />
                )}
                <IconButton size="small" onClick={() => setLastResult(null)}>×</IconButton>
              </Box>
            </Stack>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
              На склад <b>{lastResult.warehouseName || '—'}</b> принято позиций:{' '}
              <b>{lastResult.session.items.length}</b>. Один акт приёмки на всю поставку.
              {' Session: '}
              <span style={{ fontFamily: 'monospace' }}>{String(lastResult.session.sessionId).slice(0, 8)}…</span>
            </Alert>

            <Stack spacing={1} mb={2}>
              {lastResult.session.items.map((it) => (
                <Paper key={it.operationId} variant="outlined" sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={600} noWrap>
                      {it.productName}
                      {it.productSku && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {it.productSku}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={500}>Кол-во: <b>{it.expectedQty}</b></Typography>
                </Paper>
              ))}
            </Stack>

            {lastResult.session.documentError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {lastResult.session.documentError}
              </Alert>
            )}

            <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap>
              {lastResult.session.receiptOrderDocId && (
                <DocumentDownloadButton
                  documentId={lastResult.session.receiptOrderDocId}
                  filename="receipt-order.pdf"
                  label="Приходный ордер"
                />
              )}
              {lastResult.session.receiptActDocId && (
                <DocumentDownloadButton
                  documentId={lastResult.session.receiptActDocId}
                  filename="receipt-act.pdf"
                  label="Акт приёмки"
                />
              )}
              {lastResult.session.placementListDocId && (
                <DocumentDownloadButton
                  documentId={lastResult.session.placementListDocId}
                  filename="placement-list.pdf"
                  label="Лист размещения"
                />
              )}
            </Stack>

            {lastResult.session.status === 'PAUSED' && (
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleCompleteSession(lastResult.session.sessionId)}
                >
                  Принять без замечаний
                </Button>
                <GenerationModeCheckbox value={genMode} onChange={setGenMode} />
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<ReportProblemIcon />}
                  onClick={() => setDiscrepancyDialog(lastResult.session)}
                >
                  Зафиксировать расхождение
                </Button>
              </Stack>
            )}
          </Paper>
        )}

        <DiscrepancyDialog
          session={discrepancyDialog}
          userId={userId}
          onClose={() => setDiscrepancyDialog(null)}
          onSubmit={handleSessionDiscrepancySubmit}
        />

        <CreateSupplierInlineDialog
          open={supplierDialogOpen}
          onClose={() => setSupplierDialogOpen(false)}
          onCreated={handleSupplierCreated}
          notify={notify}
        />

        <CreateProductInlineDialog
          open={productDialogOpen}
          onClose={() => setProductDialogOpen(false)}
          onCreated={handleProductCreated}
          notify={notify}
        />

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
            <ReceiveHistoryTab warehouses={warehouses} userId={userId} userWarehouseId={user?.warehouseId} notify={notify} />
          )}
        </Paper>

        {tab === 0 && (
          <Alert severity="info">
            После приёмки автоматически генерируется приходный ордер и акт приёмки.
            Скачать PDF можно по ссылкам выше или в разделе «Документы».
          </Alert>
        )}
      </Box>
    </Box>
  );
};

const ReceiveHistoryTab = ({ warehouses, userId, userWarehouseId, notify }) => {
  const [warehouseId, setWarehouseId] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userWarehouseId) {
      if (warehouseId !== userWarehouseId) setWarehouseId(userWarehouseId);
      return;
    }
    if (warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0].warehouseId || warehouses[0].id);
    }
  }, [warehouses, warehouseId, userWarehouseId]);

  const load = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        type: 'RECEIVE',
        warehouseId,
        page,
        size: rowsPerPage,
        sort: 'createdAt,desc',
      };
      if (onlyMine && userId) params.userId = userId;
      const data = await productService.getOperationsHistory(params);
      const list = Array.isArray(data) ? data : (data?.content || []);
      setHistory(list);
      setTotal(typeof data?.totalElements === 'number' ? data.totalElements : list.length);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить историю');
      setHistory([]);
      setTotal(0);
      notify(err.message || 'Не удалось загрузить историю', 'error');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, onlyMine, userId, page, rowsPerPage, notify]);

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
            disabled={!!userWarehouseId}
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
        <>
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
                  <TableCell>{formatDate(op.operationDate || op.createdAt || op.timestamp || op.operationTime)}</TableCell>
                  <TableCell>
                    {op.productName || op.productNameRu
                      || (op.productId ? <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{String(op.productId).slice(0, 8)}…</Typography> : '—')}
                  </TableCell>
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
    </Box>
  );
};

const DiscrepancyDialog = ({ session, userId, onClose, onSubmit }) => {
  const [rows, setRows] = useState([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) {
      setRows(session.items.map((it) => ({
        operationId: it.operationId,
        productId: it.productId,
        productName: it.productName,
        productSku: it.productSku,
        expectedQty: Number(it.expectedQty || 0),
        actualQty: '',
        defectDescription: '',
        discrepancyType: 'SHORTAGE',
      })));
      setGeneralNotes('');
    }
  }, [session]);

  if (!session) return null;

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const realDiscrepancies = rows.filter((r) => {
    const a = Number(r.actualQty);
    return r.actualQty !== '' && !Number.isNaN(a) && a !== r.expectedQty;
  });

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit(session.sessionId, {
        userId,
        generalNotes: generalNotes || null,
        items: realDiscrepancies.map((r) => ({
          productId: r.productId,
          operationId: r.operationId,
          expectedQty: r.expectedQty,
          actualQty: Number(r.actualQty),
          defectDescription: r.defectDescription || null,
          discrepancyType: r.discrepancyType,
        })),
      });
    } finally {
      setBusy(false);
    }
  };

  const hasInvalidActual = realDiscrepancies.some((r) => Number(r.actualQty) < 0);
  const canSubmit = realDiscrepancies.length > 0 && !hasInvalidActual;

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Зафиксировать расхождение по приёмке</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            Один акт расхождения формируется на всю поставку ({rows.length} позиций). Укажите
            фактически принятое количество для тех позиций, по которым обнаружены расхождения.
            Позиции, где факт = ожидание, в акт не попадут.
          </Alert>

          <Stack spacing={1.5}>
            {rows.map((r, idx) => {
              const actual = Number(r.actualQty);
              const delta = !Number.isNaN(actual) ? actual - r.expectedQty : 0;
              const hasDiff = r.actualQty !== '' && !Number.isNaN(actual) && actual !== r.expectedQty;
              return (
                <Paper key={r.operationId} variant="outlined" sx={{ p: 1.5, borderColor: hasDiff ? 'warning.main' : undefined }}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography fontWeight={600}>
                        {r.productName}
                        {r.productSku && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {r.productSku}
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 4 }}>
                        <TextField
                          label="Ожидалось"
                          value={r.expectedQty}
                          disabled
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <TextField
                          label="Фактически"
                          type="number"
                          inputProps={{ step: '0.01', min: '0' }}
                          value={r.actualQty}
                          onChange={(e) => updateRow(idx, { actualQty: e.target.value })}
                          fullWidth
                          size="small"
                          helperText={hasDiff ? `Δ: ${delta > 0 ? '+' : ''}${delta}` : ' '}
                          error={hasDiff && actual < 0}
                        />
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <FormControl size="small" fullWidth disabled={!hasDiff}>
                          <InputLabel>Тип</InputLabel>
                          <Select
                            value={r.discrepancyType}
                            label="Тип"
                            onChange={(e) => updateRow(idx, { discrepancyType: e.target.value })}
                          >
                            <MenuItem value="SHORTAGE">Недостача</MenuItem>
                            <MenuItem value="SURPLUS">Излишек</MenuItem>
                            <MenuItem value="DEFECT">Брак / дефект</MenuItem>
                            <MenuItem value="MISGRADE">Пересортица</MenuItem>
                            <MenuItem value="OTHER">Иное</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {hasDiff && (
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            label="Описание (опционально)"
                            value={r.defectDescription}
                            onChange={(e) => updateRow(idx, { defectDescription: e.target.value })}
                            fullWidth
                            size="small"
                            placeholder="Например: вмятина на упаковке"
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <TextField
            label="Общая заметка по акту (опционально)"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
          />

          {!canSubmit && (
            <Alert severity="warning" sx={{ borderRadius: 1 }}>
              Не указаны расхождения. Если приёмка без замечаний — закройте диалог и нажмите
              «Принять без замечаний».
            </Alert>
          )}
          <Alert severity="info" sx={{ borderRadius: 1 }}>
            После фиксации будет перегенерирован акт приёмки с шаблоном «Акт расхождения», сессия
            перейдёт в статус <b>Завершена с расхождениями</b>. Подпись кладовщика как материально-
            ответственного лица — достаточное основание (Постановление № 1290 п.40).
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Отмена</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={busy || !canSubmit}
          startIcon={busy ? <CircularProgress size={16} /> : <ReportProblemIcon />}
        >
          Зафиксировать ({realDiscrepancies.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CreateSupplierInlineDialog = ({ open, onClose, onCreated, notify }) => {
  const [busy, setBusy] = useState(false);
  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(supplierSchema),
    defaultValues: {
      name: '', unp: '', contactPerson: '', phone: '', email: '', address: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      reset({ name: '', unp: '', contactPerson: '', phone: '', email: '', address: '' });
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      const created = await supplierService.create(values);
      onCreated(created);
    } catch (err) {
      notify(err.message || 'Не удалось создать поставщика', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новый поставщик</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Наименование *"
            fullWidth size="small"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoFocus
          />
          <TextField
            label="УНП (9 цифр)"
            fullWidth size="small"
            {...register('unp')}
            error={!!errors.unp}
            helperText={errors.unp?.message}
          />
          <TextField
            label="Контактное лицо"
            fullWidth size="small"
            {...register('contactPerson')}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Телефон"
              fullWidth size="small"
              {...register('phone')}
            />
            <TextField
              label="Email"
              fullWidth size="small"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Stack>
          <TextField
            label="Адрес"
            fullWidth size="small"
            {...register('address')}
            multiline rows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UNIT_OPTIONS = ['шт', 'кг', 'г', 'л', 'мл', 'м', 'см', 'упак', 'ящ', 'рулон'];

const CreateProductInlineDialog = ({ open, onClose, onCreated, notify }) => {
  const [busy, setBusy] = useState(false);
  const {
    register, handleSubmit, reset, control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(productCreateSchema),
    defaultValues: {
      name: '', sku: '', barcode: '',
      unitOfMeasure: 'шт', price: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      reset({
        name: '', sku: '', barcode: '',
        unitOfMeasure: 'шт', price: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      const payload = {
        ...values,
        unitOfMeasure: values.unitOfMeasure || 'шт',
        price: values.price !== '' && values.price != null ? Number(values.price) : null,
      };
      const created = await productService.createProduct(payload);
      onCreated(created);
    } catch (err) {
      notify(err.message || 'Не удалось создать товар', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новый товар</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Название *"
            fullWidth size="small"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoFocus
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="SKU"
              fullWidth size="small"
              placeholder="оставьте пустым — сгенерируется автоматически"
              {...register('sku')}
              error={!!errors.sku}
              helperText={errors.sku?.message || 'Если не указать — будет назначен автоматически'}
            />
            <TextField
              label="Штрих-код"
              fullWidth size="small"
              {...register('barcode')}
              error={!!errors.barcode}
              helperText={errors.barcode?.message}
            />
          </Stack>
          <Controller
            name="unitOfMeasure"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth size="small" error={!!errors.unitOfMeasure}>
                <InputLabel>Ед. измерения</InputLabel>
                <Select {...field} label="Ед. измерения" variant="outlined">
                  {UNIT_OPTIONS.map((u) => (
                    <MenuItem key={u} value={u}>{u}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>{errors.unitOfMeasure?.message || 'шт / кг / л / упак'}</FormHelperText>
              </FormControl>
            )}
          />
          <TextField
            label="Учётная цена, руб."
            type="number"
            fullWidth size="small"
            {...register('price')}
            error={!!errors.price}
            helperText={errors.price?.message
              || 'Базовая цена для переоценки/аналитики (можно изменить позже)'}
            inputProps={{ min: 0, step: '0.01' }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceivePage;
