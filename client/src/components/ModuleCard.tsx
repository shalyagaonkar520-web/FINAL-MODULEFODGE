import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Github, Plus, Layers, ShieldCheck, Trash2 } from 'lucide-react';
import { Module } from '../types';
import { useProjectStore } from '../store/useProjectStore';

interface ModuleCardProps {
  module: Module;
  onAddToProject?: (module: Module) => void;
  onDeleteModule?: (module: Module) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, onAddToProject, onDeleteModule }) => {
  const navigate = useNavigate();
  const { currentProject, addModuleToCurrentProject } = useProjectStore();

  const technologies =
    Array.isArray(module.technologies) && module.technologies.length > 0
      ? module.technologies
      : ['React', 'Node.js'];

  const categoryColorMap: Record<string, string> = {
    CRM: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    Accounting: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    Inventory: 'bg-amber-600/10 text-amber-400 border-amber-600/30',
    Payments: 'bg-yellow-400/10 text-yellow-200 border-yellow-400/30',
    Authentication: 'bg-amber-300/10 text-amber-200 border-amber-300/30',
  };

  const categoryBadgeClass =
    categoryColorMap[module.categoryName] || 'bg-neutral-900 text-amber-300 border-amber-500/30';

  const isAlreadyAdded = currentProject?.modules.some(
    (pm) => (pm.module?.id || pm.moduleId) === module.id
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToProject) {
      onAddToProject(module);
    } else if (currentProject) {
      addModuleToCurrentProject(module);
    } else {
      navigate('/projects');
    }
  };

  return (
    <div
      onClick={() => navigate(`/modules/${module.id}`)}
      className="glass-ai-card rounded-2xl p-5 border border-amber-500/20 hover:border-amber-500/60 cursor-pointer flex flex-col justify-between group relative overflow-hidden transition-all duration-200 bg-neutral-950/80"
    >
      {/* Top Banner Gold Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${categoryBadgeClass}`}>
            {module.categoryName}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <span>v{module.version}</span>
            {module.sourceType === 'github' ? (
              <span
                title={
                  module.githubSyncStatus === 'update_available'
                    ? 'Update available on GitHub'
                    : 'Synced with GitHub'
                }
                className={`flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                  module.githubSyncStatus === 'update_available'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <Github className="w-3 h-3 inline" />
                <span>{module.githubSyncStatus === 'update_available' ? 'Update' : 'Synced'}</span>
              </span>
            ) : (
              <span title="Uploaded ZIP verified">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
              </span>
            )}
          </div>
        </div>

        {/* Title & Author */}
        <div className="flex items-start gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors text-base leading-snug">
              {module.name}
            </h3>
            <p className="text-[11px] text-amber-200/60 font-mono">by {module.author}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed mb-4">
          {module.description}
        </p>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {technologies.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded-lg bg-black border border-amber-500/20 text-[10px] text-amber-200/70 font-mono"
            >
              {tech}
            </span>
          ))}
          {technologies.length > 3 && (
            <span className="px-1.5 py-0.5 text-[10px] text-neutral-500 font-mono">
              +{technologies.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Stats & Actions */}
      <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
          <Download className="w-3.5 h-3.5 text-amber-500/60" />
          <span>{module.downloads} downloads</span>
        </div>

        <div className="flex items-center gap-2">
          {onDeleteModule && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteModule(module);
              }}
              className="p-1.5 rounded-xl bg-black hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition"
              title="Delete Module Folder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleAdd}
            disabled={isAlreadyAdded}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
              isAlreadyAdded
                ? 'bg-neutral-900 text-neutral-500 cursor-default border border-neutral-800'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/20'
            }`}
          >
            {isAlreadyAdded ? (
              'Added ✓'
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>Add to Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
