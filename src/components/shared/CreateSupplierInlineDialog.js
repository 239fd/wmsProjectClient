import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import supplierService from '../../services/supplierService';
import { supplierSchema } from '../../validation/schemas';
import { useSnackbar } from '../../context/SnackbarContext';

const CreateSupplierInlineDialog = ({ open, onClose, onCreated }) => {
  const { notify } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(supplierSchema),
    defaultValues: {
      name: '', unp: '', contactPerson: '', phone: '', email: '', address: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      reset({ name: '', unp: '', contactPerson: '', phone: '', email: '', address: '' });
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      const created = await supplierService.create(values);
      notify('Поставщик создан');
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      notify(err?.message || 'Не удалось создать поставщика', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Новый поставщик</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Наименование *"
            fullWidth size="small"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
            autoFocus
          />
          <TextField
            label="УНП (9 цифр)"
            fullWidth size="small"
            {...register('unp')}
            error={!!errors.unp}
            helperText={errors.unp?.message}
          />
          <TextField
            label="Контактное лицо"
            fullWidth size="small"
            {...register('contactPerson')}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Телефон"
              fullWidth size="small"
              {...register('phone')}
            />
            <TextField
              label="Email"
              fullWidth size="small"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Stack>
          <TextField
            label="Адрес"
            fullWidth size="small"
            {...register('address')}
            multiline rows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Отмена</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={busy}>
          {busy ? 'Создаём…' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSupplierInlineDialog;
