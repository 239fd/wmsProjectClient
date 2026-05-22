import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Paper, Stack, Typography, Button,
  Chip, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import supplyService from '../../services/supplyService';
import { useSnackbar } from '../../context/SnackbarContext';
import ImportSupplyDialog from './ImportSupplyDialog';
import CreateSupplyDialog from './CreateSupplyDialog';
import ConfirmDialog from '../shared/ConfirmDialog';
import EmptyState from '../shared/EmptyState';
import { TableSkeleton } from '../shared/LoadingSkeleton';

const STATUS_TABS = [
  { value: 'PLANNED',     label: 'Плановые' },
  { value: 'IN_PROGRESS', label: 'В процессе' },
  { value: 'ACCEPTED',    label: 'Принятые' },
  { value: 'CANCELLED',   label: 'Отменённые' },
];

const STATUS_LABEL = {
  PLANNED: 'План',
  IN_PROGRESS: 'В процессе',
  ACCEPTED: 'Принята',
  REJECTED: 'Отклонена',
  CANCELLED: 'Отменена',
};

const SOURCE_LABEL = {
  '1C-Python': '1С (RPA)',
  'JSON': 'JSON',
  'MANUAL': 'Вручную',
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('ru-RU'); } catch { return String(iso); }
};

const SuppliesSection = ({ onPickReceive, refreshSignal = 0 }) => {
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const [status, setStatus] = useState('PLANNED');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const totalAcrossAll = Object.values(counts).reduce((s, n) => s + (n || 0), 0);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await supplyService.list({ status, size: 50 });
      const content = res?.content || res || [];
      setItems(Array.isArray(content) ? content : []);
    } catch (err) {
      notify(err?.message || 'Не удалось загрузить поставки', 'error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, status, notify]);

  const loadCounts = useCallback(async () => {
    if (!orgId) return;
    const result = {};
    await Promise.all(STATUS_TABS.map(async (tab) => {
      try {
        const res = await supplyService.list({ status: tab.value, size: 1 });
        result[tab.value] = res?.totalElements ?? (Array.isArray(res?.content) ? res.content.length : 0);
      } catch {
        result[tab.value] = 0;
      }
    }));
    setCounts(result);
  }, [orgId]);

  useEffect(() => { load(); }, [load, refreshSignal]);
  useEffect(() => { loadCounts(); }, [loadCounts, refreshSignal]);

  const handleImported = () => { load(); loadCounts(); };
  const handleSaved = () => {
    setStatus('PLANNED');
    load();
    loadCounts();
  };

  const resolveId = (row) =>
    row?.supplyId || row?.supply_id || row?.id || null;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = resolveId(deleteTarget);
    if (!id) {
      notify('ID поставки не определён — обновите страницу', 'error');
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await supplyService.cancel(id);
      notify('Поставка удалена');
      setDeleteTarget(null);
      load();
      loadCounts();
    } catch (err) {
      notify(err?.data?.message || err?.message || 'Не удалось удалить', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStartReceive = (supply) => {
    onPickReceive?.(supply);
  };

  const tabLabel = (tab) => (
    <Stack direction="row" alignItems="center" spacing={1}>
      <span>{tab.label}</span>
      <Chip size="small" label={counts[tab.value] ?? 0} />
    </Stack>
  );

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        gap={2}
        mb={2}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" fontWeight={700}>Плановые поставки</Typography>
          <Typography variant="caption" color="text.secondary">
            Импорт из 1С (RPA) или JSON-файла. Создание вручную доступно с детализацией
            или «только количество позиций».
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Tooltip title="Обновить">
            <span>
              <IconButton onClick={() => { load(); loadCounts(); }} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={() => setImportOpen(true)}
          >
            Запарсить
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Создать вручную
          </Button>
        </Stack>
      </Stack>

      {!loading && totalAcrossAll === 0 ? (
        <EmptyState
          title="Плановых поставок пока нет"
          description="Запарсите из 1С (кнопка «Запарсить») или создайте поставку вручную"
        />
      ) : (
        <>
          <Tabs
            value={status}
            onChange={(_, v) => setStatus(v)}
            sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none' } }}
          >
            {STATUS_TABS.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tabLabel(tab)} />
            ))}
          </Tabs>

          {loading ? (
            <TableSkeleton rows={5} columns={7} />
          ) : items.length === 0 ? (
            <EmptyState
              title={`В статусе «${STATUS_LABEL[status]}» пусто`}
              description="Переключите вкладку или загрузите новые поставки"
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>External ID</TableCell>
                    <TableCell>Поставщик</TableCell>
                    <TableCell>Дата</TableCell>
                    <TableCell align="right">Позиций</TableCell>
                    <TableCell>Источник</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((s, idx) => {
                    const id = resolveId(s);
                    const status = s.status || s.supply_status || 'PLANNED';
                    const externalId = s.externalId || s.external_id;
                    const supplierName = s.supplierName || s.supplier_name;
                    const expectedDate = s.expectedDate || s.expected_date;
                    const totalItems = s.totalItems ?? s.total_items ?? 0;
                    const source = s.source || s.import_source;
                    const quantityOnly = s.quantityOnly ?? s.quantity_only;
                    const isPlanned = status === 'PLANNED';
                    const hasId = !!id;
                    return (
                      <TableRow key={id || `row-${idx}`} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {externalId || '—'}
                          </Typography>
                          {quantityOnly && (
                            <Chip size="small" label="quantity-only" sx={{ mt: 0.5 }} />
                          )}
                        </TableCell>
                        <TableCell>{supplierName || '—'}</TableCell>
                        <TableCell>{fmtDate(expectedDate)}</TableCell>
                        <TableCell align="right">{totalItems}</TableCell>
                        <TableCell>
                          <Chip size="small" label={SOURCE_LABEL[source] || source || '—'} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={STATUS_LABEL[status] || status}
                            color={
                              status === 'ACCEPTED' ? 'success'
                                : status === 'IN_PROGRESS' ? 'warning'
                                : status === 'PLANNED' ? 'primary'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {isPlanned && (
                              <>
                                <Tooltip title={hasId ? 'Изменить' : 'ID не определён'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => setEditTarget(s)}
                                      disabled={!hasId}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title={hasId ? 'Удалить' : 'ID не определён'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => setDeleteTarget(s)}
                                      disabled={!hasId}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </>
                            )}
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={isPlanned ? <PlayArrowIcon /> : <CallReceivedIcon />}
                              disabled={!hasId || (!isPlanned && status !== 'IN_PROGRESS')}
                              onClick={() => handleStartReceive({ ...s, supplyId: id })}
                            >
                              {isPlanned ? 'Принять' : 'Открыть'}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}

      <ImportSupplyDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={handleImported}
      />
      <CreateSupplyDialog
        open={createOpen || !!editTarget}
        supply={editTarget}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить плановую поставку"
        message={deleteTarget
          ? <>Удалить поставку <b>{deleteTarget.externalId || deleteTarget.supplyId}</b>? Действие необратимо.</>
          : ''}
        confirmText="Удалить"
        confirmColor="error"
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Paper>
  );
};

export default SuppliesSection;
