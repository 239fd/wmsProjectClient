import React, { useEffect, useState } from 'react';
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

const EMPTY_ITEM = () => ({
  productId: null,
  productName: '',
  sku: '',
  expectedQty: '',
  unitPrice: '',
  packagingType: 'BOX',
  storageConditions: 'ROOM',
  unitOfMeasure: 'шт',
  notes: '',
});

const CreateSupplyDialog = ({ open, onClose, onSaved, supply = null }) => {
  const { notify } = useSnackbar();
  const user = useSelector(selectUser);
  const { data: warehouses } = useWarehouses();
  const { data: suppliers, refresh: refreshSuppliers } = useSuppliers();
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const isEdit = !!supply;

  const [mode, setMode] = useState('detailed');
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [totalItems, setTotalItems] = useState('');
  const [items, setItems] = useState([EMPTY_ITEM()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [productSearchBusy, setProductSearchBusy] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    if (isEdit && supply) {
      const quantityOnly = supply.quantityOnly ?? supply.quantity_only;
      setMode(quantityOnly ? 'quantity' : 'detailed');
      const whId = supply.warehouseId || supply.warehouse_id;
      setWarehouseId(whId ? String(whId) : '');
      const spId = supply.supplierId || supply.supplier_id;
      setSupplierId(spId ? String(spId) : '');
      setSupplierName(supply.supplierName || supply.supplier_name || '');
      setExpectedDate(supply.expectedDate || supply.expected_date || '');
      setNotes(supply.notes || '');
      const totItems = supply.totalItems ?? supply.total_items;
      setTotalItems(totItems != null ? String(totItems) : '');
      setItems(
        Array.isArray(supply.items) && supply.items.length > 0
          ? supply.items.map((it) => ({
              productId: it.productId || it.product_id || null,
              productName: it.productName || it.product_name || '',
              sku: it.sku || '',
              expectedQty: (it.expectedQty ?? it.expected_qty) != null ? String(it.expectedQty ?? it.expected_qty) : '',
              unitPrice: (it.unitPrice ?? it.unit_price) != null ? String(it.unitPrice ?? it.unit_price) : '',
              packagingType: it.packagingType || it.packaging_type || 'BOX',
              storageConditions: it.storageConditions || it.storage_conditions || 'ROOM',
              unitOfMeasure: it.unitOfMeasure || it.unit_of_measure || 'шт',
              notes: it.notes || '',
            }))
          : [EMPTY_ITEM()]
      );
    } else {
      reset();
    }
  }, [open, isEdit, supply]);

  useEffect(() => {
    if (!open) return;
    if (warehouseId) return;
    if (user?.warehouseId) {
      setWarehouseId(String(user.warehouseId));
      return;
    }
    if (warehouses && warehouses.length > 0) {
      setWarehouseId(String(warehouses[0].warehouseId || warehouses[0].id));
    }
  }, [open, user, warehouses, warehouseId]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const list = Array.isArray(warehouses) && warehouses.length > 0 ? warehouses : null;
    if (list) {
      setWarehouseOptions(list);
      return;
    }
    if (user?.warehouseId) {
      warehouseService.getWarehouse?.(user.warehouseId)
        .then((wh) => {
          if (mounted && wh) {
            setWarehouseOptions([{
              warehouseId: wh.warehouseId || wh.id,
              name: wh.name || 'Мой склад',
              id: wh.warehouseId || wh.id,
            }]);
          }
        })
        .catch(() => {
          if (mounted) setWarehouseOptions([{
            warehouseId: user.warehouseId,
            id: user.warehouseId,
            name: 'Мой склад',
          }]);
        });
    }
    return () => { mounted = false; };
  }, [open, warehouses, user]);

  useEffect(() => {
    if (!productSearchQuery || productSearchQuery.length < 2) {
      setProductOptions([]);
      return;
    }
    let cancelled = false;
    setProductSearchBusy(true);
    const handle = setTimeout(async () => {
      try {
        const res = await productService.searchProducts(productSearchQuery);
        if (!cancelled) {
          setProductOptions(Array.isArray(res) ? res : (res?.content || []));
        }
      } catch {
        if (!cancelled) setProductOptions([]);
      } finally {
        if (!cancelled) setProductSearchBusy(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [productSearchQuery]);

  const reset = () => {
    setMode('detailed');
    setWarehouseId('');
    setSupplierId('');
    setSupplierName('');
    setExpectedDate('');
    setNotes('');
    setTotalItems('');
    setItems([EMPTY_ITEM()]);
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, EMPTY_ITEM()]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    if (!warehouseId) return 'Выберите склад';
    if (mode === 'detailed') {
      if (!items.length) return 'Добавьте хотя бы одну позицию';
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.productName?.trim()) return `Позиция ${i + 1}: укажите название товара`;
        const qty = Number(it.expectedQty);
        if (!Number.isFinite(qty) || qty <= 0) return `Позиция ${i + 1}: количество > 0`;
      }
    } else {
      const n = Number(totalItems);
      if (!Number.isFinite(n) || n <= 0) return 'Укажите плановое число позиций > 0';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setBusy(true);
    try {
      const finalWarehouseId = warehouseId
        || (user?.warehouseId ? String(user.warehouseId) : '')
        || (warehouses && warehouses[0]
            ? String(warehouses[0].warehouseId || warehouses[0].id) : '');
      const finalCreatedBy = user?.userId;
      if (!finalWarehouseId) {
        setError('Не удалось определить склад. Перезайдите в систему.');
        setBusy(false);
        return;
      }
      if (!finalCreatedBy) {
        setError('Сессия истекла. Перезайдите в систему.');
        setBusy(false);
        return;
      }
      const selectedSupplier = (suppliers || []).find(
        (s) => String(s.supplierId || s.id) === String(supplierId)
      );
      const totalItemsRaw = mode === 'quantity' ? Number(totalItems) : items.length;
      const payload = {
        supplierId: supplierId || null,
        supplierName: selectedSupplier ? selectedSupplier.name : (supplierName || null),
        warehouseId: finalWarehouseId,
        expectedDate: expectedDate || null,
        notes: notes || null,
        createdBy: finalCreatedBy,
        quantityOnly: mode === 'quantity',
        totalItems: Number.isFinite(totalItemsRaw) && totalItemsRaw > 0 ? totalItemsRaw : null,
        items: mode === 'quantity' ? [] : items.map((it) => ({
          productId: it.productId || null,
          productName: it.productName,
          sku: it.sku || null,
          unitOfMeasure: it.unitOfMeasure || 'шт',
          storageConditions: it.storageConditions || 'ROOM',
          expectedQty: Number(it.expectedQty),
          unitPrice: it.unitPrice ? Number(it.unitPrice) : null,
          packagingType: it.packagingType || null,
          notes: it.notes || null,
        })),
      };
      const supplyIdForUpdate = supply?.supplyId || supply?.supply_id || supply?.id;
      const saved = isEdit
        ? await supplyService.update(supplyIdForUpdate, payload)
        : await supplyService.create(payload);
      notify(isEdit ? 'Поставка изменена' : 'Плановая поставка создана');
      onSaved?.(saved);
      reset();
      onClose?.();
    } catch (ex) {
      setError(ex?.data?.message || ex?.message || 'Не удалось сохранить поставку');
    } finally {
      setBusy(false);
    }
  };

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
            <FormControl fullWidth size="small">
              <InputLabel>Склад</InputLabel>
              <Select
                value={warehouseId}
                label="Склад"
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {warehouseOptions.map((w) => {
                  const id = String(w.warehouseId || w.id);
                  return (
                    <MenuItem key={id} value={id}>
                      {w.name}{w.address ? ` · ${w.address}` : ''}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: 'flex-start' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Поставщик</InputLabel>
                <Select
                  value={supplierId}
                  label="Поставщик"
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    const sel = (suppliers || []).find((s) => String(s.supplierId || s.id) === String(e.target.value));
                    if (sel) setSupplierName(sel.name || '');
                  }}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) return <em>— не выбран —</em>;
                    const sel = (suppliers || []).find((s) => String(s.supplierId || s.id) === String(value));
                    if (sel) return `${sel.name}${sel.unp ? ` (ИНН ${sel.unp})` : ''}`;
                    return supplierName || '—';
                  }}
                >
                  <MenuItem value=""><em>— не выбран —</em></MenuItem>
                  {(suppliers || []).map((s) => {
                    const id = String(s.supplierId || s.id);
                    return (
                      <MenuItem key={id} value={id}>
                        {s.name}{s.unp ? ` (ИНН ${s.unp})` : ''}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
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
            />
            <TextField
              size="small"
              label="Примечания"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
            />
          </Stack>

          {mode === 'quantity' && (
            <TextField
              size="small"
              label="Плановое число позиций"
              type="number"
              value={totalItems}
              onChange={(e) => setTotalItems(e.target.value)}
              helperText="Кладовщик внесёт номенклатуру при приёмке; SKU сгенерируется автоматически"
              sx={{ maxWidth: 320 }}
            />
          )}

          {mode === 'detailed' && (
            <Stack spacing={1}>
              <Divider />
              <Typography variant="subtitle2">Позиции</Typography>
              <Typography variant="caption" color="text.secondary">
                Выберите товар из справочника или впишите название нового — SKU сгенерируется
                автоматически при приёмке. Срок годности указывается уже при приёмке партии.
              </Typography>
              {items.map((it, idx) => (
                <Stack key={idx} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems="flex-start">
                  <Autocomplete
                    freeSolo
                    size="small"
                    sx={{ flex: 1, minWidth: 240 }}
                    options={productOptions}
                    loading={productSearchBusy}
                    value={it.productId
                      ? productOptions.find((p) => (p.productId || p.id) === it.productId)
                          || { productId: it.productId, name: it.productName, sku: it.sku }
                      : (it.productName || null)
                    }
                    getOptionLabel={(opt) =>
                      typeof opt === 'string'
                        ? opt
                        : (opt?.name ? `${opt.name}${opt.sku ? ` · ${opt.sku}` : ''}` : '')
                    }
                    onInputChange={(_, val) => {
                      setProductSearchQuery(val || '');
                      if (typeof val === 'string') updateItem(idx, { productName: val });
                    }}
                    onChange={(_, val) => {
                      if (val && typeof val === 'object') {
                        updateItem(idx, {
                          productId: val.productId || val.id,
                          productName: val.name,
                          sku: val.sku || '',
                          unitOfMeasure: val.unitOfMeasure || val.unit_of_measure || 'шт',
                          storageConditions: val.requiredStorageCondition || val.required_storage_condition || it.storageConditions,
                        });
                      } else if (typeof val === 'string') {
                        updateItem(idx, { productId: null, productName: val, sku: '' });
                      } else {
                        updateItem(idx, { productId: null, productName: '', sku: '' });
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Товар (из справочника или новый)"
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
                    size="small" label="Кол-во" type="number" value={it.expectedQty}
                    onChange={(e) => updateItem(idx, { expectedQty: e.target.value })}
                    sx={{ width: 100 }}
                  />
                  <TextField
                    size="small" label="Цена" type="number" value={it.unitPrice}
                    onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                    sx={{ width: 110 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 130 }}>
                    <InputLabel>Упаковка</InputLabel>
                    <Select
                      value={it.packagingType || ''}
                      label="Упаковка"
                      onChange={(e) => updateItem(idx, { packagingType: e.target.value })}
                    >
                      {PACKAGING_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Условия</InputLabel>
                    <Select
                      value={it.storageConditions || 'ROOM'}
                      label="Условия"
                      onChange={(e) => updateItem(idx, { storageConditions: e.target.value })}
                    >
                      {STORAGE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    color="error"
                    size="small"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
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
        onCreated={(created) => {
          const newId = created?.supplierId || created?.id;
          setSupplierDialogOpen(false);
          if (refreshSuppliers) {
            Promise.resolve(refreshSuppliers()).then(() => {
              if (newId) {
                setSupplierId(String(newId));
                setSupplierName(created.name || '');
              }
            });
          } else if (newId) {
            setSupplierId(String(newId));
            setSupplierName(created.name || '');
          }
        }}
      />
    </Dialog>
  );
};

export default CreateSupplyDialog;
