import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Tabs, Tab, Chip, Skeleton, Alert,
  MenuItem, Select, InputLabel, FormControl, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Stack,
  TextField, Button,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Receipt as ReceiptIcon,
  Storefront as StorefrontIcon,
  Warehouse as WarehouseIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  WarningAmber as WarningAmberIcon,
  EmojiEvents as EmojiEventsIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import analyticsService from '../services/analyticsService';
import productService from '../services/productService';
import { useWarehouses, useEmployees } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import AnalyticsReportDialog from '../components/analytics/AnalyticsReportDialog';
import { enumChipProps } from '../utils/enumLabels';

const PERIODS = [
  { value: 'week', label: 'Неделя', days: 7 },
  { value: 'month', label: 'Месяц', days: 30 },
  { value: 'quarter', label: 'Квартал', days: 90 },
  { value: 'year', label: 'Год', days: 365 },
];

const OP_TYPE = {
  RECEIPT:     { label: 'Приёмка',     color: '#2e7d32' },
  RECEIVE:     { label: 'Приёмка',     color: '#2e7d32' },
  SHIP:        { label: 'Отгрузка',    color: '#1976d2' },
  TRANSFER:    { label: 'Перемещение', color: '#9c27b0' },
  WRITEOFF:    { label: 'Списание',    color: '#d32f2f' },
  WRITE_OFF:   { label: 'Списание',    color: '#d32f2f' },
  REVALUATION: { label: 'Переоценка',  color: '#ed6c02' },
  RESERVE:     { label: 'Резерв',      color: '#0097a7' },
  RELEASE:     { label: 'Освобождение',color: '#0288d1' },
  INVENTORY:   { label: 'Инвентаризация', color: '#0288d1' },
};
const opMeta = (key) => OP_TYPE[key] || { label: key, color: '#616161' };

const ROLE_LABEL = { WORKER: 'Работник', ACCOUNTANT: 'Бухгалтер', DIRECTOR: 'Директор' };

const formatDateIso = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const dayLabelShort = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit' });
};

const formatDateTime = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return String(raw);
  }
};

const TrendBadge = ({ deltaPercent }) => {
    if (deltaPercent === null || deltaPercent === undefined) return null;
    const pct = Number(deltaPercent);
    const rounded = Math.round(pct * 10) / 10;
    let Icon, color, bg;
    if (rounded > 0) {
        Icon = TrendingUpIcon;
        color = '#2e7d32';
        bg = '#e8f5e9';
    } else if (rounded < 0) {
        Icon = TrendingDownIcon;
        color = '#d32f2f';
        bg = '#ffebee';
    } else {
        Icon = TrendingFlatIcon;
        color = '#616161';
        bg = '#f5f5f5';
    }
    const sign = rounded > 0 ? '+' : '';
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            bgcolor: bg, color, borderRadius: 1.5, px: 1, py: 0.25,
        }}>
            <Icon sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={700}>
                {sign}{rounded.toFixed(1)}%
            </Typography>
        </Box>
    );
};

const KPICard = ({ icon: Icon, label, value, color, loading, trend }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box sx={{ bgcolor: color + '20', borderRadius: 2, p: 1, display: 'inline-flex' }}>
          <Icon sx={{ color, fontSize: 26 }} />
        </Box>
        {!loading && trend !== undefined && <TrendBadge deltaPercent={trend} />}
      </Stack>
      {loading ? (
        <Skeleton variant="text" width={100} height={42} />
      ) : (
        <Typography variant="h4" fontWeight={700}>
          {value === null || value === undefined
            ? '—'
            : Number(value).toLocaleString('ru-RU')}
        </Typography>
      )}
      <Typography color="text.secondary" variant="body2">{label}</Typography>
    </CardContent>
  </Card>
);

