import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Chip, Divider, Grid, Card, CardContent, Alert,
  CircularProgress, Stack, Collapse, LinearProgress,
  MenuItem, Select, FormControl, InputLabel, FormHelperText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip,
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
  AcUnit as AcUnitIcon,
  Inventory2 as Inventory2Icon,
  Layers as LayersIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { selectUser, fetchProfile, setUser } from '../store/slices/authSlice';
import organizationService from '../services/organizationService';
import warehouseService from '../services/warehouseService';
import { useWarehouses, useEmployees } from '../hooks';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { applyServerError } from '../utils/applyServerError';
import {
  organizationSchema, warehouseSchema, rackSchema,
  shelfSchema, cellSchema, palletSchema,
} from '../validation/schemas';

const EMPTY_ORG_FORM = { name: '', shortName: '', unp: '', address: '' };
const EMPTY_WH_FORM = { name: '', address: '', responsibleUserId: '' };

const RACK_KIND_OPTIONS = [
  { value: 'SHELF', label: 'Полочный', icon: LayersIcon },
  { value: 'CELL', label: 'Ячеистый', icon: ViewModuleIcon },
  { value: 'PALLET', label: 'Паллетный', icon: Inventory2Icon },
];
const RACK_KIND_LABEL = Object.fromEntries(RACK_KIND_OPTIONS.map((o) => [o.value, o.label]));
const RACK_KIND_ICON = Object.fromEntries(RACK_KIND_OPTIONS.map((o) => [o.value, o.icon]));

const STORAGE_CONDITION_OPTIONS = [
  { value: 'ROOM', label: 'Комнатная температура (15…25 °C)' },
  { value: 'COOL', label: 'Прохладный режим (5…15 °C)' },
  { value: 'FRIDGE', label: 'Холодильник (0…5 °C)' },
  { value: 'FREEZER', label: 'Морозильник (-18…-24 °C)' },
];

const PALLET_TYPE_OPTIONS = [
  { value: 'EUR', label: 'EUR (80×120 см)' },
  { value: 'FIN', label: 'FIN (100×120 см)' },
  { value: 'US', label: 'US (120×120 см)' },
  { value: 'ASIA', label: 'ASIA (110×110 см)' },
];

const EMPTY_RACK_FORM = { name: '', kind: 'SHELF', storageConditions: 'ROOM', maxWeightKg: '' };
const EMPTY_SLOT_FORM = {
  lengthCm: '', widthCm: '', heightCm: '',
  palletPlaceCount: '', palletType: 'EUR', maxHeightCm: '',
  count: 1,
};

const slotSchemaFor = (kind) => {
  switch (kind) {
    case 'SHELF': return shelfSchema;
    case 'CELL': return cellSchema;
    case 'PALLET': return palletSchema;
    default: return null;
  }
};

const OrganizationPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstTime = searchParams.get('firstTime') === 'true';

  const orgId = user?.organizationId;

  const [tabValue, setTabValue] = useState(0);
  const [organization, setOrganization] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: warehouses, refresh: refreshWarehouses } = useWarehouses();
  const { data: employees } = useEmployees();

  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [orgBusy, setOrgBusy] = useState(false);
  const [orgDeleteOpen, setOrgDeleteOpen] = useState(false);

  const [whDialogOpen, setWhDialogOpen] = useState(false);
  const [whEditing, setWhEditing] = useState(null);
  const [whBusy, setWhBusy] = useState(false);
  const [whDeleteOpen, setWhDeleteOpen] = useState(false);
  const [selectedWh, setSelectedWh] = useState(null);

  const [racksByWh, setRacksByWh] = useState({});
  const [expandedWh, setExpandedWh] = useState(new Set());

  const [rackDialog, setRackDialog] = useState({ open: false, warehouseId: null });
  const [rackBusy, setRackBusy] = useState(false);
  const [rackDeleteState, setRackDeleteState] = useState({ open: false, rack: null, warehouseId: null });

  const [slotDialog, setSlotDialog] = useState({ open: false, rack: null });
  const [slotBusy, setSlotBusy] = useState(false);

  const [slotsByRack, setSlotsByRack] = useState({});
  const [expandedRacks, setExpandedRacks] = useState(new Set());

  const orgForm = useForm({
    resolver: yupResolver(organizationSchema),
    defaultValues: EMPTY_ORG_FORM,
    mode: 'onTouched',
  });
  const whForm = useForm({
    resolver: yupResolver(warehouseSchema),
    defaultValues: EMPTY_WH_FORM,
    mode: 'onTouched',
  });
  const rackForm = useForm({
    resolver: yupResolver(rackSchema),
    defaultValues: EMPTY_RACK_FORM,
    mode: 'onTouched',
  });

  const slotForm = useForm({
    defaultValues: EMPTY_SLOT_FORM,
    mode: 'onSubmit',
  });

  const hasOrganization = !!organization;

  const loadOrg = useCallback(async () => {
    if (!orgId) {
      setOrgLoading(false);
      return;
    }
    setOrgLoading(true);
    setError(null);
    try {
      const org = await organizationService.getById(orgId);
      setOrganization(org);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные организации');
    } finally {
      setOrgLoading(false);
    }
  }, [orgId]);

  useEffect(() => { loadOrg(); }, [loadOrg]);

  useEffect(() => {
    if (!orgLoading && !organization && (isFirstTime || !orgId)) {
      orgForm.reset(EMPTY_ORG_FORM);
      setOrgDialogOpen(true);
    }

  }, [orgLoading, organization, isFirstTime, orgId]);

  const handleOrgEdit = () => {
    orgForm.reset({
      name: organization.name || '',
      shortName: organization.shortName || '',
      unp: organization.unp || '',
      address: organization.address || '',
    });
    setOrgDialogOpen(true);
  };

  const onOrgSave = async (values) => {
    setOrgBusy(true);
    orgForm.clearErrors(['unp', 'name']);
    try {
      const payload = {
        name: values.name.trim(),
        shortName: values.shortName?.trim() || null,
        unp: values.unp.trim(),
        address: values.address.trim(),
      };
      if (hasOrganization) {
        const updated = await organizationService.update(orgId, payload);
        setOrganization(updated);
        notify('Организация обновлена');
      } else {
        const created = await organizationService.create(payload);
        setOrganization(created);
        dispatch(setUser({ ...user, organizationId: created.orgId }));
        const httpService = (await import('../services/httpService')).default;
        await httpService.refreshAccessToken();
        dispatch(fetchProfile());
        notify('Организация создана');
        if (isFirstTime) setSearchParams({}, { replace: true });
        setTabValue(1);
      }
      setOrgDialogOpen(false);
    } catch (err) {
      const handled = applyServerError(err, orgForm.setError, ['unp', 'name']);
      if (!handled) notify(err.message || 'Не удалось сохранить организацию', 'error');
    } finally {
      setOrgBusy(false);
    }
  };

  const handleOrgDelete = async () => {
    setOrgBusy(true);
    try {
      await organizationService.delete(orgId);
      notify('Организация удалена');
      setOrganization(null);
      await refreshWarehouses();
      dispatch(setUser({ ...user, organizationId: null }));
    } catch (err) {
      notify(err.message || 'Не удалось удалить организацию', 'error');
    } finally {
      setOrgBusy(false);
      setOrgDeleteOpen(false);
    }
  };

  const handleWhDialogOpen = (warehouse = null) => {
    if (warehouse) {
      setWhEditing(warehouse);
      whForm.reset({
        name: warehouse.name || '',
        address: warehouse.address || '',
        responsibleUserId: warehouse.responsibleUserId || '',
      });
    } else {
      setWhEditing(null);
      whForm.reset(EMPTY_WH_FORM);
    }
    setWhDialogOpen(true);
  };

  const onWhSave = async (values) => {
    setWhBusy(true);
    try {
      const payload = {
        name: values.name.trim(),
        address: values.address.trim(),
        ...(values.responsibleUserId ? { responsibleUserId: values.responsibleUserId } : {}),
      };
      if (whEditing) {
        await warehouseService.updateWarehouse(whEditing.warehouseId || whEditing.id, payload);
        notify('Склад обновлён');
      } else {
        await warehouseService.createWarehouse({ ...payload, orgId });
        notify('Склад создан');
      }
      setWhDialogOpen(false);
      await refreshWarehouses();
    } catch (err) {
      notify(err.message || 'Не удалось сохранить склад', 'error');
    } finally {
      setWhBusy(false);
    }
  };

  const handleWhDelete = async () => {
    if (!selectedWh) return;
    setWhBusy(true);
    try {
      await warehouseService.deleteWarehouse(selectedWh.warehouseId || selectedWh.id);
      notify('Склад удалён');
      setWhDeleteOpen(false);
      setSelectedWh(null);
      await refreshWarehouses();
    } catch (err) {
      notify(err.message || 'Не удалось удалить склад', 'error');
    } finally {
      setWhBusy(false);
    }
  };

  const loadRacks = async (warehouseId) => {
    setRacksByWh((prev) => ({ ...prev, [warehouseId]: 'loading' }));
    try {
      const list = await warehouseService.getRacksByWarehouse(warehouseId);
      setRacksByWh((prev) => ({
        ...prev,
        [warehouseId]: Array.isArray(list) ? list : (list?.content || []),
      }));
    } catch (err) {
      setRacksByWh((prev) => ({ ...prev, [warehouseId]: 'error' }));
      notify(err.message || 'Не удалось загрузить стеллажи', 'error');
    }
  };

  const loadSlots = async (rackId) => {
    setSlotsByRack((prev) => ({ ...prev, [rackId]: 'loading' }));
    try {
      const data = await warehouseService.getSlotsByRack(rackId);
      setSlotsByRack((prev) => ({
        ...prev,
        [rackId]: { kind: data?.kind, slots: data?.slots || [] },
      }));
    } catch (err) {
      setSlotsByRack((prev) => ({ ...prev, [rackId]: 'error' }));
      notify(err.message || 'Не удалось загрузить слоты', 'error');
    }
  };

  const handleToggleRack = (rackId) => {
    setExpandedRacks((prev) => {
      const next = new Set(prev);
      if (next.has(rackId)) {
        next.delete(rackId);
      } else {
        next.add(rackId);
        if (!slotsByRack[rackId] || slotsByRack[rackId] === 'error') {
          loadSlots(rackId);
        }
      }
      return next;
    });
  };

  const handleToggleWh = (warehouseId) => {
    setExpandedWh((prev) => {
      const next = new Set(prev);
      if (next.has(warehouseId)) {
        next.delete(warehouseId);
      } else {
        next.add(warehouseId);
        if (!racksByWh[warehouseId] || racksByWh[warehouseId] === 'error') {
          loadRacks(warehouseId);
        }
      }
      return next;
    });
  };

  const handleRackDialogOpen = (warehouseId) => {
    rackForm.reset(EMPTY_RACK_FORM);
    setRackDialog({ open: true, warehouseId });
  };

  const onRackSave = async (values) => {
    setRackBusy(true);
    try {
      await warehouseService.createRack({
        warehouseId: rackDialog.warehouseId,
        name: values.name.trim(),
        kind: values.kind,
        storageConditions: values.storageConditions || null,
        maxWeightKg: values.maxWeightKg !== '' && values.maxWeightKg !== null
          ? Number(values.maxWeightKg)
          : null,
      });
      notify('Стеллаж создан');
      setRackDialog({ open: false, warehouseId: null });
      await loadRacks(rackDialog.warehouseId);
    } catch (err) {
      notify(err.message || 'Не удалось создать стеллаж', 'error');
    } finally {
      setRackBusy(false);
    }
  };

  const handleRackDelete = async () => {
    const { rack, warehouseId } = rackDeleteState;
    if (!rack) return;
    setRackBusy(true);
    try {
      await warehouseService.deleteRack(rack.rackId);
      notify('Стеллаж удалён');
      setRackDeleteState({ open: false, rack: null, warehouseId: null });
      await loadRacks(warehouseId);
    } catch (err) {
      notify(err.message || 'Не удалось удалить стеллаж', 'error');
    } finally {
      setRackBusy(false);
    }
  };

  const handleSlotDialogOpen = (rack) => {
    slotForm.reset(EMPTY_SLOT_FORM);
    setSlotDialog({ open: true, rack });
  };

  const onSlotSave = async (raw) => {
    const { rack } = slotDialog;
    if (!rack) return;

    let values;
    if (rack.kind === 'SHELF' || rack.kind === 'CELL') {
      values = {
        lengthCm: raw.lengthCm,
        widthCm: raw.widthCm,
        heightCm: raw.heightCm,
      };
    } else if (rack.kind === 'PALLET') {
      values = {
        palletPlaceCount: raw.palletPlaceCount,
        palletType: raw.palletType,
        maxHeightCm: raw.maxHeightCm,
      };
    } else {
      return;
    }

    const schema = slotSchemaFor(rack.kind);
    let validated;
    try {
      validated = await schema.validate(values, { abortEarly: false });
    } catch (validationError) {
      slotForm.clearErrors();
      (validationError.inner || []).forEach((err) => {
        slotForm.setError(err.path, { type: 'yup', message: err.message });
      });
      return;
    }

    let count = 1;
    if (rack.kind !== 'PALLET') {
      const countRaw = Number(raw.count);
      if (!Number.isFinite(countRaw) || countRaw < 1 || countRaw > 100 || Math.floor(countRaw) !== countRaw) {
        slotForm.setError('count', { type: 'manual', message: 'От 1 до 100' });
        return;
      }
      count = countRaw;
    }

    slotForm.clearErrors('count');
    setSlotBusy(true);
    try {
      for (let i = 0; i < count; i++) {
        if (rack.kind === 'SHELF') {
          await warehouseService.addShelf(rack.rackId, validated);
        } else if (rack.kind === 'CELL') {
          await warehouseService.addCell(rack.rackId, validated);
        } else if (rack.kind === 'PALLET') {
          await warehouseService.addPallet(rack.rackId, validated);
        }
      }
      notify(count > 1 ? `Создано слотов: ${count}` : 'Слот добавлен');
      setSlotDialog({ open: false, rack: null });

      if (expandedRacks.has(rack.rackId)) {
        loadSlots(rack.rackId);
      } else {

        setSlotsByRack((prev) => {
          const next = { ...prev };
          delete next[rack.rackId];
          return next;
        });
      }
    } catch (err) {
      notify(err.message || 'Не удалось добавить слот', 'error');
    } finally {
      setSlotBusy(false);
    }
  };

  if (orgLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Организация
        </Typography>

        {(isFirstTime && !hasOrganization) && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Добро пожаловать! Заполните реквизиты вашей организации.
            После создания вы сможете добавить склады и пригласить сотрудников.
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={loadOrg}>Повторить</Button>}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        <Paper sx={{ borderRadius: 3 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<BusinessIcon />} iconPosition="start" label="Реквизиты организации" />
            <Tab icon={<WarehouseIcon />} iconPosition="start" label="Склады" />
          </Tabs>

          {}
          {tabValue === 0 && (
            <Box sx={{ p: 4 }}>
              {!hasOrganization ? (
                <EmptyState
                  icon={BusinessIcon}
                  title="Организация ещё не создана"
                  actionLabel="Создать организацию"
                  onAction={() => { orgForm.reset(EMPTY_ORG_FORM); setOrgDialogOpen(true); }}
                />
              ) : (
                <>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">Полное наименование</Typography>
                      <Typography variant="body1" mb={2}>{organization.name}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">Краткое наименование</Typography>
                      <Typography variant="body1" mb={2}>{organization.shortName || '—'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">УНП</Typography>
                      <Typography variant="body1" mb={2}>{organization.unp}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary">Статус</Typography>
                      <Chip
                        label={organization.status === 'ACTIVE' ? 'Активна' : 'Архивирована'}
                        color={organization.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </Grid>
                    <Grid size={12}>
                      <Typography variant="subtitle2" color="text.secondary">Адрес</Typography>
                      <Typography variant="body1">{organization.address}</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={handleOrgEdit}>
                      Редактировать
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setOrgDeleteOpen(true)}
                    >
                      Удалить организацию
                    </Button>
                  </Stack>
                </>
              )}
            </Box>
          )}

          {}
          {tabValue === 1 && (
            <Box sx={{ p: 4 }}>
              {!hasOrganization ? (
                <Alert severity="warning">
                  Сначала создайте организацию на вкладке «Реквизиты организации»
                </Alert>
              ) : (
                <>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" fontWeight={600}>
                      Склады организации
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleWhDialogOpen()}
                    >
                      Добавить склад
                    </Button>
                  </Stack>

                  {warehouses.length === 0 ? (
                    <EmptyState
                      icon={WarehouseIcon}
                      title="У вас ещё нет складов"
                      description="Создайте первый склад, чтобы начать заполнять его стеллажами и принимать товар"
                      actionLabel="Добавить первый склад"
                      onAction={() => handleWhDialogOpen()}
                    />
                  ) : (
                    <Grid container spacing={3}>
                      {warehouses.map((wh) => {
                        const id = wh.warehouseId || wh.id;
                        const isExpanded = expandedWh.has(id);
                        const racksState = racksByWh[id];
                        const racks = Array.isArray(racksState) ? racksState : [];
                        const racksLoading = racksState === 'loading';
                        const racksError = racksState === 'error';
                        const racksCount = Array.isArray(racksState) ? racks.length : null;

                        const responsible = wh.responsibleUserId
                          ? employees.find((e) => e.userId === wh.responsibleUserId)
                          : null;

                        return (
                          <Grid size={12} key={id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                  <Box>
                                    <Typography variant="h6" fontWeight={600}>{wh.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{wh.address}</Typography>
                                    {responsible && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Ответственный: <b>{responsible.username || responsible.email}</b>
                                      </Typography>
                                    )}
                                    {wh.responsibleUserId && !responsible && (
                                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                        Ответственный: уволен или недоступен
                                      </Typography>
                                    )}
                                    {wh.isActive === false && (
                                      <Chip label="Неактивен" size="small" sx={{ mt: 1 }} />
                                    )}
                                  </Box>
                                  <Stack direction="row" spacing={0}>
                                    <IconButton size="small" onClick={() => handleWhDialogOpen(wh)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => { setSelectedWh(wh); setWhDeleteOpen(true); }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                </Stack>

                                <Divider sx={{ my: 2 }} />

                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Button
                                    onClick={() => handleToggleWh(id)}
                                    startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                  >
                                    Стеллажи{racksCount !== null ? ` (${racksCount})` : ''}
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleRackDialogOpen(id)}
                                  >
                                    Добавить стеллаж
                                  </Button>
                                </Stack>

                                <Collapse in={isExpanded} timeout="auto">
                                  <Box sx={{ pt: 2 }}>
                                    {racksLoading ? (
                                      <Box display="flex" justifyContent="center" py={3}>
                                        <CircularProgress size={28} />
                                      </Box>
                                    ) : racksError ? (
                                      <Alert
                                        severity="error"
                                        action={
                                          <Button color="inherit" size="small" onClick={() => loadRacks(id)}>
                                            Повторить
                                          </Button>
                                        }
                                      >
                                        Не удалось загрузить стеллажи
                                      </Alert>
                                    ) : racks.length === 0 ? (
                                      <Typography color="text.secondary" textAlign="center" py={3}>
                                        Стеллажей пока нет
                                      </Typography>
                                    ) : (
                                      <TableContainer>
                                        <Table size="small">
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
                                            {racks.map((rack) => {
                                              const Icon = RACK_KIND_ICON[rack.kind];
                                              const slotsState = slotsByRack[rack.rackId];
                                              const slotsExpanded = expandedRacks.has(rack.rackId);
                                              const slotsLoading = slotsState === 'loading';
                                              const slotsError = slotsState === 'error';
                                              const slotsData = (slotsState && slotsState !== 'loading' && slotsState !== 'error') ? slotsState : null;
                                              return (
                                                <React.Fragment key={rack.rackId}>
                                                  <TableRow hover>
                                                    <TableCell>
                                                      <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleRack(rack.rackId)}
                                                      >
                                                        {slotsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                                      </IconButton>
                                                    </TableCell>
                                                    <TableCell>
                                                      <Stack direction="row" spacing={1} alignItems="center">
                                                        {Icon && <Icon fontSize="small" color="action" />}
                                                        <Typography variant="body2">
                                                          {RACK_KIND_LABEL[rack.kind] || rack.kind}
                                                        </Typography>
                                                      </Stack>
                                                    </TableCell>
                                                    <TableCell>{rack.name}</TableCell>
                                                    <TableCell>
                                                      {rack.storageConditions
                                                        ? (STORAGE_CONDITION_OPTIONS.find((o) => o.value === rack.storageConditions)?.label || rack.storageConditions)
                                                        : '—'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                      <Tooltip title="Добавить слот">
                                                        <IconButton
                                                          size="small"
                                                          color="primary"
                                                          onClick={() => handleSlotDialogOpen(rack)}
                                                        >
                                                          <AddIcon fontSize="small" />
                                                        </IconButton>
                                                      </Tooltip>
                                                      <Tooltip title="Удалить стеллаж">
                                                        <IconButton
                                                          size="small"
                                                          color="error"
                                                          onClick={() => setRackDeleteState({ open: true, rack, warehouseId: id })}
                                                        >
                                                          <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                      </Tooltip>
                                                    </TableCell>
                                                  </TableRow>
                                                  <TableRow>
                                                    <TableCell colSpan={5} sx={{ py: 0, borderBottom: slotsExpanded ? undefined : 'none' }}>
                                                      <Collapse in={slotsExpanded} timeout="auto">
                                                        <Box sx={{ py: 2 }}>
                                                          {slotsLoading ? (
                                                            <Box display="flex" justifyContent="center" py={2}>
                                                              <CircularProgress size={24} />
                                                            </Box>
                                                          ) : slotsError ? (
                                                            <Alert
                                                              severity="error"
                                                              action={<Button size="small" onClick={() => loadSlots(rack.rackId)}>Повторить</Button>}
                                                            >
                                                              Не удалось загрузить слоты
                                                            </Alert>
                                                          ) : !slotsData || slotsData.slots.length === 0 ? (
                                                            <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                                                              Слотов пока нет
                                                            </Typography>
                                                          ) : (
                                                            <RackSlotsTable kind={slotsData.kind} slots={slotsData.slots} rack={rack} onRenamed={() => loadSlots(rack.rackId)} />
                                                          )}
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
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </>
              )}
            </Box>
          )}
        </Paper>

        {}
        <Dialog open={orgDialogOpen} onClose={() => !orgBusy && setOrgDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{hasOrganization ? 'Редактировать организацию' : 'Создать организацию'}</DialogTitle>
          <form onSubmit={orgForm.handleSubmit(onOrgSave)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Полное наименование"
                  fullWidth
                  disabled={orgBusy}
                  {...orgForm.register('name')}
                  error={!!orgForm.formState.errors.name}
                  helperText={orgForm.formState.errors.name?.message}
                />
                <TextField
                  label="Краткое наименование"
                  fullWidth
                  disabled={orgBusy}
                  {...orgForm.register('shortName')}
                  error={!!orgForm.formState.errors.shortName}
                  helperText={orgForm.formState.errors.shortName?.message}
                />
                <TextField
                  label="УНП"
                  fullWidth
                  disabled={orgBusy}
                  {...orgForm.register('unp')}
                  error={!!orgForm.formState.errors.unp}
                  helperText={orgForm.formState.errors.unp?.message || '9 цифр'}
                />
                <TextField
                  label="Юридический адрес"
                  fullWidth
                  disabled={orgBusy}
                  {...orgForm.register('address')}
                  error={!!orgForm.formState.errors.address}
                  helperText={orgForm.formState.errors.address?.message}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOrgDialogOpen(false)} disabled={orgBusy}>Отмена</Button>
              <Button variant="contained" type="submit" disabled={orgBusy}>
                {orgBusy ? <CircularProgress size={20} color="inherit" /> : (hasOrganization ? 'Сохранить' : 'Создать')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <ConfirmDialog
          open={orgDeleteOpen}
          onClose={() => setOrgDeleteOpen(false)}
          onConfirm={handleOrgDelete}
          title="Удаление организации"
          message={<>Удалить организацию <b>{organization?.name}</b>? Все склады, сотрудники и связанные данные будут отвязаны.</>}
          confirmText="Удалить"
          confirmColor="error"
          busy={orgBusy}
        />

        {}
        <Dialog open={whDialogOpen} onClose={() => !whBusy && setWhDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>{whEditing ? 'Редактировать склад' : 'Новый склад'}</DialogTitle>
          <form onSubmit={whForm.handleSubmit(onWhSave)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Название"
                  fullWidth
                  disabled={whBusy}
                  {...whForm.register('name')}
                  error={!!whForm.formState.errors.name}
                  helperText={whForm.formState.errors.name?.message}
                />
                <TextField
                  label="Адрес"
                  fullWidth
                  disabled={whBusy}
                  {...whForm.register('address')}
                  error={!!whForm.formState.errors.address}
                  helperText={whForm.formState.errors.address?.message}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setWhDialogOpen(false)} disabled={whBusy}>Отмена</Button>
              <Button variant="contained" type="submit" disabled={whBusy}>
                {whBusy ? <CircularProgress size={20} color="inherit" /> : (whEditing ? 'Сохранить' : 'Создать')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <ConfirmDialog
          open={whDeleteOpen}
          onClose={() => setWhDeleteOpen(false)}
          onConfirm={handleWhDelete}
          title="Удаление склада"
          message={<>Удалить склад <b>{selectedWh?.name}</b>? Это действие необратимо.</>}
          confirmText="Удалить"
          confirmColor="error"
          busy={whBusy}
        />

        {}
        <Dialog
          open={rackDialog.open}
          onClose={() => !rackBusy && setRackDialog({ open: false, warehouseId: null })}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Новый стеллаж</DialogTitle>
          <form onSubmit={rackForm.handleSubmit(onRackSave)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  label="Название"
                  fullWidth
                  disabled={rackBusy}
                  {...rackForm.register('name')}
                  error={!!rackForm.formState.errors.name}
                  helperText={rackForm.formState.errors.name?.message}
                />
                <Controller
                  name="kind"
                  control={rackForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!rackForm.formState.errors.kind}>
                      <InputLabel>Тип</InputLabel>
                      <Select {...field} label="Тип" variant="outlined" disabled={rackBusy}>
                        {RACK_KIND_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                      {rackForm.formState.errors.kind && (
                        <FormHelperText>{rackForm.formState.errors.kind.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
                <Controller
                  name="storageConditions"
                  control={rackForm.control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!rackForm.formState.errors.storageConditions}>
                      <InputLabel>Условия хранения</InputLabel>
                      <Select {...field} label="Условия хранения" variant="outlined" disabled={rackBusy}>
                        {STORAGE_CONDITION_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value || 'none'} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                      {rackForm.formState.errors.storageConditions && (
                        <FormHelperText>{rackForm.formState.errors.storageConditions.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
                <TextField
                  label="Грузоподъёмность всего стеллажа (кг)"
                  type="number"
                  fullWidth
                  disabled={rackBusy}
                  helperText={rackForm.formState.errors.maxWeightKg?.message
                    || 'Общий лимит веса на стеллаж; слоты добавляются без собственного лимита'}
                  error={!!rackForm.formState.errors.maxWeightKg}
                  {...rackForm.register('maxWeightKg')}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRackDialog({ open: false, warehouseId: null })} disabled={rackBusy}>
                Отмена
              </Button>
              <Button variant="contained" type="submit" disabled={rackBusy}>
                {rackBusy ? <CircularProgress size={20} color="inherit" /> : 'Создать'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <ConfirmDialog
          open={rackDeleteState.open}
          onClose={() => setRackDeleteState({ open: false, rack: null, warehouseId: null })}
          onConfirm={handleRackDelete}
          title="Удаление стеллажа"
          message={<>Удалить стеллаж <b>{rackDeleteState.rack?.name}</b>? Все слоты (полки/ячейки/паллеты) внутри будут удалены вместе со стеллажом.</>}
          confirmText="Удалить"
          confirmColor="error"
          busy={rackBusy}
        />

        {}
        <Dialog
          open={slotDialog.open}
          onClose={() => !slotBusy && setSlotDialog({ open: false, rack: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Новый слот ({slotDialog.rack ? RACK_KIND_LABEL[slotDialog.rack.kind] : ''})
          </DialogTitle>
          <form onSubmit={slotForm.handleSubmit(onSlotSave)} noValidate>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                {(slotDialog.rack?.kind === 'SHELF' || slotDialog.rack?.kind === 'CELL'
                  || slotDialog.rack?.kind === 'PALLET') && (
                  <Alert severity="info" sx={{ borderRadius: 1 }}>
                    Грузоподъёмность задана на уровне стеллажа: <b>{slotDialog.rack?.maxWeightKg ?? '—'} кг</b>.
                    Для каждого слота вводятся только габариты{slotDialog.rack?.kind === 'PALLET' ? ', количество паллетомест и высота слота' : ''}.
                  </Alert>
                )}

                {slotDialog.rack?.kind === 'PALLET' ? (
                  <>
                    <TextField
                      label="Кол-во паллетомест"
                      type="number"
                      fullWidth
                      disabled={slotBusy}
                      {...slotForm.register('palletPlaceCount')}
                      error={!!slotForm.formState.errors.palletPlaceCount}
                      helperText={slotForm.formState.errors.palletPlaceCount?.message}
                    />
                    <Controller
                      name="palletType"
                      control={slotForm.control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!slotForm.formState.errors.palletType}>
                          <InputLabel>Тип паллета</InputLabel>
                          <Select {...field} label="Тип паллета" variant="outlined" disabled={slotBusy}>
                            {PALLET_TYPE_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                    <TextField
                      label="Высота слота, см"
                      type="number"
                      fullWidth
                      disabled={slotBusy}
                      {...slotForm.register('maxHeightCm')}
                      error={!!slotForm.formState.errors.maxHeightCm}
                      helperText={slotForm.formState.errors.maxHeightCm?.message
                        || 'Максимальная высота паллета, помещающегося на слот'}
                    />
                  </>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Длина, см"
                      type="number"
                      fullWidth
                      disabled={slotBusy}
                      {...slotForm.register('lengthCm')}
                      error={!!slotForm.formState.errors.lengthCm}
                      helperText={slotForm.formState.errors.lengthCm?.message}
                    />
                    <TextField
                      label="Ширина, см"
                      type="number"
                      fullWidth
                      disabled={slotBusy}
                      {...slotForm.register('widthCm')}
                      error={!!slotForm.formState.errors.widthCm}
                      helperText={slotForm.formState.errors.widthCm?.message}
                    />
                    <TextField
                      label="Высота, см"
                      type="number"
                      fullWidth
                      disabled={slotBusy}
                      {...slotForm.register('heightCm')}
                      error={!!slotForm.formState.errors.heightCm}
                      helperText={slotForm.formState.errors.heightCm?.message}
                    />
                  </Stack>
                )}

                {slotDialog.rack?.kind !== 'PALLET' && (
                  <TextField
                    label="Создать одинаковых, шт"
                    type="number"
                    fullWidth
                    disabled={slotBusy}
                    inputProps={{ min: 1, max: 100 }}
                    {...slotForm.register('count')}
                    error={!!slotForm.formState.errors.count}
                    helperText={slotForm.formState.errors.count?.message || 'От 1 до 100 — сколько одинаковых слотов создать'}
                  />
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSlotDialog({ open: false, rack: null })} disabled={slotBusy}>
                Отмена
              </Button>
              <Button variant="contained" type="submit" disabled={slotBusy}>
                {slotBusy ? <CircularProgress size={20} color="inherit" /> : 'Добавить'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
};

const SlotStatusChip = ({ slot }) => {
  const occupied = slot?.occupied === true;
  return (
    <Chip
      size="small"
      color={occupied ? 'warning' : 'success'}
      label={occupied ? 'Занята' : 'Доступна'}
      sx={{ minWidth: 92 }}
    />
  );
};

const SlotLoadCell = ({ slot, capacityKg }) => {
  const itemsCount = slot?.itemsCount ?? 0;
  const totalQuantity = slot?.totalQuantity ?? 0;
  const cap = capacityKg ? Number(capacityKg) : null;
  const used = Number(totalQuantity) || 0;
  const percent = cap && cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : null;

  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {itemsCount > 0 ? `${itemsCount} позиций · ${used}` : 'Пусто'}
        {cap ? ` / ${cap} кг` : ''}
      </Typography>
      {percent !== null && (
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{ mt: 0.5, height: 4, borderRadius: 1 }}
          color={percent >= 90 ? 'error' : percent >= 60 ? 'warning' : 'success'}
        />
      )}
    </Box>
  );
};

const SlotCodeCell = ({ slot, onRenamed }) => {
  const { notify } = useSnackbar();
  const slotId = slot.cellId || slot.shelfId || slot.placeId || slot.id;
  const current = slot.slotCode || slot.cellCode || '';
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const code = (value || '').trim();
    if (!code || code === current) {
      setEditing(false);
      setValue(current);
      return;
    }
    setBusy(true);
    try {
      await warehouseService.renameSlotCode(slotId, code);
      notify('Код ячейки обновлён');
      setEditing(false);
      onRenamed?.();
    } catch (err) {
      notify(err?.data?.message || err?.message || 'Не удалось изменить код', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <b>{current || '—'}</b>
        {slotId && (
          <Tooltip title="Изменить код">
            <IconButton size="small" onClick={() => { setValue(current); setEditing(true); }}>
              <EditIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <TextField
        size="small"
        value={value}
        autoFocus
        disabled={busy}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') { setEditing(false); setValue(current); }
        }}
        inputProps={{ maxLength: 32, style: { padding: '4px 8px', width: 90 } }}
      />
      <IconButton size="small" color="primary" onClick={save} disabled={busy}>
        <CheckIcon sx={{ fontSize: 17 }} />
      </IconButton>
      <IconButton size="small" onClick={() => { setEditing(false); setValue(current); }} disabled={busy}>
        <CloseIcon sx={{ fontSize: 17 }} />
      </IconButton>
    </Stack>
  );
};

const RackSlotsTable = ({ kind, slots, rack, onRenamed }) => {
  const dims = (s) => `${s.lengthCm ?? '—'}×${s.widthCm ?? '—'}×${s.heightCm ?? '—'}`;
  const rackCapacityKg = rack?.maxWeightKg ?? null;

  if (kind === 'SHELF') {
    const occupiedCount = slots.filter((s) => s.occupied).length;
    return (
      <>
        {rackCapacityKg != null && (
          <Box sx={{ mb: 1, px: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Грузоподъёмность стеллажа: <b>{rackCapacityKg} кг</b> · занято полок: <b>{occupiedCount}/{slots.length}</b>
            </Typography>
          </Box>
        )}
        <Table size="small" sx={{ bgcolor: 'background.default' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>№</TableCell>
              <TableCell>Код</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Загрузка</TableCell>
              <TableCell>Габариты Д×Ш×В, см</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slots.map((s, i) => (
              <TableRow key={s.shelfId || s.id || i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><SlotCodeCell slot={s} onRenamed={onRenamed} /></TableCell>
                <TableCell><SlotStatusChip slot={s} /></TableCell>
                <TableCell><SlotLoadCell slot={s} capacityKg={null} /></TableCell>
                <TableCell>{dims(s)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  }

  if (kind === 'CELL') {
    const totalLoad = slots.reduce((acc, s) => acc + Number(s.totalQuantity || 0), 0);
    const occupiedCount = slots.filter((s) => s.occupied).length;
    return (
      <>
        {rackCapacityKg != null && (
          <Box sx={{ mb: 1, px: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Грузоподъёмность стеллажа: <b>{rackCapacityKg} кг</b> ·
              {' '}занято ячеек: <b>{occupiedCount}/{slots.length}</b> ·
              {' '}суммарно: <b>{totalLoad}</b>
            </Typography>
          </Box>
        )}
        <Table size="small" sx={{ bgcolor: 'background.default' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>№</TableCell>
              <TableCell>Код</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Загрузка</TableCell>
              <TableCell>Габариты Д×Ш×В, см</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slots.map((s, i) => (
              <TableRow key={s.cellId || s.id || i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><SlotCodeCell slot={s} onRenamed={onRenamed} /></TableCell>
                <TableCell><SlotStatusChip slot={s} /></TableCell>
                <TableCell><SlotLoadCell slot={s} capacityKg={null} /></TableCell>
                <TableCell>{dims(s)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  }

  if (kind === 'PALLET') {
    const occupiedCount = slots.filter((s) => s.occupied).length;
    const palletDims = (s) => `${s.lengthCm ?? '—'}×${s.widthCm ?? '—'}`;
    const maxH = (s) => (s.maxHeightCm != null ? `${s.maxHeightCm} см` : '— (без ограничения)');
    return (
      <>
        {rackCapacityKg != null && (
          <Box sx={{ mb: 1, px: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Грузоподъёмность стеллажа: <b>{rackCapacityKg} кг</b> · занято паллетомест: <b>{occupiedCount}/{slots.length}</b>
            </Typography>
          </Box>
        )}
        <Table size="small" sx={{ bgcolor: 'background.default' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>№</TableCell>
              <TableCell>Код</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Загрузка</TableCell>
              <TableCell>Поддон Д×Ш, см</TableCell>
              <TableCell>Макс. высота груза</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slots.map((s, i) => (
              <TableRow key={s.placeId || s.id || i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><SlotCodeCell slot={s} onRenamed={onRenamed} /></TableCell>
                <TableCell><SlotStatusChip slot={s} /></TableCell>
                <TableCell><SlotLoadCell slot={s} capacityKg={null} /></TableCell>
                <TableCell>{palletDims(s)}</TableCell>
                <TableCell>{maxH(s)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    );
  }

  return null;
};

export default OrganizationPage;
