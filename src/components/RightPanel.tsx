import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  GitFork,
  UserPlus,
  Users,
  FileCheck,
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
  onSortProjects?: (targetAnchor?: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  validationResult,
  currentYaml,
  onUpdateYaml,
  onJumpToLine,
  onSortUsers,
  onSortProjects,
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
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border-l border-govuk-grey-border dark:border-zinc-800 select-none transition-colors">
      {/* GOV.UK Tab Navigation Header */}
      <div className="h-11 px-2 border-b border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey dark:bg-zinc-900 flex items-center justify-between shrink-0 overflow-x-auto">
        <div className="flex items-center gap-0.5">
          {/* Diagnostics Tab */}
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-4 border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 -mb-[1px]'
                : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
            }`}
          >
            <AlertCircle
              className={`w-3.5 h-3.5 ${
                errorCount > 0
                  ? 'text-govuk-red'
                  : warningCount > 0
                  ? 'text-govuk-yellow-tint'
                  : 'text-govuk-green'
              }`}
            />
            <span>Validation</span>
            {totalIssues > 0 && (
              <span
                className={`govuk-tag text-[10px] py-0.2 px-1 ${
                  errorCount > 0 ? 'govuk-tag--red' : 'govuk-tag--yellow text-govuk-black'
                }`}
              >
                {totalIssues}
              </span>
            )}
          </button>

          {/* Anchors Tab */}
          <button
            onClick={() => setActiveTab('anchors')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs transition-all cursor-pointer ${
              activeTab === 'anchors'
                ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-4 border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 -mb-[1px]'
                : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Anchors</span>
            {validationResult.stats.anchorCount > 0 && (
              <span className="govuk-tag govuk-tag--blue text-[10px] py-0.2 px-1">
                {validationResult.stats.anchorCount}
              </span>
            )}
          </button>

          {/* Add User Assistant Tab */}
          <button
            onClick={() => setActiveTab('adduser')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs transition-all cursor-pointer ${
              activeTab === 'adduser'
                ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-4 border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 -mb-[1px]'
                : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
            {validationResult.isUsersConfig && (
              <span className="govuk-tag govuk-tag--purple text-[10px] py-0.2 px-1">
                Wizard
              </span>
            )}
          </button>

          {/* Add Project Assistant Tab */}
          <button
            onClick={() => setActiveTab('addproject')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs transition-all cursor-pointer ${
              activeTab === 'addproject'
                ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-4 border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 -mb-[1px]'
                : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Add Project</span>
            {validationResult.isUsersConfig && (
              <span className="govuk-tag govuk-tag--blue text-[10px] py-0.2 px-1">
                Wizard
              </span>
            )}
          </button>

          {/* User Directory Tab (shown if users are configured) */}
          {validationResult.isUsersConfig && (
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-4 border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 -mb-[1px]'
                  : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users ({validationResult.stats.usersCount})</span>
            </button>
          )}

          {/* Project Hierarchy Tab (Project -> Environments -> Roles -> Users) */}
          {validationResult.isUsersConfig && (
            <button
              onClick={() => setActiveTab('hierarchy')}
              title="View Project -> Environments -> Roles -> Users Hierarchy"
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs transition-all cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-4 border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 -mb-[1px]'
                  : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Project Hierarchy</span>
            </button>
          )}

          {/* Resolved & JSON Tab */}
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs transition-all cursor-pointer ${
              activeTab === 'resolved'
                ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-4 border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 -mb-[1px]'
                : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
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
            onSortProjects={onSortProjects}
          />
        )}
        {activeTab === 'anchors' && (
          <AnchorsTab
            validationResult={validationResult}
            onJumpToLine={onJumpToLine}
            onSortProjects={onSortProjects}
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
            onSortProjects={onSortProjects}
            onOpenAddProject={() => setActiveTab('addproject')}
          />
        )}
        {activeTab === 'hierarchy' && (
          <UserDirectoryTab
            validationResult={validationResult}
            onJumpToLine={onJumpToLine}
            onSortUsers={onSortUsers}
            onSortProjects={onSortProjects}
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
