import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const initialItem = { name: '', expected: '', actual: '', diff: '' };

const InventoryPage = () => {
  const [sessions, setSessions] = useState([
    { id: 1, date: '2025-10-10', status: 'Завершена', responsible: 'Иванов И.И.' },
    { id: 2, date: '2025-10-16', status: 'В процессе', responsible: 'Петров П.П.' },
  ]);
  const [form, setForm] = useState({ date: '', responsible: '', items: [ { ...initialItem } ] });
  const [errors, setErrors] = useState({});

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (idx, e) => {
    const items = form.items.map((p, i) => i === idx ? { ...p, [e.target.name]: e.target.value } : p);
    setForm({ ...form, items });
  };

  const handleAddItem = () => {
    setForm({ ...form, items: [ ...form.items, { ...initialItem } ] });
  };

  const handleRemoveItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.date) newErrors.date = 'Укажите дату';
    if (!form.responsible) newErrors.responsible = 'Укажите ответственного';
    form.items.forEach((p, i) => {
      if (!p.name) newErrors[`item_name_${i}`] = 'Название обязательно';
      if (!p.expected) newErrors[`item_expected_${i}`] = 'Ожидаемое количество обязательно';
      if (!p.actual) newErrors[`item_actual_${i}`] = 'Фактическое количество обязательно';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSessions([
      ...sessions,
      {
        id: sessions.length + 1,
        date: form.date,
        responsible: form.responsible,
        status: 'В процессе',
      },
    ]);
    setForm({ date: '', responsible: '', items: [ { ...initialItem } ] });
    setErrors({});
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" fontWeight={900} mb={3} textAlign="center">
          Инвентаризация
        </Typography>
        <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Новая сессия инвентаризации
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField label="Дата" name="date" type="date" value={form.date} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Ответственный" name="responsible" value={form.responsible} onChange={handleFormChange} fullWidth error={!!errors.responsible} helperText={errors.responsible} />
              </Grid>
            </Grid>
            <Box mt={3}>
              <Typography fontWeight={700} mb={1}>Позиции для проверки</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Наименование</TableCell>
                      <TableCell>Ожидаемое</TableCell>
                      <TableCell>Фактическое</TableCell>
                      <TableCell>Разница</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.items.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <TextField name="name" value={p.name} onChange={e => handleItemChange(idx, e)} size="small" error={!!errors[`item_name_${idx}`]} helperText={errors[`item_name_${idx}`]} />
                        </TableCell>
                        <TableCell>
                          <TextField name="expected" value={p.expected} onChange={e => handleItemChange(idx, e)} size="small" type="number" error={!!errors[`item_expected_${idx}`]} helperText={errors[`item_expected_${idx}`]} />
                        </TableCell>
                        <TableCell>
                          <TextField name="actual" value={p.actual} onChange={e => handleItemChange(idx, e)} size="small" type="number" error={!!errors[`item_actual_${idx}`]} helperText={errors[`item_actual_${idx}`]} />
                        </TableCell>
                        <TableCell>
                          <TextField name="diff" value={p.actual && p.expected ? (Number(p.actual) - Number(p.expected)) : ''} size="small" disabled />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveItem(idx)} disabled={form.items.length === 1}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button startIcon={<AddIcon />} onClick={handleAddItem} sx={{ mt: 2 }}>
                Добавить позицию
              </Button>
            </Box>
            <Box mt={3} textAlign="right">
              <Button type="submit" variant="contained" color="primary">
                Сохранить сессию
              </Button>
            </Box>
          </form>
        </Paper>
        <Paper sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Последние сессии инвентаризации
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Дата</TableCell>
                  <TableCell>Ответственный</TableCell>
                  <TableCell>Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.responsible}</TableCell>
                    <TableCell>{s.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default InventoryPage;
