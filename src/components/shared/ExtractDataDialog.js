import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Grid,
  FormControl, InputLabel, Select, MenuItem, TextField, Alert, Divider,
  Typography, CircularProgress, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import erpExtractorService from '../../services/erpExtractorService';
import erpConnectionService from '../../services/erpConnectionService';
import { useSnackbar } from '../../context/SnackbarContext';

const AGGREGATORS = [
  {
    value: 'onec',
    label: '1С (толстый клиент, WinAppDriver)',
    description: 'Read-only парсинг журнала «Заказы поставщикам». Требует запущенный WinAppDriver на 127.0.0.1:4723 и открытое окно 1С.',
    fields: ['username', 'password', 'basePath', 'sectionName', 'journalName'],
    defaults: { sectionName: 'Закупки', journalName: 'Заказы поставщикам' },
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

const ExtractDataDialog = ({ open, onClose, onExtracted }) => {
  const { notify } = useSnackbar();
  const [step, setStep] = useState('select');
  const [aggregator, setAggregator] = useState('onec');
  const [creds, setCreds] = useState({
    username: '', password: '', basePath: '',
    sectionName: 'Закупки', journalName: 'Заказы поставщикам',
  });
  const [running, setRunning] = useState(false);
  const [savedConnections, setSavedConnections] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [saveAsConnection, setSaveAsConnection] = useState(false);
  const [connectionName, setConnectionName] = useState('');

  useEffect(() => {
    if (open) {
      setStep('select');
      setAggregator('onec');
      setRunning(false);
      setSelectedConnectionId('');
      setSaveAsConnection(false);
      setConnectionName('');
      erpConnectionService.list()
          .then((list) => setSavedConnections(Array.isArray(list) ? list : []))
          .catch(() => setSavedConnections([]));
    }
  }, [open]);

  const agg = AGGREGATORS.find((a) => a.value === aggregator);

  const runExtraction = async (body) => {
    setRunning(true);
    try {
      const res = await erpExtractorService.run(aggregator, body);
      const added = res?.newDeliveries ?? res?.savedCount ?? res?.new ?? res?.itemsExtracted ?? 0;
      notify(added > 0 ? `Извлечено новых поставок: ${added}` : 'Новых поставок нет');
      onExtracted?.();
      onClose();
    } catch (err) {
      notify(err.message || 'Не удалось извлечь данные', 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleStartFlow = () => {
    if (selectedConnectionId) {
      runExtraction({ connectionId: selectedConnectionId });
      return;
    }
    if (agg.fields.length === 0) {
      runExtraction(null);
      return;
    }
    setCreds((prev) => ({ ...prev, ...agg.defaults }));
    setStep('credentials');
  };

  const handleSubmitCreds = async () => {
    const missing = agg.fields.filter((f) => FIELD_META[f].required && !String(creds[f] || '').trim());
    if (missing.length > 0) {
      notify(`Заполните обязательные поля: ${missing.map((f) => FIELD_META[f].label).join(', ')}`, 'warning');
      return;
    }
    const body = { aggregator };
    agg.fields.forEach((f) => { body[f] = creds[f] || null; });

    if (saveAsConnection) {
      try {
        const saved = await erpConnectionService.create({
          aggregator,
          name: connectionName?.trim() || `${agg.label} ${new Date().toLocaleDateString('ru-RU')}`,
          username: body.username,
          password: body.password,
          basePath: body.basePath,
          sectionName: body.sectionName,
          journalName: body.journalName,
          driverUrl: body.driverUrl,
          isDefault: false,
        });
        notify(`Подключение сохранено: ${saved.name}`);
        setSavedConnections((prev) => [saved, ...prev]);
      } catch (err) {
        notify(`Не удалось сохранить подключение: ${err.message || ''}`, 'warning');
      }
    }

    runExtraction(body);
  };

  const filteredConnections = savedConnections.filter((c) => c.aggregator === aggregator);

  return (
    <Dialog open={open} onClose={running ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          {step === 'select' ? 'Выбор агрегатора ERP' : `Параметры · ${agg.label}`}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={running}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {step === 'select' && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Агрегатор</InputLabel>
              <Select
                value={aggregator}
                label="Агрегатор"
                variant="outlined"
                onChange={(e) => { setAggregator(e.target.value); setSelectedConnectionId(''); }}
                disabled={running}
              >
                {AGGREGATORS.map((a) => (
                  <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info">{agg.description}</Alert>
            {filteredConnections.length > 0 && (
              <FormControl fullWidth>
                <InputLabel>Сохранённое подключение</InputLabel>
                <Select
                  value={selectedConnectionId}
                  label="Сохранённое подключение"
                  variant="outlined"
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  disabled={running}
                >
                  <MenuItem value=""><em>Новые параметры</em></MenuItem>
                  {filteredConnections.map((c) => (
                    <MenuItem key={c.connectionId} value={c.connectionId}>
                      {c.name || c.connectionId.substring(0, 8)} {c.isDefault ? '(по умолчанию)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        )}

        {step === 'credentials' && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              {agg.fields.map((f) => {
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
            <Divider />
            <Stack direction="row" alignItems="center" spacing={1}>
              <input
                type="checkbox"
                checked={saveAsConnection}
                onChange={(e) => setSaveAsConnection(e.target.checked)}
                disabled={running}
                id="save-as-connection"
              />
              <label htmlFor="save-as-connection">
                <Typography variant="body2">Сохранить как подключение (пароль зашифруется)</Typography>
              </label>
            </Stack>
            {saveAsConnection && (
              <TextField
                fullWidth
                label="Имя подключения"
                placeholder="Например: 1С Продакшн"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                disabled={running}
                size="small"
              />
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        {step === 'credentials' && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setStep('select')}
            disabled={running}
          >
            К выбору
          </Button>
        )}
        <Button onClick={onClose} disabled={running}>Отмена</Button>
        {step === 'select' ? (
          <Button
            variant="contained"
            onClick={handleStartFlow}
            disabled={running}
            startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          >
            {agg.fields.length === 0 ? (running ? 'Извлекаем…' : 'Запустить') : 'Далее'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmitCreds}
            disabled={running}
            startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          >
            {running ? 'Извлекаем…' : 'Запустить извлечение'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExtractDataDialog;
