import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import documentService from '../../services/documentService';
import { useSnackbar } from '../../context/SnackbarContext';

const DocumentDownloadButton = ({ documentId, filename, label = 'Скачать акт', size = 'small', variant = 'outlined' }) => {
    const { notify } = useSnackbar();
    const [busy, setBusy] = useState(false);

    if (!documentId) return null;

    const handleClick = async () => {
        setBusy(true);
        try {
            await documentService.download(documentId, filename || `${documentId}.pdf`);
        } catch (err) {
            notify(err.message || 'Не удалось скачать документ', 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Button
            type="button"
            size={size}
            variant={variant}
            onClick={handleClick}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
        >
            {label}
        </Button>
    );
};

export default DocumentDownloadButton;
