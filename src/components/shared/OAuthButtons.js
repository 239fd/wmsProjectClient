import React from 'react';
import { Stack, Button, Divider } from '@mui/material';
import { BACKEND_URL as API_BASE_URL } from '../../config/api';

const OAuthButtons = ({ disabled = false, intent = null }) => {
  const buildRedirect = (provider) => {
    if (intent) {

      localStorage.setItem('oauthIntent', JSON.stringify({ ...intent, ts: Date.now() }));
    } else {
      localStorage.removeItem('oauthIntent');
    }
    const type = intent?.type || 'login';
    window.location.href = `${API_BASE_URL}/api/oauth/authorize/${provider}?type=${type}`;
  };

  return (
    <>
      <Divider sx={{ my: 3 }}>или</Divider>
      <Stack spacing={1}>
        <Button
          variant="outlined"
          startIcon={
            <img
              src={require('../../assets/icons/icons8-google.svg').default}
              alt="Google"
              style={{ width: 24, height: 24 }}
            />
          }
          fullWidth
          onClick={() => buildRedirect('google')}
          disabled={disabled}
          type="button"
          sx={{ textTransform: 'none' }}
        >
          Через Google
        </Button>
        <Button
          variant="outlined"
          startIcon={
            <img
              src={require('../../assets/icons/idjTYqBahg_1760536075578.png')}
              alt="Yandex"
              style={{ width: 24, height: 24 }}
            />
          }
          fullWidth
          onClick={() => buildRedirect('yandex')}
          disabled={disabled}
          type="button"
          sx={{ textTransform: 'none' }}
        >
          Через Яндекс
        </Button>
      </Stack>
    </>
  );
};

export default OAuthButtons;
