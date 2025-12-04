import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { Box, CircularProgress } from '@mui/material';

// Layouts
import GuestLayout from '../components/layout/GuestLayout';
import MainLayout from '../components/layout/MainLayout';

// Pages
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import RoleSelectPage from '../pages/RoleSelectPage';
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

// Защищённый маршрут (только для авторизованных)
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Маршрут только для гостей
const GuestRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/main" replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* OAuth Callback - доступен всегда */}
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />

      {/* Выбор роли - доступен при наличии данных регистрации */}
      <Route path="/role" element={<RoleSelectPage />} />

      {/* Публичные маршруты с GuestLayout */}
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
      </Route>

      {/* Защищённые маршруты с MainLayout */}
      <Route path="/main" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<MainPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="organization" element={<OrganizationPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="receive" element={<ReceivePage />} />
        <Route path="ship" element={<ShipPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="writeoff" element={<WriteoffPage />} />
        <Route path="revaluation" element={<RevaluationPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* 404 - редирект на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;

