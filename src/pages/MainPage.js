import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardActionArea, Stack, Chip, Skeleton, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import BusinessIcon from '@mui/icons-material/Business';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import { useWarehouses, useEmployees, useSuppliers } from '../hooks';
import shipRequestService from '../services/shipRequestService';
import productService from '../services/productService';

const MAX_WIDTH = 1440;
const ACTIVE_SESSION_KEY = (userId) => `wms_inventory_active_${userId}`;

const ALL_ACTIONS = [
  { key: 'receive',     label: 'Поставки и приёмка', desc: 'Плановые поставки и приёмка', path: '/main/receive',     icon: CallReceivedIcon, color: '#2e7d32', allowed: ['WORKER'] },
  { key: 'ship',        label: 'Отгрузка',         desc: 'Заявки на отгрузку',            path: '/main/ship',        icon: LocalShippingIcon, color: '#1976d2', allowed: ['WORKER'] },
  { key: 'inventory',   label: 'Инвентаризация',   desc: 'Активная сессия и записи',      path: '/main/inventory',   icon: AssignmentIcon, color: '#0288d1', allowed: ['ACCOUNTANT'] },
  { key: 'revaluation', label: 'Переоценка',       desc: 'Изменение учётной цены',        path: '/main/revaluation', icon: EditIcon, color: '#ed6c02', allowed: ['ACCOUNTANT'] },
  { key: 'writeoff',    label: 'Списание',         desc: 'Списать товар по причине',      path: '/main/writeoff',    icon: RemoveCircleOutlineIcon, color: '#d32f2f', allowed: ['ACCOUNTANT'] },
  { key: 'analytics',   label: 'Аналитика',        desc: 'KPI и динамика операций',       path: '/main/analytics',   icon: AssessmentIcon, color: '#9c27b0', allowed: ['DIRECTOR'] },
  { key: 'suppliers',   label: 'Поставщики',       desc: 'Справочник поставщиков',        path: '/main/suppliers',   icon: StorefrontIcon, color: '#5d4037', allowed: ['WORKER'] },
  { key: 'product-card',label: 'Карточка товара',  desc: 'Где хранится, лог операций, перемещение', path: '/main/product-card', icon: InventoryIcon, color: '#1976d2', allowed: ['WORKER'] },
  { key: 'documents',   label: 'Документы',        desc: 'История и скачивание актов',    path: '/main/documents',   icon: DescriptionIcon, color: '#455a64', allowed: ['WORKER', 'ACCOUNTANT'] },
  { key: 'employees',   label: 'Сотрудники',       desc: 'Управление и приглашения',      path: '/main/employees',   icon: GroupIcon, color: '#6d4c41', allowed: ['DIRECTOR'] },
  { key: 'organization',label: 'Организация',      desc: 'Реквизиты и склады',            path: '/main/organization',icon: BusinessIcon, color: '#37474f', allowed: ['DIRECTOR'] },
];

const ROLE_LABEL = { WORKER: 'Кладовщик', ACCOUNTANT: 'Бухгалтер', DIRECTOR: 'Заведующий' };

const OP_TYPE_LABEL = {
  RECEIPT: 'Приёмка',
  SHIP: 'Отгрузка',
  SHIPMENT: 'Отгрузка',
  STAGING: 'Размещение',
  TRANSFER: 'Перемещение',
  WRITE_OFF: 'Списание',
  WRITEOFF: 'Списание',
  REVALUATION: 'Переоценка',
  INVENTORY: 'Инвентаризация',
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

const firstName = (user) => {
  if (!user) return 'Гость';
  if (user.firstName) return user.firstName;
  if (user.fullName) return String(user.fullName).split(' ')[1] || String(user.fullName).split(' ')[0];
  return 'Гость';
};

const formatDate = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return String(raw);
  }
};

