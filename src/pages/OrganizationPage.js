import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const initialOrg = { name: 'ООО "Компания"', unp: '123456789', address: 'г. Минск, ул. Примерная, 1' };
const initialWarehouse = { name: '', address: '' };

const OrganizationPage = () => {
  const [org, setOrg] = useState(initialOrg);
  const [editOrg, setEditOrg] = useState(initialOrg);
  const [orgEditOpen, setOrgEditOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([
    { id: 1, name: 'Склад 1', address: 'ул. Складская, 10' },
    { id: 2, name: 'Склад 2', address: 'ул. Промышленная, 5' },
  ]);
  const [whDialogOpen, setWhDialogOpen] = useState(false);
  const [whEditIndex, setWhEditIndex] = useState(-1);
  const [whForm, setWhForm] = useState(initialWarehouse);

  const handleOrgEditOpen = () => {
    setEditOrg(org);
    setOrgEditOpen(true);
  };
  const handleOrgEditClose = () => {
    setOrgEditOpen(false);
  };
  const handleOrgSave = () => {
    setOrg(editOrg);
    setOrgEditOpen(false);
  };
  const handleWhOpen = (wh, idx) => {
    setWhEditIndex(idx);
    setWhForm(wh || initialWarehouse);
    setWhDialogOpen(true);
  };
  const handleWhClose = () => {
    setWhDialogOpen(false);
    setWhEditIndex(-1);
    setWhForm(initialWarehouse);
  };
  const handleWhSave = () => {
    if (whEditIndex > -1) {
      setWarehouses(warehouses.map((w, i) => i === whEditIndex ? { ...whForm, id: w.id } : w));
    } else {
      setWarehouses([...warehouses, { ...whForm, id: Date.now() }]);
    }
    handleWhClose();
  };
  const handleWhDelete = (idx) => {
    setWarehouses(warehouses.filter((_, i) => i !== idx));
  };

  return (
    <Box maxWidth={1000} mx="auto" mt={4}>
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Организация
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600}>Реквизиты организации</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
            <Box>
              <Typography>Наименование: {org.name}</Typography>
              <Typography>УНП: {org.unp}</Typography>
              <Typography>Адрес: {org.address}</Typography>
            </Box>
            <Button variant="outlined" onClick={handleOrgEditOpen}>Редактировать</Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Склады</Typography>
          <Button variant="contained" sx={{ mb: 2 }} onClick={() => handleWhOpen(null, -1)}>Добавить склад</Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Адрес</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouses.map((wh, idx) => (
                  <TableRow key={wh.id}>
                    <TableCell>{wh.name}</TableCell>
                    <TableCell>{wh.address}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleWhOpen(wh, idx)}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleWhDelete(idx)} color="error"><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
      <Dialog open={orgEditOpen} onClose={handleOrgEditClose} maxWidth="xs" fullWidth>
        <DialogTitle>Редактировать реквизиты</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Наименование" value={editOrg.name} onChange={e => setEditOrg({ ...editOrg, name: e.target.value })} fullWidth required />
          <TextField label="УНП" value={editOrg.unp} onChange={e => setEditOrg({ ...editOrg, unp: e.target.value })} fullWidth required />
          <TextField label="Адрес" value={editOrg.address} onChange={e => setEditOrg({ ...editOrg, address: e.target.value })} fullWidth required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOrgEditClose}>Отмена</Button>
          <Button onClick={handleOrgSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={whDialogOpen} onClose={handleWhClose} maxWidth="xs" fullWidth>
        <DialogTitle>{whEditIndex > -1 ? 'Редактировать склад' : 'Добавить склад'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Название" value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} fullWidth required />
          <TextField label="Адрес" value={whForm.address} onChange={e => setWhForm({ ...whForm, address: e.target.value })} fullWidth required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleWhClose}>Отмена</Button>
          <Button onClick={handleWhSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationPage;
