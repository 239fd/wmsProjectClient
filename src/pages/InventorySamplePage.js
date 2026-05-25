import React, { useState } from 'react';
import {
  Box, Typography, Grid, Stack, Button, TextField, Chip, Divider, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, InputLabel, FormControl, FormHelperText, FormControlLabel, Checkbox,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  StopCircle as StopIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningAmberIcon,
  HourglassEmpty as HourglassEmptyIcon,
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

const MOCK_SESSION = {
  status: 'ACTIVE',
  warehouse: 'Склад №1 — Минск, ул. Кальварийская',
  startedAt: '11.05.2026 09:14',
  filledRecords: 7,
  totalRecords: 12,
  records: [
    { id: 'r1',  name: 'Молоко 2.5% 1л',         sku: 'SKU-001023', cell: 'a3f8b1c2…', expected: 240, actual: 240,  status: 'OK',          marked: false },
    { id: 'r2',  name: 'Йогурт ваниль 150г',     sku: 'SKU-001114', cell: 'b4e9c2d3…', expected: 180, actual: 175,  status: 'К списанию',  marked: true  },
    { id: 'r3',  name: 'Сыр Гауда 200г',         sku: 'SKU-001202', cell: 'c5f0d3e4…', expected:  60, actual:  60,  status: 'OK',          marked: false },
    { id: 'r4',  name: 'Масло сливочное 180г',   sku: 'SKU-001340', cell: 'd6e1f4a5…', expected: 110, actual: 115,  status: 'Расхождение', marked: false },
    { id: 'r5',  name: 'Хлеб бородинский 400г',  sku: 'SKU-001501', cell: 'e7f2a5b6…', expected: 220, actual: 220,  status: 'OK',          marked: false },
    { id: 'r6',  name: 'Кофе зерно 1кг',         sku: 'SKU-002011', cell: 'f8a3b6c7…', expected:  25, actual:  23,  status: 'К списанию',  marked: true  },
    { id: 'r7',  name: 'Чай чёрный 100г',        sku: 'SKU-002012', cell: 'a9b4c7d8…', expected:  80, actual:  80,  status: 'OK',          marked: false },
    { id: 'r8',  name: 'Сахар-песок 1кг',        sku: 'SKU-002101', cell: 'b0c5d8e9…', expected: 320, actual: null, status: 'Не записано', marked: false },
    { id: 'r9',  name: 'Соль поваренная 500г',   sku: 'SKU-002102', cell: 'c1d6e9f0…', expected: 150, actual: null, status: 'Не записано', marked: false },
    { id: 'r10', name: 'Мука пшеничная 2кг',     sku: 'SKU-002103', cell: 'd2e7f0a1…', expected:  90, actual: null, status: 'Не записано', marked: false },
    { id: 'r11', name: 'Печенье овсяное 300г',   sku: 'SKU-002301', cell: 'e3f8a1b2…', expected:  64, actual: null, status: 'Не записано', marked: false },
    { id: 'r12', name: 'Шоколад горький 90г',    sku: 'SKU-002302', cell: 'f4a9b2c3…', expected:  72, actual: null, status: 'Не записано', marked: false },
  ],
};

const StatusChip = ({ status }) => {
  let Icon = null;
  if (status === 'Не записано')  Icon = HourglassEmptyIcon;
  if (status === 'К списанию')   Icon = WarningAmberIcon;
  if (status === 'OK')           Icon = CheckCircleIcon;
  return (
    <Chip
      icon={Icon ? <Icon sx={{ color: `${WF.ink} !important`, fontSize: 16 }} /> : undefined}
      label={status}
      size="small"
      sx={{
        bgcolor: status === 'OK' ? WF.bg : WF.fillSoft,
        color: WF.ink,
        border: `1px solid ${WF.line}`,
        fontWeight: 600,
      }}
    />
  );
};

const InventorySamplePage = () => {
  const [hasSession, setHasSession] = useState(true);
  const [startOpen, setStartOpen] = useState(false);
  const [inlineEdits, setInlineEdits] = useState({});
  const session = hasSession ? MOCK_SESSION : null;

  return (
    <Box sx={{ bgcolor: WF.bg, minHeight: '100vh', py: 4, color: WF.ink }}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
        <Navbar />
      </Box>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={3}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: WF.ink }}>Инвентаризация</Typography>
          <Button size="small" sx={outlinedBtnSx} onClick={() => setHasSession((v) => !v)}>
            {hasSession ? 'Показать пустое состояние' : 'Показать активную сессию'}
          </Button>
        </Stack>

        {!session ? (
          <Box sx={{ ...cardSx, p: 4 }}>
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
              <Box sx={{
                bgcolor: WF.fillSoft, border: `1px solid ${WF.line}`,
                color: WF.ink, p: 1.5, borderRadius: 1.5, display: 'inline-flex',
              }}>
                <PlayArrowIcon />
              </Box>
              <Typography variant="h6" fontWeight={700}>Активной сессии нет</Typography>
              <Typography variant="body2" color={WF.inkSoft} sx={{ textAlign: 'center', maxWidth: 560 }}>
                Начните сессию инвентаризации для одного из складов. Во время сессии вы будете записывать
                фактические остатки товаров; по завершении система сравнит их с учётными.
              </Typography>
              <Button sx={blackBtnSx} onClick={() => setStartOpen(true)}>Начать сессию</Button>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ ...cardSx, p: 4, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6" fontWeight={700}>Активная сессия</Typography>
                  <Chip label="Активна" size="small"
                    sx={{ bgcolor: WF.fillSoft, color: WF.ink, border: `1px solid ${WF.line}`, fontWeight: 600 }} />
                </Stack>
                <Typography variant="body2" color={WF.inkSoft} mt={0.5}>
                  Склад: <b style={{ color: WF.ink }}>{session.warehouse}</b> · Начата: {session.startedAt}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControlLabel
                  control={<Checkbox size="small" sx={{ color: WF.line, '&.Mui-checked': { color: WF.ink } }} />}
                  label={<Typography variant="caption" color={WF.inkSoft}>Режим RPA</Typography>}
                />
                <Button startIcon={<StopIcon />} sx={blackBtnSx}>Завершить</Button>
                <Button startIcon={<CancelIcon />} sx={outlinedBtnSx}>Отменить</Button>
              </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ ...cardSx, p: 2 }}>
                  <Typography variant="caption" color={WF.inkSoft}>Записано подсчётов</Typography>
                  <Typography variant="h5" fontWeight={800}>{session.filledRecords}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Box sx={{ ...cardSx, p: 2 }}>
                  <Typography variant="caption" color={WF.inkSoft}>Всего записей</Typography>
                  <Typography variant="h5" fontWeight={800}>{session.totalRecords}</Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: WF.lineSoft }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Подсчёт по позициям</Typography>
              <Button sx={outlinedBtnSx} size="small">Всё совпадает</Button>
            </Stack>

            <Alert
              severity="info"
              icon={false}
              sx={{
                mb: 2, bgcolor: WF.fillSoft, color: WF.ink,
                border: `1px solid ${WF.line}`, borderRadius: 1,
              }}
            >
              Заполните «Фактически» для каждой позиции. Расхождение в минус → пометка к списанию;
              в плюс → корректировка inventory. При завершении сессии будет создан inventory-report (ИНВ).
            </Alert>

            <Box sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader sx={wfTableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Товар</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Ячейка</TableCell>
                      <TableCell align="right">Ожидалось</TableCell>
                      <TableCell align="right">Фактически</TableCell>
                      <TableCell align="right">Расхождение</TableCell>
                      <TableCell>Статус</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.records.map((rec) => {
                      const filled = rec.actual !== null;
                      const discrepancy = filled ? (rec.actual - rec.expected) : null;
                      const hasDiscr = filled && discrepancy !== 0;
                      return (
                        <TableRow key={rec.id} hover>
                          <TableCell>{rec.name}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{rec.sku}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{rec.cell}</Typography>
                          </TableCell>
                          <TableCell align="right">{rec.expected}</TableCell>
                          <TableCell align="right">
                            {filled ? (
                              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                <Typography variant="body2" fontWeight={hasDiscr ? 700 : 400}>{rec.actual}</Typography>
                                <Button size="small" variant="text" sx={{ color: WF.inkSoft, minWidth: 'auto', textTransform: 'none' }}>✎</Button>
                              </Stack>
                            ) : (
                              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                <TextField
                                  size="small" type="number" placeholder="—"
                                  value={inlineEdits[rec.id] ?? ''}
                                  onChange={(e) => setInlineEdits((p) => ({ ...p, [rec.id]: e.target.value }))}
                                  sx={{ width: 90, '& .MuiOutlinedInput-notchedOutline': { borderColor: WF.line } }}
                                />
                                <Button size="small" sx={{ color: WF.inkSoft, minWidth: 'auto', textTransform: 'none' }}>=</Button>
                                <Button size="small" sx={{ ...blackBtnSx, minWidth: 'auto', px: 1, py: 0.25 }}>✓</Button>
                              </Stack>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {filled ? (discrepancy > 0 ? `+${discrepancy}` : discrepancy) : '—'}
                          </TableCell>
                          <TableCell><StatusChip status={rec.status} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}

        <Typography variant="caption" sx={{ color: WF.inkMuted }}>
          Wireframe mockup · /sample2
        </Typography>
      </Box>

      <Dialog open={startOpen} onClose={() => setStartOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Начать сессию инвентаризации</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Склад</InputLabel>
              <Select value="w1" label="Склад" variant="outlined">
                <MenuItem value="w1">Склад №1 — Минск, Кальварийская</MenuItem>
                <MenuItem value="w2">Склад №2 — Минск, Дзержинского</MenuItem>
                <MenuItem value="w3">Склад №3 — Брест, Московская</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Причина инвентаризации" fullWidth defaultValue="Плановая годовая"
              helperText="Напр.: «Плановая годовая», «Смена МОЛ», «Контрольная проверка»"
            />
            <FormControl fullWidth>
              <InputLabel>Ответственный</InputLabel>
              <Select value="u3" label="Ответственный" variant="outlined">
                <MenuItem value="u3">Сидорова А.В. · Бухгалтер</MenuItem>
                <MenuItem value="u4">Кузнецова Е.С. · Бухгалтер</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Комиссия</InputLabel>
              <Select multiple value={['u1', 'u2', 'u5']} label="Комиссия" variant="outlined"
                renderValue={(sel) => `${sel.length} участник(а)`}>
                <MenuItem value="u1">Иванов И.И. · Кладовщик</MenuItem>
                <MenuItem value="u2">Петров П.П. · Кладовщик</MenuItem>
                <MenuItem value="u5">Морозов Д.А. · Кладовщик</MenuItem>
              </Select>
              <FormHelperText>Председатель и члены комиссии (по НСБУ N 126).</FormHelperText>
            </FormControl>
            <TextField label="Примечания" multiline rows={2} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartOpen(false)} sx={{ color: WF.inkSoft, textTransform: 'none' }}>Отмена</Button>
          <Button sx={blackBtnSx} onClick={() => { setStartOpen(false); setHasSession(true); }}>Начать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventorySamplePage;
