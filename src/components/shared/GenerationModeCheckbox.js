import React, { useEffect, useState } from 'react';
import { Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { API_ENDPOINTS } from '../../config/api';
import httpService from '../../services/httpService';

const readDefault = () =>
  localStorage.getItem('generationMode') === 'rpa' ? 'rpa' : 'auto';

export default function GenerationModeCheckbox({ value, onChange, disabled = false }) {
  const [internal, setInternal] = useState(readDefault);
  const [available, setAvailable] = useState(true);
  const [reason, setReason] = useState('');

  const current = value !== undefined ? value : internal;

  useEffect(() => {
    let cancelled = false;
    httpService
      .get(API_ENDPOINTS.DOCUMENTS?.RPA_HEALTH || '/api/documents/rpa/health')
      .then((data) => {
        if (cancelled) return;
        setAvailable(!!data?.enabled);
        setReason(data?.reason || '');
      })
      .catch(() => {
        if (!cancelled) {
          setAvailable(false);
          setReason('Не удалось проверить состояние Python rpa-service');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const next = e.target.checked ? 'rpa' : 'auto';
    if (onChange) onChange(next);
    if (value === undefined) setInternal(next);
  };

  const tip = available
    ? 'Документ будет заполнен через Python rpa-service (реальный .xlsx / .docx из шаблона). Если шаблона нет — автоматически переключится на программный канал (PDF).'
    : reason || 'Python rpa-service сейчас недоступен. Будет использован программный канал (PDF).';

  return (
    <Tooltip title={tip} arrow>
      <span>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={current === 'rpa'}
              onChange={handleChange}
              icon={<SmartToyIcon fontSize="small" />}
              checkedIcon={<SmartToyIcon fontSize="small" color="primary" />}
              disabled={disabled || !available}
            />
          }
          label="Заполнить через 1С / Office (RPA)"
          sx={{ ml: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
        />
      </span>
    </Tooltip>
  );
}
