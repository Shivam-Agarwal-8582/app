import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { GroupsListPage } from './pages/groups/GroupsListPage';
import { GroupDetailPage } from './pages/groups/GroupDetailPage';
import { ProfilePage } from './pages/profile/ProfilePage';

/**
 * Handles Android Hardware Back Button navigation lifecycle
 */
const AndroidLifecycleManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;
    let handle: any = null;

    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!isMounted) return;

      const path = location.pathname;
      if (path === '/dashboard' || path === '/login' || path === '/') {
        CapApp.minimizeApp();
      } else if (canGoBack) {
        navigate(-1);
      } else {
        navigate('/dashboard');
      }
    }).then((listener) => {
      handle = listener;
    });

    return () => {
      isMounted = false;
      if (handle?.remove) {
        handle.remove();
      }
    };
  }, [navigate, location]);

  return null;
};

export const App: React.FC = () => {
  const initAuth = useAuthStore((s) => s.initAuth);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    const bootstrap = async () => {
      await initAuth();
      if (token) {
        await fetchCurrentUser();
      }
      if (Capacitor.isNativePlatform()) {
        try {
          await SplashScreen.hide();
        } catch {
          // ignore
        }
      }
    };
    bootstrap();
  }, [initAuth, token, fetchCurrentUser]);

  return (
    <BrowserRouter>
      <AndroidLifecycleManager />
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/groups" element={<GroupsListPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