const StatCard = ({ label, value, icon: Icon, color, loading, onClick, hint }) => (
  <Card
    variant="outlined"
    sx={{
      height: '100%',
      borderRadius: 3,
      transition: 'transform 0.15s, box-shadow 0.15s',
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : undefined,
    }}
  >
    <CardActionArea onClick={onClick} disabled={!onClick} sx={{ height: '100%', p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{
          bgcolor: color + '15',
          color,
          width: 48, height: 48,
          borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Skeleton width={60} height={32} />
          ) : (
            <Typography variant="h5" fontWeight={700}>
              {value === null || value === undefined ? '—' : Number(value).toLocaleString('ru-RU')}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" noWrap>
            {label}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardActionArea>
  </Card>
);

const RecentOpsTable = ({ ops, loading, title, emptyText }) => (
  <Paper sx={{ p: 3, borderRadius: 3 }}>
    <Typography variant="h6" fontWeight={600} mb={2}>{title}</Typography>
    {loading ? (
      <Stack spacing={1}>
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={32} />)}
      </Stack>
    ) : !ops || ops.length === 0 ? (
      <Typography variant="body2" color="text.secondary">{emptyText || 'Операций пока нет'}</Typography>
    ) : (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>Товар</TableCell>
              <TableCell align="right">Кол-во</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ops.map((op, i) => (
              <TableRow key={op.operationId || i}>
                <TableCell>{formatDate(op.createdAt || op.operationDate || op.timestamp)}</TableCell>
                <TableCell>
                  <Chip
                    label={OP_TYPE_LABEL[op.operationType || op.type] || op.operationType || op.type || '—'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{op.productName || (op.productId ? String(op.productId).slice(0, 8) + '…' : '—')}</TableCell>
                <TableCell align="right">{op.quantity ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Paper>
);

const WorkerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { data: warehouses } = useWarehouses();
  const userId = user?.userId;
  const userWhId = user?.warehouseId;

  const [shipCount, setShipCount] = useState(undefined);
  const [recentOps, setRecentOps] = useState(undefined);

  const activeInventoryId = userId ? localStorage.getItem(ACTIVE_SESSION_KEY(userId)) : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await shipRequestService.list();
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : (list?.content || []);
        const active = arr.filter(
          (r) => (r.status === 'PLANNED' || r.status === 'PICKING')
            && (!userWhId || r.warehouseId === userWhId)
        );
        setShipCount(active.length);
      } catch {
        if (!cancelled) setShipCount(null);
      }
    })();
    (async () => {
      try {
        const params = userId ? { userId } : {};
        const data = await productService.getOperationsHistory(params);
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data?.content || []);
        arr.sort((a, b) => new Date(b.createdAt || b.operationDate || 0) - new Date(a.createdAt || a.operationDate || 0));
        setRecentOps(arr.slice(0, 5));
      } catch {
        if (!cancelled) setRecentOps(null);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, userWhId]);

  const myWarehouse = warehouses.find((w) => (w.warehouseId || w.id) === userWhId);

  return (
    <Stack spacing={3} mb={4}>
      {activeInventoryId && (
        <Alert
          severity="info"
          icon={<AssignmentIcon />}
          action={
            <Box sx={{ cursor: 'pointer', textDecoration: 'underline', mr: 1 }}
                 onClick={() => navigate('/main/inventory')}>
              Перейти
            </Box>
          }
        >
          У вас открыта сессия инвентаризации — записи нужно завершить или отменить.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label={myWarehouse ? `Заявки на отгрузку · ${myWarehouse.name}` : 'Заявки на отгрузку'}
            value={shipCount === undefined ? null : shipCount}
            loading={shipCount === undefined}
            icon={LocalShippingIcon}
            color="#1976d2"
            onClick={() => navigate('/main/ship')}
            hint="К подбору и завершению"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Активная инвентаризация"
            value={activeInventoryId ? 1 : 0}
            icon={AssignmentIcon}
            color="#0288d1"
            onClick={() => navigate('/main/inventory')}
            hint={activeInventoryId ? 'Открыта · перейти к подсчётам' : 'Сессия не запущена'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Документы"
            value={null}
            icon={DescriptionIcon}
            color="#455a64"
            onClick={() => navigate('/main/documents')}
            hint="Скачать акты и накладные"
          />
        </Grid>
      </Grid>

      <RecentOpsTable
        ops={recentOps === undefined || recentOps === null ? [] : recentOps}
        loading={recentOps === undefined}
        title="Мои последние операции"
        emptyText="Вы пока не выполняли операций"
      />
    </Stack>
  );
};

const AccountantDashboard = ({ user }) => {
  const navigate = useNavigate();
  const userId = user?.userId;

  const [markedCount, setMarkedCount] = useState(undefined);
  const [recentOps, setRecentOps] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await productService.getMarkedForWriteOff();
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : (data?.content || []);
        setMarkedCount(arr.length);
      } catch {
        if (!cancelled) setMarkedCount(null);
      }
    })();
    (async () => {
      try {
        const data = await productService.getOperationsHistory();
        if (cancelled) return;
        let arr = Array.isArray(data) ? data : (data?.content || []);

        arr = arr.filter((op) => {
          const t = op.operationType || op.type;
          return t === 'WRITE_OFF' || t === 'WRITEOFF' || t === 'REVALUATION';
        });
        arr.sort((a, b) => new Date(b.createdAt || b.operationDate || 0) - new Date(a.createdAt || a.operationDate || 0));
        setRecentOps(arr.slice(0, 5));
      } catch {
        if (!cancelled) setRecentOps(null);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const showMarkedAlert = typeof markedCount === 'number' && markedCount > 0;

  return (
    <Stack spacing={3} mb={4}>
      {showMarkedAlert && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          action={
            <Box sx={{ cursor: 'pointer', textDecoration: 'underline', mr: 1 }}
                 onClick={() => navigate('/main/writeoff')}>
              Перейти к списанию
            </Box>
          }
        >
          Позиций, помеченных к списанию: <b>{markedCount}</b>. Их нужно оформить актами.
        </Alert>
      )}

      <RecentOpsTable
        ops={recentOps === undefined || recentOps === null ? [] : recentOps}
        loading={recentOps === undefined}
        title="Последние списания и переоценки"
        emptyText="Списаний и переоценок пока не было"
      />
    </Stack>
  );
};

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { data: warehouses } = useWarehouses();
  const { data: employees } = useEmployees();

  const [recentOps, setRecentOps] = useState(undefined);

  const loadAll = useCallback(async () => {
    try {
      const data = await productService.getOperationsHistory();
      let arr = Array.isArray(data) ? data : (data?.content || []);
      arr.sort((a, b) => new Date(b.createdAt || b.operationDate || 0) - new Date(a.createdAt || a.operationDate || 0));
      setRecentOps(arr.slice(0, 7));
    } catch {
      setRecentOps(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) loadAll();
    return () => { cancelled = true; };
  }, [loadAll]);

  const activeEmployees = employees.filter((e) => !e.isBlocked && e.isActive !== false).length;

  return (
    <Stack spacing={3} mb={4}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Складов в организации"
            value={warehouses.length}
            icon={BusinessIcon}
            color="#37474f"
            onClick={() => navigate('/main/organization')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Активных сотрудников"
            value={activeEmployees}
            icon={GroupIcon}
            color="#6d4c41"
            onClick={() => navigate('/main/employees')}
            hint={employees.length > activeEmployees ? `Всего: ${employees.length}` : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            label="Аналитика"
            value={null}
            icon={AssessmentIcon}
            color="#9c27b0"
            onClick={() => navigate('/main/analytics')}
            hint="KPI и динамика операций"
          />
        </Grid>
      </Grid>

      <RecentOpsTable
        ops={recentOps === undefined || recentOps === null ? [] : recentOps}
        loading={recentOps === undefined}
        title="Последние операции по организации"
        emptyText="Операций пока не было"
      />
    </Stack>
  );
};

const MainPage = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const t = setInterval(() => setGreeting(getGreeting()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const userRole = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : undefined);
  const directorWithoutOrg = userRole === 'DIRECTOR' && !user?.organizationId;
  const actions = ALL_ACTIONS.filter((a) => {
    const roleOk = a.allowed === 'ALL' || (userRole && a.allowed.includes(userRole));
    if (!roleOk) return false;
    if (directorWithoutOrg && a.key !== 'organization') return false;
    return true;
  });

  let Dashboard = null;
  if (userRole === 'WORKER') Dashboard = WorkerDashboard;
  else if (userRole === 'ACCOUNTANT') Dashboard = AccountantDashboard;
  else if (userRole === 'DIRECTOR' && !directorWithoutOrg) Dashboard = DirectorDashboard;

  return (
    <Box sx={{
      width: '100%', bgcolor: 'background.default', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      <Box sx={{ width: '100%', maxWidth: MAX_WIDTH, px: { xs: 2, md: 4 }, my: 4 }}>
        <Paper elevation={0} sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: '#fff',
          borderRadius: 4,
          p: { xs: 3, md: 5 },
          mb: 4,
        }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            {greeting}, {firstName(user)}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            {userRole && ROLE_LABEL[userRole] ? `Роль: ${ROLE_LABEL[userRole]}` : 'Добро пожаловать в WMS'}
          </Typography>
        </Paper>

        {Dashboard && <Dashboard user={user} />}

        {directorWithoutOrg && (
          <Alert
            severity="info"
            sx={{ mb: 3, borderRadius: 3 }}
            action={
              <Box
                sx={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 600, mr: 1 }}
                onClick={() => navigate('/main/organization?firstTime=true')}
              >
                Создать организацию
              </Box>
            }
          >
            Чтобы начать работу с WMS, создайте организацию. Все остальные разделы станут доступны
            автоматически после создания.
          </Alert>
        )}

        <Typography variant="h5" fontWeight={700} mb={2}>
          Быстрые действия
        </Typography>

        <Grid container spacing={2}>
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={a.key}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(a.path)}
                    sx={{ height: '100%', p: 2.5 }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        bgcolor: a.color + '15',
                        color: a.color,
                        width: 48, height: 48,
                        borderRadius: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {a.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {a.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default MainPage;
