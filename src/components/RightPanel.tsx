import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  GitFork,
  UserPlus,
  Users,
  FileCheck,
  Sparkles,
  FolderPlus,
  FolderTree,
} from 'lucide-react';
import { ValidationResult } from '../types/yaml';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';
import { AnchorsTab } from './tabs/AnchorsTab';
import { AddUserTab } from './tabs/AddUserTab';
import { AddProjectTab } from './tabs/AddProjectTab';
import { UserDirectoryTab } from './tabs/UserDirectoryTab';
import { ResolvedTab } from './tabs/ResolvedTab';

type RightPanelTab = 'diagnostics' | 'anchors' | 'adduser' | 'addproject' | 'directory' | 'hierarchy' | 'resolved';

interface RightPanelProps {
  validationResult: ValidationResult;
  currentYaml: string;
  onUpdateYaml: (newYaml: string) => void;
  onJumpToLine: (line: number, column?: number) => void;
  onSortUsers?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  validationResult,
  currentYaml,
  onUpdateYaml,
  onJumpToLine,
  onSortUsers,
}) => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('diagnostics');

  const errorCount = validationResult.issues.filter(i => i.severity === 'error').length;
  const warningCount = validationResult.issues.filter(i => i.severity === 'warning').length;
  const totalIssues = errorCount + warningCount;

  // If there are errors, make sure user can easily see diagnostics
  useEffect(() => {
    if (errorCount > 0 && activeTab !== 'diagnostics' && activeTab !== 'adduser') {
      // Keep current tab unless user wants to inspect
    }
  }, [errorCount, activeTab]);

  return (
    <div className="h-full flex flex-col bg-slate-50/70 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 select-none transition-colors">
      {/* Tab Navigation Header */}
      <div className="h-10 px-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 flex items-center justify-between shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1">
          {/* Diagnostics Tab */}
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'diagnostics'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <AlertCircle
              className={`w-3.5 h-3.5 ${
                errorCount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : warningCount > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            />
            <span>Validation</span>
            {totalIssues > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  errorCount > 0
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                }`}
              >
                {totalIssues}
              </span>
            )}
          </button>

          {/* Anchors & Aliases Tab */}
          <button
            onClick={() => setActiveTab('anchors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'anchors'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Anchors &amp; Merges</span>
            {validationResult.stats.anchorCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                {validationResult.stats.anchorCount}
              </span>
            )}
          </button>

          {/* Add User Assistant Tab */}
          <button
            onClick={() => setActiveTab('adduser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'adduser'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Add User</span>
            {validationResult.isUsersConfig && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Wizard
              </span>
            )}
          </button>

          {/* Add Project Assistant Tab */}
          <button
            onClick={() => setActiveTab('addproject')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'addproject'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Add Project</span>
            {validationResult.isUsersConfig && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Wizard
              </span>
            )}
          </button>

          {/* User Directory Tab (shown if users are configured) */}
          {validationResult.isUsersConfig && (
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Users ({validationResult.stats.usersCount})</span>
            </button>
          )}

          {/* Project Hierarchy Tab (Project -> Environments -> Roles -> Users) */}
          {validationResult.isUsersConfig && (
            <button
              onClick={() => setActiveTab('hierarchy')}
              title="View Project -> Environments -> Roles -> Users Hierarchy"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'hierarchy'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Project Hierarchy</span>
            </button>
          )}

          {/* Resolved & JSON Tab */}
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'resolved'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Resolved YAML</span>
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'diagnostics' && (
          <DiagnosticsTab
            validationResult={validationResult}
            onJumpToLine={onJumpToLine}
            onSortUsers={onSortUsers}
          />
        )}
        {activeTab === 'anchors' && (
          <AnchorsTab
            validationResult={validationResult}
            onJumpToLine={onJumpToLine}
          />
        )}
        {activeTab === 'adduser' && (
          <AddUserTab
            validationResult={validationResult}
            currentYaml={currentYaml}
            onUpdateYaml={onUpdateYaml}
            onJumpToLine={onJumpToLine}
          />
        )}
        {activeTab === 'addproject' && (
          <AddProjectTab
            validationResult={validationResult}
            currentYaml={currentYaml}
            onUpdateYaml={onUpdateYaml}
            onJumpToLine={onJumpToLine}
            onSwitchToDirectory={() => setActiveTab('directory')}
          />
        )}
        {activeTab === 'directory' && (
          <UserDirectoryTab
            validationResult={validationResult}
            onJumpToLine={onJumpToLine}
            onSortUsers={onSortUsers}
            onOpenAddProject={() => setActiveTab('addproject')}
          />
        )}
        {activeTab === 'hierarchy' && (
          <UserDirectoryTab
            validationResult={validationResult}
            onJumpToLine={onJumpToLine}
            onSortUsers={onSortUsers}
            onOpenAddProject={() => setActiveTab('addproject')}
            initialStatFilter="projects"
            initialProjectsViewMode="hierarchy"
          />
        )}
        {activeTab === 'resolved' && (
          <ResolvedTab validationResult={validationResult} />
        )}
      </div>
    </div>
  );
};
