import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Select, InputLabel, FormControl,
  ToggleButton, ToggleButtonGroup, Typography, IconButton, Divider, Alert,
  Autocomplete, CircularProgress,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import supplyService from '../../services/supplyService';
import productService from '../../services/productService';
import warehouseService from '../../services/warehouseService';
import { useSnackbar } from '../../context/SnackbarContext';
import { useWarehouses, useSuppliers } from '../../hooks';
import CreateSupplierInlineDialog from '../shared/CreateSupplierInlineDialog';

const PACKAGING_OPTIONS = [
  { value: 'PALLET', label: 'Паллет' },
  { value: 'BOX', label: 'Коробка' },
  { value: 'CRATE', label: 'Ящик' },
  { value: 'EACH', label: 'Поштучно' },
];

const STORAGE_OPTIONS = [
  { value: 'ROOM', label: 'Комнатная' },
  { value: 'COOL', label: 'Прохладная' },
  { value: 'FRIDGE', label: 'Холодильник' },
  { value: 'FREEZER', label: 'Морозильник' },
];

let nextLocalId = 1;
const newLocalId = () => `local-${nextLocalId++}`;

const emptyItem = () => ({
  localId: newLocalId(),
  productId: null,
  productName: '',
  sku: '',
  expectedQty: '',
  unitPrice: '',
  packagingType: 'BOX',
  unitsPerPackage: '1',
  packageLengthCm: '',
  packageWidthCm: '',
  packageHeightCm: '',
  packageWeightKg: '',
  storageConditions: 'ROOM',
  unitOfMeasure: 'шт',
  notes: '',
});

