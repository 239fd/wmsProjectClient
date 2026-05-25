import React, { useState } from 'react';
import {
  Box, Typography, Grid, Paper, Stack, Button, IconButton, Tabs, Tab, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputBase, TextField,
} from '@mui/material';
import {
  ChevronLeft, ChevronRight,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Receipt as ReceiptIcon,
  Storefront as StorefrontIcon,
  Warehouse as WarehouseIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';

const WF = {
  bg:        '#ffffff',
  ink:       '#1a1a1a',
  inkSoft:   '#5a5a5a',
  inkMuted:  '#8a8a8a',
  line:      '#1a1a1a',
  lineSoft:  '#d8d8d8',
  fillSoft:  '#f4f4f4',
  fillMid:   '#bdbdbd',
  fillDark:  '#5a5a5a',
  fillBtn:   '#000000',
  fillBtnTx: '#ffffff',
  radius:    14,
};

const cardSx = {
  border: `1px solid ${WF.line}`,
  borderRadius: `${WF.radius}px`,
  bgcolor: WF.bg,
};

const blackBtnSx = {
  bgcolor: WF.fillBtn,
  color: WF.fillBtnTx,
  textTransform: 'none',
  borderRadius: 1,
  px: 2.5,
  py: 0.75,
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': { bgcolor: '#222', boxShadow: 'none' },
};

const outlinedBtnSx = {
  bgcolor: WF.bg,
  color: WF.ink,
  border: `1px solid ${WF.line}`,
  textTransform: 'none',
  borderRadius: 1,
  px: 2,
  py: 0.5,
  fontWeight: 500,
  boxShadow: 'none',
  '&:hover': { bgcolor: WF.fillSoft, boxShadow: 'none', border: `1px solid ${WF.line}` },
};

const Navbar = () => (
  <Box sx={{
    border: `1px solid ${WF.line}`,
    borderRadius: `${WF.radius}px`,
    bgcolor: WF.bg,
    px: 3, py: 1.5,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    mb: 4,
  }}>
    <Typography sx={{ fontWeight: 800, letterSpacing: 1, color: WF.ink }}>NAME</Typography>
    <Stack direction="row" spacing={4}>
      <Typography sx={{ color: WF.ink }}>Nav Item 1</Typography>
      <Typography sx={{ color: WF.ink }}>Nav Item 2</Typography>
      <Typography sx={{ color: WF.ink }}>Nav Item 3</Typography>
    </Stack>
    <Stack direction="row" spacing={1}>
      <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${WF.line}` }} />
      <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${WF.line}` }} />
    </Stack>
  </Box>
);

const Pagination = ({ from, to, count }) => (
  <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end" sx={{ mt: 2 }}>
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" sx={{ color: WF.inkSoft }}>Строк на странице:</Typography>
      <FormControl size="small" variant="standard">
        <Select
          defaultValue={20}
          disableUnderline
          input={<InputBase sx={{ fontSize: 13, '& .MuiSelect-select': { py: 0.25, pr: 2 } }} />}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
      </FormControl>
    </Stack>
    <Typography variant="caption" sx={{ color: WF.inkSoft }}>
      {from}-{to} из {count}
    </Typography>
    <Stack direction="row" spacing={0.5}>
      <IconButton size="small" sx={{ border: `1px solid ${WF.line}`, borderRadius: '50%', p: 0.25 }}>
        <ChevronLeft fontSize="small" />
      </IconButton>
      <IconButton size="small" sx={{ border: `1px solid ${WF.line}`, borderRadius: '50%', p: 0.25 }}>
        <ChevronRight fontSize="small" />
      </IconButton>
    </Stack>
  </Stack>
);

