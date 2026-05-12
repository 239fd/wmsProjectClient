import React, { useState, useEffect } from 'react';
import {
  Box, Avatar, TextField, Button, Stack, Paper, CircularProgress, Alert,
  Typography, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  fetchProfile, updateProfile, selectUser, selectAuthLoading, selectAuthError, clearError,
  setUser,
} from '../store/slices/authSlice';
import profileService from '../services/profileService';
import { useSnackbar } from '../context/SnackbarContext';
import { updateProfileSchema, changePasswordSchema } from '../validation/schemas';

const splitFullName = (fullName) => {
  const parts = (fullName || '').split(' ');
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts.slice(2).join(' '),
  };
};

const buildPhotoSrc = (photoBase64) => {
  if (!photoBase64) return '';
  if (photoBase64.startsWith('data:')) return photoBase64;
  return `data:image/jpeg;base64,${photoBase64}`;
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { notify } = useSnackbar();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [editing, setEditing] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

  const profileForm = useForm({
    resolver: yupResolver(updateProfileSchema),
    defaultValues: { firstName: '', lastName: '', middleName: '', email: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      const parts = splitFullName(user.fullName);
      profileForm.reset({
        firstName: parts.firstName,
        lastName: parts.lastName,
        middleName: parts.middleName,
        email: user.email || '',
      });
    }

  }, [user]);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    if (user) {
      const parts = splitFullName(user.fullName);
      profileForm.reset({
        firstName: parts.firstName,
        lastName: parts.lastName,
        middleName: parts.middleName,
        email: user.email || '',
      });
    }
    setEditing(false);
  };

  const onSaveProfile = async (values) => {
    const result = await dispatch(updateProfile({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName?.trim() || null,
      email: values.email.trim(),
    }));
    if (!result.error) {
      setEditing(false);
      notify('Изменения сохранены');
      dispatch(fetchProfile());
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      await profileService.uploadPhoto(file);
      const fresh = await profileService.getProfile();
      dispatch(setUser({ ...user, ...fresh }));
      notify('Фото обновлено');
    } catch (err) {
      notify(err.message || 'Не удалось загрузить фото', 'error');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoDelete = async () => {
    setPhotoBusy(true);
    try {
      await profileService.deletePhoto();
      dispatch(setUser({ ...user, photoBase64: null }));
      notify('Фото удалено');
    } catch (err) {
      notify(err.message || 'Не удалось удалить фото', 'error');
    } finally {
      setPhotoBusy(false);
    }
  };

  if (loading && !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const { register, handleSubmit, formState: { errors } } = profileForm;

  return (
    <Box maxWidth={520} mx="auto" mt={4}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Личный кабинет
        </Typography>

        <form onSubmit={handleSubmit(onSaveProfile)} noValidate>
          <Stack spacing={3} alignItems="center">
            <Box sx={{ position: 'relative', width: 120, height: 120 }}>
              <Avatar src={buildPhotoSrc(user?.photoBase64)} sx={{ width: 120, height: 120 }} />
              {photoBusy && (
                <CircularProgress
                  size={120}
                  sx={{ position: 'absolute', top: 0, left: 0, color: 'rgba(25,118,210,0.5)' }}
                />
              )}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ position: 'absolute', bottom: -8, right: -8 }}
              >
                <IconButton
                  component="label"
                  size="small"
                  color="primary"
                  sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
                  disabled={photoBusy}
                >
                  <EditIcon fontSize="small" />
                  <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                </IconButton>
                {user?.photoBase64 && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handlePhotoDelete}
                    sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
                    disabled={photoBusy}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Box>

            <Stack spacing={2} width="100%">
              <TextField
                label="Фамилия"
                fullWidth
                disabled={!editing || loading}
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
              <TextField
                label="Имя"
                fullWidth
                disabled={!editing || loading}
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
              <TextField
                label="Отчество"
                fullWidth
                disabled={!editing || loading}
                {...register('middleName')}
                error={!!errors.middleName}
                helperText={errors.middleName?.message}
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                disabled={!editing || loading}
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Stack>

            {!editing ? (
              <Stack direction="row" spacing={2}>
                <Button variant="contained" type="button" onClick={handleEdit}>Редактировать</Button>
                <Button
                  variant="outlined"
                  startIcon={<LockResetIcon />}
                  onClick={() => setPwdDialogOpen(true)}
                  type="button"
                >
                  Сменить пароль
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Сохранить'}
                </Button>
                <Button variant="outlined" color="secondary" type="button" onClick={handleCancel} disabled={loading}>
                  Отмена
                </Button>
              </Stack>
            )}
          </Stack>
        </form>
      </Paper>

      <ChangePasswordDialog
        open={pwdDialogOpen}
        onClose={() => setPwdDialogOpen(false)}
        notify={notify}
      />
    </Box>
  );
};

const ChangePasswordDialog = ({ open, onClose, notify }) => {
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!open) reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [open, reset]);

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      await profileService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notify('Пароль изменён');
      onClose();
    } catch (err) {
      notify(err.message || 'Не удалось сменить пароль', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Смена пароля</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Текущий пароль"
              type="password"
              fullWidth
              autoComplete="current-password"
              disabled={busy}
              {...register('currentPassword')}
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
            />
            <TextField
              label="Новый пароль"
              type="password"
              fullWidth
              autoComplete="new-password"
              disabled={busy}
              {...register('newPassword')}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message || 'Минимум 8 символов'}
            />
            <TextField
              label="Повторите новый пароль"
              type="password"
              fullWidth
              autoComplete="new-password"
              disabled={busy}
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={busy}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? <CircularProgress size={20} color="inherit" /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProfilePage;
