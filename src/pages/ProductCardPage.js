import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Button, Autocomplete, TextField, CircularProgress,
  Tabs, Tab, Chip, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { useSnackbar } from '../context/SnackbarContext';
import productService from '../services/productService';
import productCardService from '../services/productCardService';
import warehouseService from '../services/warehouseService';
import { useWarehouses, useEmployees } from '../hooks';
import EmptyState from '../components/shared/EmptyState';
import TransferDialog from '../components/product/TransferDialog';

const STORAGE_RU = {
  ROOM: 'Комнатная',
  COOL: 'Прохладная',
  FRIDGE: 'Холодильник',
  FREEZER: 'Морозильник',
};

const PACKAGING_RU = {
  PALLET: 'Паллет',
  BOX: 'Коробка',
  CRATE: 'Ящик',
  EACH: 'Поштучно',
};

const INVENTORY_STATUS_RU = {
  AVAILABLE: 'Доступно',
  RESERVED: 'Зарезервировано',
  BLOCKED: 'Заблокировано',
  EXPIRED: 'Просрочено',
  DAMAGED: 'Повреждено',
};

const OPERATION_LABEL = {
  RECEIPT: 'Приёмка',
  RECEIVE: 'Приёмка',
  SHIPMENT: 'Отгрузка',
  SHIP: 'Отгрузка',
  TRANSFER: 'Перемещение',
  WRITE_OFF: 'Списание',
  WRITEOFF: 'Списание',
  REVALUATION: 'Переоценка',
  RESERVE: 'Резерв',
  RELEASE: 'Освобождение',
  INVENTORY: 'Инвентаризация',
};

const OPERATION_COLOR = {
  RECEIPT: 'success',
  RECEIVE: 'success',
  SHIPMENT: 'primary',
  SHIP: 'primary',
  TRANSFER: 'secondary',
  WRITE_OFF: 'error',
  WRITEOFF: 'error',
  REVALUATION: 'warning',
  RESERVE: 'info',
  RELEASE: 'info',
  INVENTORY: 'default',
};

const pad2 = (n) => String(n).padStart(2, '0');
const fmtDateTime = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  } catch { return String(raw); }
};

const fmtDate = (raw) => {
  if (!raw) return '—';
  try { return new Date(raw).toLocaleDateString('ru-RU'); } catch { return String(raw); }
};

