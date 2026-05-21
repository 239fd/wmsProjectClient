import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, CircularProgress, Box, LinearProgress, Typography
} from '@mui/material';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmColor = 'primary',
  busy = false,
  maxWidth = 'xs',
  countdownSeconds = 0,
}) => {
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (!open || !countdownSeconds) {
      setRemaining(countdownSeconds);
      return undefined;
    }
    setRemaining(countdownSeconds);
    const id = setInterval(() => {
      setRemaining((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [open, countdownSeconds]);

  const locked = remaining > 0;
  const progress = countdownSeconds > 0
    ? ((countdownSeconds - remaining) / countdownSeconds) * 100
    : 100;

  return (
    <Dialog open={open} onClose={() => !busy && onClose?.()} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{message}</DialogContentText>
        {countdownSeconds > 0 && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={locked ? 'warning' : 'success'}
              sx={{ height: 6, borderRadius: 1 }}
            />
            <Typography
              variant="caption"
              color={locked ? 'warning.main' : 'success.main'}
              sx={{ display: 'block', mt: 1, fontWeight: 500 }}
            >
              {locked
                ? `Кнопка станет активной через ${remaining} с — это защита от случайного нажатия.`
                : 'Теперь можно подтвердить действие.'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy} autoFocus>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={busy || locked}
        >
          {busy ? <CircularProgress size={20} color="inherit" /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
