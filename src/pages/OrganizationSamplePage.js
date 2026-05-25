import React, { useState } from 'react';
import {
  Box, Typography, Grid, Stack, Button, IconButton, Chip, Divider, Collapse, Alert,
  Tabs, Tab, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warehouse as WarehouseIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ViewModule as ViewModuleIcon,
  Inventory2 as Inventory2Icon,
  Layers as LayersIcon,
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

const textBtnSx = {
  color: WF.ink,
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': { bgcolor: WF.fillSoft },
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

const RACK_KIND_LABEL = { SHELF: 'Полочный', CELL: 'Ячеистый', PALLET: 'Паллетный' };
const RACK_KIND_ICON  = { SHELF: LayersIcon, CELL: ViewModuleIcon, PALLET: Inventory2Icon };
const STORAGE_LABEL = {
  ROOM:    'Комнатная температура (15…25 °C)',
  COOL:    'Прохладный режим (5…15 °C)',
  FRIDGE:  'Холодильник (0…5 °C)',
  FREEZER: 'Морозильник (-18…-24 °C)',
};

const WAREHOUSES = [
  {
    id: 'w1',
    name: 'Склад №1 — Кальварийская',
    address: 'г. Минск, ул. Кальварийская, 17',
    responsible: 'Иванов И.И.',
    active: true,
    racks: [
      {
        id: 'r1', kind: 'SHELF', name: 'Стеллаж A1', storage: 'ROOM', maxWeightKg: 800,
        slots: [
          { idx: 1, occupied: false, dims: '120×60×40', itemsCount: 0, totalQuantity: 0 },
          { idx: 2, occupied: true,  dims: '120×60×40', itemsCount: 3, totalQuantity: 48 },
          { idx: 3, occupied: true,  dims: '120×60×40', itemsCount: 1, totalQuantity: 24 },
          { idx: 4, occupied: false, dims: '120×60×40', itemsCount: 0, totalQuantity: 0 },
        ],
      },
      {
        id: 'r2', kind: 'CELL', name: 'Стеллаж A2', storage: 'COOL', maxWeightKg: 600,
        slots: [],
      },
      {
        id: 'r3', kind: 'PALLET', name: 'Стеллаж B1', storage: 'FRIDGE', maxWeightKg: 1200,
        slots: [],
      },
    ],
  },
  {
    id: 'w2',
    name: 'Склад №2 — Дзержинского',
    address: 'г. Минск, пр. Дзержинского, 104',
    responsible: 'Петров П.П.',
    active: true,
    racks: [
      { id: 'r4', kind: 'PALLET', name: 'Стеллаж C1', storage: 'ROOM',   maxWeightKg: 1500, slots: [] },
      { id: 'r5', kind: 'PALLET', name: 'Стеллаж C2', storage: 'FREEZER', maxWeightKg: 1500, slots: [] },
    ],
  },
  {
    id: 'w3',
    name: 'Склад №3 — Брест',
    address: 'г. Брест, ул. Московская, 256',
    responsible: null,
    active: false,
    racks: [],
  },
];

const RACK_KIND_TINT = { SHELF: WF.fillSoft, CELL: WF.fillSoft, PALLET: WF.fillSoft };

const SlotStatusChip = ({ occupied }) => (
  <Chip
    size="small"
    label={occupied ? 'Занята' : 'Доступна'}
    sx={{
      minWidth: 92,
      bgcolor: occupied ? WF.fillMid : WF.fillSoft,
      color: WF.ink,
      border: `1px solid ${WF.line}`,
      fontWeight: 600,
    }}
  />
);

const SlotLoadCell = ({ slot, capacityKg }) => {
  const itemsCount = slot.itemsCount ?? 0;
  const used = Number(slot.totalQuantity) || 0;
  const cap = capacityKg ? Number(capacityKg) : null;
  const percent = cap && cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : null;
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="caption" sx={{ color: WF.inkSoft, display: 'block' }}>
        {itemsCount > 0 ? `${itemsCount} позиций · ${used}` : 'Пусто'}
        {cap ? ` / ${cap} кг` : ''}
      </Typography>
      {percent !== null && (
        <Box sx={{ mt: 0.5, height: 4, bgcolor: WF.fillSoft, borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: WF.ink }} />
        </Box>
      )}
    </Box>
  );
};

const RackSlotsTable = ({ rack }) => {
  const occupiedCount = rack.slots.filter((s) => s.occupied).length;
  if (rack.slots.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: WF.inkSoft, pl: 2 }}>
        Слотов пока нет
      </Typography>
    );
  }
  return (
    <>
      <Box sx={{ mb: 1, px: 1 }}>
        <Typography variant="caption" sx={{ color: WF.inkSoft }}>
          Грузоподъёмность стеллажа: <b style={{ color: WF.ink }}>{rack.maxWeightKg} кг</b> ·
          {' '}занято: <b style={{ color: WF.ink }}>{occupiedCount}/{rack.slots.length}</b>
        </Typography>
      </Box>
      <Table size="small" sx={{ ...wfTableSx, bgcolor: WF.fillSoft }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 60 }}>№</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Загрузка</TableCell>
            <TableCell>Габариты Д×Ш×В, см</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rack.slots.map((s) => (
            <TableRow key={s.idx}>
              <TableCell>{s.idx}</TableCell>
              <TableCell><SlotStatusChip occupied={s.occupied} /></TableCell>
              <TableCell><SlotLoadCell slot={s} capacityKg={rack.maxWeightKg} /></TableCell>
              <TableCell>{s.dims}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

const WarehouseCard = ({ wh, expanded, onToggle, expandedRacks, onToggleRack }) => (
  <Box sx={{ ...cardSx, p: 3 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" fontWeight={700}>{wh.name}</Typography>
          {!wh.active && (
            <Chip label="Неактивен" size="small"
              sx={{ bgcolor: WF.fillSoft, color: WF.ink, border: `1px solid ${WF.line}` }} />
          )}
        </Stack>
        <Typography variant="body2" sx={{ color: WF.inkSoft }}>{wh.address}</Typography>
        {wh.responsible && (
          <Typography variant="body2" sx={{ color: WF.inkSoft, mt: 0.5 }}>
            Ответственный: <b style={{ color: WF.ink }}>{wh.responsible}</b>
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={0}>
        <IconButton size="small" sx={{ color: WF.ink }}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ color: WF.ink }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>

    <Divider sx={{ my: 2, borderColor: WF.lineSoft }} />

    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Button
        onClick={() => onToggle(wh.id)}
        startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={textBtnSx}
      >
        Стеллажи ({wh.racks.length})
      </Button>
      <Button size="small" startIcon={<AddIcon />} sx={outlinedBtnSx}>
        Добавить стеллаж
      </Button>
    </Stack>

    <Collapse in={expanded} timeout="auto">
      <Box sx={{ pt: 2 }}>
        {wh.racks.length === 0 ? (
          <Typography sx={{ color: WF.inkSoft, textAlign: 'center', py: 3 }}>
            Стеллажей пока нет
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" sx={wfTableSx}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell>Тип</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Условия хранения</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wh.racks.map((rack) => {
                  const Icon = RACK_KIND_ICON[rack.kind];
                  const rackExpanded = expandedRacks.has(rack.id);
                  return (
                    <React.Fragment key={rack.id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton size="small" sx={{ color: WF.ink }} onClick={() => onToggleRack(rack.id)}>
                            {rackExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Icon fontSize="small" sx={{ color: WF.ink }} />
                            <Typography variant="body2">{RACK_KIND_LABEL[rack.kind]}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{rack.name}</TableCell>
                        <TableCell>{STORAGE_LABEL[rack.storage]}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Добавить слот">
                            <IconButton size="small" sx={{ color: WF.ink }}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить стеллаж">
                            <IconButton size="small" sx={{ color: WF.ink }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 0, borderBottom: rackExpanded ? undefined : 'none' }}>
                          <Collapse in={rackExpanded} timeout="auto">
                            <Box sx={{ py: 2 }}>
                              <RackSlotsTable rack={rack} />
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Collapse>
  </Box>
);

const OrganizationSamplePage = () => {
  const [tab, setTab] = useState(1);
  const [expandedWh, setExpandedWh] = useState(new Set(['w1']));
  const [expandedRacks, setExpandedRacks] = useState(new Set(['r1']));

  const toggleWh = (id) => setExpandedWh((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleRack = (id) => setExpandedRacks((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <Box sx={{ bgcolor: WF.bg, minHeight: '100vh', py: 4, color: WF.ink }}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
        <Navbar />
      </Box>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: WF.ink, mb: 3 }}>Организация</Typography>

        <Box sx={{ ...cardSx }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: `1px solid ${WF.lineSoft}`,
              '& .MuiTab-root': {
                color: WF.inkSoft,
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 56,
              },
              '& .Mui-selected':  { color: `${WF.ink} !important`, fontWeight: 700 },
              '& .MuiTabs-indicator': { bgcolor: WF.ink },
            }}
          >
            <Tab icon={<BusinessIcon />}  iconPosition="start" label="Реквизиты организации" />
            <Tab icon={<WarehouseIcon />} iconPosition="start" label="Склады" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ p: 4 }}>
              <Alert
                icon={false}
                sx={{
                  bgcolor: WF.fillSoft, color: WF.ink,
                  border: `1px solid ${WF.line}`, borderRadius: 1,
                }}
              >
                Заглушка вкладки «Реквизиты организации». Откройте «Склады» — там полный 1:1 макет.
              </Alert>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ p: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={700}>Склады организации</Typography>
                <Button startIcon={<AddIcon />} sx={blackBtnSx}>Добавить склад</Button>
              </Stack>

              <Grid container spacing={3}>
                {WAREHOUSES.map((wh) => (
                  <Grid size={12} key={wh.id}>
                    <WarehouseCard
                      wh={wh}
                      expanded={expandedWh.has(wh.id)}
                      onToggle={toggleWh}
                      expandedRacks={expandedRacks}
                      onToggleRack={toggleRack}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        <Typography variant="caption" sx={{ color: WF.inkMuted, mt: 3, display: 'block' }}>
          Wireframe mockup · /sample3
        </Typography>
      </Box>
    </Box>
  );
};

export default OrganizationSamplePage;
