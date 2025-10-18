import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

const kpiData = [
  { label: 'Сотрудников', value: 12 },
  { label: 'Складов', value: 3 },
  { label: 'Операций за месяц', value: 154 },
  { label: 'Оборот, BYN', value: '1 200 000' },
];
const periods = [
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('month');

  return (
    <Box sx={{ width: '100%', pt: 4, pb: 6, bgcolor: '#fff', minHeight: '100vh' }}>
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Аналитика
        </Typography>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Период</InputLabel>
            <Select value={period} label="Период" variant="outlined" onChange={e => setPeriod(e.target.value)}>
              {periods.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Grid container spacing={3} mb={4}>
          {kpiData.map((kpi, idx) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.label}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3, bgcolor: '#f7f9fa' }}>
                <Typography variant="h5" fontWeight={700}>{kpi.value}</Typography>
                <Typography color="text.secondary">{kpi.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Paper sx={{ p: 4, borderRadius: 3, minHeight: 320 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Динамика операций (макет графика)</Typography>
          <Box sx={{ width: '100%', height: 220, bgcolor: '#e3eaf2', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#90a4ae' }}>
            {/* Здесь будет график (заглушка) */}
            <Typography>График появится после интеграции с сервером</Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;
