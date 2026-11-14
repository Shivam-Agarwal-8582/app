import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, User, Plus } from 'lucide-react';

interface BottomNavProps {
  onOpenCreateGroup?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenCreateGroup }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] transition-colors shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <Users className="w-5 h-5" />
          <span>Groups</span>
        </NavLink>

        {onOpenCreateGroup && (
          <button
            onClick={onOpenCreateGroup}
            className="-mt-5 w-12 h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 transition-transform active:scale-95"
            title="Create New Group"
            aria-label="Create New Group"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

