import React, { useState, useEffect } from 'react';
import { Box, Avatar, TextField, Button, Stack, Paper, CircularProgress, Alert, Snackbar } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile, selectUser, selectAuthLoading, selectAuthError, clearError } from '../store/slices/authSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [success, setSuccess] = useState(false);
  const [editProfile, setEditProfile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      const nameParts = (user.fullName || '').split(' ');
      setEditProfile({
        surname: nameParts[0] || '',
        name: nameParts[1] || '',
        patronymic: nameParts[2] || '',
        email: user.email || '',
      });
      setAvatarPreview(user.photoUrl || '');
    }
  }, [user]);

  const handleChange = (e) => {
    setEditProfile({ ...editProfile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
      // TODO: Добавить загрузку фото на сервер
    }
  };

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    if (user) {
      const nameParts = (user.fullName || '').split(' ');
      setEditProfile({
        surname: nameParts[0] || '',
        name: nameParts[1] || '',
        patronymic: nameParts[2] || '',
        email: user.email || '',
      });
    }
    setAvatarPreview(user?.photoUrl || '');
    setEditing(false);
  };

  const handleSave = async () => {
    const fullName = [editProfile.surname, editProfile.name, editProfile.patronymic]
      .filter(Boolean)
      .join(' ');

    const result = await dispatch(updateProfile({
      fullName,
      email: editProfile.email,
    }));

    if (!result.error) {
      setEditing(false);
      setSuccess(true);
    }
  };

  if (loading && !editProfile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Изменения сохранены
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Stack spacing={3} alignItems="center">
          <Box position="relative">
            <Avatar src={avatarPreview} sx={{ width: 100, height: 100, mb: 1 }} />
            {editing && (
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
              >
                Изменить
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </Button>
            )}
          </Box>
          <Stack spacing={2} width="100%">
            <TextField
              label="Фамилия"
              name="surname"
              value={editProfile?.surname || ''}
              onChange={handleChange}
              fullWidth
              disabled={!editing || loading}
            />
            <TextField
              label="Имя"
              name="name"
              value={editProfile?.name || ''}
              onChange={handleChange}
              fullWidth
              disabled={!editing || loading}
            />
            <TextField
              label="Отчество"
              name="patronymic"
              value={editProfile?.patronymic || ''}
              onChange={handleChange}
              fullWidth
              disabled={!editing || loading}
            />
            <TextField
              label="Email"
              name="email"
              value={editProfile?.email || ''}
              onChange={handleChange}
              fullWidth
              disabled={!editing || loading}
            />
          </Stack>
          {!editing ? (
            <Button variant="contained" onClick={handleEdit}>Редактировать</Button>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Сохранить'}
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleCancel} disabled={loading}>
                Отмена
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProfilePage;

