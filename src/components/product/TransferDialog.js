import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Alert, Typography, Autocomplete, TextField,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useSnackbar } from '../../context/SnackbarContext';
import productService from '../../services/productService';
import warehouseService from '../../services/warehouseService';

const TransferDialog = ({ open, onClose, product, sourceStock, onTransferred }) => {
  const { notify } = useSnackbar();
  const user = useSelector(selectUser);

  const [cellsFlat, setCellsFlat] = useState([]);
  const [loadingCells, setLoadingCells] = useState(false);
  const [targetCell, setTargetCell] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const warehouseId = user?.warehouseId || sourceStock?.warehouseId;
  const sourceQty = sourceStock ? Number(sourceStock.quantity || 0) : 0;
  const sourceReserved = sourceStock ? Number(sourceStock.reservedQuantity || 0) : 0;
  const sourceAvailable = Math.max(0, sourceQty - sourceReserved);
  const sourceStorage = sourceStock?.storageConditions
    || sourceStock?.batchStorageConditions
    || null;
  const sourcePackaging = sourceStock?.packagingType
    || sourceStock?.batchPackagingType
    || null;
  const isPallet = sourcePackaging === 'PALLET';
  const unitsPerPackage = Number(sourceStock?.unitsPerPackage || sourceStock?.batchUnitsPerPackage || 1) || 1;
  const sourcePackages = unitsPerPackage > 0 ? Math.floor(sourceAvailable / unitsPerPackage) : 0;
  const qtyPacks = Number(quantity) || 0;
  const qtyUnits = qtyPacks * unitsPerPackage;

  useEffect(() => {
    if (!open || !warehouseId) {
      setCellsFlat([]);
      return;
    }
    let cancelled = false;
    setLoadingCells(true);
    warehouseService.getAllCellsFlat(warehouseId)
      .then((list) => { if (!cancelled) setCellsFlat(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setCellsFlat([]); })
      .finally(() => { if (!cancelled) setLoadingCells(false); });
    return () => { cancelled = true; };
  }, [open, warehouseId]);

  useEffect(() => {
    if (open) {
      setTargetCell(null);
      setQuantity(String(sourcePackages || ''));
      setNotes('');
      setError(null);
    }
  }, [open, sourcePackages]);

  const targetOptions = useMemo(() => cellsFlat.filter((c) => {
    if (c.occupied) return false;
    if (sourceStock?.cellId && String(c.id) === String(sourceStock.cellId)) return false;
    if (sourceStorage && c.rackStorageConditions
        && c.rackStorageConditions !== sourceStorage) return false;
    if (isPallet) {
      if (c.rackKind !== 'PALLET') return false;
    } else if (c.rackKind === 'PALLET') {
      return false;
    }
    return true;
  }), [cellsFlat, sourceStock, sourceStorage, isPallet]);

  const handleSubmit = async () => {
    if (!sourceStock) { setError('Не выбрана исходная ячейка'); return; }
    if (!Number.isFinite(qtyPacks) || qtyPacks <= 0) {
      setError('Количество упаковок должно быть > 0');
      return;
    }
    if (qtyPacks > sourcePackages) {
      setError(`Доступно только ${sourcePackages} упак. (= ${sourceAvailable} шт.${sourceReserved > 0 ? `, зарезервировано ${sourceReserved} шт.` : ''})`);
      return;
    }
    if (!targetCell) { setError('Выберите ячейку назначения'); return; }

    setError(null);
    setBusy(true);
    try {
      const payload = {
        productId: product?.productId || product?.id,
        batchId: sourceStock.batchId || null,
        fromWarehouseId: warehouseId,
        fromCellId: sourceStock.cellId || null,
        toWarehouseId: warehouseId,
        toCellId: targetCell.id,
        quantity: qtyUnits,
        userId: user?.userId,
        notes: notes || null,
      };
      const res = await productService.transferProduct(payload);
      notify(`Перемещено ${qtyPacks} упак. (${qtyUnits} шт.) в ячейку ${targetCell.slotCode || targetCell.cellCode || String(targetCell.id).slice(0, 8)}`);
      onTransferred?.(res);
      onClose?.();
    } catch (ex) {
      setError(ex?.data?.message || ex?.message || 'Не удалось переместить');
    } finally {
      setBusy(false);
    }
  };

  if (!sourceStock) return null;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <SwapHorizIcon color="primary" />
          <span>Перемещение между ячейками</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            <b>{product?.productName || product?.name || '—'}</b>
            {product?.sku ? ` · SKU ${product.sku}` : ''}
          </Typography>

          <Alert severity="info">
            В ячейке <b>{sourceStock.slotCode || sourceStock.cellCode
              || (sourceStock.cellId ? String(sourceStock.cellId).slice(0, 8) : 'без ячейки')}</b>:
            <b> {sourcePackages}</b> упак. (= <b>{sourceAvailable}</b> шт.)
            {sourceReserved > 0 ? ` · резерв: ${sourceReserved} шт.` : ''}.
            {sourceStock.batchNumber ? ` Партия №${sourceStock.batchNumber}.` : ''}
            {sourcePackaging ? ` Упаковка: ${sourcePackaging}` : ''}
            {unitsPerPackage > 1 ? ` (по ${unitsPerPackage} шт./упак.)` : ''}.
            {sourceStorage ? ` Условия: ${sourceStorage}.` : ''}
          </Alert>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Кол-во упаковок"
              size="small"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputProps={{ min: '0', step: '1', max: sourcePackages }}
              helperText={qtyPacks > 0
                ? `= ${qtyUnits} шт. (макс ${sourcePackages} упак. / ${sourceAvailable} шт.)`
                : `Максимум: ${sourcePackages} упак.`}
              sx={{ width: 240 }}
            />
            <Button
              variant="text"
              size="small"
              onClick={() => setQuantity(String(sourcePackages))}
              disabled={sourcePackages === 0}
            >
              Всё ({sourcePackages})
            </Button>
          </Stack>

          <Autocomplete
            options={targetOptions}
            loading={loadingCells}
            value={targetCell}
            onChange={(_, val) => setTargetCell(val)}
            groupBy={(opt) => `${opt.rackName} · ${opt.rackKind} · ${opt.rackStorageConditions || '—'}`}
            getOptionLabel={(opt) => {
              if (!opt) return '';
              const code = opt.slotCode || opt.cellCode || String(opt.id).slice(0, 8);
              const wt = opt.maxWeightKg ? ` · до ${opt.maxWeightKg}кг` : '';
              const sz = opt.lengthCm
                ? ` · ${opt.lengthCm}×${opt.widthCm}×${opt.heightCm}см` : '';
              return `${code}${wt}${sz}`;
            }}
            isOptionEqualToValue={(a, b) => String(a?.id) === String(b?.id)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={isPallet ? 'Куда — паллет-место' : 'Куда — ячейка/полка'}
                size="small"
                helperText={targetOptions.length === 0
                  ? `Нет свободных ${isPallet ? 'паллет-мест' : 'ячеек'} (фильтр: ${sourceStorage || 'все условия'})`
                  : `Доступно ${targetOptions.length}${sourceStorage ? ` (условия: ${sourceStorage})` : ''}`}
              />
            )}
          />

          <TextField
            label="Примечание (опционально)"
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy || !targetCell || qtyPacks <= 0 || qtyPacks > sourcePackages}
          startIcon={<SwapHorizIcon />}
        >
          {busy ? 'Переносим…' : 'Переместить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferDialog;
