import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { registerNotify } from '../utils/notifyBridge';

const SnackbarContext = createContext({ notify: () => {} });

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);

  const notify = useCallback((message, severity = 'success', options = {}) => {
    const id = Date.now() + Math.random();
    setQueue((prev) => [...prev, { id, message, severity, duration: 3500, ...options }]);
  }, []);

  useEffect(() => {
    registerNotify(notify);
    return () => registerNotify(null);
  }, [notify]);

  const handleClose = (id) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  };

  const current = queue[0];

  return (
    <SnackbarContext.Provider value={{ notify }}>
      {children}
      {current && (
        <Snackbar
          key={current.id}
          open
          autoHideDuration={current.duration}
          onClose={() => handleClose(current.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity={current.severity}
            onClose={() => handleClose(current.id)}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {current.message}
          </Alert>
        </Snackbar>
      )}
    </SnackbarContext.Provider>
  );
};
