import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  GitFork,
  UserPlus,
  Users,
  FileCheck,
  FolderPlus,
} from 'lucide-react';
import { ValidationResult } from '../types/yaml';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';
import { AnchorsTab } from './tabs/AnchorsTab';
import { AddUserTab } from './tabs/AddUserTab';
import { AddProjectTab } from './tabs/AddProjectTab';
import { UserDirectoryTab } from './tabs/UserDirectoryTab';
import { ResolvedTab } from './tabs/ResolvedTab';

export type RightPanelTab = 'diagnostics' | 'anchors' | 'directory' | 'resolved' | 'adduser' | 'addproject' | 'hierarchy';

interface RightPanelProps {
  validationResult: ValidationResult;
  currentYaml: string;
  onUpdateYaml: (newYaml: string) => void;
  onJumpToLine: (line: number, column?: number) => void;
  onSortUsers?: () => void;
  onSortProjects?: (targetAnchor?: string) => void;
  activeTab?: RightPanelTab;
  onSelectTab?: (tab: RightPanelTab) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  validationResult,
  currentYaml,
  onUpdateYaml,
  onJumpToLine,
  onSortUsers,
  onSortProjects,
  activeTab: controlledTab,
  onSelectTab,
}) => {
  const [internalTab, setInternalTab] = useState<RightPanelTab>('diagnostics');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: RightPanelTab) => {
    if (onSelectTab) onSelectTab(tab);
    setInternalTab(tab);
  };

  const errorCount = validationResult.issues.filter(i => i.severity === 'error').length;
  const warningCount = validationResult.issues.filter(i => i.severity === 'warning').length;
  const totalIssues = errorCount + warningCount;

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const allTabs: {
    id: RightPanelTab;
    label: string;
    icon: React.ReactNode;
    tag?: React.ReactNode;
    visible?: boolean;
  }[] = [
    {
      id: 'diagnostics',
      label: 'Validation',
      icon: (
        <AlertCircle
          className={`w-3.5 h-3.5 ${
            errorCount > 0
              ? 'text-govuk-red'
              : warningCount > 0
              ? 'text-govuk-yellow-tint'
              : 'text-govuk-green'
          }`}
        />
      ),
      tag: totalIssues > 0 ? (
        <span
          className={`govuk-tag text-[10px] py-0.2 px-1 ${
            errorCount > 0 ? 'govuk-tag--red' : 'govuk-tag--yellow text-govuk-black'
          }`}
        >
          {totalIssues}
        </span>
      ) : undefined,
    },
    {
      id: 'anchors',
      label: 'Anchors',
      icon: <GitFork className="w-3.5 h-3.5" />,
      tag: validationResult.stats.anchorCount > 0 ? (
        <span className="govuk-tag govuk-tag--blue text-[10px] py-0.2 px-1">
          {validationResult.stats.anchorCount}
        </span>
      ) : undefined,
    },
    {
      id: 'directory',
      label: `Users & Access (${validationResult.stats.usersCount})`,
      icon: <Users className="w-3.5 h-3.5" />,
      visible: validationResult.isUsersConfig,
    },
    {
      id: 'resolved',
      label: 'Resolved YAML',
      icon: <FileCheck className="w-3.5 h-3.5" />,
    },
  ];

  const visibleTabs = allTabs.filter(t => t.visible !== false);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % visibleTabs.length;
      const nextTab = visibleTabs[nextIndex];
      setActiveTab(nextTab.id);
      tabRefs.current[nextTab.id]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + visibleTabs.length) % visibleTabs.length;
      const prevTab = visibleTabs[prevIndex];
      setActiveTab(prevTab.id);
      tabRefs.current[prevTab.id]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const firstTab = visibleTabs[0];
      setActiveTab(firstTab.id);
      tabRefs.current[firstTab.id]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastTab = visibleTabs[visibleTabs.length - 1];
      setActiveTab(lastTab.id);
      tabRefs.current[lastTab.id]?.focus();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border-l border-govuk-grey-border dark:border-zinc-800 select-none transition-colors">
      {/* GOV.UK Tab Navigation Header */}
      <nav
        className="h-11 px-2 pt-1 border-b-2 border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey dark:bg-zinc-900 flex items-end justify-between shrink-0 overflow-x-auto overflow-y-hidden"
        role="tablist"
        aria-label="Editor Views"
      >
        <div className="flex items-end gap-1 min-w-max pb-0 -mb-[2px]">
          {visibleTabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={el => {
                  tabRefs.current[tab.id] = el;
                }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={0}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={e => handleTabKeyDown(e, idx)}
                className={`group relative h-[40px] inline-flex items-center gap-1.5 px-3.5 text-xs cursor-pointer transition-colors border-t-4 select-none shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-950 text-govuk-black dark:text-zinc-100 font-bold border-t-govuk-blue border-x border-govuk-grey-border dark:border-zinc-800 border-b-2 border-b-white dark:border-b-zinc-950 z-10'
                    : 'text-govuk-blue dark:text-zinc-400 hover:text-govuk-blue-dark dark:hover:text-zinc-200 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 border-t-transparent border-x border-transparent border-b-2 border-b-transparent font-medium'
                } focus:outline-none focus-visible:outline-none focus-visible:border-t-govuk-blue focus-visible:bg-govuk-yellow focus-visible:text-govuk-black focus-visible:shadow-[0_-2px_#ffdd00,0_4px_#0b0c0c] focus-visible:z-20`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.tag}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Add User & Add Project */}
        {validationResult.isUsersConfig && (
          <div className="flex items-center gap-1.5 pb-1 shrink-0 ml-auto pl-2">
            <button
              type="button"
              onClick={() => setActiveTab('adduser')}
              title="Add a new user (Wizard)"
              className={`text-xs font-bold py-1 px-2.5 rounded-none mb-0 inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === 'adduser'
                  ? 'govuk-button ring-2 ring-govuk-black'
                  : 'govuk-button'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addproject')}
              title="Add a new project & environment (Wizard)"
              className={`text-xs font-bold py-1 px-2.5 rounded-none mb-0 inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === 'addproject'
                  ? 'govuk-button--secondary border-2 border-govuk-black'
                  : 'govuk-button--secondary'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>
        )}
      </nav>

      {/* Tab Content Body */}
      <div
        className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-zinc-950"
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
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
            onSwitchToDirectory={() => setActiveTab('directory')}
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
        {(activeTab === 'directory' || activeTab === 'hierarchy') && (
          <UserDirectoryTab
            validationResult={validationResult}
            onJumpToLine={onJumpToLine}
            onSortUsers={onSortUsers}
            onSortProjects={onSortProjects}
            onOpenAddUser={() => setActiveTab('adduser')}
            onOpenAddProject={() => setActiveTab('addproject')}
            initialStatFilter={activeTab === 'hierarchy' ? 'projects' : undefined}
            initialProjectsViewMode={activeTab === 'hierarchy' ? 'hierarchy' : undefined}
          />
        )}
        {activeTab === 'resolved' && (
          <ResolvedTab validationResult={validationResult} />
        )}
      </div>
    </div>
  );
};
