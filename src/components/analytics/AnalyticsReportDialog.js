import React, { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Stack, TextField, Checkbox, FormControlLabel,
  Typography, Chip, Divider, Alert, CircularProgress,
} from '@mui/material';
import { Download as DownloadIcon, Save as SaveIcon } from '@mui/icons-material';
import analyticsService from '../../services/analyticsService';
import { useSnackbar } from '../../context/SnackbarContext';
import { useWarehouses } from '../../hooks';

const SECTIONS = [
  { code: 'SUMMARY',   label: 'Сводка по организации',  hint: 'Кол-во складов, активные, общая загрузка' },
  { code: 'STRUCTURE', label: 'Структура складов',      hint: 'Стеллажи, типы, температурные зоны, занятость' },
  { code: 'ABC',       label: 'ABC-анализ',             hint: 'Распределение и топ-50 товаров по классам' },
  { code: 'DETAILED',  label: 'Остатки и оборачиваемость', hint: 'Остатки, операции, истекающие сроки, тренд' },
];

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isoMinus = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isoMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const PRESETS = [
  { code: 'week',    label: 'Неделя',  from: () => isoMinus(7),  to: isoToday },
  { code: 'month',   label: 'Месяц',   from: isoMonthStart,      to: isoToday },
  { code: 'quarter', label: 'Квартал', from: () => isoMinus(90), to: isoToday },
  { code: 'year',    label: 'Год',     from: () => isoMinus(365),to: isoToday },
];

const AnalyticsReportDialog = ({ open, onClose }) => {
  const { notify } = useSnackbar();
  const { data: warehouses } = useWarehouses();

  const [from, setFrom] = useState(isoMonthStart());
  const [to, setTo] = useState(isoToday());
  const [sections, setSections] = useState(() => new Set(['SUMMARY', 'STRUCTURE', 'ABC', 'DETAILED']));
  const [warehouseIds, setWarehouseIds] = useState([]);
  const [saveToRegistry, setSaveToRegistry] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const allWhSelected = warehouseIds.length === 0 || warehouseIds.length === (warehouses?.length || 0);

  const toggleSection = (code) => {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleWarehouse = (id) => {
    setWarehouseIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const applyPreset = (preset) => {
    setFrom(preset.from());
    setTo(preset.to());
  };

  const datesValid = useMemo(() => {
    if (!from || !to) return false;
    return from <= to;
  }, [from, to]);

  const canSubmit = datesValid && sections.size > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        from,
        to,
        warehouseIds: allWhSelected ? null : warehouseIds,
        sections: Array.from(sections),
        saveToRegistry,
      };
      const result = await analyticsService.generateReport(payload);
      if (saveToRegistry && result.documentNumber) {
        notify(`Отчёт сформирован и сохранён: ${result.documentNumber}`);
      } else {
        notify('Отчёт сформирован');
      }
      onClose?.();
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Не удалось сформировать отчёт';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Сформировать аналитический отчёт</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" mb={1}>Период</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField
                label="С"
                type="date"
                size="small"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: to }}
              />
              <TextField
                label="По"
                type="date"
                size="small"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: from, max: isoToday() }}
              />
            </Stack>
            <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
              {PRESETS.map((p) => (
                <Chip
                  key={p.code}
                  label={p.label}
                  size="small"
                  variant="outlined"
                  onClick={() => applyPreset(p)}
                />
              ))}
            </Stack>
            {!datesValid && (
              <Alert severity="warning" sx={{ mt: 1.5 }}>
                Дата начала не должна быть позже даты окончания
              </Alert>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" mb={1}>Разделы отчёта</Typography>
            <Stack spacing={0.5}>
              {SECTIONS.map((s) => (
                <FormControlLabel
                  key={s.code}
                  control={
                    <Checkbox
                      checked={sections.has(s.code)}
                      onChange={() => toggleSection(s.code)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{s.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.hint}</Typography>
                    </Box>
                  }
                />
              ))}
            </Stack>
            {sections.size === 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Выберите хотя бы один раздел
              </Alert>
            )}
          </Box>

          {warehouses && warehouses.length > 1 && sections.has('STRUCTURE') && (
            <>
              <Divider />
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Склады для раздела «Структура»</Typography>
                  <Button
                    size="small"
                    onClick={() => setWarehouseIds(allWhSelected
                      ? warehouses.map((w) => w.warehouseId || w.id)
                      : [])}
                  >
                    {allWhSelected ? 'Снять все' : 'Все склады'}
                  </Button>
                </Stack>
                <Stack spacing={0.25} sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {warehouses.map((w) => {
                    const id = w.warehouseId || w.id;
                    const checked = allWhSelected || warehouseIds.includes(id);
                    return (
                      <FormControlLabel
                        key={id}
                        control={
                          <Checkbox
                            size="small"
                            checked={checked}
                            onChange={() => toggleWarehouse(id)}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            {w.name}{w.address ? ` · ${w.address}` : ''}
                          </Typography>
                        }
                      />
                    );
                  })}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  По умолчанию — все склады. Влияет только на раздел «Структура».
                </Typography>
              </Box>
            </>
          )}

          <Divider />

          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={saveToRegistry}
                  onChange={(e) => setSaveToRegistry(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">Сохранить копию в реестр документов</Typography>
                  <Typography variant="caption" color="text.secondary">
                    PDF будет доступен в «Документы» с номером ОТЧ-YYYY-NNNNN
                  </Typography>
                </Box>
              }
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : saveToRegistry ? <SaveIcon /> : <DownloadIcon />}
        >
          {submitting ? 'Формируется…' : 'Сформировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnalyticsReportDialog;
