import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Button, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Pagination
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
  'receipt-order':   'Приходный ордер',
  'release-order':   'Расходный ордер',
  'shipment-order':  'Заказ на отгрузку',
  'inventory-report':'Опись инвентаризации',
  'revaluation-act': 'Акт переоценки',
  'write-off-act':   'Акт списания',
  'waybill':         'Накладная (ТТН)',
  'picking-list':    'Лист подбора',
  'receipt-act':     'Акт приёмки',
  'invoice-fact':    'Счёт-фактура',
  'invoice':         'Инвойс',
  'transport-note':  'Транспортная накладная',
  'cmr':             'CMR',
  'discrepancy-act': 'Акт о расхождении',
};

const formatDate = (iso) => iso ? new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const DocumentsPage = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { notify } = useSnackbar();
  const orgId = user?.organizationId;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
      const res = await documentService.list({ page, size: 20 });

      const list = res?.content || res?.documents || (Array.isArray(res) ? res : []);
      setItems(list);
      setTotalPages(res?.totalPages || 1);
    } catch (err) {
      notify(err.message || 'Не удалось загрузить документы', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, notify]);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (doc) => {
    const id = doc.documentId || doc.id;
    if (!id) return;
    setDownloadingId(id);
    try {
      const ext = (doc.format || 'pdf').replace(/^rpa-/, '');
      const filename = `${doc.type || 'document'}-${String(id).slice(0, 8)}.${ext}`;
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
                      <TableCell>Тип</TableCell>
                      <TableCell>ID</TableCell>
                      <TableCell>Формат</TableCell>
                      <TableCell>Создан</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((doc) => {
                      const id = doc.documentId || doc.id;
                      return (
                        <TableRow key={id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <DescriptionIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {TYPE_LABEL[doc.type] || doc.type}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {String(id).slice(0, 8)}…
                            </Typography>
                          </TableCell>
                          <TableCell>{(doc.format || 'pdf').toUpperCase()}</TableCell>
                          <TableCell>{formatDate(doc.createdAt)}</TableCell>
                          <TableCell>
                            <Chip
                              label={doc.status || 'GENERATED'}
                              size="small"
                              color={doc.status === 'FAILED' ? 'error' : 'success'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDownload(doc)}
                              disabled={downloadingId === id}
                            >
                              {downloadingId === id
                                ? <CircularProgress size={18} />
                                : <DownloadIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" py={2}>
                  <Pagination
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, p) => setPage(p - 1)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default DocumentsPage;
