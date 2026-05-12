import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Button, IconButton, Chip, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, CircularProgress, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import erpExtractorService from '../services/erpExtractorService';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';

const formatDate = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const ErpExtractorPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const [tab, setTab] = useState(0);
  const [pending, setPending] = useState([]);
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('api');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (user && !orgId) {
      navigate('/main/organization?firstTime=true', { replace: true });
    }
  }, [user, orgId, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, l] = await Promise.all([
        erpExtractorService.getPendingDeliveries().catch(() => []),
        erpExtractorService.getLog().catch(() => null),
      ]);
      setPending(Array.isArray(p) ? p : (p?.content || []));
      setLog(l);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить данные', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await erpExtractorService.run(mode);
      const items = res?.itemsExtracted ?? res?.itemCount ?? 0;
      notify(`Извлечение завершено · позиций: ${items}`);
      await load();
    } catch (err) {
      notify(err.message || 'Не удалось запустить извлечение', 'error');
    } finally {
      setRunning(false);
    }
  };

  if (!user || !orgId) return null;

  const logEntries = log && typeof log === 'object'
    ? Object.entries(log).flatMap(([source, runs]) =>
        Array.isArray(runs) ? runs.map((r) => ({ source, ...r })) : [])
    : [];

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} mb={3}>ERP Extractor (RPA)</Typography>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Источник</InputLabel>
                <Select
                  value={mode}
                  label="Источник"
                  variant="outlined"
                  onChange={(e) => setMode(e.target.value)}
                  disabled={running}
                >
                  <MenuItem value="api">API (REST интеграция)</MenuItem>
                  <MenuItem value="rpa">RPA (Jsoup HTML-скрапинг)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={running ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleRun}
                  disabled={running}
                  size="large"
                >
                  {running ? 'Извлекаем...' : 'Запустить извлечение'}
                </Button>
                <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading || running}>
                  Обновить
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ borderRadius: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={`Ожидающие поставки (${pending.length})`} />
            <Tab label="Журнал запусков" />
          </Tabs>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : tab === 0 ? (
            pending.length === 0 ? (
              <EmptyState
                icon={CloudSyncIcon}
                title="Ожидающих поставок нет"
                description="Запустите извлечение, чтобы подгрузить новые поставки из внешней ERP"
                sx={{ py: 6 }}
              />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>External ID</TableCell>
                      <TableCell>Поставщик</TableCell>
                      <TableCell>Дата поступления</TableCell>
                      <TableCell align="right">Позиций</TableCell>
                      <TableCell>Статус</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pending.map((d, i) => (
                      <TableRow key={d.externalId || d.id || i} hover>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {d.externalId || d.id || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{d.supplierName || d.supplier || '—'}</TableCell>
                        <TableCell>{d.expectedDate || d.deliveryDate || '—'}</TableCell>
                        <TableCell align="right">{d.itemsCount ?? d.totalItems ?? '—'}</TableCell>
                        <TableCell>
                          {d.status && <Chip label={d.status} size="small" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (

            logEntries.length === 0 ? (
              <EmptyState title="Журнал пуст" description="Запусков ещё не было" sx={{ py: 6 }} />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Источник</TableCell>
                      <TableCell>Когда</TableCell>
                      <TableCell align="right">Извлечено</TableCell>
                      <TableCell align="right">Время, мс</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Сообщение</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logEntries.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Chip label={entry.source?.toUpperCase() || '—'} size="small" />
                        </TableCell>
                        <TableCell>{formatDate(entry.runAt || entry.timestamp)}</TableCell>
                        <TableCell align="right">{entry.itemsExtracted ?? entry.itemCount ?? '—'}</TableCell>
                        <TableCell align="right">{entry.runtimeMs ?? '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={entry.success === false ? 'Ошибка' : 'OK'}
                            color={entry.success === false ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{entry.message || '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default ErpExtractorPage;
