import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { CreateGroupModal } from '../../pages/groups/CreateGroupModal';

export const AppLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors pb-[env(safe-area-inset-bottom,0px)]">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar onOpenCreateGroup={() => setIsCreateGroupOpen(true)} />
        <main className="flex-1 p-4 sm:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      <BottomNav onOpenCreateGroup={() => setIsCreateGroupOpen(true)} />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreated={() => {
          setIsCreateGroupOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
};