const CreateSupplyDialog = ({ open, onClose, onSaved, supply = null }) => {
  const { notify } = useSnackbar();
  const user = useSelector(selectUser);
  const { data: warehouses } = useWarehouses();
  const { data: suppliers, refresh: refreshSuppliers } = useSuppliers();

  const isEdit = !!supply;

  const [mode, setMode] = useState('detailed');
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierLabel, setSupplierLabel] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [totalItems, setTotalItems] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const initRef = useRef({ open: false, supplyId: null });

  useEffect(() => {
    if (!open) {
      initRef.current = { open: false, supplyId: null };
      return;
    }
    const currentSupplyId = supply?.supplyId || supply?.supply_id || supply?.id || null;
    const sameTarget = initRef.current.open && initRef.current.supplyId === currentSupplyId;
    initRef.current = { open: true, supplyId: currentSupplyId };

    if (supply) {
      if (sameTarget) return;
      const quantityOnly = supply.quantityOnly ?? supply.quantity_only;
      setMode(quantityOnly ? 'quantity' : 'detailed');
      const whId = supply.warehouseId || supply.warehouse_id || user?.warehouseId;
      setWarehouseId(whId ? String(whId) : '');
      const spId = supply.supplierId || supply.supplier_id;
      setSupplierId(spId ? String(spId) : '');
      setSupplierLabel(supply.supplierName || supply.supplier_name || '');
      setExpectedDate(supply.expectedDate || supply.expected_date || '');
      setNotes(supply.notes || '');
      const tot = supply.totalItems ?? supply.total_items;
      setTotalItems(tot != null ? String(tot) : '');
      const rawItems = Array.isArray(supply.items) ? supply.items : [];
      setItems(
        rawItems.length > 0
          ? rawItems.map((it) => ({
              localId: newLocalId(),
              productId: it.productId || it.product_id || null,
              productName: it.productName || it.product_name || '',
              sku: it.sku || '',
              expectedQty: (it.expectedQty ?? it.expected_qty) != null
                ? String(it.expectedQty ?? it.expected_qty) : '',
              unitPrice: (it.unitPrice ?? it.unit_price) != null
                ? String(it.unitPrice ?? it.unit_price) : '',
              packagingType: it.packagingType || it.packaging_type || 'BOX',
              unitsPerPackage: (it.unitsPerPackage ?? it.units_per_package) != null
                ? String(it.unitsPerPackage ?? it.units_per_package) : '1',
              storageConditions: it.storageConditions || it.storage_conditions || 'ROOM',
              unitOfMeasure: it.unitOfMeasure || it.unit_of_measure || 'шт',
              notes: it.notes || '',
            }))
          : [emptyItem()]
      );
    } else {
      const whFallback = user?.warehouseId
        || (Array.isArray(warehouses) && warehouses[0]
            ? (warehouses[0].warehouseId || warehouses[0].id) : null);
      if (sameTarget) {
        if (whFallback && !warehouseId) {
          setWarehouseId(String(whFallback));
        }
        return;
      }
      setMode('detailed');
      setWarehouseId(whFallback ? String(whFallback) : '');
      setSupplierId('');
      setSupplierLabel('');
      setExpectedDate('');
      setNotes('');
      setTotalItems('');
      setItems([emptyItem()]);
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supply, user, warehouses]);

  useEffect(() => {
    if (!open) return;
    if (Array.isArray(warehouses) && warehouses.length > 0) {
      setWarehouseOptions(warehouses);
      return;
    }
    if (user?.warehouseId) {
      warehouseService.getWarehouse?.(user.warehouseId)
        .then((wh) => {
          if (!wh) return;
          setWarehouseOptions([{
            warehouseId: wh.warehouseId || wh.id,
            id: wh.warehouseId || wh.id,
            name: wh.name || 'Мой склад',
          }]);
        })
        .catch(() => {
          setWarehouseOptions([{
            warehouseId: user.warehouseId,
            id: user.warehouseId,
            name: 'Мой склад',
          }]);
        });
    }
  }, [open, warehouses, user]);

  const supplierOptions = useMemo(
    () => (suppliers || [])
      .filter((s) => (s.supplierId || s.id) && s.name)
      .map((s) => ({
        id: String(s.supplierId || s.id),
        name: s.name,
        unp: s.unp,
      })),
    [suppliers]
  );

  const selectedSupplierOption = useMemo(() => {
    if (!supplierId) return null;
    const found = supplierOptions.find((s) => s.id === supplierId);
    if (found) return found;
    return supplierLabel ? { id: supplierId, name: supplierLabel, unp: null } : null;
  }, [supplierOptions, supplierId, supplierLabel]);

  const handleClose = useCallback(() => {
    if (busy) return;
    onClose?.();
  }, [busy, onClose]);

  const updateItem = useCallback((localId, patch) => {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)));
  }, []);

  const addItem = useCallback(() => setItems((prev) => [...prev, emptyItem()]), []);

  const removeItem = useCallback((localId) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.localId !== localId);
      return next.length === 0 ? [emptyItem()] : next;
    });
  }, []);

  const handleSubmit = async () => {
    let storageUser = null;
    try {
      const raw = localStorage.getItem('user');
      if (raw) storageUser = JSON.parse(raw);
    } catch { /* noop */ }
    const effectiveWarehouseId = warehouseId || user?.warehouseId || storageUser?.warehouseId || '';
    if (!effectiveWarehouseId) { setError('Не удалось определить склад — обновите страницу или перезайдите'); return; }
    const userId = user?.userId || storageUser?.userId;
    if (!userId) { setError('Сессия истекла, перезайдите'); return; }

    if (mode === 'detailed') {
      if (!items.length || (items.length === 1 && !items[0].productName && !items[0].expectedQty)) {
        setError('Добавьте хотя бы одну позицию');
        return;
      }
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.productName?.trim()) { setError(`Позиция ${i + 1}: укажите название товара`); return; }
        const qty = Number(it.expectedQty);
        if (!Number.isFinite(qty) || qty <= 0) { setError(`Позиция ${i + 1}: количество > 0`); return; }
      }
    } else {
      const tot = Number(totalItems);
      if (!Number.isFinite(tot) || tot <= 0) { setError('Укажите число позиций > 0'); return; }
    }

    setError(null);
    setBusy(true);
    try {
      const supplierObj = selectedSupplierOption;
      const isValidUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
      const cleanSupplierId = isValidUuid(supplierId) ? supplierId : null;
      const totalItemsNum = mode === 'quantity' ? Number(totalItems) : items.length;
      const payload = {
        supplierId: cleanSupplierId,
        supplierName: supplierObj ? supplierObj.name : (supplierLabel || null),
        warehouseId: effectiveWarehouseId,
        expectedDate: expectedDate || null,
        notes: notes || null,
        createdBy: userId,
        quantityOnly: mode === 'quantity',
        totalItems: Number.isFinite(totalItemsNum) ? totalItemsNum : 0,
        items: mode === 'quantity' ? [] : items.map((it) => ({
          productId: it.productId || null,
          productName: it.productName,
          sku: it.sku || null,
          unitOfMeasure: it.unitOfMeasure || 'шт',
          storageConditions: it.storageConditions || 'ROOM',
          expectedQty: Number(it.expectedQty),
          unitPrice: it.unitPrice ? Number(it.unitPrice) : null,
          packagingType: it.packagingType || null,
          unitsPerPackage: it.unitsPerPackage ? Number(it.unitsPerPackage) : null,
          packageLengthCm: it.packageLengthCm ? Number(it.packageLengthCm) : null,
          packageWidthCm: it.packageWidthCm ? Number(it.packageWidthCm) : null,
          packageHeightCm: it.packageHeightCm ? Number(it.packageHeightCm) : null,
          packageWeightKg: it.packageWeightKg ? Number(it.packageWeightKg) : null,
          notes: it.notes || null,
        })),
      };
      const supplyIdForUpdate = supply?.supplyId || supply?.supply_id || supply?.id;
      // eslint-disable-next-line no-console
      console.log('[SUPPLY-DEBUG] mode=', mode, 'isEdit=', isEdit, 'supplyId=', supplyIdForUpdate, 'payload=', JSON.parse(JSON.stringify(payload)));
      const saved = isEdit
        ? await supplyService.update(supplyIdForUpdate, payload)
        : await supplyService.create(payload);
      notify(isEdit ? 'Поставка изменена' : 'Плановая поставка создана');
      onSaved?.(saved);
      onClose?.();
    } catch (ex) {
      setError(ex?.data?.message || ex?.message || 'Не удалось сохранить поставку');
    } finally {
      setBusy(false);
    }
  };

  const handleSupplierCreated = useCallback((created) => {
    setSupplierDialogOpen(false);
    if (!created) return;
    const newId = created.supplierId || created.id;
    const newName = created.name || '';
    if (refreshSuppliers) {
      Promise.resolve(refreshSuppliers()).finally(() => {
        if (newId) {
          setSupplierId(String(newId));
          setSupplierLabel(newName);
        }
      });
    } else if (newId) {
      setSupplierId(String(newId));
      setSupplierLabel(newName);
    }
  }, [refreshSuppliers]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>{isEdit ? 'Редактировать плановую поставку' : 'Новая плановая поставка'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, v) => v && setMode(v)}
          >
            <ToggleButton value="detailed">Конкретные позиции</ToggleButton>
            <ToggleButton value="quantity">Только число позиций</ToggleButton>
          </ToggleButtonGroup>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {user?.warehouseId ? (
              <TextField
                fullWidth
                size="small"
                label="Склад"
                value={
                  (warehouseOptions.find(
                    (w) => String(w.warehouseId || w.id) === String(user.warehouseId),
                  )?.name) || 'Мой склад'
                }
                InputProps={{ readOnly: true }}
                helperText="Поставка создаётся на ваш склад"
              />
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Склад *</InputLabel>
                <Select
                  value={warehouseId}
                  label="Склад *"
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  {warehouseOptions.map((w) => {
                    const id = String(w.warehouseId || w.id);
                    return (
                      <MenuItem key={id} value={id}>{w.name}</MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: 'flex-start' }}>
              <Autocomplete
                fullWidth
                size="small"
                options={supplierOptions}
                value={selectedSupplierOption}
                getOptionLabel={(opt) => opt
                  ? `${opt.name}${opt.unp ? ` (УНП ${opt.unp})` : ''}`
                  : ''}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                onChange={(_, val) => {
                  setSupplierId(val?.id || '');
                  setSupplierLabel(val?.name || '');
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Поставщик" />
                )}
                noOptionsText="Поставщиков нет — создайте нового"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddIcon />}
                onClick={() => setSupplierDialogOpen(true)}
                sx={{ whiteSpace: 'nowrap', height: 40 }}
              >
                Новый
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              size="small"
              label="Плановая дата"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: 220 }}
            />
            <TextField
              size="small"
              label="Примечания"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Stack>

          {mode === 'quantity' ? (
            <TextField
              size="small"
              label="Плановое число позиций *"
              type="number"
              value={totalItems}
              onChange={(e) => setTotalItems(e.target.value)}
              helperText="Кладовщик внесёт номенклатуру при приёмке; SKU сгенерируется автоматически"
              sx={{ maxWidth: 320 }}
            />
          ) : (
            <Stack spacing={1}>
              <Divider />
              <Typography variant="subtitle2">Позиции</Typography>
              <Typography variant="caption" color="text.secondary">
                Срок годности указывается уже при приёмке партии.
              </Typography>
              {items.map((it, idx) => (
                <SupplyItemRow
                  key={it.localId}
                  index={idx}
                  item={it}
                  onPatch={(patch) => updateItem(it.localId, patch)}
                  onRemove={() => removeItem(it.localId)}
                  disableRemove={items.length === 1}
                />
              ))}
              <Button startIcon={<AddIcon />} onClick={addItem} variant="text" size="small">
                Добавить позицию
              </Button>
            </Stack>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy ? 'Сохраняем…' : (isEdit ? 'Сохранить' : 'Создать поставку')}
        </Button>
      </DialogActions>
      <CreateSupplierInlineDialog
        open={supplierDialogOpen}
        onClose={() => setSupplierDialogOpen(false)}
        onCreated={handleSupplierCreated}
      />
    </Dialog>
  );
};