const ProductCardPage = () => {
  const { notify } = useSnackbar();
  const user = useSelector(selectUser);
  const userWarehouseId = user?.warehouseId;
  const { data: warehouses } = useWarehouses();
  const { data: employees } = useEmployees();

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [card, setCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [transferSource, setTransferSource] = useState(null);
  const [cellsFlat, setCellsFlat] = useState([]);

  useEffect(() => {
    if (!userWarehouseId) { setCellsFlat([]); return; }
    let cancelled = false;
    warehouseService.getAllCellsFlat(userWarehouseId)
      .then((list) => { if (!cancelled) setCellsFlat(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setCellsFlat([]); });
    return () => { cancelled = true; };
  }, [userWarehouseId]);

  const warehouseById = React.useMemo(() => {
    const m = new Map();
    (warehouses || []).forEach((w) => m.set(String(w.warehouseId || w.id), w.name));
    return m;
  }, [warehouses]);
  const employeeById = React.useMemo(() => {
    const m = new Map();
    (employees || []).forEach((e) => m.set(String(e.userId), e.fullName || e.username || e.email));
    return m;
  }, [employees]);
  const cellById = React.useMemo(() => {
    const m = new Map();
    (cellsFlat || []).forEach((c) => m.set(String(c.id), c));
    return m;
  }, [cellsFlat]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setSearchBusy(true);
    const handle = setTimeout(async () => {
      try {
        const res = await productService.searchProducts(query);
        if (!cancelled) {
          setOptions(Array.isArray(res) ? res : (res?.content || []));
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setSearchBusy(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query]);

  const loadCard = async (product) => {
    if (!product) { setCard(null); return; }
    const id = product.productId || product.id;
    if (!id) return;
    setCardLoading(true);
    try {
      const data = await productCardService.getCard(id);
      setCard(data);
    } catch (err) {
      notify(err?.message || 'Не удалось загрузить карточку', 'error');
      setCard(null);
    } finally {
      setCardLoading(false);
    }
  };

  const handleSelect = (val) => {
    setSelected(val);
    loadCard(val);
  };

  const handleDownloadPdf = async () => {
    if (!selected) return;
    setPdfBusy(true);
    try {
      const id = selected.productId || selected.id;
      const sku = selected.sku ? `-${selected.sku}` : '';
      await productCardService.downloadPdf(id, `product-card${sku}.pdf`);
    } catch (err) {
      notify(err?.message || 'Не удалось скачать PDF', 'error');
    } finally {
      setPdfBusy(false);
    }
  };

  const allStocks = card?.currentStocks || [];
  const allBatches = card?.batches || [];
  const allOperations = card?.operations || [];
  const batchByIdMap = React.useMemo(() => {
    const m = new Map();
    (allBatches || []).forEach((b) => m.set(String(b.batchId), b));
    return m;
  }, [allBatches]);
  const cellLabel = (cellId) => {
    if (!cellId) return 'без ячейки';
    const c = cellById.get(String(cellId));
    if (!c) return String(cellId).slice(0, 8) + '…';
    const code = c.slotCode || c.cellCode || c.id?.toString().slice(0, 8) + '…';
    const rack = c.rackName ? `${c.rackName} / ` : '';
    return `${rack}${code}`;
  };
  const warehouseLabel = (id) =>
    warehouseById.get(String(id)) || (id ? String(id).slice(0, 8) + '…' : '—');
  const userLabel = (id) => employeeById.get(String(id)) || (id ? String(id).slice(0, 8) + '…' : '—');
  const stocks = userWarehouseId
    ? allStocks.filter((s) => String(s.warehouseId) === String(userWarehouseId))
    : allStocks;
  const batches = allBatches;
  const operations = userWarehouseId
    ? allOperations.filter((op) => String(op.warehouseId) === String(userWarehouseId))
    : allOperations;

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          gap={2}
          mb={3}
        >
          <Typography variant="h4" fontWeight={700}>Карточка товара</Typography>
          {selected && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={pdfBusy ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
                disabled={pdfBusy}
                onClick={handleDownloadPdf}
              >
                Скачать PDF
              </Button>
            </Stack>
          )}
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
          <Autocomplete
            options={options}
            loading={searchBusy}
            value={selected}
            getOptionLabel={(opt) => opt
              ? `${opt.name || '—'}${opt.sku ? ` · SKU ${opt.sku}` : ''}`
              : ''}
            isOptionEqualToValue={(a, b) => (a?.productId || a?.id) === (b?.productId || b?.id)}
            onInputChange={(_, v) => setQuery(v || '')}
            onChange={(_, val) => handleSelect(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Поиск товара (по названию или SKU, мин. 2 символа)"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  endAdornment: (
                    <>
                      {searchBusy && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Paper>

        {!selected && (
          <EmptyState
            title="Выберите товар"
            description="Введите название или SKU в поле выше — увидите карточку с остатками, партиями и историей операций"
          />
        )}

        {selected && cardLoading && (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <CircularProgress size={28} />
          </Paper>
        )}

        {selected && card && !cardLoading && (
          <>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{card.productName || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    SKU: <b>{card.sku || '—'}</b>
                    {card.category ? ` · Категория: ${card.category}` : ''}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  {card.abcClass && (
                    <Chip
                      label={`Класс ${card.abcClass}`}
                      color={card.abcClass === 'A' ? 'success' : card.abcClass === 'B' ? 'warning' : 'default'}
                      size="small"
                    />
                  )}
                  <Chip label={`Партий: ${batches.length}`} size="small" />
                  <Chip label={`Ячеек: ${stocks.length}`} size="small" />
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ borderRadius: 3 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab label={`Где хранится (${stocks.length})`} />
                <Tab label={`Партии (${batches.length})`} />
                <Tab label={`История операций (${operations.length})`} />
              </Tabs>

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {tab === 0 && (
                  stocks.length === 0 ? (
                    <EmptyState title="Остатков нет"
                      description={userWarehouseId
                        ? 'По этому товару нет запасов на вашем складе'
                        : 'По этому товару нет запасов ни на одной ячейке'} />
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Склад</TableCell>
                          <TableCell sx={{ minWidth: 220 }}>Ячейка</TableCell>
                          <TableCell>Партия</TableCell>
                          <TableCell>Срок до</TableCell>
                          <TableCell align="right">Кол-во</TableCell>
                          <TableCell align="right">Резерв</TableCell>
                          <TableCell>Статус</TableCell>
                          <TableCell align="right">Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stocks.map((s, idx) => {
                          const sameWh = userWarehouseId
                            && String(s.warehouseId) === String(userWarehouseId);
                          const movable = sameWh
                            && Number(s.quantity || 0) > Number(s.reservedQuantity || 0);
                          const batch = batchByIdMap.get(String(s.batchId));
                          const batchNum = s.batchNumber
                            || batch?.batchNumber
                            || (s.batchId ? String(s.batchId).slice(0, 8) + '…' : '—');
                          const expiry = s.expiryDate || batch?.expiryDate;
                          return (
                            <TableRow key={s.inventoryId || idx}>
                              <TableCell>{warehouseLabel(s.warehouseId)}</TableCell>
                              <TableCell>{cellLabel(s.cellId)}</TableCell>
                              <TableCell>{batchNum}</TableCell>
                              <TableCell>{fmtDate(expiry)}</TableCell>
                              <TableCell align="right">{s.quantity ?? 0}</TableCell>
                              <TableCell align="right">{s.reservedQuantity ?? 0}</TableCell>
                              <TableCell>
                                <Chip size="small" label={INVENTORY_STATUS_RU[s.status] || s.status || '—'} />
                              </TableCell>
                              <TableCell align="right">
                                <Tooltip title={movable
                                  ? 'Переместить вся ячейка в другую'
                                  : (sameWh
                                    ? 'Нечего перемещать (всё зарезервировано)'
                                    : 'Не ваш склад')}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      disabled={!movable}
                                      onClick={() => setTransferSource(s)}
                                    >
                                      <SwapHorizIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )
                )}

                {tab === 1 && (
                  batches.length === 0 ? (
                    <EmptyState title="Партий нет" />
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>№ партии</TableCell>
                          <TableCell>Срок до</TableCell>
                          <TableCell>Условия</TableCell>
                          <TableCell>Упаковка</TableCell>
                          <TableCell align="right">Закупочная</TableCell>
                          <TableCell>Поставщик</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batches.map((b) => (
                          <TableRow key={b.batchId}>
                            <TableCell>{b.batchNumber || '—'}</TableCell>
                            <TableCell>{fmtDate(b.expiryDate)}</TableCell>
                            <TableCell>{STORAGE_RU[b.storageConditions] || b.storageConditions || '—'}</TableCell>
                            <TableCell>{PACKAGING_RU[b.packagingType] || b.packagingType || '—'}</TableCell>
                            <TableCell align="right">{b.purchasePrice ?? '—'}</TableCell>
                            <TableCell>{b.supplier || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                )}

                {tab === 2 && (
                  operations.length === 0 ? (
                    <EmptyState title="Операций нет" description="По этому товару нет ни одной операции в логе" />
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Дата</TableCell>
                          <TableCell>Тип</TableCell>
                          <TableCell>Склад</TableCell>
                          <TableCell align="right">Кол-во</TableCell>
                          <TableCell>Откуда → Куда</TableCell>
                          <TableCell>Партия</TableCell>
                          <TableCell>Пользователь</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {operations.map((op) => {
                          const cellLine = (op.operationType === 'TRANSFER' && op.fromCellId && op.toCellId)
                            ? `${cellLabel(op.fromCellId)} → ${cellLabel(op.toCellId)}`
                            : (op.toCellId ? cellLabel(op.toCellId)
                                : (op.fromCellId ? cellLabel(op.fromCellId)
                                    : (op.cellId ? cellLabel(op.cellId) : '—')));
                          const batch = batchByIdMap.get(String(op.batchId));
                          const batchNum = op.batchNumber || batch?.batchNumber
                            || (op.batchId ? String(op.batchId).slice(0, 8) + '…' : '—');
                          return (
                            <TableRow key={op.operationId}>
                              <TableCell>{fmtDateTime(op.operationDate)}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={OPERATION_LABEL[op.operationType] || op.operationType}
                                  color={OPERATION_COLOR[op.operationType] || 'default'}
                                />
                              </TableCell>
                              <TableCell>{warehouseLabel(op.warehouseId)}</TableCell>
                              <TableCell align="right">{op.quantity ?? 0}</TableCell>
                              <TableCell>
                                <Typography variant="caption">{cellLine}</Typography>
                              </TableCell>
                              <TableCell>{batchNum}</TableCell>
                              <TableCell>{userLabel(op.userId)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )
                )}
              </Box>
            </Paper>
          </>
        )}

        <TransferDialog
          open={!!transferSource}
          onClose={() => setTransferSource(null)}
          product={selected ? { ...selected, productName: card?.productName, sku: card?.sku } : null}
          sourceStock={transferSource}
          onTransferred={() => {
            setTransferSource(null);
            if (selected) loadCard(selected);
          }}
        />
      </Box>
    </Box>
  );
};

export default ProductCardPage;
