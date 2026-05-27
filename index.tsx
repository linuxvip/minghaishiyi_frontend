import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/Toast';
import { ConfigProvider } from './admin/contexts/ConfigContext';
import { AuthProvider } from './admin/contexts/AuthContext';
import ProtectedRoute from './admin/components/ProtectedRoute';
import AdminLayout from './admin/components/AdminLayout';
import LoginPage from './admin/pages/LoginPage';
import DashboardPage from './admin/pages/DashboardPage';
import UserListPage from './admin/pages/users/UserListPage';
import UserFormPage from './admin/pages/users/UserFormPage';
import GroupListPage from './admin/pages/groups/GroupListPage';
import GroupFormPage from './admin/pages/groups/GroupFormPage';
import DestinyCaseListPage from './admin/pages/destiny-cases/DestinyCaseListPage';
import DestinyCaseFormPage from './admin/pages/destiny-cases/DestinyCaseFormPage';
import SettingsPage from "./admin/pages/SettingsPage";
import AuditLogPage from './admin/pages/audit/AuditLogPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ConfigProvider><AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<LoginPage />} />

            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UserListPage />} />
              <Route path="users/new" element={<UserFormPage />} />
              <Route path="users/:id" element={<UserFormPage />} />
              <Route path="groups" element={<GroupListPage />} />
              <Route path="groups/new" element={<GroupFormPage />} />
              <Route path="groups/:id" element={<GroupFormPage />} />
              <Route path="destiny-cases" element={<DestinyCaseListPage />} />
              <Route path="destiny-cases/new" element={<DestinyCaseFormPage />} />
              <Route path="destiny-cases/:id" element={<DestinyCaseFormPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
            </Route>

            <Route path="/*" element={<App />} />
          </Routes>
        </AuthProvider></ConfigProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