const SupplyItemRow = ({ item, index, onPatch, onRemove, disableRemove }) => {
  const [productOptions, setProductOptions] = useState([]);
  const [productSearchBusy, setProductSearchBusy] = useState(false);
  const [inputValue, setInputValue] = useState(item.productName || '');

  useEffect(() => {
    setInputValue(item.productName || '');
  }, [item.productName]);

  useEffect(() => {
    const query = inputValue?.trim();
    if (!query || query.length < 2) {
      setProductOptions([]);
      return;
    }
    let cancelled = false;
    setProductSearchBusy(true);
    const handle = setTimeout(async () => {
      try {
        const res = await productService.searchProducts(query);
        if (!cancelled) {
          const list = Array.isArray(res) ? res : (res?.content || []);
          setProductOptions(list);
        }
      } catch {
        if (!cancelled) setProductOptions([]);
      } finally {
        if (!cancelled) setProductSearchBusy(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [inputValue]);

  const autocompleteValue = useMemo(() => {
    if (item.productId) {
      const fromOptions = productOptions.find(
        (p) => (p.productId || p.id) === item.productId
      );
      if (fromOptions) return fromOptions;
      return { productId: item.productId, name: item.productName, sku: item.sku };
    }
    return null;
  }, [item.productId, item.productName, item.sku, productOptions]);

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="flex-start">
      <Autocomplete
        freeSolo
        size="small"
        sx={{ flex: 1, minWidth: 240 }}
        options={productOptions}
        loading={productSearchBusy}
        value={autocompleteValue}
        inputValue={inputValue}
        onInputChange={(_, val, reason) => {
          setInputValue(val || '');
          if (reason === 'input') {
            onPatch({ productName: val || '', productId: null, sku: '' });
          } else if (reason === 'clear') {
            onPatch({ productName: '', productId: null, sku: '' });
          }
        }}
        onChange={(_, val) => {
          if (val && typeof val === 'object') {
            onPatch({
              productId: val.productId || val.id,
              productName: val.name || '',
              sku: val.sku || '',
              unitOfMeasure: val.unitOfMeasure || val.unit_of_measure || item.unitOfMeasure,
              storageConditions: val.requiredStorageCondition
                || val.required_storage_condition
                || item.storageConditions,
            });
          }
        }}
        getOptionLabel={(opt) => typeof opt === 'string'
          ? opt
          : (opt?.name ? `${opt.name}${opt.sku ? ` · ${opt.sku}` : ''}` : '')}
        isOptionEqualToValue={(a, b) => (a?.productId || a?.id) === (b?.productId || b?.id)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Позиция ${index + 1}: товар (выбрать или ввести новый)`}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {productSearchBusy && <CircularProgress size={16} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      <TextField
        size="small" label="Кол-во *" type="number" value={item.expectedQty}
        onChange={(e) => onPatch({ expectedQty: e.target.value })}
        sx={{ width: 100 }}
      />
      <TextField
        size="small" label="Цена" type="number" value={item.unitPrice}
        onChange={(e) => onPatch({ unitPrice: e.target.value })}
        sx={{ width: 110 }}
      />
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>Упаковка</InputLabel>
        <Select
          value={item.packagingType || ''}
          label="Упаковка"
          onChange={(e) => onPatch({ packagingType: e.target.value })}
        >
          {PACKAGING_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small" label="шт. в 1 упак." type="number" value={item.unitsPerPackage || '1'}
        onChange={(e) => onPatch({ unitsPerPackage: e.target.value })}
        inputProps={{ min: '1', step: '1' }}
        sx={{ width: 150 }}
        InputLabelProps={{ shrink: true }}
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Условия</InputLabel>
        <Select
          value={item.storageConditions || 'ROOM'}
          label="Условия"
          onChange={(e) => onPatch({ storageConditions: e.target.value })}
        >
          {STORAGE_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <IconButton onClick={onRemove} disabled={disableRemove} color="error" size="small">
        <DeleteOutlineIcon />
      </IconButton>
    </Stack>
  );
};

export default CreateSupplyDialog;
