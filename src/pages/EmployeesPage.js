import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const initialEmployee = { fullName: '', email: '', role: '', warehouse: '' };
const roles = [
  { value: 'WORKER', label: 'Работник' },
  { value: 'ACCOUNTANT', label: 'Бухгалтер' },
  { value: 'DIRECTOR', label: 'Директор' },
];
const warehouses = [
  { value: 'Склад 1', label: 'Склад 1' },
  { value: 'Склад 2', label: 'Склад 2' },
];

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([
    { id: 1, fullName: 'Иванов Иван', email: 'ivanov@mail.com', role: 'Работник', warehouse: 'Склад 1' },
    { id: 2, fullName: 'Петров Петр', email: 'petrov@mail.com', role: 'Бухгалтер', warehouse: 'Склад 2' },
  ]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [form, setForm] = useState(initialEmployee);

  const handleOpen = (employee, idx) => {
    setEditIndex(idx);
    setForm(employee || initialEmployee);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setForm(initialEmployee);
    setEditIndex(-1);
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = () => {
    if (editIndex > -1) {
      setEmployees(employees.map((emp, i) => i === editIndex ? { ...form, id: emp.id } : emp));
    } else {
      setEmployees([...employees, { ...form, id: Date.now() }]);
    }
    handleClose();
  };
  const handleDelete = (idx) => {
    setEmployees(employees.filter((_, i) => i !== idx));
  };
  const filtered = filter ? employees.filter(e => e.role === filter) : employees;

  return (
    <Box sx={{ width: '100%', bgcolor: '#fff', minHeight: '100vh', pt: 6, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Сотрудники
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Фильтр по роли</InputLabel>
            <Select value={filter} label="Фильтр по роли" variant="outlined" onChange={e => setFilter(e.target.value)}>
              <MenuItem value="">Все</MenuItem>
              {roles.map(r => <MenuItem key={r.value} value={r.label}>{r.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => handleOpen(null, -1)}>Добавить сотрудника</Button>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ФИО</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell>Склад</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((emp, idx) => (
                <TableRow key={emp.id}>
                  <TableCell>{emp.fullName}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>{emp.warehouse}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpen(emp, idx)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(idx)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
          <DialogTitle>{editIndex > -1 ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="ФИО" name="fullName" value={form.fullName} onChange={handleChange} fullWidth required />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth required />
            <FormControl fullWidth>
              <InputLabel>Роль</InputLabel>
              <Select name="role" value={form.role} label="Роль" variant="outlined" onChange={handleChange} required>
                {roles.map(r => <MenuItem key={r.value} value={r.label}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Склад</InputLabel>
              <Select name="warehouse" value={form.warehouse} label="Склад" variant="outlined" onChange={handleChange} required>
                {warehouses.map(w => <MenuItem key={w.value} value={w.label}>{w.label}</MenuItem>)}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Отмена</Button>
            <Button onClick={handleSave} variant="contained">Сохранить</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default EmployeesPage;
