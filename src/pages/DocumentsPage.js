import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Button, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import documentService from '../services/documentService';
import { useSnackbar } from '../context/SnackbarContext';
import EmptyState from '../components/shared/EmptyState';
import { TableSkeleton } from '../components/shared/LoadingSkeleton';

const TYPE_LABEL = {
  'receipt-order':    'Приходный ордер',
  'receipt-act':      'Акт приёмки',
  'waybill':          'ТТН (товарно-транспортная)',
  'transport-note':   'ТН (товарная)',
  'cmr':              'CMR (международная)',
  'inventory-report': 'Опись инвентаризации',
  'revaluation-act':  'Акт переоценки',
  'write-off-act':    'Акт списания',
  'invoice':          'Инвойс',
  'picking-list':     'Лист подбора',
  'placement-list':   'Лист размещения',
};

const formatDate = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const DocumentsPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (user && !orgId) {
      navigate('/main/organization?firstTime=true', { replace: true });
    }
  }, [user, orgId, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentService.list({
        page,
        size: rowsPerPage,
        sort: 'generatedAt,desc',
        type: typeFilter || undefined,
      });
      const list = res?.content || (Array.isArray(res) ? res : []);
      setItems(list);
      setTotal(typeof res?.totalElements === 'number' ? res.totalElements : list.length);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить документы', 'error');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, typeFilter, notify]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(0); }, [typeFilter]);

  const handleDownload = async (doc) => {
    const id = doc.id;
    if (!id) return;
    setDownloadingId(id);
    try {
      const ext = (doc.fileFormat || 'pdf').toLowerCase();
      const filename = `${doc.documentNumber || doc.documentType || 'document'}.${ext}`;
      await documentService.download(id, filename);
      notify('Документ скачан');
    } catch (err) {
      notify(err.message || 'Не удалось скачать документ', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user || !orgId) return null;

  return (
    <Box sx={{ width: '100%', bgcolor: '#f5f5f5', minHeight: '100vh', pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight={700}>Документы</Typography>
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Обновить
          </Button>
        </Stack>

        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <FormControl size="small" sx={{ minWidth: 280 }}>
            <InputLabel>Тип документа</InputLabel>
            <Select
              value={typeFilter}
              label="Тип документа"
              variant="outlined"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">Все типы</MenuItem>
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        <Paper sx={{ borderRadius: 3 }}>
          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={DescriptionIcon}
              title="Документов пока нет"
              description="Документы создаются автоматически при операциях приёмки, отгрузки, списания и переоценки. После операции документ появится здесь."
              sx={{ py: 6 }}
            />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Номер</TableCell>
                      <TableCell>Тип</TableCell>
                      <TableCell>Формат</TableCell>
                      <TableCell>Сгенерирован</TableCell>
                      <TableCell>Операция</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {doc.documentNumber || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <DescriptionIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {TYPE_LABEL[doc.documentType] || doc.documentType}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(doc.fileFormat || 'pdf').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{formatDate(doc.generatedAt)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {doc.operationId ? String(doc.operationId).slice(0, 8) + '…' : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                          >
                            {downloadingId === doc.id
                              ? <CircularProgress size={18} />
                              : <DownloadIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Строк на странице"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
              />
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default DocumentsPage;
