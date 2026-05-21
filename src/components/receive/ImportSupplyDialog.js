import React, { useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Alert, CircularProgress, Box, Divider,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import supplyService from '../../services/supplyService';
import { useSnackbar } from '../../context/SnackbarContext';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { useWarehouses } from '../../hooks';

const ImportSupplyDialog = ({ open, onClose, onImported, defaultMode = '1c' }) => {
  const { notify } = useSnackbar();
  const user = useSelector(selectUser);
  const { data: warehouses } = useWarehouses();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState(defaultMode);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const resolveContext = () => ({
    warehouseId: user?.warehouseId
      || (Array.isArray(warehouses) && warehouses[0]
          ? (warehouses[0].warehouseId || warehouses[0].id) : null),
    userId: user?.userId,
  });

  const resetState = () => {
    setMode(defaultMode);
    setResult(null);
    setBusy(false);
  };

  const handleClose = () => {
    if (busy) return;
    resetState();
    onClose?.();
  };

  const handleImport1c = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await supplyService.importFrom1c(resolveContext());
      setResult(res);
      if (res?.success) {
        notify(`Импортировано ${res.imported ?? 0}, пропущено ${res.skipped ?? 0}`);
        onImported?.();
      } else {
        notify(res?.error || 'Импорт завершён с ошибкой', 'warning');
      }
    } catch (err) {
      notify(err?.data?.error || err?.message || 'Не удалось импортировать', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await supplyService.importFromJson(file, resolveContext());
      setResult(res);
      if (res?.success) {
        notify(`Импортировано ${res.imported ?? 0}, пропущено ${res.skipped ?? 0}`);
        onImported?.();
      } else if (res?.error) {
        notify(res.error, 'error');
      }
    } catch (err) {
      const data = err?.data;
      if (data?.details) {
        setResult({ error: data.error, details: data.details, errored: 1 });
      }
      notify(data?.error || err?.message || 'Не удалось импортировать JSON', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      await supplyService.downloadSampleJson();
    } catch (err) {
      notify('Не удалось скачать пример', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Импорт плановых поставок</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <Button
              variant={mode === '1c' ? 'contained' : 'outlined'}
              startIcon={<SettingsRemoteIcon />}
              onClick={() => setMode('1c')}
              disabled={busy}
            >
              Из 1С (RPA)
            </Button>
            <Button
              variant={mode === 'json' ? 'contained' : 'outlined'}
              startIcon={<UploadFileIcon />}
              onClick={() => setMode('json')}
              disabled={busy}
            >
              Из JSON-файла
            </Button>
          </Stack>

          <Divider />

          {mode === '1c' && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Запустит запрос к локальному rpa-service, который через 1С УТ заберёт «Заказы поставщикам»
                и создаст плановые поставки для текущей организации.
              </Typography>
              <Button
                variant="contained"
                onClick={handleImport1c}
                disabled={busy}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {busy ? 'Импорт идёт…' : 'Запустить импорт из 1С'}
              </Button>
            </Stack>
          )}

          {mode === 'json' && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Загрузите JSON-файл со списком поставок. Структура: корень с массивом
                {' '}<code>"supplies"</code> либо одиночный объект. Опциональные блоки
                (transport / commission / international) сохраняются в snapshot.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<UploadFileIcon />}
                  onClick={handlePickFile}
                  disabled={busy}
                >
                  Выбрать файл…
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloudDownloadIcon />}
                  onClick={handleDownloadSample}
                  disabled={busy}
                >
                  Скачать пример
                </Button>
              </Stack>
              <input
                type="file"
                accept="application/json,.json"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </Stack>
          )}

          {busy && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Идёт обработка…</Typography>
            </Box>
          )}

          {result && (
            <Alert severity={result.success ? 'success' : (result.errored ? 'warning' : 'info')}>
              <Stack spacing={0.5}>
                {result.source && (
                  <Typography variant="body2">Источник: {result.source}</Typography>
                )}
                <Typography variant="body2">
                  Найдено: {result.found ?? '—'} ·
                  импортировано: {result.imported ?? 0} ·
                  пропущено: {result.skipped ?? 0} ·
                  с ошибкой: {result.errored ?? 0}
                </Typography>
                {result.errors?.length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {result.errors.map((e, idx) => (
                      <li key={idx}><Typography variant="caption">{e}</Typography></li>
                    ))}
                  </Box>
                )}
                {result.details && (
                  <Box component="pre" sx={{ m: 0, fontSize: 11, maxHeight: 160, overflow: 'auto' }}>
                    {JSON.stringify(result.details, null, 2)}
                  </Box>
                )}
                {result.error && !result.details && (
                  <Typography variant="caption" color="error">{result.error}</Typography>
                )}
              </Stack>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportSupplyDialog;
