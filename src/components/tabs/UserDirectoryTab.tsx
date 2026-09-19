import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  ExternalLink,
  Shield,
  FolderGit2,
  FolderTree,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowDownAZ,
  CheckCircle2,
  Layers,
  Key,
  X,
  Zap,
  UserPlus,
} from 'lucide-react';
import { ValidationResult, RbacUser } from '../../types/yaml';
import { buildProjectHierarchy } from '../../utils/yamlValidator';

interface UserDirectoryTabProps {
  validationResult: ValidationResult;
  onJumpToLine: (line: number, column?: number) => void;
  onSortUsers?: () => void;
  onSortProjects?: (targetAnchor?: string) => void;
  onOpenAddUser?: () => void;
  onOpenAddProject?: () => void;
  initialStatFilter?: 'all' | 'super' | 'power' | 'projects';
  initialProjectsViewMode?: 'by-project' | 'hierarchy' | 'by-count';
}

const ExpandedUserProjects: React.FC<{ user: RbacUser }> = ({ user }) => {
  const [projectSearch, setProjectSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    if (!projectSearch.trim()) return user.projects;
    const q = projectSearch.toLowerCase();
    return user.projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.environments.some(e =>
        e.name.toLowerCase().includes(q) ||
        e.roles.some(r => r.toLowerCase().includes(q))
      )
    );
  }, [user.projects, projectSearch]);

  const maxInitial = 5;
  const isLarge = user.projects.length > maxInitial;
  const displayProjects = isLarge && !showAll && !projectSearch.trim()
    ? filtered.slice(0, maxInitial)
    : filtered;

  return (
    <div className="border-t-2 border-govuk-black dark:border-zinc-800 bg-govuk-grey/30 dark:bg-zinc-950 p-3.5 space-y-3">
      {/* Header and Project Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <FolderGit2 className="w-4 h-4 text-govuk-black dark:text-zinc-200 shrink-0" />
          <span className="font-bold text-govuk-black dark:text-zinc-100 uppercase tracking-wider text-xs">
            Projects, Environments &amp; Roles ({user.projects.length})
          </span>
          {user.isSuperAdmin ? (
            <span className="govuk-tag govuk-tag--purple text-[10px] font-bold">
              SUPER ADMIN
            </span>
          ) : user.isPowerAdmin ? (
            <span className="govuk-tag govuk-tag--yellow text-[10px] font-bold">
              POWER ADMIN
            </span>
          ) : null}
        </div>

        {isLarge && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-govuk-text-secondary dark:text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Filter ${user.projects.length} projects...`}
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              className="govuk-input rounded-none pl-8 pr-2 py-1 text-xs text-govuk-black dark:text-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 placeholder:text-govuk-text-secondary dark:placeholder:text-zinc-500 w-48"
            />
          </div>
        )}
      </div>

      {/* Projects List */}
      <div className="space-y-2.5">
        {displayProjects.length === 0 ? (
          <div className="text-xs text-govuk-text-secondary dark:text-zinc-400 italic py-3 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-govuk-grey-border dark:border-zinc-800 rounded-none">
            No projects match &ldquo;{projectSearch}&rdquo;
          </div>
        ) : (
          displayProjects.map((proj, pIdx) => (
            <div
              key={proj.name + pIdx}
              className="rounded-none border-2 border-govuk-black dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-none"
            >
              {/* 1. Project Title Bar */}
              <div className="px-3 py-2 bg-govuk-grey dark:bg-zinc-800 border-b-2 border-govuk-black dark:border-zinc-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 bg-govuk-black dark:bg-zinc-950 text-white flex items-center justify-center shrink-0 text-xs">
                    <FolderGit2 className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs text-govuk-text-secondary dark:text-zinc-400 font-bold">Project:</span>
                    <span className="font-mono text-xs font-bold text-govuk-black dark:text-zinc-100 truncate">
                      {proj.name}
                    </span>
                  </div>

                  {proj.isAlias && proj.aliasName && (
                    <span className="govuk-tag govuk-tag--purple text-[10px] font-bold">
                      *{proj.aliasName}
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono font-bold text-govuk-text-secondary dark:text-zinc-400 shrink-0">
                  {proj.environments.length} {proj.environments.length === 1 ? 'ENV' : 'ENVS'}
                </span>
              </div>

              {/* 2. Environments & 3. Roles Body */}
              <div className="p-3 space-y-2 bg-white dark:bg-zinc-900">
                {proj.environments.length === 0 ? (
                  <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 italic px-1">
                    No environments configured for this project
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {proj.environments.map((env, eIdx) => (
                      <div
                        key={env.name + eIdx}
                        className="rounded-none border border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey/30 dark:bg-zinc-950 p-2.5 text-xs space-y-2"
                      >
                        {/* 2. Environment Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-mono text-xs font-bold text-govuk-black dark:text-zinc-100">
                            <Layers className="w-3.5 h-3.5 text-govuk-blue dark:text-sky-400 shrink-0" />
                            <span className="text-govuk-text-secondary dark:text-zinc-400 font-sans text-xs font-bold">
                              Environment:
                            </span>
                            <span className="text-govuk-black dark:text-zinc-100 font-bold">{env.name}</span>
                          </div>

                          <span className="govuk-tag govuk-tag--grey text-[10px] font-bold">
                            {env.roles.length} {env.roles.length === 1 ? 'ROLE' : 'ROLES'}
                          </span>
                        </div>

                        {/* 3. Roles List */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-govuk-grey-border dark:border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-govuk-text-secondary dark:text-zinc-400 flex items-center gap-1 shrink-0">
                            <Key className="w-2.5 h-2.5 text-govuk-black dark:text-zinc-200" />
                            <span>Roles:</span>
                          </span>

                          {env.roles.length === 0 ? (
                            <span className="text-xs text-govuk-text-secondary dark:text-zinc-400 italic">No roles assigned</span>
                          ) : (
                            env.roles.map((role, rIdx) => (
                              <span
                                key={rIdx}
                                className={`govuk-tag text-[10px] font-bold ${getRoleBadgeStyle(role)}`}
                              >
                                {role}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show more/fewer button for large lists */}
      {isLarge && !projectSearch.trim() && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="govuk-button--secondary text-xs font-bold py-1 px-3 rounded-none"
          >
            {showAll
              ? 'Show fewer projects'
              : `Show all ${user.projects.length} projects (${user.projects.length - maxInitial} more)`}
          </button>
        </div>
      )}
    </div>
  );
};


const getEnvBadgeColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('prod')) {
    return 'govuk-tag govuk-tag--red';
  }
  if (n.includes('stag')) {
    return 'govuk-tag govuk-tag--yellow';
  }
  if (n.includes('dev')) {
    return 'govuk-tag govuk-tag--blue';
  }
  if (n.includes('sand')) {
    return 'govuk-tag govuk-tag--green';
  }
  return 'govuk-tag govuk-tag--grey';
};

const getRoleBadgeStyle = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin') {
    return 'govuk-tag--purple';
  }
  if (r === 'readonly') {
    return 'govuk-tag--grey';
  }
  return 'govuk-tag--green';
};

export const UserDirectoryTab: React.FC<UserDirectoryTabProps> = ({
  validationResult,
  onJumpToLine,
  onSortUsers,
  onSortProjects,
  onOpenAddUser,
  onOpenAddProject,
  initialStatFilter,
  initialProjectsViewMode,
}) => {
  const usersMeta = validationResult.usersMetadata;
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'file' | 'az'>('az');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [statFilter, setStatFilter] = useState<'all' | 'super' | 'power' | 'projects'>(
    initialStatFilter || 'all'
  );
  const [projectsViewMode, setProjectsViewMode] = useState<'by-project' | 'hierarchy' | 'by-count'>(
    initialProjectsViewMode || 'hierarchy'
  );
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [expandedEnvs, setExpandedEnvs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialStatFilter) {
      setStatFilter(initialStatFilter);
    }
  }, [initialStatFilter]);

  useEffect(() => {
    if (initialProjectsViewMode) {
      setProjectsViewMode(initialProjectsViewMode);
    }
  }, [initialProjectsViewMode]);

  const users = usersMeta?.users || [];

  const toggleUserExpand = (uname: string) => {
    setExpandedUsers(prev => ({ ...prev, [uname]: !prev[uname] }));
  };

  const toggleProjectExpand = (pname: string) => {
    setExpandedProjects(prev => ({ ...prev, [pname]: !(prev[pname] ?? true) }));
  };

  const toggleEnvExpand = (envKey: string) => {
    setExpandedEnvs(prev => ({ ...prev, [envKey]: !(prev[envKey] ?? true) }));
  };

  const filteredUsers = useMemo(() => {
    const list = users.filter(user => {
      // Stat filter
      if (statFilter === 'super' && !user.isSuperAdmin) {
        return false;
      }
      if (statFilter === 'power' && !user.isPowerAdmin) {
        return false;
      }

      // Username match
      const matchesSearch =
        !search ||
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.projects.some(p => p.name.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      // Project filter match
      if (projectFilter !== 'all') {
        if (user.isSuperAdmin || user.isPowerAdmin) return true; // Super and Power admins have access to all projects
        const hasProj = user.projects.some(p => p.name === projectFilter);
        if (!hasProj) return false;
      }

      return true;
    });

    if (statFilter === 'projects' && projectsViewMode === 'by-count') {
      return [...list].sort((a, b) => b.projects.length - a.projects.length);
    }

    if (sortOrder === 'az') {
      return [...list].sort((a, b) =>
        a.username.toLowerCase().localeCompare(b.username.toLowerCase())
      );
    }
    return list;
  }, [users, search, projectFilter, sortOrder, statFilter, projectsViewMode]);

  // Map projects to users who have access to each project
  const projectUsersList = useMemo(() => {
    const known = usersMeta?.knownProjects || [];
    const map = new Map<string, { username: string; line: number; isSuperAdmin: boolean; isPowerAdmin: boolean; environments: RbacUser['projects'][0]['environments'] }[]>();

    for (const proj of known) {
      map.set(proj, []);
    }

    for (const user of users) {
      for (const p of user.projects) {
        if (!map.has(p.name)) {
          map.set(p.name, []);
        }
        map.get(p.name)!.push({
          username: user.username,
          line: user.line,
          isSuperAdmin: user.isSuperAdmin,
          isPowerAdmin: user.isPowerAdmin,
          environments: p.environments,
        });
      }
    }

    const result: { projectName: string; users: { username: string; line: number; isSuperAdmin: boolean; isPowerAdmin: boolean; environments: RbacUser['projects'][0]['environments'] }[] }[] = [];
    const q = search.trim().toLowerCase();
    for (const [projectName, pUsers] of map.entries()) {
      if (!q || projectName.toLowerCase().includes(q) || pUsers.some(u => u.username.toLowerCase().includes(q))) {
        result.push({ projectName, users: pUsers });
      }
    }

    return result.sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [users, usersMeta?.knownProjects, search]);

  // Hierarchical mapping: Project -> Environments -> Roles -> List of Users
  const projectHierarchy = useMemo(() => {
    return buildProjectHierarchy(users, usersMeta?.knownProjects, search);
  }, [users, usersMeta?.knownProjects, search]);

  const superAdminCount = users.filter(u => u.isSuperAdmin).length;
  const powerAdminCount = users.filter(u => u.isPowerAdmin).length;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-800 rounded-none p-4 space-y-4 shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-govuk-black dark:bg-zinc-800 text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-govuk-black dark:text-zinc-100">
                RBAC User Directory
              </h3>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400">
                Parsed {users.length} user access definitions from YAML
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setStatFilter('projects');
                setProjectsViewMode('hierarchy');
              }}
              title="Show Project -> Environments -> Roles -> Users Hierarchy"
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-none transition-colors shrink-0 ${
                statFilter === 'projects' && projectsViewMode === 'hierarchy'
                  ? 'govuk-button mb-0'
                  : 'govuk-button--secondary mb-0'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Project Hierarchy</span>
            </button>

            {onOpenAddUser && (
              <button
                type="button"
                onClick={onOpenAddUser}
                title="Add a new user"
                className="govuk-button inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-none mb-0 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            )}

            {onOpenAddProject && (
              <button
                type="button"
                onClick={onOpenAddProject}
                title="Add a new project and environment with user access"
                className="govuk-button--secondary inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-none mb-0 shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add Project &amp; Environment</span>
              </button>
            )}

            {users.length > 1 && onSortUsers && (
              <button
                type="button"
                onClick={() => {
                  onSortUsers();
                  setSortOrder('az');
                  setFeedbackMsg('All users have been sorted alphabetically in the YAML file!');
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                title="Sort all users alphabetically in the YAML source code"
                className="govuk-button--secondary inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-none mb-0 shrink-0"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>Sort Users in YAML</span>
              </button>
            )}

            {onSortProjects && (validationResult.hasPresetProjectAnchors || usersMeta?.hasPresetProjectAnchors) && (
              <button
                type="button"
                onClick={() => {
                  onSortProjects();
                  setFeedbackMsg('All projects in all_projects_admin and all_projects_non_prod_admin have been sorted alphabetically!');
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                title="Sort all projects alphabetically in all_projects_admin & all_projects_non_prod_admin"
                className="govuk-button--secondary inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-none mb-0 shrink-0"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>Sort Preset Projects</span>
              </button>
            )}
          </div>
        </div>

        {feedbackMsg && (
          <div className="border-4 border-govuk-green bg-[#00703c]/10 dark:bg-emerald-950/30 text-govuk-green-dark dark:text-emerald-300 text-xs p-3 rounded-none flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Interactive Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Total Users Button */}
          <button
            type="button"
            onClick={() => setStatFilter('all')}
            title="Click to view all users"
            className={`p-3 rounded-none border-2 text-left transition-colors cursor-pointer ${
              statFilter === 'all'
                ? 'border-govuk-black bg-govuk-black text-white dark:border-zinc-700 dark:bg-zinc-800'
                : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey/40 dark:bg-zinc-950 hover:bg-govuk-grey dark:hover:bg-zinc-800/60 text-govuk-black dark:text-zinc-100'
            }`}
          >
            <span className={`text-[11px] uppercase tracking-wider font-bold flex items-center justify-between ${
              statFilter === 'all' ? 'text-white' : 'text-govuk-text-secondary dark:text-zinc-400'
            }`}>
              <span>Total Users</span>
            </span>
            <div className="text-xl font-bold mt-1">
              {users.length}
            </div>
          </button>

          {/* Super Admins Button */}
          <button
            type="button"
            onClick={() => setStatFilter(statFilter === 'super' ? 'all' : 'super')}
            title="Click to filter Super Admins (Admin access in all projects & all environments)"
            className={`p-3 rounded-none border-2 text-left transition-colors cursor-pointer ${
              statFilter === 'super'
                ? 'border-govuk-black bg-govuk-purple text-white dark:border-purple-600'
                : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey/40 dark:bg-zinc-950 hover:bg-govuk-grey dark:hover:bg-zinc-800/60 text-govuk-black dark:text-zinc-100'
            }`}
          >
            <span className={`text-[11px] uppercase tracking-wider font-bold flex items-center justify-between ${
              statFilter === 'super' ? 'text-white' : 'text-govuk-text-secondary dark:text-zinc-400'
            }`}>
              <span>Super Admins</span>
            </span>
            <div className={`text-xl font-bold mt-1 ${
              statFilter === 'super' ? 'text-white' : 'text-govuk-purple dark:text-purple-400'
            }`}>
              {superAdminCount}
            </div>
          </button>

          {/* Power Admins Button */}
          <button
            type="button"
            onClick={() => setStatFilter(statFilter === 'power' ? 'all' : 'power')}
            title="Click to filter Power Admins (Admin access in sandbox, dev & staging; no prod admin)"
            className={`p-3 rounded-none border-2 text-left transition-colors cursor-pointer ${
              statFilter === 'power'
                ? 'border-govuk-black bg-[#f47738] text-white dark:border-orange-600'
                : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey/40 dark:bg-zinc-950 hover:bg-govuk-grey dark:hover:bg-zinc-800/60 text-govuk-black dark:text-zinc-100'
            }`}
          >
            <span className={`text-[11px] uppercase tracking-wider font-bold flex items-center justify-between ${
              statFilter === 'power' ? 'text-white' : 'text-govuk-text-secondary dark:text-zinc-400'
            }`}>
              <span>Power Admins</span>
            </span>
            <div className={`text-xl font-bold mt-1 ${
              statFilter === 'power' ? 'text-white' : 'text-govuk-yellow dark:text-amber-400'
            }`}>
              {powerAdminCount}
            </div>
          </button>

          {/* Projects Count Button */}
          <button
            type="button"
            onClick={() => {
              if (statFilter === 'projects') {
                setStatFilter('all');
              } else {
                setStatFilter('projects');
                setProjectsViewMode('hierarchy');
              }
            }}
            title="Click to view Project Hierarchy (Project → Environments → Roles → Users)"
            className={`p-3 rounded-none border-2 text-left transition-colors cursor-pointer ${
              statFilter === 'projects'
                ? 'border-govuk-black bg-govuk-blue text-white dark:border-sky-600'
                : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey/40 dark:bg-zinc-950 hover:bg-govuk-grey dark:hover:bg-zinc-800/60 text-govuk-black dark:text-zinc-100'
            }`}
          >
            <span className={`text-[11px] uppercase tracking-wider font-bold flex items-center justify-between ${
              statFilter === 'projects' ? 'text-white' : 'text-govuk-text-secondary dark:text-zinc-400'
            }`}>
              <span>Projects</span>
            </span>
            <div className={`text-xl font-bold mt-1 ${
              statFilter === 'projects' ? 'text-white' : 'text-govuk-blue dark:text-sky-400'
            }`}>
              {usersMeta?.knownProjects.length || 0}
            </div>
          </button>
        </div>
      </div>

      {/* Active Stat Filter Banners */}
      {statFilter === 'super' && (
        <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/40 border-l-[10px] border-govuk-purple border-y border-r border-govuk-grey-border dark:border-zinc-800 px-4 py-3 rounded-none text-xs text-govuk-black dark:text-zinc-200">
          <div className="flex items-center gap-2 font-bold">
            <Shield className="w-4 h-4 text-govuk-purple dark:text-purple-400" />
            <span>Showing {filteredUsers.length} Super Admins (Admin access in all projects and all environments)</span>
          </div>
          <button
            type="button"
            onClick={() => setStatFilter('all')}
            className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Show All Users</span>
          </button>
        </div>
      )}

      {statFilter === 'power' && (
        <div className="flex items-center justify-between bg-yellow-50 dark:bg-amber-950/40 border-l-[10px] border-govuk-yellow border-y border-r border-govuk-grey-border dark:border-zinc-800 px-4 py-3 rounded-none text-xs text-govuk-black dark:text-zinc-200">
          <div className="flex items-center gap-2 font-bold">
            <Zap className="w-4 h-4 text-govuk-yellow dark:text-amber-400" />
            <span>Showing {filteredUsers.length} Power Admins (Admin in sandbox, dev &amp; staging; no prod admin)</span>
          </div>
          <button
            type="button"
            onClick={() => setStatFilter('all')}
            className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Show All Users</span>
          </button>
        </div>
      )}

      {statFilter === 'projects' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 dark:bg-blue-950/40 border-l-[10px] border-govuk-blue border-y border-r border-govuk-grey-border dark:border-zinc-800 px-4 py-3 rounded-none text-xs text-govuk-black dark:text-zinc-200">
          <div className="flex items-center gap-2 font-bold">
            <FolderGit2 className="w-4 h-4 text-govuk-blue dark:text-sky-400" />
            <span>
              Projects Directory ({usersMeta?.knownProjects.length || projectHierarchy.length} Projects, {users.length} Users)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-govuk-grey dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-700 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setProjectsViewMode('hierarchy')}
                className={`flex items-center gap-1 px-2.5 py-1 font-bold rounded-none transition-colors ${
                  projectsViewMode === 'hierarchy'
                    ? 'bg-govuk-black dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Hierarchy</span>
              </button>
              <button
                type="button"
                onClick={() => setProjectsViewMode('by-project')}
                className={`px-2.5 py-1 font-bold rounded-none transition-colors ${
                  projectsViewMode === 'by-project'
                    ? 'bg-govuk-black dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
                }`}
              >
                Flat Project List
              </button>
              <button
                type="button"
                onClick={() => setProjectsViewMode('by-count')}
                className={`px-2.5 py-1 font-bold rounded-none transition-colors ${
                  projectsViewMode === 'by-count'
                    ? 'bg-govuk-black dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
                }`}
              >
                By Project Count
              </button>
            </div>

            {onOpenAddUser && (
              <button
                type="button"
                onClick={onOpenAddUser}
                className="govuk-button text-xs font-bold py-1 px-2.5 rounded-none mb-0 inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            )}

            {onOpenAddProject && (
              <button
                type="button"
                onClick={onOpenAddProject}
                className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none mb-0 inline-flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            )}

            {onSortProjects && (validationResult.hasPresetProjectAnchors || usersMeta?.hasPresetProjectAnchors) && (
              <button
                type="button"
                onClick={() => {
                  onSortProjects();
                  setFeedbackMsg('All projects in all_projects_admin and all_projects_non_prod_admin have been sorted alphabetically!');
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                title="Sort all projects alphabetically in all_projects_admin & all_projects_non_prod_admin"
                className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>Sort Preset Projects</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStatFilter('all')}
              className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>All Users</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Project Filter */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-govuk-text-secondary dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              statFilter === 'projects'
                ? projectsViewMode === 'hierarchy'
                  ? 'Search projects, environments, roles, or users...'
                  : projectsViewMode === 'by-project'
                  ? 'Search projects or users...'
                  : 'Search users...'
                : 'Search by username or project...'
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="govuk-input w-full pl-9 pr-3 py-1.5 text-xs text-govuk-black dark:text-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 placeholder:text-govuk-text-secondary dark:placeholder:text-zinc-500"
          />
        </div>

        {statFilter === 'projects' && projectsViewMode === 'hierarchy' ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const allOpen: Record<string, boolean> = {};
                projectHierarchy.forEach(p => {
                  allOpen[p.projectName] = true;
                });
                setExpandedProjects(allOpen);
              }}
              className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => {
                const allClosed: Record<string, boolean> = {};
                projectHierarchy.forEach(p => {
                  allClosed[p.projectName] = false;
                });
                setExpandedProjects(allClosed);
              }}
              className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none"
            >
              Collapse All
            </button>
          </div>
        ) : statFilter !== 'projects' || projectsViewMode === 'by-count' ? (
          <div className="flex items-center gap-2 shrink-0">
            {usersMeta?.knownProjects && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-govuk-text-secondary dark:text-zinc-400" />
                <select
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                  className="govuk-input rounded-none px-2.5 py-1 text-xs text-govuk-black dark:text-zinc-100 bg-white dark:bg-zinc-900 dark:border-zinc-700 font-bold"
                >
                  <option value="all">All Projects</option>
                  {usersMeta.knownProjects.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center bg-govuk-grey dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-700 p-0.5 text-xs">
              <button
                onClick={() => setSortOrder('az')}
                title="Sort users A-Z"
                className={`px-2.5 py-1 font-bold rounded-none transition-colors ${
                  sortOrder === 'az'
                    ? 'bg-govuk-black dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortOrder('file')}
                title="Show in YAML file order"
                className={`px-2.5 py-1 font-bold rounded-none transition-colors ${
                  sortOrder === 'file'
                    ? 'bg-govuk-black dark:bg-zinc-100 text-white dark:text-zinc-950'
                    : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
                }`}
              >
                File Order
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main Content Area */}
      {statFilter === 'projects' && projectsViewMode === 'hierarchy' ? (
        /* Hierarchical Project -> Environments -> Roles -> Users */
        <div className="space-y-3">
          {projectHierarchy.length === 0 ? (
            <div className="py-10 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-govuk-grey-border dark:border-zinc-800 rounded-none p-6">
              <p className="text-sm font-bold text-govuk-black dark:text-zinc-100">
                No projects match &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mt-1">
                Try a different search query or clear the search filter.
              </p>
            </div>
          ) : (
            projectHierarchy.map(proj => {
              const isProjectExpanded = expandedProjects[proj.projectName] ?? true;

              return (
                <div
                  key={proj.projectName}
                  className="bg-white dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-800 rounded-none shadow-none"
                >
                  {/* 1. Project Accordion Header */}
                  <div
                    onClick={() => toggleProjectExpand(proj.projectName)}
                    className="p-3 bg-govuk-grey dark:bg-zinc-800 border-b-2 border-govuk-black dark:border-zinc-700 flex items-center justify-between gap-3 cursor-pointer hover:bg-govuk-grey-border/40 dark:hover:bg-zinc-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 bg-govuk-black dark:bg-zinc-950 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                        <FolderGit2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-xs text-govuk-text-secondary dark:text-zinc-400 font-bold">
                          Project:
                        </span>
                        <span className="font-mono text-sm font-bold text-govuk-black dark:text-zinc-100 truncate">
                          {proj.projectName}
                        </span>
                        <span className="govuk-tag govuk-tag--blue text-[10px] font-bold">
                          {proj.environments.length} {proj.environments.length === 1 ? 'ENV' : 'ENVS'}
                        </span>
                        <span className="govuk-tag govuk-tag--grey text-[10px] font-bold">
                          {proj.userCount} {proj.userCount === 1 ? 'USER' : 'USERS'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-govuk-text-secondary dark:text-zinc-400 hidden sm:inline">
                        {isProjectExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {isProjectExpanded ? (
                        <ChevronDown className="w-4 h-4 text-govuk-black dark:text-zinc-100" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-govuk-black dark:text-zinc-100" />
                      )}
                    </div>
                  </div>

                  {/* 2. Environments List */}
                  {isProjectExpanded && (
                    <div className="p-3.5 bg-govuk-grey/20 dark:bg-zinc-950 space-y-3">
                      {proj.environments.length === 0 ? (
                        <div className="text-xs text-govuk-text-secondary dark:text-zinc-400 italic py-2 px-1">
                          No environments configured for this project
                        </div>
                      ) : (
                        proj.environments.map(env => {
                          const envKey = `${proj.projectName}::${env.envName}`;
                          const isEnvExpanded = expandedEnvs[envKey] ?? true;

                          return (
                            <div
                              key={envKey}
                              className="rounded-none border-2 border-govuk-black dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-none"
                            >
                              {/* Environment Header */}
                              <div
                                onClick={() => toggleEnvExpand(envKey)}
                                className="p-2.5 bg-govuk-grey dark:bg-zinc-800 border-b border-govuk-grey-border dark:border-zinc-700 flex items-center justify-between gap-2 cursor-pointer hover:bg-govuk-grey-border/30 dark:hover:bg-zinc-700/60 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <Layers className="w-3.5 h-3.5 text-govuk-blue shrink-0" />
                                  <span className="text-xs text-govuk-text-secondary dark:text-zinc-400 font-bold font-sans">
                                    Environment:
                                  </span>
                                  <span
                                    className={`text-[10px] font-mono font-bold ${getEnvBadgeColor(
                                      env.envName
                                    )}`}
                                  >
                                    {env.envName}
                                  </span>
                                  <span className="text-xs font-mono text-govuk-text-secondary dark:text-zinc-400">
                                    {env.roles.length} {env.roles.length === 1 ? 'role' : 'roles'} &bull; {env.userCount} {env.userCount === 1 ? 'user' : 'users'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isEnvExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-govuk-black dark:text-zinc-100" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-govuk-black dark:text-zinc-100" />
                                  )}
                                </div>
                              </div>

                              {/* 3. Roles and 4. Users in this Environment */}
                              {isEnvExpanded && (
                                <div className="p-3 space-y-3 bg-white dark:bg-zinc-900">
                                  {env.roles.length === 0 ? (
                                    <div className="text-xs text-govuk-text-secondary dark:text-zinc-400 italic py-1">
                                      No roles assigned in this environment
                                    </div>
                                  ) : (
                                    env.roles.map(role => (
                                      <div
                                        key={role.roleName}
                                        className="p-3 rounded-none border border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey/20 dark:bg-zinc-950/60 space-y-2.5"
                                      >
                                        {/* 3. Role Title Bar */}
                                        <div className="flex items-center justify-between gap-2 border-b border-govuk-grey-border dark:border-zinc-800 pb-2">
                                          <div className="flex items-center gap-2">
                                            <Key className="w-3 h-3 text-govuk-black dark:text-zinc-300 shrink-0" />
                                            <span className="text-xs text-govuk-text-secondary dark:text-zinc-400 font-bold">
                                              Role:
                                            </span>
                                            <span
                                              className={`govuk-tag text-[10px] font-bold ${getRoleBadgeStyle(
                                                role.roleName
                                              )}`}
                                            >
                                              {role.roleName}
                                            </span>
                                          </div>

                                          <span className="govuk-tag govuk-tag--grey text-[10px] font-bold">
                                            {role.users.length} {role.users.length === 1 ? 'USER' : 'USERS'}
                                          </span>
                                        </div>

                                        {/* 4. List of Users */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {role.users.map((u, uIdx) => (
                                            <div
                                              key={u.username + uIdx}
                                              className="p-2.5 rounded-none border border-govuk-grey-border dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 hover:border-govuk-black dark:hover:border-zinc-600 transition-colors"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 bg-govuk-black dark:bg-zinc-950 text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                                                  {u.username.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                  <div className="font-mono text-xs font-bold text-govuk-black dark:text-zinc-100 truncate">
                                                    {u.username}
                                                  </div>
                                                  <div className="flex items-center gap-1 mt-0.5">
                                                    {u.isSuperAdmin ? (
                                                      <span className="govuk-tag govuk-tag--purple text-[9px] font-bold">
                                                        SUPER
                                                      </span>
                                                    ) : u.isPowerAdmin ? (
                                                      <span className="govuk-tag govuk-tag--yellow text-[9px] font-bold">
                                                        POWER
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                </div>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() => onJumpToLine(u.line)}
                                                title={`Jump to line ${u.line} in YAML`}
                                                className="govuk-button--secondary text-[11px] font-mono font-bold px-2 py-0.5 rounded-none inline-flex items-center gap-1 shrink-0"
                                              >
                                                <span>Line {u.line}</span>
                                                <ExternalLink className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : statFilter === 'projects' && projectsViewMode === 'by-project' ? (
        /* Projects Breakdown: List of Projects with their assigned users */
        <div className="space-y-3">
          {projectUsersList.length === 0 ? (
            <div className="py-10 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-govuk-grey-border dark:border-zinc-800 rounded-none p-6">
              <p className="text-sm font-bold text-govuk-black dark:text-zinc-100">No projects match &ldquo;{search}&rdquo;</p>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mt-1">Try a different search query or clear the filter.</p>
            </div>
          ) : (
            projectUsersList.map(proj => {
              const isProjectExpanded = expandedProjects[proj.projectName] ?? true;

              return (
                <div
                  key={proj.projectName}
                  className="bg-white dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-800 rounded-none shadow-none"
                >
                  {/* Project Accordion Header */}
                  <div
                    onClick={() => toggleProjectExpand(proj.projectName)}
                    className="p-3 bg-govuk-grey dark:bg-zinc-800 border-b-2 border-govuk-black dark:border-zinc-700 flex items-center justify-between gap-3 cursor-pointer hover:bg-govuk-grey-border/40 dark:hover:bg-zinc-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 bg-govuk-black dark:bg-zinc-950 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                        <FolderGit2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm font-bold text-govuk-black dark:text-zinc-100 truncate">
                          {proj.projectName}
                        </span>
                        <span className="govuk-tag govuk-tag--blue text-[10px] font-bold">
                          {proj.users.length} {proj.users.length === 1 ? 'USER' : 'USERS'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-govuk-text-secondary dark:text-zinc-400 hidden sm:inline">
                        {isProjectExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {isProjectExpanded ? (
                        <ChevronDown className="w-4 h-4 text-govuk-black dark:text-zinc-100" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-govuk-black dark:text-zinc-100" />
                      )}
                    </div>
                  </div>

                  {/* Users inside this project */}
                  {isProjectExpanded && (
                    <div className="p-3.5 bg-govuk-grey/20 dark:bg-zinc-950 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {proj.users.map((u, uIdx) => (
                          <div
                            key={uIdx}
                            className="p-3 rounded-none border border-govuk-grey-border dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-xs font-bold text-govuk-black dark:text-zinc-100 truncate">
                                  {u.username}
                                </span>
                                {u.isSuperAdmin ? (
                                  <span className="govuk-tag govuk-tag--purple text-[9px] font-bold">
                                    SUPER
                                  </span>
                                ) : u.isPowerAdmin ? (
                                  <span className="govuk-tag govuk-tag--yellow text-[9px] font-bold">
                                    POWER
                                  </span>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  onJumpToLine(u.line);
                                }}
                                title={`Jump to line ${u.line}`}
                                className="govuk-button--secondary text-[11px] font-mono font-bold px-2 py-0.5 rounded-none inline-flex items-center gap-1 shrink-0"
                              >
                                <span>Line {u.line}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Environments & roles for this user in this project */}
                            {u.environments.length > 0 && (
                              <div className="space-y-1 pt-1.5 border-t border-govuk-grey-border dark:border-zinc-800">
                                {u.environments.map((env, envIdx) => (
                                  <div key={envIdx} className="text-xs flex items-center justify-between gap-1 text-govuk-black dark:text-zinc-200">
                                    <span className="font-mono font-bold flex items-center gap-1 truncate text-govuk-blue dark:text-sky-400">
                                      <Layers className="w-3 h-3 shrink-0" />
                                      {env.name}
                                    </span>
                                    <span className="text-[11px] font-mono text-govuk-text-secondary dark:text-zinc-400 truncate">
                                      {env.roles.join(', ') || 'no roles'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Standard / Filtered User Cards List */
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="py-10 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-govuk-grey-border dark:border-zinc-800 rounded-none p-6">
              <p className="text-sm font-bold text-govuk-black dark:text-zinc-100">No users match search criteria</p>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mt-1">Try searching for a different username or resetting filters.</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isExpanded = expandedUsers[user.username] ?? false;

              return (
                <div
                  key={user.username}
                  className="bg-white dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-800 rounded-none shadow-none"
                >
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-govuk-black dark:bg-zinc-950 text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-govuk-black dark:text-zinc-100 truncate">
                            {user.username}
                          </span>

                          {user.isSuperAdmin ? (
                            <span className="govuk-tag govuk-tag--purple text-[10px] font-bold">
                              SUPER ADMIN
                            </span>
                          ) : user.isPowerAdmin ? (
                            <span className="govuk-tag govuk-tag--yellow text-[10px] font-bold">
                              POWER ADMIN
                            </span>
                          ) : null}

                          <span className="govuk-tag govuk-tag--grey text-[10px] font-bold">
                            {user.projects.length} {user.projects.length === 1 ? 'PROJECT' : 'PROJECTS'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onJumpToLine(user.line)}
                        title={`Jump to line ${user.line}`}
                        className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1 font-mono"
                      >
                        <span>Line {user.line}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {user.projects.length > 0 && (
                        <button
                          onClick={() => toggleUserExpand(user.username)}
                          className="govuk-button--secondary p-1.5 rounded-none font-bold"
                          title={isExpanded ? 'Collapse projects' : 'View projects'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Projects, Environments, and Roles Breakdown */}
                  {isExpanded && <ExpandedUserProjects user={user} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
