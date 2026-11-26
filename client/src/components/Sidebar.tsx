import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  PackageCheck,
  FolderGit2,
  PlusCircle,
  Settings,
  Zap,
  LogOut,
  Sparkles,
  Layers,
  Crown,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Sidebar: React.FC = () => {
  const { user, isDevMode, logout } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Modules', path: '/modules', icon: Boxes },
    { label: 'My Modules', path: '/my-modules', icon: PackageCheck },
    { label: 'My Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Teams & Tasks', path: '/teams', icon: Users },
    { label: 'Create Module', path: '/modules/create', icon: PlusCircle },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-black/95 border-r border-amber-500/20 flex flex-col h-screen sticky top-0 select-none z-30 shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-amber-500/20 flex items-center justify-between bg-gradient-to-b from-amber-500/5 to-transparent">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              <span className="gold-text-gradient">ModuleForge</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 rounded border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-amber-200/60 font-mono">Software Module Engine</p>
          </div>
        </NavLink>
      </div>

      {/* Dev Mode Banner Indicator */}
      {isDevMode && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-amber-300 text-xs">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <div className="leading-tight">
            <span className="font-semibold block text-[11px]">Development Mode</span>
            <span className="text-[10px] text-amber-400/80">Local Dev Auth Active</span>
          </div>
        </div>
      )}

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-semibold font-mono tracking-wider text-amber-400/60 uppercase flex items-center justify-between">
          <span>Navigation</span>
          <Crown className="w-3 h-3 text-amber-500/60" />
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10 font-semibold'
                    : 'text-neutral-400 hover:text-amber-200 hover:bg-neutral-900/80 border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Antigravity AI Banner */}
        <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-black to-neutral-950 border border-amber-500/30 text-xs text-neutral-300 shadow-lg">
          <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>AI Architecture Ready</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Exported ZIP packages include PROJECT.json tailored for instant AI coding agent orchestration.
          </p>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-amber-500/20 bg-black/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-amber-500/20 hover:border-amber-500/40 transition">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="User Avatar"
              className="w-8 h-8 rounded-full ring-2 ring-amber-500/50 object-cover shadow-sm"
            />
            <div className="truncate text-xs">
              <span className="font-semibold text-neutral-200 block truncate">{user?.name || 'Developer'}</span>
              <span className="text-amber-300/70 block truncate text-[11px] font-mono">{user?.email || 'dev@moduleforge.io'}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
