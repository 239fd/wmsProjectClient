import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent, Tabs, Tab, Chip, Skeleton, Alert,
  MenuItem, Select, InputLabel, FormControl, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack,
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
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import analyticsService from '../services/analyticsService';
import productService from '../services/productService';
import { useWarehouses, useEmployees } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';

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

  const [inventory, setInventory] = useState(null);
  const [opsDynamics, setOpsDynamics] = useState(null);
  const [warehousesSummary, setWarehousesSummary] = useState(null);
  const [opsComparison, setOpsComparison] = useState(null);
  const [invComparison, setInvComparison] = useState(null);
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
    const tasks = [
      analyticsService.getInventoryAnalytics().catch((e) => ({ __err: e.message })),
      analyticsService.getOperationsDynamics(dateRange.startDate, dateRange.endDate).catch((e) => ({ __err: e.message })),
      analyticsService.getOperationsComparison(dateRange.startDate, dateRange.endDate).catch((e) => ({ __err: e.message })),
      analyticsService.getInventoryComparison(dateRange.startDate, dateRange.endDate).catch((e) => ({ __err: e.message })),
    ];
    if (orgId) {
      tasks.push(analyticsService.getWarehousesOrgSummary(orgId).catch((e) => ({ __err: e.message })));
    } else {
      tasks.push(Promise.resolve(null));
    }
    const [inv, ops, opsCmp, invCmp, whs] = await Promise.all(tasks);

    if (inv && !inv.__err) setInventory(inv);
    else if (inv?.__err) notify(`Аналитика остатков: ${inv.__err}`, 'error');

    if (ops && !ops.__err) setOpsDynamics(ops);
    else if (ops?.__err) notify(`Динамика операций: ${ops.__err}`, 'error');

    if (opsCmp && !opsCmp.__err) setOpsComparison(opsCmp);
    else setOpsComparison(null);

    if (invCmp && !invCmp.__err) setInvComparison(invCmp);
    else setInvComparison(null);

    if (whs && !whs.__err) setWarehousesSummary(whs);

    setOverviewLoading(false);
  }, [dateRange.startDate, dateRange.endDate, orgId, notify]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const totalOpsInPeriod = useMemo(() => {
    if (!opsDynamics?.operationsByType) return null;
    return Object.values(opsDynamics.operationsByType).reduce((s, v) => s + Number(v || 0), 0);
  }, [opsDynamics]);

  return (
    <Box sx={{ width: '100%', pt: 4, pb: 6, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Аналитика и отчётность</Typography>
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

        {}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard
              icon={InventoryIcon}
              label="Всего на складах"
              value={inventory?.totalQuantity}
              color="#1976d2"
              loading={overviewLoading}
              trend={invComparison?.totalQuantityTrendPercent}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard
              icon={TrendingUpIcon}
              label="Уникальных позиций"
              value={inventory?.uniqueProducts}
              color="#2e7d32"
              loading={overviewLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard
              icon={ReceiptIcon}
              label={`Операции · ${PERIODS.find((p) => p.value === period)?.label.toLowerCase()}`}
              value={totalOpsInPeriod}
              color="#ed6c02"
              loading={overviewLoading}
              trend={opsComparison?.deltaPercent}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KPICard
              icon={StorefrontIcon}
              label="Доступно"
              value={inventory?.availableQuantity}
              color="#9c27b0"
              loading={overviewLoading}
              trend={invComparison?.availableQuantityTrendPercent}
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
          </Tabs>

          {tab === 0 && (
            <OverviewTab
              loading={overviewLoading}
              warehousesSummary={warehousesSummary}
              opsDynamics={opsDynamics}
              periodLabel={PERIODS.find((p) => p.value === period)?.label}
            />
          )}
          {tab === 1 && (
            <OperationsTab dateRange={dateRange} />
          )}
          {tab === 2 && (
            <EmployeesTab orgId={orgId} />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

const OverviewTab = ({ loading, warehousesSummary, opsDynamics, periodLabel }) => {

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
      <Typography variant="h6" fontWeight={600} mb={2}>Эффективность складов</Typography>
      {loading ? (
        <Grid container spacing={2} mb={4}>
          {[0, 1, 2].map((i) => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      ) : !warehousesList || warehousesList.length === 0 ? (
        <Box mb={4}>
          <EmptyState title="Нет данных о складах" sx={{ py: 4 }} />
        </Box>
      ) : (
        <Grid container spacing={2} mb={4}>
          {warehousesList.map((w, i) => {
            const fill = Number(w.fillPercentage ?? w.utilization ?? 0);
            return (
              <Grid size={{ xs: 12, md: 4 }} key={w.warehouseId || w.id || i}>
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                      <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', p: 1, borderRadius: 2, display: 'inline-flex' }}>
                        <WarehouseIcon />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {w.name || '—'}
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Уникальных товаров</Typography>
                        <Typography variant="body2" fontWeight={600}>{w.uniqueProducts ?? '—'}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Объём</Typography>
                        <Typography variant="body2" fontWeight={600}>{w.totalQuantity ?? '—'}</Typography>
                      </Stack>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" color="text.secondary">Заполненность</Typography>
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (whFilter) params.warehouseId = whFilter;
      if (dateRange?.startDate) params.startDate = dateRange.startDate;
      if (dateRange?.endDate) params.endDate = dateRange.endDate;
      const data = await productService.getOperationsHistory(params);
      const arr = Array.isArray(data) ? data : (data?.content || []);
      arr.sort((a, b) => new Date(b.createdAt || b.operationDate || 0) - new Date(a.createdAt || a.operationDate || 0));
      setOps(arr);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить операции', 'error');
      setOps([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, whFilter, dateRange?.startDate, dateRange?.endDate, notify]);

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
            Найдено: <b>{ops.length}</b>
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
      )}
    </Box>
  );
};

const EmployeesTab = ({ orgId }) => {
  const user = useSelector(selectUser);
  const isDirector = user?.role === 'DIRECTOR';
  const { data: employees } = useEmployees();
  const { notify } = useSnackbar();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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
    arr.sort((a, b) => {
      const aOps = Number(a.operationsStats?.totalOperations || 0);
      const bOps = Number(b.operationsStats?.totalOperations || 0);
      return bOps - aOps;
    });
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
                <TableCell align="right">Всего операций</TableCell>
                <TableCell>Разбивка по типам</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAnalytics.map((a) => {
                const emp = empMap.get(a.userId);
                const stats = a.operationsStats || {};
                const total = Number(stats.totalOperations || 0);
                const breakdown = stats.byType || stats.operationsByType || null;
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
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={total > 0 ? 700 : 400}>
                        {total}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {breakdown && typeof breakdown === 'object' && Object.keys(breakdown).length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {Object.entries(breakdown).map(([type, count]) => {
                            const meta = opMeta(type);
                            return (
                              <Chip
                                key={type}
                                label={`${meta.label}: ${count}`}
                                size="small"
                                sx={{ bgcolor: meta.color + '15', color: meta.color }}
                              />
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
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
