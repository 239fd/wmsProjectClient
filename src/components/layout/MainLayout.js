import React from 'react';
import MainNavbar from './MainNavbar';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import ErrorBoundary from '../shared/ErrorBoundary';
import PageBreadcrumbs from '../shared/PageBreadcrumbs';

const MainLayout = () => (
  <>
    <MainNavbar />
    <PageBreadcrumbs />
    <Box component="main" sx={{ width: '100%' }}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </Box>
  </>
);

export default MainLayout;
