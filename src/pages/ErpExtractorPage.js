import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Button, Chip, Grid, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, CircularProgress, MenuItem, Select, InputLabel, FormControl,
  Alert, Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import erpExtractorService from '../services/erpExtractorService';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';

const formatDate = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const AGGREGATORS = [
  {
    value: 'onec',
    label: '1С (толстый клиент, WinAppDriver)',
    description: 'Read-only парсинг журнала «Заказы поставщикам». Требует запущенный WinAppDriver на 127.0.0.1:4723 и открытое окно 1С.',
    fields: ['username', 'password', 'basePath', 'sectionName', 'journalName'],
    defaults: {
      sectionName: 'Закупки',
      journalName: 'Заказы поставщикам',
    },
  },
  {
    value: 'api',
    label: 'Mock REST API (dev)',
    description: 'Тестовая REST-заглушка mock-erp для разработки. Credentials и путь не требуются.',
    fields: [],
    defaults: {},
  },
  {
    value: 'rpa',
    label: 'Mock HTML scraping (dev)',
    description: 'Тестовый Jsoup-скрапинг mock-erp. Credentials и путь не требуются.',
    fields: [],
    defaults: {},
  },
];

const FIELD_META = {
  username: { label: 'Пользователь 1С', placeholder: 'Например: Администратор (ФедоровБМ)', required: true },
  password: { label: 'Пароль', placeholder: 'оставьте пустым, если без пароля', type: 'password', required: false },
  basePath: { label: 'Путь к базе', placeholder: 'C:\\Users\\...\\utdemo  или  /F"srvr=...;ref=..."', required: true },
  sectionName: { label: 'Раздел', placeholder: 'Закупки', required: true },
  journalName: { label: 'Журнал', placeholder: 'Заказы поставщикам', required: true },
};

const ErpExtractorPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const [tab, setTab] = useState(0);
  const [pending, setPending] = useState([]);
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('select');
  const [aggregator, setAggregator] = useState('onec');
  const [creds, setCreds] = useState({
    username: '', password: '', basePath: '',
    sectionName: 'Закупки', journalName: 'Заказы поставщикам',
  });
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

  const handleStartFlow = () => {
    const agg = AGGREGATORS.find((a) => a.value === aggregator);
    if (!agg) return;
    if (agg.fields.length === 0) {
      runExtraction(null);
      return;
    }
    setCreds((prev) => ({ ...prev, ...agg.defaults }));
    setStep('credentials');
  };

  const runExtraction = async (connection) => {
    setRunning(true);
    try {
      const res = await erpExtractorService.run(aggregator, connection);
      const items = res?.itemsExtracted ?? res?.itemCount ?? res?.new ?? 0;
      notify(`Извлечение завершено · позиций: ${items}`);
      setStep('select');
      await load();
    } catch (err) {
      notify(err.message || 'Не удалось запустить извлечение', 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCreds = () => {
    const agg = AGGREGATORS.find((a) => a.value === aggregator);
    const missing = agg.fields.filter((f) => FIELD_META[f].required && !String(creds[f] || '').trim());
    if (missing.length > 0) {
      notify(`Заполните обязательные поля: ${missing.map((f) => FIELD_META[f].label).join(', ')}`, 'warning');
      return;
    }
    const connection = { aggregator };
    agg.fields.forEach((f) => { connection[f] = creds[f] || null; });
    runExtraction(connection);
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

        {step === 'select' && (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Выбор агрегатора (ERP)</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Агрегатор</InputLabel>
                  <Select
                    value={aggregator}
                    label="Агрегатор"
                    variant="outlined"
                    onChange={(e) => setAggregator(e.target.value)}
                    disabled={running}
                  >
                    {AGGREGATORS.map((a) => (
                      <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartFlow}
                    disabled={running}
                    size="large"
                  >
                    Далее
                  </Button>
                  <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading || running}>
                    Обновить
                  </Button>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  {AGGREGATORS.find((a) => a.value === aggregator)?.description}
                </Alert>
              </Grid>
            </Grid>
          </Paper>
        )}

        {step === 'credentials' && (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Параметры подключения · {AGGREGATORS.find((a) => a.value === aggregator)?.label}
              </Typography>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setStep('select')}
                disabled={running}
              >
                К выбору
              </Button>
            </Stack>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Сейчас параметры читаются из <code>rpa.properties</code> на бэке — поля формы передаются, но
              бэкенд их пока игнорирует. См. PLAN.md §2.7 (backend backlog).
            </Alert>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {AGGREGATORS.find((a) => a.value === aggregator)?.fields.map((f) => {
                const meta = FIELD_META[f];
                return (
                  <Grid key={f} size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label={meta.label + (meta.required ? ' *' : '')}
                      placeholder={meta.placeholder}
                      type={meta.type || 'text'}
                      value={creds[f] || ''}
                      onChange={(e) => setCreds((prev) => ({ ...prev, [f]: e.target.value }))}
                      disabled={running}
                      size="small"
                    />
                  </Grid>
                );
              })}
            </Grid>
            <Stack direction="row" spacing={2} mt={3}>
              <Button
                variant="contained"
                startIcon={running ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleSubmitCreds}
                disabled={running}
                size="large"
              >
                {running ? 'Извлекаем…' : 'Запустить извлечение'}
              </Button>
              <Button onClick={() => setStep('select')} disabled={running}>
                Отмена
              </Button>
            </Stack>
          </Paper>
        )}

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
