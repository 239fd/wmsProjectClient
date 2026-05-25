import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider
} from '@mui/material';

const rackTypes = [
  { value: 'SHELF', label: 'Стеллаж с полками' },
  { value: 'CELL', label: 'Ячеистый стеллаж' },
  { value: 'PALLET', label: 'Паллетный стеллаж' },
];

const STORAGE_CONDITIONS = [
  { value: 'ROOM', label: 'Комнатная температура (от 15 до 25 °C)' },
  { value: 'COOL', label: 'Прохладный режим (от 5 до 15 °C)' },
  { value: 'FRIDGE', label: 'Холодильник (от 0 до 5 °C)' },
  { value: 'FREEZER', label: 'Морозильник (от -18 до -24 °C)' },
];

const RackDialog = ({ open, onClose, onSave, initialData = null }) => {
  const [form, setForm] = useState(
    initialData || {
      name: '',
      kind: 'SHELF',
      storageConditions: 'ROOM',

      shelf_count: '',
      shelf_capacity_kg: '',

      cell_count: '',
      max_weight_kg: '',

      pallet_place_count: '',

      length_cm: '',
      width_cm: '',
      height_cm: '',
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    onSave(form);
    onClose();
  };

  const renderSpecificFields = () => {
    switch (form.kind) {
      case 'SHELF':
        return (
          <>
            <TextField
              label="Количество полок"
              name="shelf_count"
              type="number"
              value={form.shelf_count}
              onChange={handleChange}
              fullWidth
              required
              helperText="Сколько полок на стеллаже. Общая грузоподъёмность задана на уровне стеллажа."
            />
          </>
        );
      case 'CELL':
        return (
          <>
            <TextField
              label="Количество ячеек"
              name="cell_count"
              type="number"
              value={form.cell_count}
              onChange={handleChange}
              fullWidth
              required
              helperText="Сколько ячеек на стеллаже. Общая грузоподъёмность задана на уровне стеллажа."
            />
          </>
        );
      case 'PALLET':
        return (
          <>
            <TextField
              label="Количество паллетных мест"
              name="pallet_place_count"
              type="number"
              value={form.pallet_place_count}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Максимальный вес (кг)"
              name="max_weight_kg"
              type="number"
              value={form.max_weight_kg}
              onChange={handleChange}
              fullWidth
              required
            />
          </>
        );
      default:
        return null;
    }
  };

  const getDimensionsHelperText = () => {
    switch (form.kind) {
      case 'SHELF':
        return 'Размеры одной полки';
      case 'CELL':
        return 'Размеры одной ячейки';
      case 'PALLET':
        return 'Размеры паллетного стеллажа';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Редактировать стеллаж' : 'Добавить стеллаж'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Наименование"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>Тип стеллажа</InputLabel>
            <Select
              name="kind"
              value={form.kind}
              label="Тип стеллажа"
              onChange={handleChange}
            >
              {rackTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Условия хранения (температурная зона)</InputLabel>
            <Select
              name="storageConditions"
              value={form.storageConditions || 'ROOM'}
              label="Условия хранения (температурная зона)"
              onChange={handleChange}
            >
              {STORAGE_CONDITIONS.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />
          <Typography variant="subtitle2" color="text.secondary">
            Специфические параметры
          </Typography>
          {renderSpecificFields()}

          <Divider />
          <Typography variant="subtitle2" color="text.secondary">
            {getDimensionsHelperText()}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
            <TextField
              label="Длина (см)"
              name="length_cm"
              type="number"
              value={form.length_cm}
              onChange={handleChange}
              required
            />
            <TextField
              label="Ширина (см)"
              name="width_cm"
              type="number"
              value={form.width_cm}
              onChange={handleChange}
              required
            />
            <TextField
              label="Высота (см)"
              name="height_cm"
              type="number"
              value={form.height_cm}
              onChange={handleChange}
              required
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RackDialog;
