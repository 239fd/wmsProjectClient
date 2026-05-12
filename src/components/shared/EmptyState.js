import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, sx }) => (
  <Box sx={{ textAlign: 'center', py: 6, px: 3, ...sx }}>
    {Icon && <Icon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />}
    {title && (
      <Typography variant="h6" mb={description ? 1 : 2}>
        {title}
      </Typography>
    )}
    {description && (
      <Typography variant="body2" color="text.secondary" mb={2} sx={{ maxWidth: 480, mx: 'auto' }}>
        {description}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;
