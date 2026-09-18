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
  Tag,
  X,
  Zap,
} from 'lucide-react';
import { ValidationResult, RbacUser } from '../../types/yaml';
import { buildProjectHierarchy } from '../../utils/yamlValidator';

interface UserDirectoryTabProps {
  validationResult: ValidationResult;
  onJumpToLine: (line: number, column?: number) => void;
  onSortUsers?: () => void;
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
    <div className="border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-black/40 p-3.5 space-y-3">
      {/* Header and Project Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px]">
            Projects, Environments &amp; Roles ({user.projects.length})
          </span>
          {user.isSuperAdmin ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-semibold flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> Super Admin
            </span>
          ) : user.isPowerAdmin ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Power Admin
            </span>
          ) : null}
        </div>

        {isLarge && (
          <div className="relative">
            <Search className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Filter ${user.projects.length} projects...`}
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 pl-6 py-1 text-[11px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>
        )}
      </div>

      {/* Projects List */}
      <div className="space-y-2.5">
        {displayProjects.length === 0 ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 italic py-3 text-center bg-white dark:bg-zinc-900/60 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
            No projects match &ldquo;{projectSearch}&rdquo;
          </div>
        ) : (
          displayProjects.map((proj, pIdx) => (
            <div
              key={proj.name + pIdx}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs"
            >
              {/* 1. Project Title Bar */}
              <div className="px-3 py-2 bg-zinc-100/80 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FolderGit2 className="w-3 h-3" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Project:</span>
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {proj.name}
                    </span>
                  </div>

                  {proj.isAlias && proj.aliasName && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0">
                      *{proj.aliasName}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                  {proj.environments.length} {proj.environments.length === 1 ? 'environment' : 'environments'}
                </span>
              </div>

              {/* 2. Environments & 3. Roles Body */}
              <div className="p-2.5 space-y-2 bg-white dark:bg-zinc-900/60">
                {proj.environments.length === 0 ? (
                  <p className="text-[11px] text-zinc-400 italic px-1">
                    No environments configured for this project
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {proj.environments.map((env, eIdx) => (
                      <div
                        key={env.name + eIdx}
                        className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2 text-xs space-y-1.5"
                      >
                        {/* 2. Environment Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <span className="text-zinc-500 dark:text-zinc-400 font-sans text-[11px] font-normal">
                              Environment:
                            </span>
                            <span className="text-cyan-700 dark:text-cyan-300 font-semibold">{env.name}</span>
                          </div>

                          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                            {env.roles.length} {env.roles.length === 1 ? 'role' : 'roles'}
                          </span>
                        </div>

                        {/* 3. Roles List */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 border-t border-zinc-200/60 dark:border-zinc-800/50">
                          <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                            <Key className="w-2.5 h-2.5 text-amber-500" />
                            <span>Roles:</span>
                          </span>

                          {env.roles.length === 0 ? (
                            <span className="text-[10px] text-zinc-400 italic">No roles assigned</span>
                          ) : (
                            env.roles.map((role, rIdx) => (
                              <span
                                key={rIdx}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium border flex items-center gap-1 ${
                                  role === 'admin'
                                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25'
                                    : role === 'readonly'
                                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                                }`}
                              >
                                {role === 'admin' ? (
                                  <Shield className="w-2.5 h-2.5" />
                                ) : (
                                  <Tag className="w-2.5 h-2.5 opacity-70" />
                                )}
                                <span>{role}</span>
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
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium py-1 px-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 transition-colors"
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
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
  }
  if (n.includes('stag')) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
  }
  if (n.includes('dev')) {
    return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25';
  }
  if (n.includes('sand')) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
  }
  return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25';
};

const getRoleBadgeStyle = (role: string) => {
  const r = role.toLowerCase();
  if (r === 'admin') {
    return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25';
  }
  if (r === 'readonly') {
    return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25';
  }
  return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
};

export const UserDirectoryTab: React.FC<UserDirectoryTabProps> = ({
  validationResult,
  onJumpToLine,
  onSortUsers,
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
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                RBAC User Directory
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
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
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm transition-colors shrink-0 ${
                statFilter === 'projects' && projectsViewMode === 'hierarchy'
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs ring-2 ring-indigo-400 dark:ring-indigo-500'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Project Hierarchy</span>
            </button>

            {onOpenAddProject && (
              <button
                type="button"
                onClick={onOpenAddProject}
                title="Add a new project and environment with user access"
                className="flex items-center gap-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition-colors shrink-0"
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
                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition-colors shrink-0"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>Sort Users in YAML</span>
              </button>
            )}
          </div>
        </div>

        {feedbackMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
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
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              statFilter === 'all'
                ? 'ring-2 ring-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>Total Users</span>
              {statFilter === 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </span>
            <div className="text-sm font-semibold mt-0.5 text-zinc-900 dark:text-zinc-100">
              {users.length}
            </div>
          </button>

          {/* Super Admins Button */}
          <button
            type="button"
            onClick={() => setStatFilter(statFilter === 'super' ? 'all' : 'super')}
            title="Click to filter Super Admins (Admin access in all projects & all environments)"
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              statFilter === 'super'
                ? 'ring-2 ring-purple-500 bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>Super Admins</span>
              {statFilter === 'super' && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              )}
            </span>
            <div className="text-sm font-semibold mt-0.5 text-purple-600 dark:text-purple-400">
              {superAdminCount}
            </div>
          </button>

          {/* Power Admins Button */}
          <button
            type="button"
            onClick={() => setStatFilter(statFilter === 'power' ? 'all' : 'power')}
            title="Click to filter Power Admins (Admin access in sandbox, dev & staging; no prod admin)"
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              statFilter === 'power'
                ? 'ring-2 ring-amber-500 bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>Power Admins</span>
              {statFilter === 'power' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </span>
            <div className="text-sm font-semibold mt-0.5 text-amber-600 dark:text-amber-400">
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
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              statFilter === 'projects'
                ? 'ring-2 ring-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-700 shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-950/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>Projects</span>
              {statFilter === 'projects' && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              )}
            </span>
            <div className="text-sm font-semibold mt-0.5 text-cyan-600 dark:text-cyan-400">
              {usersMeta?.knownProjects.length || 0}
            </div>
          </button>
        </div>
      </div>

      {/* Active Stat Filter Banners */}
      {statFilter === 'super' && (
        <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/25 px-3 py-2 rounded-lg text-xs text-purple-700 dark:text-purple-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Shield className="w-4 h-4" />
            <span>Showing {filteredUsers.length} Super Admins (Admin access in all projects and all environments)</span>
          </div>
          <button
            type="button"
            onClick={() => setStatFilter('all')}
            className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Show All Users</span>
          </button>
        </div>
      )}

      {statFilter === 'power' && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 px-3 py-2 rounded-lg text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Showing {filteredUsers.length} Power Admins (Admin in sandbox, dev &amp; staging; no prod admin)</span>
          </div>
          <button
            type="button"
            onClick={() => setStatFilter('all')}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Show All Users</span>
          </button>
        </div>
      )}

      {statFilter === 'projects' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-cyan-500/10 border border-cyan-500/25 px-3 py-2 rounded-lg text-xs text-cyan-800 dark:text-cyan-300">
          <div className="flex items-center gap-2 font-medium">
            <FolderGit2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>
              Projects Directory ({usersMeta?.knownProjects.length || projectHierarchy.length} Projects, {users.length} Users)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white dark:bg-zinc-900 rounded-md border border-cyan-500/30 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setProjectsViewMode('hierarchy')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                  projectsViewMode === 'hierarchy'
                    ? 'bg-cyan-600 text-white font-medium shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <FolderTree className="w-3 h-3" />
                <span>Hierarchy (Project → Env → Role → Users)</span>
              </button>
              <button
                type="button"
                onClick={() => setProjectsViewMode('by-project')}
                className={`px-2 py-1 rounded transition-colors ${
                  projectsViewMode === 'by-project'
                    ? 'bg-cyan-600 text-white font-medium shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Flat Project List
              </button>
              <button
                type="button"
                onClick={() => setProjectsViewMode('by-count')}
                className={`px-2 py-1 rounded transition-colors ${
                  projectsViewMode === 'by-count'
                    ? 'bg-cyan-600 text-white font-medium shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Users by Project Count
              </button>
            </div>

            {onOpenAddProject && (
              <button
                type="button"
                onClick={onOpenAddProject}
                className="flex items-center gap-1 text-[11px] font-semibold text-white bg-cyan-600 hover:bg-cyan-700 px-2.5 py-1 rounded transition-colors shadow-2xs"
              >
                <FolderPlus className="w-3 h-3" />
                <span>Add Project</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStatFilter('all')}
              className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-cyan-100 bg-cyan-500/10 hover:bg-cyan-500/20 px-2 py-0.5 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              <span>All Users</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Project Filter */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
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
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
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
              className="text-[11px] text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors shadow-2xs"
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
              className="text-[11px] text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors shadow-2xs"
            >
              Collapse All
            </button>
          </div>
        ) : statFilter !== 'projects' || projectsViewMode === 'by-count' ? (
          <div className="flex items-center gap-2 shrink-0">
            {usersMeta?.knownProjects && (
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-zinc-400" />
                <select
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
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

            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setSortOrder('az')}
                title="Sort users A-Z"
                className={`px-2 py-1 rounded transition-colors ${
                  sortOrder === 'az'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 font-medium shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortOrder('file')}
                title="Show in YAML file order"
                className={`px-2 py-1 rounded transition-colors ${
                  sortOrder === 'file'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
            <div className="py-12 text-center text-zinc-500 bg-white/60 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-300">
                No projects match &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Try a different search query or clear the search filter.
              </p>
            </div>
          ) : (
            projectHierarchy.map(proj => {
              const isProjectExpanded = expandedProjects[proj.projectName] ?? true;

              return (
                <div
                  key={proj.projectName}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all shadow-xs"
                >
                  {/* 1. Project Accordion Header */}
                  <div
                    onClick={() => toggleProjectExpand(proj.projectName)}
                    className="p-3 bg-zinc-100/80 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FolderGit2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          Project:
                        </span>
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {proj.projectName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 font-semibold shrink-0">
                          {proj.environments.length} {proj.environments.length === 1 ? 'environment' : 'environments'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 font-semibold shrink-0">
                          {proj.userCount} {proj.userCount === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                        {isProjectExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {isProjectExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* 2. Environments List */}
                  {isProjectExpanded && (
                    <div className="p-3 bg-zinc-50/50 dark:bg-black/30 space-y-3">
                      {proj.environments.length === 0 ? (
                        <div className="text-xs text-zinc-500 italic py-2 px-1">
                          No environments configured for this project
                        </div>
                      ) : (
                        proj.environments.map(env => {
                          const envKey = `${proj.projectName}::${env.envName}`;
                          const isEnvExpanded = expandedEnvs[envKey] ?? true;

                          return (
                            <div
                              key={envKey}
                              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs"
                            >
                              {/* Environment Header */}
                              <div
                                onClick={() => toggleEnvExpand(envKey)}
                                className="p-2.5 bg-zinc-100/90 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-2 cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                    Environment:
                                  </span>
                                  <span
                                    className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border ${getEnvBadgeColor(
                                      env.envName
                                    )}`}
                                  >
                                    {env.envName}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                                    {env.roles.length} {env.roles.length === 1 ? 'role' : 'roles'} &bull; {env.userCount} {env.userCount === 1 ? 'user' : 'users'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isEnvExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                                  )}
                                </div>
                              </div>

                              {/* 3. Roles and 4. Users in this Environment */}
                              {isEnvExpanded && (
                                <div className="p-3 space-y-3 bg-zinc-50/40 dark:bg-zinc-950/40">
                                  {env.roles.length === 0 ? (
                                    <div className="text-xs text-zinc-400 italic py-1">
                                      No roles assigned in this environment
                                    </div>
                                  ) : (
                                    env.roles.map(role => (
                                      <div
                                        key={role.roleName}
                                        className="p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 space-y-2"
                                      >
                                        {/* 3. Role Title Bar */}
                                        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
                                          <div className="flex items-center gap-1.5">
                                            <Key className="w-3 h-3 text-amber-500 shrink-0" />
                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                              Role:
                                            </span>
                                            <span
                                              className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border flex items-center gap-1 ${getRoleBadgeStyle(
                                                role.roleName
                                              )}`}
                                            >
                                              {role.roleName === 'admin' ? (
                                                <Shield className="w-2.5 h-2.5" />
                                              ) : (
                                                <Tag className="w-2.5 h-2.5 opacity-70" />
                                              )}
                                              <span>{role.roleName}</span>
                                            </span>
                                          </div>

                                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium shrink-0">
                                            {role.users.length} {role.users.length === 1 ? 'user' : 'users'}
                                          </span>
                                        </div>

                                        {/* 4. List of Users */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                          {role.users.map((u, uIdx) => (
                                            <div
                                              key={u.username + uIdx}
                                              className="p-2 rounded-md border border-zinc-200/60 dark:border-zinc-800/70 bg-zinc-50/60 dark:bg-zinc-950/60 flex items-center justify-between gap-2 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-6 h-6 rounded-full bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                                                  {u.username.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                  <div className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                    {u.username}
                                                  </div>
                                                  <div className="flex items-center gap-1 mt-0.5">
                                                    {u.isSuperAdmin ? (
                                                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0 flex items-center gap-0.5">
                                                        <Shield className="w-2 h-2" /> Super Admin
                                                      </span>
                                                    ) : u.isPowerAdmin ? (
                                                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0 flex items-center gap-0.5">
                                                        <Zap className="w-2 h-2" /> Power Admin
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                </div>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() => onJumpToLine(u.line)}
                                                title={`Jump to line ${u.line} in YAML`}
                                                className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-colors shrink-0"
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
        <div className="space-y-2.5">
          {projectUsersList.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 bg-white/60 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-300">No projects match &ldquo;{search}&rdquo;</p>
              <p className="text-xs text-zinc-500 mt-1">Try a different search query or clear the filter.</p>
            </div>
          ) : (
            projectUsersList.map(proj => {
              const isProjectExpanded = expandedProjects[proj.projectName] ?? true;

              return (
                <div
                  key={proj.projectName}
                  className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden transition-all shadow-sm"
                >
                  {/* Project Accordion Header */}
                  <div
                    onClick={() => toggleProjectExpand(proj.projectName)}
                    className="p-3 bg-zinc-100/80 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                        <FolderGit2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {proj.projectName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 font-semibold shrink-0">
                          {proj.users.length} {proj.users.length === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                        {isProjectExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {isProjectExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Users inside this project */}
                  {isProjectExpanded && (
                    <div className="p-3 bg-zinc-50/50 dark:bg-black/30 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {proj.users.map((u, uIdx) => (
                          <div
                            key={uIdx}
                            className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {u.username}
                                </span>
                                {u.isSuperAdmin ? (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0 flex items-center gap-0.5">
                                    <Shield className="w-2 h-2" /> Super Admin
                                  </span>
                                ) : u.isPowerAdmin ? (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0 flex items-center gap-0.5">
                                    <Zap className="w-2 h-2" /> Power Admin
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
                                className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors shrink-0"
                              >
                                <span>Line {u.line}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Environments & roles for this user in this project */}
                            {u.environments.length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                {u.environments.map((env, envIdx) => (
                                  <div key={envIdx} className="text-[11px] flex items-center justify-between gap-1 text-zinc-600 dark:text-zinc-400">
                                    <span className="font-mono text-cyan-700 dark:text-cyan-300 flex items-center gap-1 truncate">
                                      <Layers className="w-2.5 h-2.5 shrink-0" />
                                      {env.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
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
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 bg-white/60 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-300">No users match search criteria</p>
              <p className="text-xs text-zinc-500 mt-1">Try searching for a different username or resetting filters.</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isExpanded = expandedUsers[user.username] ?? false;

              return (
                <div
                  key={user.username}
                  className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg overflow-hidden transition-all shadow-sm"
                >
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {user.username}
                          </span>

                          {user.isSuperAdmin ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              <Shield className="w-2.5 h-2.5" /> Super Admin
                            </span>
                          ) : user.isPowerAdmin ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              <Zap className="w-2.5 h-2.5" /> Power Admin
                            </span>
                          ) : null}

                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {user.projects.length} {user.projects.length === 1 ? 'project' : 'projects'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onJumpToLine(user.line)}
                        title={`Jump to line ${user.line}`}
                        className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-zinc-100 hover:bg-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-colors"
                      >
                        <span>Line {user.line}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>

                      {user.projects.length > 0 && (
                        <button
                          onClick={() => toggleUserExpand(user.username)}
                          className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
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
