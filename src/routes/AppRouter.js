import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectUser, bootstrapUser } from '../store/slices/authSlice';
import { Box, CircularProgress } from '@mui/material';


import GuestLayout from '../components/layout/GuestLayout';
import MainLayout from '../components/layout/MainLayout';


import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import RegisterDirectorPage from '../pages/RegisterDirectorPage';
import RegisterByInvitationPage from '../pages/RegisterByInvitationPage';
import OAuthCallbackPage from '../pages/OAuthCallbackPage';
import MainPage from '../pages/MainPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import OrganizationPage from '../pages/OrganizationPage';
import EmployeesPage from '../pages/EmployeesPage';
import ReceivePage from '../pages/ReceivePage';
import ShipPage from '../pages/ShipPage';
import InventoryPage from '../pages/InventoryPage';
import WriteoffPage from '../pages/WriteoffPage';
import RevaluationPage from '../pages/RevaluationPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import SuppliersPage from '../pages/SuppliersPage';
import DocumentsPage from '../pages/DocumentsPage';


const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


const RoleGuard = ({ allowed, children }) => {
  const user = useSelector(selectUser);
  const userRole = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : undefined);

  if (!user || !allowed.includes(userRole)) {
    return <Navigate to="/main" replace />;
  }

  return children;
};


const OrgRequiredRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const userRole = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : undefined);

  if (userRole === 'DIRECTOR' && !user?.organizationId) {
    return <Navigate to="/main/organization?firstTime=true" replace />;
  }

  return children;
};


const GuestRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/main" replace />;
  }

  return children;
};

const AppRouter = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);


  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(bootstrapUser());
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <Routes>
      {}
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {}
      <Route path="/" element={<GuestLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        } />
        <Route path="register" element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        } />
        <Route path="register/director" element={
          <GuestRoute>
            <RegisterDirectorPage />
          </GuestRoute>
        } />
        <Route path="register/invitation" element={
          <GuestRoute>
            <RegisterByInvitationPage />
          </GuestRoute>
        } />
      </Route>

      {}
      <Route path="/main" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<MainPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="organization" element={
          <RoleGuard allowed={['DIRECTOR']}>
            <OrganizationPage />
          </RoleGuard>
        } />
        <Route path="employees" element={
          <RoleGuard allowed={['DIRECTOR']}>
            <OrgRequiredRoute>
              <EmployeesPage />
            </OrgRequiredRoute>
          </RoleGuard>
        } />
        <Route path="receive" element={
          <RoleGuard allowed={['WORKER']}>
            <ReceivePage />
          </RoleGuard>
        } />
        <Route path="ship" element={
          <RoleGuard allowed={['WORKER']}>
            <ShipPage />
          </RoleGuard>
        } />
        <Route path="inventory" element={
          <RoleGuard allowed={['ACCOUNTANT']}>
            <InventoryPage />
          </RoleGuard>
        } />
        <Route path="writeoff" element={
          <RoleGuard allowed={['ACCOUNTANT']}>
            <WriteoffPage />
          </RoleGuard>
        } />
        <Route path="revaluation" element={
          <RoleGuard allowed={['ACCOUNTANT']}>
            <RevaluationPage />
          </RoleGuard>
        } />
        <Route path="analytics" element={
          <RoleGuard allowed={['DIRECTOR']}>
            <OrgRequiredRoute>
              <AnalyticsPage />
            </OrgRequiredRoute>
          </RoleGuard>
        } />
        <Route path="suppliers" element={
          <RoleGuard allowed={['WORKER']}>
            <SuppliersPage />
          </RoleGuard>
        } />
        <Route path="supplies" element={<Navigate to="/main/receive" replace />} />
        <Route path="erp-extractor" element={<Navigate to="/main/receive" replace />} />
        <Route path="documents" element={
          <RoleGuard allowed={['WORKER', 'ACCOUNTANT']}>
            <DocumentsPage />
          </RoleGuard>
        } />
      </Route>

      {}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;

