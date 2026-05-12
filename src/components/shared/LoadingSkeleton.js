import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

export const TableSkeleton = ({ rows = 5, columns = 5, sx }) => (
  <Box sx={{ p: 2, ...sx }}>
    <Stack direction="row" spacing={2} mb={2}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" width="100%" height={24} />
      ))}
    </Stack>
    {Array.from({ length: rows }).map((_, r) => (
      <Stack key={r} direction="row" spacing={2} mb={1.5}>
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton key={c} variant="rounded" width="100%" height={32} />
        ))}
      </Stack>
    ))}
  </Box>
);

export const ListSkeleton = ({ rows = 4, sx }) => (
  <Stack spacing={1.5} sx={{ p: 2, ...sx }}>
    {Array.from({ length: rows }).map((_, i) => (
      <Stack key={i} direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

export const CardsSkeleton = ({ count = 4, height = 100, sx }) => (
  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ p: 1, ...sx }}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton
        key={i}
        variant="rounded"
        sx={{ flex: '1 1 220px', minWidth: 220 }}
        height={height}
      />
    ))}
  </Stack>
);

export const FormSkeleton = ({ fields = 4, sx }) => (
  <Stack spacing={2} sx={{ p: 2, ...sx }}>
    {Array.from({ length: fields }).map((_, i) => (
      <Box key={i}>
        <Skeleton variant="text" width="30%" height={16} />
        <Skeleton variant="rounded" width="100%" height={40} />
      </Box>
    ))}
  </Stack>
);
