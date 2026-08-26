import React from 'react';
import { Search, Plus, Terminal, Sparkles, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useModuleStore } from '../store/useModuleStore';

interface NavbarProps {
  onOpenCreateProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateProject }) => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useModuleStore();

  return (
    <header className="h-16 bg-black/85 backdrop-blur-xl border-b border-amber-500/20 px-6 flex items-center justify-between sticky top-0 z-20 shadow-md">
      {/* Search Input */}
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/70" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search modules or ask AI (CRM, Auth, Payments...)"
          className="w-full bg-neutral-950/90 border border-amber-500/25 rounded-xl pl-9 pr-12 py-2 text-xs text-amber-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition shadow-inner"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-amber-300"
          >
            ×
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-amber-400/70 bg-neutral-900 px-1.5 py-0.5 rounded border border-amber-500/30">
            ⌘K
          </span>
        )}
      </div>

      {/* Action Controls & AI Badge */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
          <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>AI Engine Active</span>
        </div>

        <button
          onClick={() => navigate('/modules/create')}
          className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 text-amber-200 text-xs font-semibold border border-amber-500/30 hover:border-amber-500/60 flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Upload Module</span>
        </button>

        <button
          onClick={onOpenCreateProject || (() => navigate('/projects'))}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shadow-lg shadow-amber-500/25 flex items-center gap-1.5 transition transform active:scale-95"
        >
          <Terminal className="w-3.5 h-3.5 text-black stroke-[2.5]" />
          <span>Create Project</span>
        </button>
      </div>
    </header>
  );
};
