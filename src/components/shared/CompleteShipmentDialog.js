import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Box, Dialog, DialogContent, DialogTitle, Grid, TextField, Typography, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FormWizard from './FormWizard';

const blankToUndefined = (v) => (v === '' || v === null ? undefined : v);

const clampInt = (v, max) => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  const clamped = Math.max(0, Math.min(max, Math.trunc(n)));
  return clamped;
};

const buildManualFields = (raw, isExport) => {
  const out = {};
  const stringKeys = [
    'vehicleMake', 'vehicleNumber', 'trailerNumber', 'driverName',
    'proxyNumber', 'proxyIssuedBy', 'sealNumber',
    'contractNumber', 'accompanyingDocs',
  ];
  stringKeys.forEach((k) => {
    const v = blankToUndefined(raw[k]);
    if (v !== undefined) out[k] = v;
  });
  if (raw.proxyDate) out.proxyDate = raw.proxyDate;
  if (raw.contractDate) out.contractDate = raw.contractDate;

  if (isExport) {
    const exportStringKeys = [
      'countryOfManufacture',
      'paymentTerms', 'specialTerms', 'shipperInstructions', 'carrierRemarks',
    ];
    exportStringKeys.forEach((k) => {
      const v = blankToUndefined(raw[k]);
      if (v !== undefined) out[k] = v;
    });
    const timeFields = [
      ['loadingArrivalHour', 23], ['loadingArrivalMin', 59],
      ['loadingDepartureHour', 23], ['loadingDepartureMin', 59],
      ['unloadingArrivalHour', 23], ['unloadingArrivalMin', 59],
      ['unloadingDepartureHour', 23], ['unloadingDepartureMin', 59],
    ];
    timeFields.forEach(([k, max]) => {
      const v = clampInt(raw[k], max);
      if (v !== undefined) out[k] = v;
    });
  }
  return out;
};

const TextRow = ({ control, name, label, multiline = false, type = 'text', inputProps, helperText }) => (
  <Controller
    name={name}
    control={control}
    defaultValue=""
    render={({ field, fieldState }) => (
      <TextField
        {...field}
        label={label}
        size="small"
        fullWidth
        multiline={multiline}
        minRows={multiline ? 2 : 1}
        type={type}
        inputProps={inputProps}
        InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        error={!!fieldState.error}
        helperText={fieldState.error?.message || helperText}
      />
    )}
  />
);

const todayIso = () => new Date().toISOString().slice(0, 10);

const NumberRow = ({ control, name, label, max }) => (
  <Controller
    name={name}
    control={control}
    defaultValue=""
    render={({ field }) => (
      <TextField
        {...field}
        label={label}
        size="small"
        fullWidth
        type="number"
        inputProps={{ min: 0, max, step: 1 }}
      />
    )}
  />
);

export default function CompleteShipmentDialog({
  open,
  onClose,
  onSubmit,
  shipmentType = 'DOMESTIC',
  busy = false,
}) {
  const { control, handleSubmit, trigger, reset } = useForm({ mode: 'onChange' });
  const isExport = shipmentType === 'EXPORT';

  React.useEffect(() => {
    if (open) reset({});
  }, [open, reset]);

  const submit = handleSubmit((raw) => {
    const manualFields = buildManualFields(raw, isExport);
    onSubmit(manualFields);
  });

  const stepTransport = {
    key: 'transport',
    label: 'Транспорт',
    fields: [],
    render: () => (
      <Box sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Все поля опциональные — пустые не попадут в документ.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="vehicleMake" label="Марка автомобиля" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="vehicleNumber" label="Гос. номер" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="trailerNumber" label="Номер прицепа" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="driverName" label="ФИО водителя" /></Grid>
        </Grid>
      </Box>
    ),
  };

  const stepProxy = {
    key: 'proxy',
    label: 'Доверенность',
    fields: [],
    render: () => (
      <Box sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="proxyNumber" label="Номер доверенности" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextRow
              control={control}
              name="proxyDate"
              label="Дата доверенности"
              type="date"
              inputProps={{ max: todayIso() }}
              helperText="Не позже сегодняшней"
            />
          </Grid>
          <Grid size={{ xs: 12 }}><TextRow control={control} name="proxyIssuedBy" label="Доверенность выдана (кем)" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="sealNumber" label="Номер пломбы" /></Grid>
        </Grid>
      </Box>
    ),
  };

  const stepContract = {
    key: 'contract',
    label: 'Контракт',
    fields: [],
    render: () => (
      <Box sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="contractNumber" label="Номер договора" /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextRow
              control={control}
              name="contractDate"
              label="Дата договора"
              type="date"
              inputProps={{ max: todayIso() }}
              helperText="Не позже сегодняшней"
            />
          </Grid>
          <Grid size={{ xs: 12 }}><TextRow control={control} name="accompanyingDocs" label="Сопроводительные документы (свободный текст)" multiline /></Grid>
        </Grid>
      </Box>
    ),
  };

  const stepCarrier = {
    key: 'carrier',
    label: 'Таможня и условия',
    fields: [],
    render: () => (
      <Box sx={{ pt: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Таможенные данные</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="countryOfManufacture" label="Страна производства" /></Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Время погрузки и разгрузки (CMR, графы 22-24)</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="loadingArrivalHour" label="Погрузка прибытие, час" max={23} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="loadingArrivalMin" label="мин" max={59} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="loadingDepartureHour" label="Погрузка убытие, час" max={23} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="loadingDepartureMin" label="мин" max={59} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="unloadingArrivalHour" label="Разгрузка прибытие, час" max={23} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="unloadingArrivalMin" label="мин" max={59} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="unloadingDepartureHour" label="Разгрузка убытие, час" max={23} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><NumberRow control={control} name="unloadingDepartureMin" label="мин" max={59} /></Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Условия и инструкции (CMR, графы 13/15/18/20)</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="paymentTerms" label="Условия оплаты" multiline /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="specialTerms" label="Особые условия" multiline /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="shipperInstructions" label="Указания отправителя" multiline /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextRow control={control} name="carrierRemarks" label="Оговорки перевозчика" multiline /></Grid>
        </Grid>
      </Box>
    ),
  };

  const steps = isExport
    ? [stepTransport, stepProxy, stepContract, stepCarrier]
    : [stepTransport, stepProxy, stepContract];

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Завершение отгрузки — оформление документов
        <IconButton size="small" onClick={onClose} disabled={busy}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <FormWizard
          steps={steps}
          trigger={trigger}
          onSubmit={submit}
          busy={busy}
          submitLabel="Завершить и сгенерировать"
          onCancel={onClose}
          cancelLabel="Отмена"
        />
      </DialogContent>
    </Dialog>
  );
}
