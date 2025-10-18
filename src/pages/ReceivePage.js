import React, { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const suppliers = [
  { id: 1, name: 'ООО Поставщик 1' },
  { id: 2, name: 'ЗАО Поставщик 2' },
  { id: 3, name: 'ИП Поставщик 3' },
];

const initialProduct = { name: '', quantity: '', unit: '', expiry: '' };

const ReceivePage = () => {
  const [deliveries, setDeliveries] = useState([
    { id: 1, number: 'ПН-001', date: '2025-10-15', supplier: 'ООО Поставщик 1', status: 'Принято' },
    { id: 2, number: 'ПН-002', date: '2025-10-16', supplier: 'ЗАО Поставщик 2', status: 'В обработке' },
  ]);
  const [form, setForm] = useState({ number: '', date: '', supplier: '', products: [ { ...initialProduct } ] });
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
    if (!form.number) newErrors.number = 'Введите номер накладной';
    if (!form.date) newErrors.date = 'Укажите дату';
    if (!form.supplier) newErrors.supplier = 'Выберите поставщика';
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
    setDeliveries([
      ...deliveries,
      {
        id: deliveries.length + 1,
        number: form.number,
        date: form.date,
        supplier: suppliers.find(s => s.id === Number(form.supplier))?.name || '',
        status: 'В обработке',
      },
    ]);
    setForm({ number: '', date: '', supplier: '', products: [ { ...initialProduct } ] });
    setErrors({});
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" fontWeight={900} mb={3} textAlign="center">
          Приёмка товара
        </Typography>
        <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Новая поставка
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField label="Номер накладной" name="number" value={form.number} onChange={handleFormChange} fullWidth error={!!errors.number} helperText={errors.number} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Дата" name="date" type="date" value={form.date} onChange={handleFormChange} fullWidth InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField select label="Поставщик" name="supplier" value={form.supplier} onChange={handleFormChange} fullWidth error={!!errors.supplier} helperText={errors.supplier}>
                  <MenuItem value="">Выберите...</MenuItem>
                  {suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <Box mt={3}>
              <Typography fontWeight={700} mb={1}>Товары в поставке</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Наименование</TableCell>
                      <TableCell>Кол-во</TableCell>
                      <TableCell>Ед. изм.</TableCell>
                      <TableCell>Срок годности</TableCell>
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
                          <TextField name="expiry" value={p.expiry} onChange={e => handleProductChange(idx, e)} size="small" type="date" InputLabelProps={{ shrink: true }} />
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
                Сохранить поставку
              </Button>
            </Box>
          </form>
        </Paper>
        <Paper sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Последние поставки
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Номер</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Поставщик</TableCell>
                  <TableCell>Статус</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveries.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.number}</TableCell>
                    <TableCell>{d.date}</TableCell>
                    <TableCell>{d.supplier}</TableCell>
                    <TableCell>{d.status}</TableCell>
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

export default ReceivePage;
