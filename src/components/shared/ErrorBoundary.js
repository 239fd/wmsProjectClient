import React from 'react';
import { Box, Typography, Button, Alert, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/main';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, maxWidth: 640, mx: 'auto', mt: 6 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Что-то пошло не так</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {this.state.error?.message || 'Неизвестная ошибка при отображении страницы'}
            </Typography>
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleReset}>
              Попробовать снова
            </Button>
            <Button variant="outlined" startIcon={<HomeIcon />} onClick={this.handleHome}>
              На главную
            </Button>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
