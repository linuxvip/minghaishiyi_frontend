import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/Toast';
import { ConfigProvider } from './admin/contexts/ConfigContext';
import { AuthProvider } from './admin/contexts/AuthContext';
import { UserAuthProvider } from './user/contexts/UserAuthContext';

// 后台管理页按需加载：普通访客永不加载这些 chunk
const ProtectedRoute = lazy(() => import('./admin/components/ProtectedRoute'));
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'));
const LoginPage = lazy(() => import('./admin/pages/LoginPage'));
const DashboardPage = lazy(() => import('./admin/pages/DashboardPage'));
const UserListPage = lazy(() => import('./admin/pages/users/UserListPage'));
const UserFormPage = lazy(() => import('./admin/pages/users/UserFormPage'));
const GroupListPage = lazy(() => import('./admin/pages/groups/GroupListPage'));
const GroupFormPage = lazy(() => import('./admin/pages/groups/GroupFormPage'));
const DestinyCaseListPage = lazy(() => import('./admin/pages/destiny-cases/DestinyCaseListPage'));
const DestinyCaseFormPage = lazy(() => import('./admin/pages/destiny-cases/DestinyCaseFormPage'));
const ArticleListPage = lazy(() => import('./admin/pages/articles/ArticleListPage'));
const ArticleFormPage = lazy(() => import('./admin/pages/articles/ArticleFormPage'));
const ProcessingTaskListPage = lazy(() => import('./admin/pages/processing-tasks/ListPage'));
const ProcessingTaskDetailPage = lazy(() => import('./admin/pages/processing-tasks/DetailPage'));
const SettingsPage = lazy(() => import('./admin/pages/SettingsPage'));
const AuditLogPage = lazy(() => import('./admin/pages/audit/AuditLogPage'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ConfigProvider><AuthProvider><UserAuthProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-[#fbf9f4] flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-stone-200 border-t-[#2b2320] animate-spin"></div>
              <span className="text-xs font-bold text-stone-400 tracking-widest">加载中...</span>
            </div>
          }>
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
              <Route path="articles" element={<ArticleListPage />} />
              <Route path="articles/new" element={<ArticleFormPage />} />
              <Route path="articles/:id" element={<ArticleFormPage />} />
              <Route path="processing-tasks" element={<ProcessingTaskListPage />} />
              <Route path="processing-tasks/:id" element={<ProcessingTaskDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit-logs" element={<AuditLogPage />} />
            </Route>

            <Route path="/*" element={<App />} />
          </Routes>
          </Suspense>
        </UserAuthProvider></AuthProvider></ConfigProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);