const wfTableSx = {
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${WF.lineSoft}`,
    color: WF.ink,
    fontSize: 13,
    py: 1.25,
  },
  '& .MuiTableCell-head': {
    fontWeight: 600,
    color: WF.ink,
    borderBottom: `1px solid ${WF.line}`,
    bgcolor: 'transparent',
  },
};

const KPI = [
  { icon: InventoryIcon,   label: 'Всего на складах',    value: 18420, trend: +4.2 },
  { icon: TrendingUpIcon,  label: 'Уникальных позиций',  value:   312, trend: -1.1 },
  { icon: ReceiptIcon,     label: 'Операции · месяц',    value:  1487, trend: +12.6 },
  { icon: StorefrontIcon,  label: 'Доступно',            value: 16980, trend: +3.8 },
  { icon: HistoryIcon,     label: 'Зарезервировано',     value:  1440, trend: 0 },
];

const TrendBadge = ({ pct }) => {
  if (pct === null || pct === undefined) return null;
  const r = Math.round(pct * 10) / 10;
  let Icon = TrendingFlatIcon;
  if (r > 0) Icon = TrendingUpIcon;
  else if (r < 0) Icon = TrendingDownIcon;
  const sign = r > 0 ? '+' : '';
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      bgcolor: WF.fillSoft, color: WF.ink,
      border: `1px solid ${WF.line}`,
      borderRadius: 1.5, px: 1, py: 0.25,
    }}>
      <Icon sx={{ fontSize: 16, color: WF.inkSoft }} />
      <Typography variant="caption" fontWeight={700}>
        {sign}{r.toFixed(1)}%
      </Typography>
    </Box>
  );
};

const KPICard = ({ icon: Icon, label, value, trend }) => (
  <Box sx={{ ...cardSx, p: 2.5, height: '100%' }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
      <Box sx={{
        bgcolor: WF.fillSoft, border: `1px solid ${WF.line}`,
        borderRadius: 1.5, p: 1, display: 'inline-flex',
      }}>
        <Icon sx={{ color: WF.ink, fontSize: 24 }} />
      </Box>
      <TrendBadge pct={trend} />
    </Stack>
    <Typography sx={{ fontWeight: 800, fontSize: 28, color: WF.ink, lineHeight: 1.1 }}>
      {Number(value).toLocaleString('ru-RU')}
    </Typography>
    <Typography variant="body2" sx={{ color: WF.inkSoft, mt: 0.5 }}>{label}</Typography>
  </Box>
);

const WAREHOUSES = [
  { name: 'Склад №1 — Минск, Кальварийская', racks: 24, occupied: 412, total: 480, fill: 86 },
  { name: 'Склад №2 — Минск, Дзержинского',  racks: 18, occupied: 290, total: 360, fill: 81 },
  { name: 'Склад №3 — Брест, Московская',    racks: 12, occupied: 168, total: 240, fill: 70 },
  { name: 'Склад №4 — Гомель, Советская',    racks:  8, occupied:  96, total: 160, fill: 60 },
];

const ABC = {
  total: 312,
  counts: { A: 62, B: 110, C: 140 },
  qty:    { A: 9210, B: 6240, C: 2970 },
};

const OPS_BY_TYPE = [
  { type: 'RECEIPT',     label: 'Приёмка',        count: 420 },
  { type: 'SHIP',        label: 'Отгрузка',       count: 380 },
  { type: 'STAGING',     label: 'Размещение',     count: 245 },
  { type: 'TRANSFER',    label: 'Перемещение',    count: 180 },
  { type: 'INVENTORY',   label: 'Инвентаризация', count: 134 },
  { type: 'WRITEOFF',    label: 'Списание',       count:  72 },
  { type: 'REVALUATION', label: 'Переоценка',     count:  56 },
];

const DAILY = [
  { d: 'Пн 05.05', c: 38 },
  { d: 'Вт 06.05', c: 62 },
  { d: 'Ср 07.05', c: 71 },
  { d: 'Чт 08.05', c: 48 },
  { d: 'Пт 09.05', c: 92 },
  { d: 'Сб 10.05', c: 22 },
  { d: 'Вс 11.05', c:  8 },
];

const OPS_HISTORY = [
  { date: '11.05.2026 14:32', type: 'Приёмка',        wh: 'Склад №1', product: 'Молоко 2.5% 1л',        qty: 240, user: 'Иванов И.И.',    opId: '9b2f1a8e' },
  { date: '11.05.2026 13:18', type: 'Отгрузка',       wh: 'Склад №1', product: 'Сыр Гауда 200г',         qty:  60, user: 'Петров П.П.',    opId: '7c1d4b3a' },
  { date: '11.05.2026 12:04', type: 'Размещение',     wh: 'Склад №2', product: 'Йогурт ваниль 150г',     qty: 180, user: 'Иванов И.И.',    opId: '5e8a2f9c' },
  { date: '11.05.2026 10:47', type: 'Списание',       wh: 'Склад №1', product: 'Хлеб бородинский 400г',  qty:  12, user: 'Сидорова А.В.',  opId: '3f4b6d8e' },
  { date: '11.05.2026 09:30', type: 'Переоценка',     wh: 'Склад №3', product: 'Кофе зерно 1кг',         qty:  25, user: 'Морозов Д.А.',   opId: '1a2b3c4d' },
  { date: '10.05.2026 17:55', type: 'Приёмка',        wh: 'Склад №2', product: 'Масло сливочное 180г',   qty: 320, user: 'Петров П.П.',    opId: '8d7e6f5a' },
  { date: '10.05.2026 15:21', type: 'Инвентаризация', wh: 'Склад №4', product: '—',                       qty: '—', user: 'Сидорова А.В.',  opId: '2c3d4e5f' },
];

const TOP_EMP = [
  { name: 'Иванов И.И.',     role: 'Кладовщик',  count: 142 },
  { name: 'Петров П.П.',     role: 'Кладовщик',  count: 118 },
  { name: 'Сидорова А.В.',   role: 'Бухгалтер',  count:  87 },
  { name: 'Кузнецова Е.С.',  role: 'Бухгалтер',  count:  64 },
  { name: 'Морозов Д.А.',    role: 'Кладовщик',  count:  41 },
];

const EMP_TABLE = [
  { name: 'Иванов И.И.',    email: 'ivanov@wms.by',    role: 'Кладовщик', days: 412 },
  { name: 'Петров П.П.',    email: 'petrov@wms.by',    role: 'Кладовщик', days: 318 },
  { name: 'Сидорова А.В.',  email: 'sidorova@wms.by',  role: 'Бухгалтер', days: 245 },
  { name: 'Кузнецова Е.С.', email: 'kuznetsova@wms.by', role: 'Бухгалтер', days: 180 },
  { name: 'Морозов Д.А.',   email: 'morozov@wms.by',   role: 'Кладовщик', days:  92 },
];

const EXPIRING = [
  { urgency: 'Просрочено',  product: 'Молоко 2.5% 1л',       sku: 'SKU-001023', batch: 'B-2604', expiry: '01.05.2026', days: -10, qty:  18, cond: 'FRIDGE'  },
  { urgency: '≤ 7 дней',    product: 'Йогурт ваниль 150г',    sku: 'SKU-001114', batch: 'B-2701', expiry: '17.05.2026', days:   6, qty:  72, cond: 'FRIDGE'  },
  { urgency: '≤ 7 дней',    product: 'Сыр Гауда 200г',        sku: 'SKU-001202', batch: 'B-2703', expiry: '18.05.2026', days:   7, qty:  40, cond: 'COOL'    },
  { urgency: '≤ 14 дней',   product: 'Масло сливочное 180г',  sku: 'SKU-001340', batch: 'B-2705', expiry: '24.05.2026', days:  13, qty: 110, cond: 'FRIDGE'  },
  { urgency: '> 14 дней',   product: 'Хлеб бородинский 400г', sku: 'SKU-001501', batch: 'B-2710', expiry: '03.06.2026', days:  23, qty: 220, cond: 'ROOM'    },
];

const AbcDonut = () => {
  const shades = { A: WF.ink, B: WF.fillDark, C: WF.fillMid };
  let offset = 0;
  const segs = ['A', 'B', 'C'].map((cls) => {
    const c = ABC.counts[cls];
    const pct = c / ABC.total;
    const s = { cls, count: c, pct, offset, dashLen: pct * 100, color: shades[cls] };
    offset += pct * 100;
    return s;
  });
  return (
    <Box sx={{ ...cardSx, p: 3, height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography sx={{ fontWeight: 700, color: WF.ink }}>ABC-распределение товаров</Typography>
        <Button sx={outlinedBtnSx}>Пересчитать</Button>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
        <Box sx={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" width="100%" height="100%">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke={WF.fillSoft} strokeWidth="3.5" />
            {segs.map((s) => (
              <circle
                key={s.cls}
                cx="18" cy="18" r="15.9155" fill="none"
                stroke={s.color} strokeWidth="3.5"
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
            <Typography variant="h5" fontWeight={800}>{ABC.total}</Typography>
            <Typography variant="caption" color={WF.inkSoft}>позиций</Typography>
          </Box>
        </Box>
        <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
          {segs.map((s) => (
            <Box key={s.cls}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 12, height: 12, bgcolor: s.color, borderRadius: 0.5 }} />
                  <Typography variant="body2" fontWeight={600}>Категория {s.cls}</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={700}>
                  {s.count} ({Math.round(s.pct * 100)}%)
                </Typography>
              </Stack>
              <Typography variant="caption" color={WF.inkSoft}>
                Остаток: {ABC.qty[s.cls].toLocaleString('ru-RU')}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

const OverviewTab = () => {
  const totalOps = OPS_BY_TYPE.reduce((s, o) => s + o.count, 0) || 1;
  const maxDaily = Math.max(...DAILY.map((d) => d.c), 1);
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Эффективность складов</Typography>
          <Grid container spacing={2}>
            {WAREHOUSES.map((w) => (
              <Grid size={{ xs: 12, sm: 6 }} key={w.name}>
                <Box sx={{ ...cardSx, p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                    <Box sx={{
                      bgcolor: WF.fillSoft, border: `1px solid ${WF.line}`,
                      color: WF.ink, p: 1, borderRadius: 1.5, display: 'inline-flex',
                    }}>
                      <WarehouseIcon fontSize="small" />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>{w.name}</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color={WF.inkSoft}>Стеллажей</Typography>
                      <Typography variant="body2" fontWeight={600}>{w.racks}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color={WF.inkSoft}>Ячеек занято</Typography>
                      <Typography variant="body2" fontWeight={600}>{w.occupied} / {w.total}</Typography>
                    </Stack>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color={WF.inkSoft}>Утилизация</Typography>
                        <Typography variant="body2" fontWeight={700}>{w.fill}%</Typography>
                      </Stack>
                      <Box sx={{ height: 8, bgcolor: WF.fillSoft, borderRadius: 1, overflow: 'hidden' }}>
                        <Box sx={{ width: `${w.fill}%`, height: '100%', bgcolor: WF.ink }} />
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <AbcDonut />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ ...cardSx, p: 3, height: '100%' }}>
            <Typography sx={{ fontWeight: 700, color: WF.ink }}>Операции по типам</Typography>
            <Typography variant="caption" color={WF.inkSoft} mb={2} display="block">За месяц</Typography>
            <Stack spacing={2}>
              {OPS_BY_TYPE.map((op) => {
                const pct = Math.round((op.count / totalOps) * 100);
                return (
                  <Box key={op.type}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{op.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{op.count} ({pct}%)</Typography>
                    </Stack>
                    <Box sx={{ height: 8, bgcolor: WF.fillSoft, borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: WF.ink }} />
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ ...cardSx, p: 3, height: '100%' }}>
            <Typography sx={{ fontWeight: 700, color: WF.ink, mb: 2 }}>Загруженность по дням</Typography>
            <Stack spacing={1}>
              {DAILY.map((d) => {
                const pct = (d.c / maxDaily) * 100;
                return (
                  <Box key={d.d} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 90, fontSize: 13, color: WF.inkSoft }}>{d.d}</Typography>
                    <Box sx={{ flex: 1, height: 24, bgcolor: WF.fillSoft, borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{
                        width: `${pct}%`, height: '100%', bgcolor: WF.ink,
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1,
                      }}>
                        <Typography sx={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{d.c}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const OperationsTab = () => (
  <Box sx={{ p: 3 }}>
    <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap" useFlexGap>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select displayEmpty defaultValue=""
          sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: WF.line }, borderRadius: 1 }}>
          <MenuItem value="">Тип операции · Все</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 240 }}>
        <Select displayEmpty defaultValue=""
          sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: WF.line }, borderRadius: 1 }}>
          <MenuItem value="">Склад · Все</MenuItem>
        </Select>
      </FormControl>
      <Button startIcon={<RefreshIcon />} sx={outlinedBtnSx}>Обновить</Button>
      <Box sx={{ flex: 1 }} />
      <Typography variant="body2" color={WF.inkSoft}>Найдено: <b>{OPS_HISTORY.length}</b></Typography>
    </Stack>
    <Box sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small" sx={wfTableSx}>
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
            {OPS_HISTORY.map((op, i) => (
              <TableRow key={i}>
                <TableCell>{op.date}</TableCell>
                <TableCell>
                  <Chip label={op.type} size="small"
                    sx={{ bgcolor: WF.fillSoft, color: WF.ink, fontWeight: 600, border: `1px solid ${WF.line}` }} />
                </TableCell>
                <TableCell>{op.wh}</TableCell>
                <TableCell>{op.product}</TableCell>
                <TableCell align="right">{op.qty}</TableCell>
                <TableCell>{op.user}</TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{op.opId}…</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    <Pagination from={1} to={7} count={87} />
  </Box>
);

const EmployeesTab = () => {
  const max = TOP_EMP[0].count;
  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={600}>Аналитика по сотрудникам</Typography>
        <Button startIcon={<RefreshIcon />} sx={outlinedBtnSx}>Обновить</Button>
      </Stack>

      <Box sx={{ ...cardSx, p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Box sx={{
            bgcolor: WF.fillSoft, border: `1px solid ${WF.line}`,
            color: WF.ink, p: 1, borderRadius: 1.5, display: 'inline-flex',
          }}>
            <EmojiEventsIcon fontSize="small" />
          </Box>
          <Typography sx={{ fontWeight: 700, color: WF.ink }}>Топ-5 активных за период</Typography>
        </Stack>
        <Stack spacing={1.5}>
          {TOP_EMP.map((u, idx) => {
            const pct = (u.count / max) * 100;
            return (
              <Box key={u.name}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{
                      bgcolor: idx === 0 ? WF.ink : WF.fillSoft,
                      color: idx === 0 ? '#fff' : WF.ink,
                      border: `1px solid ${WF.line}`,
                      width: 24, height: 24, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13,
                    }}>{idx + 1}</Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                      <Typography variant="caption" color={WF.inkSoft}>{u.role}</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" fontWeight={700}>{u.count} оп.</Typography>
                </Stack>
                <Box sx={{ height: 6, bgcolor: WF.fillSoft, borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: WF.ink }} />
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small" sx={wfTableSx}>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell align="right">В компании</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {EMP_TABLE.map((e) => (
                <TableRow key={e.email}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                    <Typography variant="caption" color={WF.inkSoft}>{e.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={e.role} size="small"
                      sx={{ bgcolor: WF.fillSoft, color: WF.ink, border: `1px solid ${WF.line}` }} />
                  </TableCell>
                  <TableCell align="right">{e.days} дн.</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

const WarehousesTab = () => {
  const agg = WAREHOUSES.reduce((acc, w) => {
    acc.racks += w.racks; acc.occupied += w.occupied; acc.total += w.total;
    return acc;
  }, { racks: 0, occupied: 0, total: 0 });
  const aggUtil = Math.round((agg.occupied / agg.total) * 1000) / 10;
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>Детализация по складам</Typography>
      <Box sx={{ ...cardSx, bgcolor: WF.fillSoft, p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color={WF.inkSoft} mb={1}>Сводка по сети складов</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color={WF.inkSoft}>Складов</Typography>
            <Typography variant="h6" fontWeight={700}>{WAREHOUSES.length}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color={WF.inkSoft}>Стеллажей</Typography>
            <Typography variant="h6" fontWeight={700}>{agg.racks}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color={WF.inkSoft}>Ячеек занято</Typography>
            <Typography variant="h6" fontWeight={700}>{agg.occupied} / {agg.total}</Typography>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="caption" color={WF.inkSoft}>Утилизация</Typography>
            <Typography variant="h6" fontWeight={700}>{aggUtil}%</Typography>
          </Grid>
        </Grid>
      </Box>
      <Grid container spacing={2}>
        {WAREHOUSES.map((w) => (
          <Grid size={{ xs: 12, md: 6 }} key={w.name}>
            <Box sx={{ ...cardSx, p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                <Box sx={{
                  bgcolor: WF.fillSoft, border: `1px solid ${WF.line}`,
                  color: WF.ink, p: 1, borderRadius: 1.5, display: 'inline-flex',
                }}>
                  <WarehouseIcon fontSize="small" />
                </Box>
                <Stack flex={1} minWidth={0}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>{w.name}</Typography>
                </Stack>
                <Chip label={`${w.fill}%`} size="small"
                  sx={{ bgcolor: WF.fillSoft, color: WF.ink, border: `1px solid ${WF.line}`, fontWeight: 700 }} />
              </Stack>
              <Box sx={{ height: 10, bgcolor: WF.fillSoft, borderRadius: 1, overflow: 'hidden', mb: 2 }}>
                <Box sx={{ width: `${w.fill}%`, height: '100%', bgcolor: WF.ink }} />
              </Box>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color={WF.inkSoft}>Стеллажей</Typography>
                  <Typography variant="body2" fontWeight={700}>{w.racks}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color={WF.inkSoft}>Ячеек занято</Typography>
                  <Typography variant="body2" fontWeight={700}>{w.occupied} / {w.total}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const ExpiringTab = () => (
  <Box sx={{ p: 3 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" useFlexGap>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{
          bgcolor: WF.fillSoft, border: `1px solid ${WF.line}`,
          color: WF.ink, p: 1, borderRadius: 1.5, display: 'inline-flex',
        }}>
          <ScheduleIcon fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={600}>Товары с истекающим сроком (FEFO-риски)</Typography>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Окно (дней)" size="small" type="number" defaultValue={30}
          sx={{ width: 130, '& .MuiOutlinedInput-notchedOutline': { borderColor: WF.line } }}
        />
        <Button startIcon={<RefreshIcon />} sx={outlinedBtnSx}>Обновить</Button>
      </Stack>
    </Stack>

    <Grid container spacing={2} mb={3}>
      {[
        { label: 'Просрочено',  count: 1 },
        { label: '≤ 7 дней',    count: 2 },
        { label: '≤ 14 дней',   count: 1 },
        { label: '> 14 дней',   count: 1 },
      ].map((s) => (
        <Grid size={{ xs: 6, md: 3 }} key={s.label}>
          <Box sx={{ ...cardSx, bgcolor: WF.fillSoft, p: 2.5 }}>
            <Typography variant="caption" sx={{ color: WF.inkSoft, fontWeight: 700, textTransform: 'uppercase' }}>
              {s.label}
            </Typography>
            <Typography variant="h4" fontWeight={800}>{s.count}</Typography>
          </Box>
        </Grid>
      ))}
    </Grid>

    <Box sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small" sx={wfTableSx}>
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
            {EXPIRING.map((r, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Chip size="small" label={r.urgency}
                    sx={{ bgcolor: WF.fillSoft, color: WF.ink, border: `1px solid ${WF.line}`, fontWeight: 700 }} />
                </TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{r.product}</Typography></TableCell>
                <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{r.sku}</Typography></TableCell>
                <TableCell>{r.batch}</TableCell>
                <TableCell>{r.expiry}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{r.days}</TableCell>
                <TableCell align="right">{r.qty.toLocaleString('ru-RU')}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.cond}
                    sx={{ bgcolor: WF.bg, color: WF.ink, border: `1px solid ${WF.line}` }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  </Box>
);

const TAB_LABELS = ['Обзор', 'Операции', 'Сотрудники', 'Склады', 'Запасы'];

const AnalyticsSamplePage = () => {
  const [period, setPeriod] = useState('month');
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ bgcolor: WF.bg, minHeight: '100vh', py: 4, color: WF.ink }}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
        <Navbar />
      </Box>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: WF.ink }}>Аналитика и отчётность</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button startIcon={<DescriptionIcon />} sx={blackBtnSx}>Сформировать отчёт</Button>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: WF.line }, borderRadius: 1 }}
              >
                <MenuItem value="week">Неделя</MenuItem>
                <MenuItem value="month">Месяц</MenuItem>
                <MenuItem value="quarter">Квартал</MenuItem>
                <MenuItem value="year">Год</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Grid container spacing={3} mb={3}>
          {KPI.map((k) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={k.label}>
              <KPICard icon={k.icon} label={k.label} value={k.value} trend={k.trend} />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ ...cardSx, mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: `1px solid ${WF.lineSoft}`,
              px: 2,
              '& .MuiTab-root': { color: WF.inkSoft, textTransform: 'none', fontWeight: 500 },
              '& .Mui-selected':  { color: `${WF.ink} !important`, fontWeight: 700 },
              '& .MuiTabs-indicator': { bgcolor: WF.ink },
            }}
          >
            {TAB_LABELS.map((l) => <Tab key={l} label={l} />)}
          </Tabs>
          {tab === 0 && <OverviewTab />}
          {tab === 1 && <OperationsTab />}
          {tab === 2 && <EmployeesTab />}
          {tab === 3 && <WarehousesTab />}
          {tab === 4 && <ExpiringTab />}
        </Box>

        <Typography variant="caption" sx={{ color: WF.inkMuted }}>
          Wireframe mockup · /sample1
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalyticsSamplePage;
