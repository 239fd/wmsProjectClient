import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Stack, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, InputLabel, FormControl, FormHelperText,
  CircularProgress, Grid, Divider, Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser } from '../store/slices/authSlice';
import supplyService from '../services/supplyService';
import productService from '../services/productService';
import ExtractDataDialog from '../components/shared/ExtractDataDialog';
import { useWarehouses, useSuppliers } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import { TableSkeleton } from '../components/shared/LoadingSkeleton';
import { supplySchema } from '../validation/schemas';
import { enumLabel, enumColor } from '../utils/enumLabels';

const STATUS = {
  PLANNED:     { label: 'Запланирована', color: 'default' },
  IN_PROGRESS: { label: 'В пути',        color: 'info' },
  ACCEPTED:    { label: 'Принята',       color: 'success' },
  REJECTED:    { label: 'Отклонена',     color: 'error' },
  CANCELLED:   { label: 'Отменена',      color: 'default' },
};

const SuppliesPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;
  const userId = user?.userId;

  const [supplies, setSupplies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const { data: suppliers } = useSuppliers();
  const { data: warehouses } = useWarehouses();
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailBusy, setDetailBusy] = useState(false);

  useEffect(() => {
    if (user && !orgId) navigate('/main/organization?firstTime=true', { replace: true });
  }, [user, orgId, navigate]);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await supplyService.list({ page, size: rowsPerPage, sort: 'createdAt,desc' });
      setSupplies(Array.isArray(res) ? res : (res?.content || []));
      setTotal(typeof res?.totalElements === 'number' ? res.totalElements : (res?.content?.length || 0));
    } catch (err) {
      notify(err.message || 'Не удалось загрузить поставки', 'error');
      setSupplies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [orgId, page, rowsPerPage, notify]);

  useEffect(() => { load(); }, [load]);

  const filtered = supplies.filter((s) =>
    statusFilter === 'all' ? true : s.status === statusFilter
  );

  const supplierName = (id) => suppliers.find((s) => s.supplierId === id)?.name || '—';
  const warehouseName = (id) => warehouses.find((w) => (w.warehouseId || w.id) === id)?.name || '—';

  const handleStatusChange = async (supplyId, newStatus) => {
    setDetailBusy(true);
    try {
      await supplyService.setStatus(supplyId, newStatus, userId);
      notify('Статус обновлён');
      await load();
      if (detail?.supplyId === supplyId) {
        const fresh = await supplyService.get(supplyId).catch(() => null);
        if (fresh) setDetail(fresh);
      }
    } catch (err) {
      notify(err.message || 'Не удалось изменить статус', 'error');
    } finally {
      setDetailBusy(false);
    }
  };

  const handleCancel = async (supplyId) => {
    setDetailBusy(true);
    try {
      await supplyService.cancel(supplyId);
      notify('Поставка отменена');
      setDetail(null);
      await load();
    } catch (err) {
      notify(err.message || 'Не удалось отменить', 'error');
    } finally {
      setDetailBusy(false);
    }
  };

  if (!user || !orgId) return null;

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Плановые поставки</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={() => setExtractOpen(true)}
            >
              Извлечь данные
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Создать поставку
            </Button>
          </Stack>
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
            <TableSkeleton rows={5} columns={6} />
          ) : supplies.length === 0 ? (
            <EmptyState
              icon={AddIcon}
              title="Поставок пока нет"
              description="Создайте плановую поставку — отметьте её как «В пути» или «Принята» по факту получения товара"
              actionLabel="Создать поставку"
              onAction={() => setCreateOpen(true)}
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="По выбранному статусу поставок нет" sx={{ py: 6 }} />
          ) : (
            <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Поставщик</TableCell>
                    <TableCell>Склад</TableCell>
                    <TableCell>Плановая дата</TableCell>
                    <TableCell align="right">Позиций</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((s) => {
                    const stat = STATUS[s.status] || { label: s.status, color: 'default' };
                    return (
                      <TableRow key={s.supplyId} hover>
                        <TableCell>{supplierName(s.supplierId)}</TableCell>
                        <TableCell>{warehouseName(s.warehouseId)}</TableCell>
                        <TableCell>{s.expectedDate || '—'}</TableCell>
                        <TableCell align="right">{s.totalItems ?? '—'}</TableCell>
                        <TableCell>
                          <Chip label={stat.label} color={stat.color} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Открыть">
                            <IconButton size="small" onClick={() => setDetail(s)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {s.status === 'PLANNED' && (
                            <Tooltip title="Отметить как «В пути»">
                              <IconButton size="small" color="info" onClick={() => handleStatusChange(s.supplyId, 'IN_PROGRESS')}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(s.status === 'PLANNED' || s.status === 'IN_PROGRESS') && (
                            <Tooltip title="Отменить">
                              <IconButton size="small" color="error" onClick={() => handleCancel(s.supplyId)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        </Paper>

        <CreateSupplyDialog
          open={createOpen}
          onClose={() => !createBusy && setCreateOpen(false)}
          suppliers={suppliers}
          warehouses={warehouses}
          userId={userId}
          userWarehouseId={user?.warehouseId}
          busy={createBusy}
          setBusy={setCreateBusy}
          onSuccess={async () => { setCreateOpen(false); await load(); }}
          notify={notify}
        />

        <ExtractDataDialog
          open={extractOpen}
          onClose={() => setExtractOpen(false)}
          onExtracted={load}
        />

        {}
        <Dialog
          open={!!detail}
          onClose={() => !detailBusy && setDetail(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Поставка</DialogTitle>
          <DialogContent dividers>
            {detail && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">Поставщик</Typography>
                  <Typography>{supplierName(detail.supplierId)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">Склад</Typography>
                  <Typography>{warehouseName(detail.warehouseId)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Плановая дата</Typography>
                  <Typography>{detail.expectedDate || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">Фактическая дата</Typography>
                  <Typography>{detail.actualDate || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">Статус</Typography>
                  <Box>
                    <Chip
                      label={STATUS[detail.status]?.label || enumLabel('SupplyStatus', detail.status)}
                      color={STATUS[detail.status]?.color || enumColor('SupplyStatus', detail.status)}
                      size="small"
                    />
                  </Box>
                </Grid>
                {detail.notes && (
                  <Grid size={12}>
                    <Typography variant="caption" color="text.secondary">Примечания</Typography>
                    <Typography>{detail.notes}</Typography>
                  </Grid>
                )}
                <Grid size={12}>
                  <Divider sx={{ my: 1 }}><Chip label="Позиции" size="small" /></Divider>
                </Grid>
                {(detail.items || []).length === 0 ? (
                  <Grid size={12}>
                    <Typography color="text.secondary">Позиций нет</Typography>
                  </Grid>
                ) : (
                  <Grid size={12}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product ID</TableCell>
                            <TableCell align="right">Ожидается</TableCell>
                            <TableCell align="right">Фактически</TableCell>
                            <TableCell align="right">Цена ед.</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {detail.items.map((it) => (
                            <TableRow key={it.itemId}>
                              <TableCell>
                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                  {String(it.productId).slice(0, 8)}…
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{it.expectedQty ?? '—'}</TableCell>
                              <TableCell align="right">{it.actualQty ?? '—'}</TableCell>
                              <TableCell align="right">{it.unitPrice ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetail(null)} disabled={detailBusy}>Закрыть</Button>
            {detail && detail.status === 'PLANNED' && (
              <Button
                variant="contained"
                color="info"
                onClick={() => handleStatusChange(detail.supplyId, 'IN_PROGRESS')}
                disabled={detailBusy}
              >
                В путь
              </Button>
            )}
            {detail && detail.status === 'IN_PROGRESS' && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleStatusChange(detail.supplyId, 'ACCEPTED')}
                disabled={detailBusy}
              >
                Принять
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

const CreateSupplyDialog = ({ open, onClose, suppliers, warehouses, userId, userWarehouseId, busy, setBusy, onSuccess, notify }) => {
  const [productOptions, setProductOptions] = useState([]);
  const [productSearchBusy, setProductSearchBusy] = useState(false);

  const {
    register, handleSubmit, control, reset, getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(supplySchema),
    defaultValues: { supplierId: '', warehouseId: '', expectedDate: '', notes: '', items: [] },
    mode: 'onSubmit',
  });
  const itemsField = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (open) {
      reset({
        supplierId: suppliers[0]?.supplierId || '',
        warehouseId: userWarehouseId || warehouses[0]?.warehouseId || warehouses[0]?.id || '',
        expectedDate: '',
        notes: '',
        items: [],
      });
    }
  }, [open, suppliers, warehouses, userWarehouseId, reset]);

  const handleProductSearch = async (q) => {
    if (!q || q.length < 2) { setProductOptions([]); return; }
    setProductSearchBusy(true);
    try {
      const res = await productService.searchProducts(q);
      setProductOptions(Array.isArray(res) ? res : (res?.content || []));
    } catch { setProductOptions([]); }
    finally { setProductSearchBusy(false); }
  };

  const handleAddItem = (p) => {
    if (!p) return;
    const existing = getValues('items') || [];
    if (existing.some((it) => it.productId === p.productId)) {
      notify('Товар уже добавлен', 'warning');
      return;
    }
    itemsField.append({
      productId: p.productId, name: p.name, sku: p.sku,
      expectedQty: '', unitPrice: '', notes: '',
    });
  };

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      await supplyService.create({
        supplierId: values.supplierId || null,
        warehouseId: values.warehouseId,
        expectedDate: values.expectedDate || null,
        notes: values.notes || null,
        createdBy: userId,
        items: values.items.map((it) => ({
          productId: it.productId,
          expectedQty: it.expectedQty,
          unitPrice: it.unitPrice || null,
          notes: it.notes || null,
        })),
      });
      notify('Поставка создана');
      onSuccess?.();
    } catch (err) {
      notify(err.message || 'Не удалось создать поставку', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Новая поставка</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth disabled={busy || suppliers.length === 0}>
                    <InputLabel>Поставщик</InputLabel>
                    <Select
                      {...field}
                      value={field.value ?? ''}
                      label="Поставщик"
                      variant="outlined"
                      MenuProps={{ disablePortal: false }}
                    >
                      <MenuItem value="">— не указан —</MenuItem>
                      {suppliers.map((s) => (
                        <MenuItem key={s.supplierId} value={s.supplierId}>{s.name}</MenuItem>
                      ))}
                    </Select>
                    {suppliers.length === 0 && (
                      <FormHelperText>
                        Нет ни одного поставщика. Создайте поставщика в справочнике «Поставщики».
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Плановая дата"
                type="date"
                fullWidth
                disabled={busy}
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('expectedDate')}
                error={!!errors.expectedDate}
                helperText={errors.expectedDate?.message}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Примечания"
                fullWidth
                disabled={busy}
                multiline
                minRows={2}
                {...register('notes')}
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }}><Chip label="Позиции" size="small" /></Divider>
            </Grid>
            <Grid size={12}>
              <Autocomplete
                options={productOptions}
                getOptionLabel={(o) => `${o.name || ''}${o.sku ? ` (${o.sku})` : ''}`}
                loading={productSearchBusy}
                onInputChange={(_, q) => handleProductSearch(q)}
                onChange={(_, val) => handleAddItem(val)}
                renderInput={(params) => <TextField {...params} label="Добавить товар" />}
              />
              {errors.items && typeof errors.items.message === 'string' && (
                <FormHelperText error sx={{ mt: 1 }}>{errors.items.message}</FormHelperText>
              )}
            </Grid>
            {itemsField.fields.length > 0 && (
              <Grid size={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Товар</TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>Кол-во</TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>Цена ед.</TableCell>
                        <TableCell align="right" sx={{ width: 60 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {itemsField.fields.map((it, i) => (
                        <TableRow key={it.id}>
                          <TableCell>
                            <Typography variant="body2">{it.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{it.sku}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small" type="number"
                              fullWidth
                              inputProps={{ step: '0.01', min: '0' }}
                              {...register(`items.${i}.expectedQty`)}
                              error={!!errors.items?.[i]?.expectedQty}
                              helperText={errors.items?.[i]?.expectedQty?.message}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small" type="number"
                              fullWidth
                              inputProps={{ step: '0.01', min: '0' }}
                              {...register(`items.${i}.unitPrice`)}
                              error={!!errors.items?.[i]?.unitPrice}
                              helperText={errors.items?.[i]?.unitPrice?.message}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small" color="error"
                              onClick={() => itemsField.remove(i)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>Отмена</Button>
          <Button variant="contained" type="submit" disabled={busy}>
            {busy ? <CircularProgress size={20} color="inherit" /> : 'Создать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SuppliesPage;
