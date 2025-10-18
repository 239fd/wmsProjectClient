import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const initialProduct = { name: '', quantity: '', unit: '', batch: '' };

const ShipPage = () => {
  const [shipments, setShipments] = useState([
    { id: 1, number: 'З-001', date: '2025-10-15', status: 'Отгружено', recipient: 'ООО Клиент 1' },
    { id: 2, number: 'З-002', date: '2025-10-16', status: 'В сборке', recipient: 'ЗАО Клиент 2' },
  ]);
  const [form, setForm] = useState({ number: '', date: '', recipient: '', products: [ { ...initialProduct } ] });
  const [errors, setErrors] = useState({});

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProductChange = (idx, e) => {
    const products = form.products.map((p, i) => i === idx ? { ...p, [e.target.name]: e.target.value } : p);
    setForm({ ...form, products });
  };

  const handleAddProduct = () => {
    setForm({ ...form, products: [ ...form.products, { ...initialProduct } ] });
  };

  const handleRemoveProduct = (idx) => {
    setForm({ ...form, products: form.products.filter((_, i) => i !== idx) });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.number) newErrors.number = 'Введите номер заявки';
    if (!form.date) newErrors.date = 'Укажите дату';
    if (!form.recipient) newErrors.recipient = 'Укажите получателя';
    form.products.forEach((p, i) => {
      if (!p.name) newErrors[`product_name_${i}`] = 'Название обязательно';
      if (!p.quantity) newErrors[`product_quantity_${i}`] = 'Количество обязательно';
      if (!p.unit) newErrors[`product_unit_${i}`] = 'Ед. изм. обязательна';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setShipments([
      ...shipments,
      {
        id: shipments.length + 1,
        number: form.number,
        date: form.date,
        recipient: form.recipient,
        status: 'В сборке',
      },
    ]);
    setForm({ number: '', date: '', recipient: '', products: [ { ...initialProduct } ] });
    setErrors({});
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" fontWeight={900} mb={3} textAlign="center">
          Отгрузка товара
        </Typography>
        <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Новая отгрузка
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField label="Номер заявки" name="number" value={form.number} onChange={handleFormChange} fullWidth error={!!errors.number} helperText={errors.number} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Дата" name="date" type="date" value={form.date} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Получатель" name="recipient" value={form.recipient} onChange={handleFormChange} fullWidth error={!!errors.recipient} helperText={errors.recipient} />
              </Grid>
            </Grid>
            <Box mt={3}>
              <Typography fontWeight={700} mb={1}>Товары к отгрузке</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Наименование</TableCell>
                      <TableCell>Кол-во</TableCell>
                      <TableCell>Ед. изм.</TableCell>
                      <TableCell>Партия</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.products.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <TextField name="name" value={p.name} onChange={e => handleProductChange(idx, e)} size="small" error={!!errors[`product_name_${idx}`]} helperText={errors[`product_name_${idx}`]} />
                        </TableCell>
                        <TableCell>
                          <TextField name="quantity" value={p.quantity} onChange={e => handleProductChange(idx, e)} size="small" type="number" error={!!errors[`product_quantity_${idx}`]} helperText={errors[`product_quantity_${idx}`]} />
                        </TableCell>
                        <TableCell>
                          <TextField name="unit" value={p.unit} onChange={e => handleProductChange(idx, e)} size="small" error={!!errors[`product_unit_${idx}`]} helperText={errors[`product_unit_${idx}`]} />
                        </TableCell>
                        <TableCell>
                          <TextField name="batch" value={p.batch} onChange={e => handleProductChange(idx, e)} size="small" />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveProduct(idx)} disabled={form.products.length === 1}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button startIcon={<AddIcon />} onClick={handleAddProduct} sx={{ mt: 2 }}>
                Добавить товар
              </Button>
            </Box>
            <Box mt={3} textAlign="right">
              <Button type="submit" variant="contained" color="primary">
                Сохранить отгрузку
              </Button>
            </Box>
          </form>
        </Paper>
        <Paper sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Последние отгрузки
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Номер</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Получатель</TableCell>
                  <TableCell>Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipments.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.number}</TableCell>
                    <TableCell>{s.date}</TableCell>
                    <TableCell>{s.recipient}</TableCell>
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

export default ShipPage;
