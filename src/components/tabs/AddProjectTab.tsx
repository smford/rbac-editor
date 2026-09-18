import React, { useState, useMemo } from 'react';
import {
  FolderPlus,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  Search,
  Key,
  ExternalLink,
} from 'lucide-react';
import { ValidationResult } from '../../types/yaml';
import { addProjectAndEnvironmentToYaml, ProjectUserAssignment } from '../../utils/yamlValidator';

interface AddProjectTabProps {
  validationResult: ValidationResult;
  currentYaml: string;
  onUpdateYaml: (newYaml: string) => void;
  onJumpToLine: (line: number, column?: number) => void;
  onSwitchToDirectory?: () => void;
}

const COMMON_ENVIRONMENTS = ['development', 'staging', 'production', 'sandbox'];

export const AddProjectTab: React.FC<AddProjectTabProps> = ({
  validationResult,
  currentYaml,
  onUpdateYaml,
  onJumpToLine,
  onSwitchToDirectory,
}) => {
  const usersMeta = validationResult.usersMetadata;
  const allUsers = usersMeta?.users || [];
  const knownProjects = usersMeta?.knownProjects || [];
  const availableRoleAnchors = usersMeta?.availableRoleAnchors || [];

  // Form State
  const [projectName, setProjectName] = useState('');
  const [environmentName, setEnvironmentName] = useState('development');
  const [useRoleAnchor, setUseRoleAnchor] = useState<boolean>(availableRoleAnchors.length > 0);
  const [selectedRoleAnchor, setSelectedRoleAnchor] = useState<string>(
    availableRoleAnchors.find(a => a.includes('admin')) || availableRoleAnchors[0] || 'admin_role'
  );
  const [defaultRoles, setDefaultRoles] = useState<string[]>(['admin', 'readonly']);
  const [addToGlobalPresets, setAddToGlobalPresets] = useState<boolean>(true);

  // User Access Selections: map username -> { selected: boolean; roles: string[]; roleAnchor?: string }
  const [userSelections, setUserSelections] = useState<
    Record<string, { selected: boolean; roles: string[]; roleAnchor?: string }>
  >({});

  // Filtering & search
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'selected' | 'standard' | 'power' | 'super'>('all');

  // Success Feedback
  const [successFeedback, setSuccessFeedback] = useState<{
    message: string;
    line: number;
    usersCount: number;
    projectName: string;
  } | null>(null);

  // Validation checks
  const cleanProjectName = projectName.trim().toLowerCase();
  const cleanEnvName = environmentName.trim().toLowerCase();

  const isProjectNameValid = cleanProjectName.length > 0 && /^[a-z0-9._-]+$/.test(cleanProjectName);
  const isEnvNameValid = cleanEnvName.length > 0 && /^[a-z0-9._-]+$/.test(cleanEnvName);
  const projectAlreadyExists = knownProjects.includes(cleanProjectName);

  // Selected users calculation
  const selectedUsernames = useMemo(() => {
    return Object.entries(userSelections)
      .filter(([_, sel]) => sel.selected)
      .map(([uname]) => uname);
  }, [userSelections]);

  const toggleUserSelected = (username: string) => {
    setUserSelections(prev => {
      const current = prev[username];
      const isSelected = current ? current.selected : false;
      return {
        ...prev,
        [username]: {
          selected: !isSelected,
          roles: current?.roles || [...defaultRoles],
          roleAnchor: current?.roleAnchor || (useRoleAnchor ? selectedRoleAnchor : undefined),
        },
      };
    });
  };

  const setUserRolePreset = (username: string, type: 'admin_anchor' | 'admin' | 'readonly' | 'both') => {
    setUserSelections(prev => {
      let roles: string[] = ['readonly'];
      let roleAnchor: string | undefined = undefined;

      if (type === 'admin_anchor') {
        roleAnchor = selectedRoleAnchor || 'admin_role';
        roles = ['admin', 'readonly'];
      } else if (type === 'admin') {
        roles = ['admin'];
      } else if (type === 'both') {
        roles = ['admin', 'readonly'];
      } else if (type === 'readonly') {
        roles = ['readonly'];
      }

      return {
        ...prev,
        [username]: {
          selected: true,
          roles,
          roleAnchor,
        },
      };
    });
  };

  // Batch actions
  const selectAllFiltered = (filtered: typeof allUsers) => {
    setUserSelections(prev => {
      const next = { ...prev };
      for (const u of filtered) {
        next[u.username] = {
          selected: true,
          roles: next[u.username]?.roles || [...defaultRoles],
          roleAnchor: next[u.username]?.roleAnchor || (useRoleAnchor ? selectedRoleAnchor : undefined),
        };
      }
      return next;
    });
  };

  const deselectAll = () => {
    setUserSelections(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        next[k] = { ...next[k], selected: false };
      }
      return next;
    });
  };

  const applyRoleToAllSelected = (type: 'admin_anchor' | 'admin' | 'readonly' | 'both') => {
    setUserSelections(prev => {
      const next = { ...prev };
      for (const uname of selectedUsernames) {
        let roles: string[] = ['readonly'];
        let roleAnchor: string | undefined = undefined;

        if (type === 'admin_anchor') {
          roleAnchor = selectedRoleAnchor || 'admin_role';
          roles = ['admin', 'readonly'];
        } else if (type === 'admin') {
          roles = ['admin'];
        } else if (type === 'both') {
          roles = ['admin', 'readonly'];
        } else if (type === 'readonly') {
          roles = ['readonly'];
        }

        next[uname] = {
          selected: true,
          roles,
          roleAnchor,
        };
      }
      return next;
    });
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const isSelected = userSelections[u.username]?.selected ?? false;

      // Filter tabs
      if (userFilter === 'selected' && !isSelected) return false;
      if (userFilter === 'super' && !u.isSuperAdmin) return false;
      if (userFilter === 'power' && !u.isPowerAdmin) return false;
      if (userFilter === 'standard' && (u.isSuperAdmin || u.isPowerAdmin)) return false;

      // Search match
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return u.username.toLowerCase().includes(q);
    });
  }, [allUsers, userFilter, userSelections, search]);

  // Handle Form Submission
  const handleAddProject = () => {
    if (!isProjectNameValid || !isEnvNameValid) return;
    if (selectedUsernames.length === 0 && !addToGlobalPresets) {
      alert('Please select at least one user or choose to add to global presets.');
      return;
    }

    const assignments: ProjectUserAssignment[] = selectedUsernames.map(uname => {
      const sel = userSelections[uname];
      return {
        username: uname,
        roles: sel?.roles || [...defaultRoles],
        roleAnchor: sel?.roleAnchor,
      };
    });

    const result = addProjectAndEnvironmentToYaml(currentYaml, {
      projectName: cleanProjectName,
      environmentName: cleanEnvName,
      addToGlobalPresets,
      userAssignments: assignments,
    });

    onUpdateYaml(result.updatedYaml);

    setSuccessFeedback({
      message: `Project "${cleanProjectName}" with environment "${cleanEnvName}" added to ${result.updatedUsersCount} user${result.updatedUsersCount === 1 ? '' : 's'}!`,
      line: result.firstModifiedLine,
      usersCount: result.updatedUsersCount,
      projectName: cleanProjectName,
    });

    // Reset fields except project name
    setProjectName('');
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <FolderPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Add Project &amp; Environment Wizard
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Create a project &amp; environment, and grant user access with selectable roles
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successFeedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-2 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessFeedback(null)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 text-xs px-1.5 py-0.5 rounded"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/20">
            {successFeedback.line > 0 && (
              <button
                type="button"
                onClick={() => onJumpToLine(successFeedback.line)}
                className="flex items-center gap-1 font-mono text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition-colors"
              >
                <span>Jump to line {successFeedback.line} in Editor</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            {onSwitchToDirectory && (
              <button
                type="button"
                onClick={onSwitchToDirectory}
                className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded transition-colors"
              >
                <Users className="w-3 h-3" />
                <span>View in User Directory</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-5">
        {/* Step 1: Project Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              1. Project Name
            </label>
            {projectAlreadyExists && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                Existing Project ({cleanProjectName})
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="e.g. payment-service, auth-api, data-lake"
              value={projectName}
              onChange={e => setProjectName(e.target.value.toLowerCase())}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {projectAlreadyExists
              ? 'This project is already recognized in the YAML. The new environment will be added to it for selected users.'
              : 'Alphanumeric, lowercase, dashes or underscores.'}
          </p>
        </div>

        {/* Step 2: Environment Details */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            2. Environment &amp; Role Template
          </label>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Quick Environment:</span>
              {COMMON_ENVIRONMENTS.map(env => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setEnvironmentName(env)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    cleanEnvName === env
                      ? 'bg-cyan-600 text-white font-medium shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="e.g. development, staging, production, sandbox"
              value={environmentName}
              onChange={e => setEnvironmentName(e.target.value.toLowerCase())}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Role Anchor vs Custom Roles */}
          <div className="bg-zinc-50/80 dark:bg-zinc-950/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Environment Role Format</span>
              </span>

              {availableRoleAnchors.length > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setUseRoleAnchor(true)}
                    className={`px-2 py-0.5 rounded ${
                      useRoleAnchor
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    Use Anchor (*role)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseRoleAnchor(false)}
                    className={`px-2 py-0.5 rounded ${
                      !useRoleAnchor
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    Explicit Roles
                  </button>
                </div>
              )}
            </div>

            {useRoleAnchor && availableRoleAnchors.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Select Reusable Role Anchor:
                </label>
                <select
                  value={selectedRoleAnchor}
                  onChange={e => setSelectedRoleAnchor(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  {availableRoleAnchors.map(anchor => (
                    <option key={anchor} value={anchor}>
                      *{anchor}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Select default roles to assign:
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaultRoles.includes('admin')}
                      onChange={e => {
                        if (e.target.checked) setDefaultRoles(prev => [...prev, 'admin']);
                        else setDefaultRoles(prev => prev.filter(r => r !== 'admin'));
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-mono">admin</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaultRoles.includes('readonly')}
                      onChange={e => {
                        if (e.target.checked) setDefaultRoles(prev => [...prev, 'readonly']);
                        else setDefaultRoles(prev => prev.filter(r => r !== 'readonly'));
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-mono">readonly</span>
                  </label>
                </div>
              </div>
            )}

            {/* Optional Global Preset Toggle */}
            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <label className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToGlobalPresets}
                  onChange={e => setAddToGlobalPresets(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-200">
                    Include in Global Presets (x-projects)
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Automatically registers this project in <code className="font-mono text-purple-600 dark:text-purple-300">*all_projects_admin</code> and <code className="font-mono text-purple-600 dark:text-purple-300">*all_projects_non_prod_admin</code> so Super and Power Admins retain access.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Step 3: User Selection with Selectable Roles */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                3. User Access &amp; Selectable Roles
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Choose which users will be granted access to this project &amp; environment
              </p>
            </div>

            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 shrink-0">
              {selectedUsernames.length} of {allUsers.length} Users Selected
            </span>
          </div>

          {/* User Filtering & Search Controls */}
          <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Batch Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => selectAllFiltered(filteredUsers)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  Select Filtered
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-medium px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-semibold">Filter:</span>
              <button
                type="button"
                onClick={() => setUserFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  userFilter === 'all'
                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                All ({allUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('selected')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  userFilter === 'selected'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                Selected ({selectedUsernames.length})
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('standard')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  userFilter === 'standard'
                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                Standard Users
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('power')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  userFilter === 'power'
                    ? 'bg-amber-600 text-white font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                Power Admins
              </button>
              <button
                type="button"
                onClick={() => setUserFilter('super')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  userFilter === 'super'
                    ? 'bg-purple-600 text-white font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                Super Admins
              </button>
            </div>

            {/* Quick Batch Role Assigner for Selected Users */}
            {selectedUsernames.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-[11px]">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  Set role for all {selectedUsernames.length} selected:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {availableRoleAnchors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => applyRoleToAllSelected('admin_anchor')}
                      className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 font-mono text-[10px]"
                    >
                      *{selectedRoleAnchor}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => applyRoleToAllSelected('both')}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 font-mono text-[10px]"
                  >
                    admin &amp; readonly
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRoleToAllSelected('admin')}
                    className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 font-mono text-[10px]"
                  >
                    admin only
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRoleToAllSelected('readonly')}
                    className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 font-mono text-[10px]"
                  >
                    readonly only
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Users List Table / Cards */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 italic bg-zinc-50 dark:bg-zinc-950/40 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                No users match current search/filter.
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = userSelections[user.username]?.selected ?? false;
                const currentRoleConfig = userSelections[user.username];
                const hasGlobalPreset =
                  user.projects.length === 1 &&
                  user.projects[0].isAlias &&
                  (user.projects[0].aliasName?.includes('all_projects') ?? false);

                return (
                  <div
                    key={user.username}
                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Left: Checkbox & User Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUserSelected(user.username)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {user.username}
                            </span>

                            {user.isSuperAdmin ? (
                              <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                <Shield className="w-2 h-2" /> Super Admin
                              </span>
                            ) : user.isPowerAdmin ? (
                              <span className="flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                <Zap className="w-2 h-2" /> Power Admin
                              </span>
                            ) : null}

                            <span className="text-[10px] text-zinc-400 font-mono">
                              ({user.projects.length} {user.projects.length === 1 ? 'project' : 'projects'})
                            </span>
                          </div>

                          {hasGlobalPreset && (
                            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                              Has global access via *{user.projects[0].aliasName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Selectable Roles when Selected */}
                      {isSelected && (
                        <div className="flex items-center gap-1.5 shrink-0 pl-6 sm:pl-0">
                          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Role:</span>
                          <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 p-0.5 text-[10px]">
                            {availableRoleAnchors.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setUserRolePreset(user.username, 'admin_anchor')}
                                className={`px-1.5 py-0.5 rounded font-mono ${
                                  currentRoleConfig?.roleAnchor
                                    ? 'bg-purple-600 text-white font-semibold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                                }`}
                              >
                                *role
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setUserRolePreset(user.username, 'both')}
                              className={`px-1.5 py-0.5 rounded font-mono ${
                                !currentRoleConfig?.roleAnchor &&
                                currentRoleConfig?.roles.includes('admin') &&
                                currentRoleConfig?.roles.includes('readonly')
                                  ? 'bg-indigo-600 text-white font-semibold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                              }`}
                            >
                              admin+read
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserRolePreset(user.username, 'admin')}
                              className={`px-1.5 py-0.5 rounded font-mono ${
                                !currentRoleConfig?.roleAnchor &&
                                currentRoleConfig?.roles.includes('admin') &&
                                !currentRoleConfig?.roles.includes('readonly')
                                  ? 'bg-amber-600 text-white font-semibold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                              }`}
                            >
                              admin
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserRolePreset(user.username, 'readonly')}
                              className={`px-1.5 py-0.5 rounded font-mono ${
                                !currentRoleConfig?.roleAnchor &&
                                !currentRoleConfig?.roles.includes('admin') &&
                                currentRoleConfig?.roles.includes('readonly')
                                  ? 'bg-sky-600 text-white font-semibold'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                              }`}
                            >
                              readonly
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 4: Preview & Action Button */}
        <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-950 text-zinc-100 p-3 rounded-lg font-mono text-xs space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between text-zinc-400 text-[11px] pb-1 border-b border-zinc-800">
              <span>YAML Structure to be Generated:</span>
              <span>Project: {cleanProjectName || '(name)'}</span>
            </div>
            <pre className="text-emerald-400 text-[11px] overflow-x-auto">
{`      - name: ${cleanProjectName || 'my-project'}
        environments:
          - name: ${cleanEnvName || 'development'}
            ${useRoleAnchor ? `roles: *${selectedRoleAnchor}` : `roles:\n              - admin\n              - readonly`}`}
            </pre>
            <div className="text-[11px] text-zinc-400 pt-1">
              Will grant access to <span className="text-cyan-400 font-semibold">{selectedUsernames.length} selected user{selectedUsernames.length === 1 ? '' : 's'}</span>
              {addToGlobalPresets && ' + registered in global x-projects presets'}.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddProject}
              disabled={!isProjectNameValid || !isEnvNameValid || (selectedUsernames.length === 0 && !addToGlobalPresets)}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed text-xs"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Project &amp; Environment to YAML</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProjectName('');
                deselectAll();
              }}
              className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