const AnalyticsPage = () => {
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const [period, setPeriod] = useState('month');
  const [tab, setTab] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const [inventory, setInventory] = useState(null);
  const [opsDynamics, setOpsDynamics] = useState(null);
  const [warehousesSummary, setWarehousesSummary] = useState(null);
  const [opsComparison, setOpsComparison] = useState(null);
  const [invComparison, setInvComparison] = useState(null);
  const [abcDistribution, setAbcDistribution] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const dateRange = useMemo(() => {
    const days = PERIODS.find((p) => p.value === period)?.days || 30;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    return { startDate: formatDateIso(start), endDate: formatDateIso(end) };
  }, [period]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    const [inv, ops, opsCmp, invCmp, abc] = await Promise.all([
      analyticsService.getInventoryAnalytics().catch((e) => ({ __err: e.message })),
      analyticsService.getOperationsDynamics(dateRange.startDate, dateRange.endDate).catch((e) => ({ __err: e.message })),
      analyticsService.getOperationsComparison(dateRange.startDate, dateRange.endDate).catch((e) => ({ __err: e.message })),
      analyticsService.getInventoryComparison(dateRange.startDate, dateRange.endDate).catch((e) => ({ __err: e.message })),
      analyticsService.getAbcDistribution().catch((e) => ({ __err: e.message })),
    ]);

    if (inv && !inv.__err) setInventory(inv);
    else if (inv?.__err) notify(`Аналитика остатков: ${inv.__err}`, 'error');

    if (ops && !ops.__err) setOpsDynamics(ops);
    else if (ops?.__err) notify(`Динамика операций: ${ops.__err}`, 'error');

    if (opsCmp && !opsCmp.__err) setOpsComparison(opsCmp);
    else setOpsComparison(null);

    if (invCmp && !invCmp.__err) setInvComparison(invCmp);
    else setInvComparison(null);

    if (abc && !abc.__err) setAbcDistribution(abc);
    else setAbcDistribution(null);

    setOverviewLoading(false);
  }, [dateRange.startDate, dateRange.endDate, notify]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    analyticsService.getWarehousesOrgSummary(orgId)
      .then((whs) => { if (!cancelled && whs) setWarehousesSummary(whs); })
      .catch((e) => notify(`Сводка по складам: ${e.message}`, 'error'));
    return () => { cancelled = true; };
  }, [orgId, notify]);

  const totalOpsInPeriod = useMemo(() => {
    if (!opsDynamics?.operationsByType) return null;
    return Object.values(opsDynamics.operationsByType).reduce((s, v) => s + Number(v || 0), 0);
  }, [opsDynamics]);

  return (
    <Box sx={{ width: '100%', pt: 4, pb: 6, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4" fontWeight={700}>Аналитика и отчётность</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={() => setReportDialogOpen(true)}
            >
              Сформировать отчёт
            </Button>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Период</InputLabel>
              <Select
                value={period}
                label="Период"
                variant="outlined"
                onChange={(e) => setPeriod(e.target.value)}
              >
                {PERIODS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KPICard
              icon={InventoryIcon}
              label="Всего на складах"
              value={inventory?.totalQuantity}
              color="#1976d2"
              loading={overviewLoading}
              trend={invComparison?.totalQuantityTrendPercent}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KPICard
              icon={TrendingUpIcon}
              label="Уникальных позиций"
              value={inventory?.uniqueProducts}
              color="#2e7d32"
              loading={overviewLoading}
              trend={invComparison?.uniqueProductsTrendPercent}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KPICard
              icon={ReceiptIcon}
              label={`Операции · ${PERIODS.find((p) => p.value === period)?.label.toLowerCase()}`}
              value={totalOpsInPeriod}
              color="#ed6c02"
              loading={overviewLoading}
              trend={opsComparison?.deltaPercent}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KPICard
              icon={StorefrontIcon}
              label="Доступно"
              value={inventory?.availableQuantity}
              color="#9c27b0"
              loading={overviewLoading}
              trend={invComparison?.availableQuantityTrendPercent}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
            <KPICard
              icon={HistoryIcon}
              label="Зарезервировано"
              value={inventory?.reservedQuantity}
              color="#d32f2f"
              loading={overviewLoading}
              trend={invComparison?.reservedQuantityTrendPercent}
            />
          </Grid>
        </Grid>

        {}
        <Paper sx={{ borderRadius: 3, mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab label="Обзор" />
            <Tab label="Операции" />
            <Tab label="Сотрудники" />
            <Tab label="Склады" />
            <Tab label="Запасы" />
          </Tabs>

          {tab === 0 && (
            <OverviewTab
              loading={overviewLoading}
              warehousesSummary={warehousesSummary}
              opsDynamics={opsDynamics}
              abcDistribution={abcDistribution}
              periodLabel={PERIODS.find((p) => p.value === period)?.label}
            />
          )}
          {tab === 1 && (
            <OperationsTab dateRange={dateRange} />
          )}
          {tab === 2 && (
            <EmployeesTab orgId={orgId} opsDynamics={opsDynamics} />
          )}
          {tab === 3 && (
            <WarehousesTab warehousesSummary={warehousesSummary} loading={overviewLoading} />
          )}
          {tab === 4 && (
            <ExpiringProductsTab />
          )}
        </Paper>
      </Box>
      <AnalyticsReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </Box>
  );
};

const ABC_COLORS = { A: '#2e7d32', B: '#ed6c02', C: '#9e9e9e' };

const AbcDonutCard = ({ data, loading }) => {
  const counts = data?.productCountByClass || {};
  const qty = data?.quantityByClass || {};
  const totalProducts = Number(data?.totalProducts || 0);
  const segments = useMemo(() => {
    if (!totalProducts) return [];
    let offset = 0;
    return ['A', 'B', 'C'].map((cls) => {
      const c = Number(counts[cls] || 0);
      const pct = totalProducts > 0 ? c / totalProducts : 0;
      const seg = { cls, count: c, pct, offset, dashLen: pct * 100, color: ABC_COLORS[cls] };
      offset += pct * 100;
      return seg;
    });
  }, [counts, totalProducts]);

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Typography variant="subtitle1" fontWeight={700} mb={2}>ABC-распределение товаров</Typography>
      {loading ? (
        <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto' }} />
      ) : totalProducts === 0 ? (
        <EmptyState title="Нет данных для ABC" sx={{ py: 4 }} />
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <Box sx={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" width="100%" height="100%">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f0f0f0" strokeWidth="3.5" />
              {segments.map((s) => (
                <circle
                  key={s.cls}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="3.5"
                  strokeDasharray={`${s.dashLen} ${100 - s.dashLen}`}
                  strokeDashoffset={-s.offset}
                  transform="rotate(-90 18 18)"
                />
              ))}
            </svg>
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography variant="h5" fontWeight={700}>{totalProducts}</Typography>
              <Typography variant="caption" color="text.secondary">позиций</Typography>
            </Box>
          </Box>
          <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
            {segments.map((s) => (
              <Box key={s.cls}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 12, height: 12, bgcolor: s.color, borderRadius: 0.5 }} />
                    <Typography variant="body2" fontWeight={600}>
                      Категория {s.cls}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={700}>
                    {s.count} ({Math.round(s.pct * 100)}%)
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Остаток: {Number(qty[s.cls] || 0).toLocaleString('ru-RU')}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      )}
    </Paper>
  );
};

const OverviewTab = ({ loading, warehousesSummary, opsDynamics, abcDistribution, periodLabel }) => {

  const warehousesList = useMemo(() => {
    if (!warehousesSummary) return null;
    if (Array.isArray(warehousesSummary)) return warehousesSummary;
    if (Array.isArray(warehousesSummary.warehouses)) return warehousesSummary.warehouses;
    return null;
  }, [warehousesSummary]);

  const opsByType = useMemo(() => {
    if (!opsDynamics?.operationsByType) return [];
    const total = Object.values(opsDynamics.operationsByType).reduce((s, v) => s + Number(v || 0), 0) || 1;
    return Object.entries(opsDynamics.operationsByType)
      .map(([type, count]) => {
        const meta = opMeta(type);
        return {
          type,
          label: meta.label,
          color: meta.color,
          count: Number(count),
          percentage: Math.round((Number(count) / total) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [opsDynamics]);

  const dailyOps = useMemo(() => {
    if (!opsDynamics?.dailyOperations) return [];
    return Object.entries(opsDynamics.dailyOperations)
      .map(([date, count]) => ({ date, count: Number(count) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [opsDynamics]);

  const maxDaily = useMemo(() => Math.max(...dailyOps.map((d) => d.count), 1), [dailyOps]);

  return (
    <Box sx={{ p: 3 }}>
      {}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Эффективность складов</Typography>
          {loading ? (
            <Grid container spacing={2}>
              {[0, 1, 2].map((i) => (
                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                  <Skeleton variant="rounded" height={140} />
                </Grid>
              ))}
            </Grid>
          ) : !warehousesList || warehousesList.length === 0 ? (
            <EmptyState title="Нет данных о складах" sx={{ py: 4 }} />
          ) : (
            <Grid container spacing={2}>
              {warehousesList.map((w, i) => {
                const structure = w.structure || {};
                const fill = Number(structure.utilizationPercent ?? w.fillPercentage ?? w.utilization ?? 0);
                const occupied = structure.occupiedSlots ?? w.occupiedCells;
                const total = structure.totalSlots ?? w.totalCells;
                const racksCount = structure.racksCount ?? w.racksCount;
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={w.warehouseId || w.id || i}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                          <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', p: 1, borderRadius: 2, display: 'inline-flex' }}>
                            <WarehouseIcon />
                          </Box>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>{w.name || '—'}</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Стеллажей</Typography>
                            <Typography variant="body2" fontWeight={600}>{racksCount ?? '—'}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">Ячеек занято</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {occupied ?? '—'}{total != null ? ` / ${total}` : ''}
                            </Typography>
                          </Stack>
                          <Box>
                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                              <Typography variant="body2" color="text.secondary">Утилизация</Typography>
                              <Typography variant="body2" fontWeight={700}>{fill}%</Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(fill, 100)}
                              sx={{ height: 8, borderRadius: 1 }}
                              color={fill > 90 ? 'error' : fill > 70 ? 'warning' : 'primary'}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <AbcDonutCard data={abcDistribution} loading={loading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>Операции по типам</Typography>
            <Typography variant="caption" color="text.secondary" mb={2} display="block">
              За {(periodLabel || '').toLowerCase()}
            </Typography>
            {loading ? (
              <Stack spacing={2}>
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={32} />)}
              </Stack>
            ) : opsByType.length === 0 ? (
              <EmptyState title="За период операций нет" sx={{ py: 4 }} />
            ) : (
              <Stack spacing={2}>
                {opsByType.map((op) => (
                  <Box key={op.type}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{op.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {op.count} ({op.percentage}%)
                      </Typography>
                    </Stack>
                    <Box sx={{ position: 'relative', height: 8, bgcolor: '#f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${op.percentage}%`,
                        bgcolor: op.color,
                        transition: 'width 0.5s ease',
                      }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>Загруженность по дням</Typography>
            {loading ? (
              <Stack spacing={1}>
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={28} />)}
              </Stack>
            ) : dailyOps.length === 0 ? (
              <EmptyState title="Нет данных за период" sx={{ py: 4 }} />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflowY: 'auto' }}>
                {dailyOps.map((d) => {
                  const pct = (d.count / maxDaily) * 100;
                  return (
                    <Box key={d.date} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ minWidth: 90, fontSize: 13, color: 'text.secondary' }}>
                        {dayLabelShort(d.date)}
                      </Typography>
                      <Box sx={{ flex: 1, position: 'relative', height: 24, bgcolor: '#f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{
                          position: 'absolute', left: 0, top: 0, height: '100%',
                          width: `${pct}%`,
                          minWidth: d.count > 0 ? 24 : 0,
                          bgcolor: '#1976d2',
                          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                          px: 1,
                          transition: 'width 0.5s ease',
                        }}>
                          <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
                            {d.count > 0 ? d.count : ''}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const OperationsTab = ({ dateRange }) => {
  const { data: warehouses } = useWarehouses();
  const { notify } = useSnackbar();

  const [typeFilter, setTypeFilter] = useState('');
  const [whFilter, setWhFilter] = useState('');
  const [ops, setOps] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: rowsPerPage, sort: 'createdAt,desc' };
      if (typeFilter) params.type = typeFilter;
      if (whFilter) params.warehouseId = whFilter;
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;
      const data = await productService.getOperationsHistory(params);
      const arr = Array.isArray(data) ? data : (data?.content || []);
      setOps(arr);
      setTotal(typeof data?.totalElements === 'number' ? data.totalElements : arr.length);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить операции', 'error');
      setOps([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, whFilter, dateRange?.startDate, dateRange?.endDate, page, rowsPerPage, notify]);

  useEffect(() => { setPage(0); }, [typeFilter, whFilter, dateRange?.startDate, dateRange?.endDate]);

  useEffect(() => { load(); }, [load]);

  const warehouseName = (id) => warehouses.find((w) => (w.warehouseId || w.id) === id)?.name || '—';

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap" useFlexGap>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Тип операции</InputLabel>
          <Select
            value={typeFilter}
            label="Тип операции"
            variant="outlined"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">Все типы</MenuItem>
            {Object.entries(OP_TYPE).filter(([k]) => !['RECEIVE', 'WRITEOFF'].includes(k)).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Склад</InputLabel>
          <Select
            value={whFilter}
            label="Склад"
            variant="outlined"
            onChange={(e) => setWhFilter(e.target.value)}
          >
            <MenuItem value="">Все склады</MenuItem>
            {warehouses.map((w) => (
              <MenuItem key={w.warehouseId || w.id} value={w.warehouseId || w.id}>
                {w.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Обновить
        </Button>
        <Box sx={{ flex: 1 }} />
        {!loading && ops && (
          <Typography variant="body2" color="text.secondary">
            Найдено: <b>{total}</b>
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={40} />)}
        </Stack>
      ) : !ops || ops.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="Операций по фильтрам не найдено"
          description="Попробуйте сбросить фильтры или расширить период"
        />
      ) : (
        <>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 560 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Склад</TableCell>
                <TableCell>Товар</TableCell>
                <TableCell align="right">Количество</TableCell>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Operation ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ops.map((op, i) => {
                const meta = opMeta(op.operationType || op.type);
                return (
                  <TableRow key={op.operationId || i} hover>
                    <TableCell>{formatDateTime(op.createdAt || op.operationDate || op.timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        label={meta.label}
                        size="small"
                        sx={{ bgcolor: meta.color + '15', color: meta.color, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{warehouseName(op.warehouseId)}</TableCell>
                    <TableCell>{op.productName || (op.productId ? String(op.productId).slice(0, 8) + '…' : '—')}</TableCell>
                    <TableCell align="right">{op.quantity ?? '—'}</TableCell>
                    <TableCell>{op.userName || (op.userId ? String(op.userId).slice(0, 8) + '…' : '—')}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {op.operationId ? String(op.operationId).slice(0, 8) + '…' : '—'}
                      </Typography>
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
    </Box>
  );
};

const EmployeesTab = ({ orgId, opsDynamics }) => {
  const user = useSelector(selectUser);
  const isDirector = user?.role === 'DIRECTOR';
  const { data: employees } = useEmployees();
  const { notify } = useSnackbar();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const topActive = useMemo(() => {
    const byUser = opsDynamics?.operationsByUser;
    if (!byUser || typeof byUser !== 'object') return [];
    return Object.entries(byUser)
      .map(([uid, count]) => ({ userId: uid, count: Number(count || 0) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [opsDynamics]);

  const empByUserId = useMemo(() => {
    const m = new Map();
    employees.forEach((e) => m.set(e.userId, e));
    return m;
  }, [employees]);

  const load = useCallback(async () => {
    if (!orgId || !isDirector) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await analyticsService.getEmployeesAnalytics(orgId);
      const arr = Array.isArray(data) ? data : (data?.employees || []);
      setAnalytics(arr);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить аналитику сотрудников', 'error');
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, isDirector, notify]);

  useEffect(() => { load(); }, [load]);

  const empMap = useMemo(() => {
    const m = new Map();
    employees.forEach((e) => m.set(e.userId, e));
    return m;
  }, [employees]);

  const sortedAnalytics = useMemo(() => {
    if (!analytics) return [];
    const arr = [...analytics];
    arr.sort((a, b) => Number(b.daysWorked || 0) - Number(a.daysWorked || 0));
    return arr;
  }, [analytics]);

  if (!isDirector) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Аналитика по сотрудникам доступна только директору.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={600}>Аналитика по сотрудникам</Typography>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Обновить
        </Button>
      </Stack>

      {topActive.length > 0 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
            <Box sx={{ bgcolor: '#fff3e0', color: '#ed6c02', p: 1, borderRadius: 2, display: 'inline-flex' }}>
              <EmojiEventsIcon />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Топ-5 активных за период
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {topActive.map((u, idx) => {
              const emp = empByUserId.get(u.userId);
              const max = topActive[0]?.count || 1;
              const pct = (u.count / max) * 100;
              return (
                <Box key={u.userId}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{
                        bgcolor: idx === 0 ? '#fff3e0' : '#f5f5f5',
                        color: idx === 0 ? '#ed6c02' : '#616161',
                        width: 24, height: 24, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13,
                      }}>{idx + 1}</Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {emp?.fullName || emp?.username || (u.userId ? String(u.userId).slice(0, 8) + '…' : '—')}
                        </Typography>
                        {emp?.role && (
                          <Typography variant="caption" color="text.secondary">
                            {ROLE_LABEL[emp.role] || emp.role}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>
                      {u.count} оп.
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 6, bgcolor: '#f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{
                      width: `${pct}%`, height: '100%',
                      bgcolor: idx === 0 ? '#ed6c02' : '#1976d2',
                      transition: 'width 0.5s ease',
                    }} />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}

      {loading ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={48} />)}
        </Stack>
      ) : !sortedAnalytics || sortedAnalytics.length === 0 ? (
        <EmptyState title="Нет данных по сотрудникам" />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell align="right">В компании</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAnalytics.map((a) => {
                const emp = empMap.get(a.userId);
                return (
                  <TableRow key={a.userId}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {emp?.username || (a.userId ? String(a.userId).slice(0, 8) + '…' : '—')}
                      </Typography>
                      {emp?.email && (
                        <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={ROLE_LABEL[a.role] || a.role} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {a.daysWorked != null ? `${a.daysWorked} дн.` : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

const STORAGE_CONDITION_LABEL = {
  ROOM: 'Комнатная (15…25°C)',
  COOL: 'Прохладный (5…15°C)',
  FRIDGE: 'Холодильник (0…5°C)',
  FREEZER: 'Морозильник (-18…-24°C)',
};

const RACK_KIND_LABEL = {
  SHELF: 'Полочный',
  CELL: 'Ячеистый',
  PALLET: 'Паллетный',
};

const RackStructureBlock = ({ structure }) => {
  if (!structure) return null;
  const racksByKind = structure.racksByKind || {};
  const racksByConditions = structure.racksByStorageConditions || {};
  const kindEntries = Object.entries(racksByKind).filter(([, v]) => v > 0);
  const condEntries = Object.entries(racksByConditions).filter(([, v]) => v > 0);

  return (
    <Box sx={{ mt: 2 }}>
      {kindEntries.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">Типы стеллажей</Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
            {kindEntries.map(([k, v]) => (
              <Chip key={k} size="small" variant="outlined"
                    label={`${RACK_KIND_LABEL[k] || k}: ${v}`} sx={{ mb: 0.5 }} />
            ))}
          </Stack>
        </Box>
      )}
      {condEntries.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary">Температурные зоны</Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
            {condEntries.map(([c, v]) => (
              <Chip key={c} size="small"
                    color={c === 'FRIDGE' || c === 'FREEZER' ? 'info' : 'default'}
                    label={`${STORAGE_CONDITION_LABEL[c] || c}: ${v}`} sx={{ mb: 0.5 }} />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

const WarehousesTab = ({ warehousesSummary, loading }) => {
  const warehousesList = useMemo(() => {
    if (!warehousesSummary) return null;
    if (Array.isArray(warehousesSummary)) return warehousesSummary;
    if (Array.isArray(warehousesSummary.warehouses)) return warehousesSummary.warehouses;
    return null;
  }, [warehousesSummary]);

  const aggregated = useMemo(() => {
    if (!warehousesList) return null;
    const total = warehousesList.reduce((acc, w) => {
      const s = w.structure || {};
      acc.racks += Number(s.racksCount || 0);
      acc.totalSlots += Number(s.totalSlots || 0);
      acc.occupiedSlots += Number(s.occupiedSlots || 0);
      return acc;
    }, { racks: 0, totalSlots: 0, occupiedSlots: 0 });
    total.utilizationPercent = total.totalSlots > 0
      ? Math.round((total.occupiedSlots / total.totalSlots) * 1000) / 10
      : 0;
    return total;
  }, [warehousesList]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>Детализация по складам</Typography>
      {loading ? (
        <Grid container spacing={2}>
          {[0, 1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <Skeleton variant="rounded" height={260} />
            </Grid>
          ))}
        </Grid>
      ) : !warehousesList || warehousesList.length === 0 ? (
        <EmptyState icon={WarehouseIcon} title="Нет складов" />
      ) : (
        <>
          {aggregated && (
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 3, bgcolor: '#f5f7fa' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Сводка по сети складов
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Складов</Typography>
                    <Typography variant="h6" fontWeight={700}>{warehousesList.length}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Стеллажей</Typography>
                    <Typography variant="h6" fontWeight={700}>{aggregated.racks}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Ячеек занято</Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {aggregated.occupiedSlots} / {aggregated.totalSlots}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Утилизация</Typography>
                    <Typography variant="h6" fontWeight={700}>{aggregated.utilizationPercent}%</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          <Grid container spacing={2}>
            {warehousesList.map((w, i) => {
              const structure = w.structure || {};
              const fill = Number(structure.utilizationPercent ?? w.fillPercentage ?? w.utilization ?? 0);
              const occupied = structure.occupiedSlots ?? w.occupiedCells ?? w.usedCells;
              const total = structure.totalSlots ?? w.totalCells;
              const racksCount = structure.racksCount ?? w.racksCount;
              const id = w.warehouseId || w.id || i;
              return (
                <Grid size={{ xs: 12, md: 6 }} key={id}>
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                        <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', p: 1, borderRadius: 2, display: 'inline-flex' }}>
                          <WarehouseIcon />
                        </Box>
                        <Stack flex={1} minWidth={0}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>{w.name || '—'}</Typography>
                          {w.address && (
                            <Typography variant="caption" color="text.secondary" noWrap>{w.address}</Typography>
                          )}
                        </Stack>
                        <Chip
                          label={`${fill}%`}
                          size="small"
                          color={fill > 90 ? 'error' : fill > 70 ? 'warning' : 'success'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                      <Box mb={2}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(fill, 100)}
                          sx={{ height: 10, borderRadius: 1 }}
                          color={fill > 90 ? 'error' : fill > 70 ? 'warning' : 'primary'}
                        />
                      </Box>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Стеллажей</Typography>
                          <Typography variant="body2" fontWeight={700}>{racksCount ?? '—'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Ячеек занято</Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {occupied ?? '—'}{total != null && ` / ${total}`}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Уникальных товаров</Typography>
                          <Typography variant="body2" fontWeight={700}>{w.uniqueProducts ?? '—'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Операций · месяц</Typography>
                          <Typography variant="body2" fontWeight={700}>{w.monthlyOperations ?? w.operationsLast30Days ?? '—'}</Typography>
                        </Grid>
                      </Grid>
                      <RackStructureBlock structure={structure} />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}
    </Box>
  );
};

const URGENCY_META = {
  EXPIRED: { label: 'Просрочено', color: '#d32f2f', bg: '#ffebee' },
  CRITICAL: { label: '≤ 7 дней', color: '#ed6c02', bg: '#fff3e0' },
  WARNING: { label: '≤ 14 дней', color: '#f9a825', bg: '#fffde7' },
  INFO: { label: '> 14 дней', color: '#1976d2', bg: '#e3f2fd' },
};

const ExpiringProductsTab = () => {
  const { notify } = useSnackbar();
  const [withinDays, setWithinDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const arr = await analyticsService.getExpiringProducts(withinDays);
      setData(Array.isArray(arr) ? arr : []);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить список товаров с истекающим сроком', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [withinDays, notify]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const s = { EXPIRED: 0, CRITICAL: 0, WARNING: 0, INFO: 0 };
    (data || []).forEach((r) => { s[r.urgency] = (s[r.urgency] || 0) + 1; });
    return s;
  }, [data]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" useFlexGap>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ bgcolor: '#ffebee', color: '#d32f2f', p: 1, borderRadius: 2, display: 'inline-flex' }}>
            <ScheduleIcon />
          </Box>
          <Typography variant="h6" fontWeight={600}>Товары с истекающим сроком (FEFO-риски)</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Окно (дней)"
            size="small"
            type="number"
            value={withinDays}
            onChange={(e) => setWithinDays(Math.max(0, Math.min(3650, Number(e.target.value) || 0)))}
            sx={{ width: 130 }}
            inputProps={{ min: 0, max: 3650 }}
          />
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Обновить
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} mb={3}>
        {['EXPIRED', 'CRITICAL', 'WARNING', 'INFO'].map((key) => {
          const m = URGENCY_META[key];
          return (
            <Grid size={{ xs: 6, md: 3 }} key={key}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: m.bg }}>
                <CardContent>
                  <Typography variant="caption" sx={{ color: m.color, fontWeight: 700, textTransform: 'uppercase' }}>
                    {m.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ color: m.color }}>
                    {loading ? '…' : stats[key]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {loading ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={40} />)}
        </Stack>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={WarningAmberIcon}
          title="Нет товаров с истекающим сроком в указанном окне"
          description="Увеличьте «окно дней» или дождитесь поступлений с короткими сроками"
        />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Срочность</TableCell>
                <TableCell>Товар</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Партия</TableCell>
                <TableCell>Срок годности</TableCell>
                <TableCell align="right">Дней осталось</TableCell>
                <TableCell align="right">Остаток</TableCell>
                <TableCell>Условия хранения</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((r, i) => {
                const meta = URGENCY_META[r.urgency] || URGENCY_META.INFO;
                return (
                  <TableRow key={r.batchId || i} hover>
                    <TableCell>
                      <Chip
                        size="small"
                        label={meta.label}
                        sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{r.productName || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {r.sku || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.batchNumber || '—'}</TableCell>
                    <TableCell>
                      {r.expiryDate
                        ? new Date(r.expiryDate).toLocaleDateString('ru-RU')
                        : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: meta.color, fontWeight: 700 }}>
                      {r.daysLeft != null ? r.daysLeft : '—'}
                    </TableCell>
                    <TableCell align="right">
                      {r.quantity != null ? Number(r.quantity).toLocaleString('ru-RU') : '—'}
                    </TableCell>
                    <TableCell>
                      {r.storageConditions ? (
                        <Chip size="small" variant="outlined" {...enumChipProps('StorageConditions', r.storageConditions)} />
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AnalyticsPage;
