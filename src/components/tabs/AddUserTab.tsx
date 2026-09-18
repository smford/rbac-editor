import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Copy,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  ArrowDownAZ,
  Zap,
} from 'lucide-react';
import { ValidationResult } from '../../types/yaml';
import { generateUserSnippet, insertUserIntoYaml, sortUsersInYaml } from '../../utils/yamlValidator';

interface AddUserTabProps {
  validationResult: ValidationResult;
  currentYaml: string;
  onUpdateYaml: (newYaml: string) => void;
  onJumpToLine: (line: number, column?: number) => void;
}

export const AddUserTab: React.FC<AddUserTabProps> = ({
  validationResult,
  currentYaml,
  onUpdateYaml,
  onJumpToLine,
}) => {
  const usersMeta = validationResult.usersMetadata;

  const [username, setUsername] = useState('');
  const [templateMode, setTemplateMode] = useState<
    'preset_all_admin' | 'preset_non_prod' | 'clone_user' | 'custom'
  >('preset_non_prod');

  const [cloneFromUser, setCloneFromUser] = useState<string>('');
  const [insertPosition, setInsertPosition] = useState<'alphabetical' | 'start' | 'end'>('alphabetical');

  // Custom project list state
  const [customProjects, setCustomProjects] = useState<
    { projectName: string; envAnchor: string }[]
  >([
    { projectName: 'chat', envAnchor: 'admin_non_prod' },
    { projectName: 'training', envAnchor: 'admin_role' },
  ]);

  const [copySuccess, setCopySuccess] = useState(false);
  const [insertSuccessMsg, setInsertSuccessMsg] = useState<string | null>(null);

  // Available anchors from file
  const availableEnvAnchors = useMemo(() => {
    if (usersMeta?.availableEnvAnchors && usersMeta.availableEnvAnchors.length > 0) {
      return usersMeta.availableEnvAnchors;
    }
    return ['admin_non_prod', 'admin_everywhere', 'dev', 'dev_ai_readonly', 'observability_dev_write'];
  }, [usersMeta]);

  const knownProjects = useMemo(() => {
    if (usersMeta?.knownProjects && usersMeta.knownProjects.length > 0) {
      return usersMeta.knownProjects;
    }
    return [
      'analytics-platform', 'api-gateway', 'auth-service', 'billing-service',
      'chat-service', 'content-delivery', 'customer-portal', 'data-pipeline',
      'identity-mgmt', 'inventory-service', 'messaging-hub', 'monitoring-system',
      'notifications', 'order-processing', 'recommendations', 'reporting-tool',
      'search-engine', 'storage-service', 'user-management', 'workflow-orchestrator'
    ];
  }, [usersMeta]);

  // Check username uniqueness
  const usernameCheck = useMemo(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) return { valid: false, message: 'Please enter a username.' };
    if (/\s/.test(clean)) return { valid: false, message: 'Usernames cannot contain spaces.' };

    const existingUser = usersMeta?.users.find(
      u => u.username.toLowerCase() === clean
    );
    if (existingUser) {
      return {
        valid: false,
        message: `Username already exists on line ${existingUser.line}!`,
        line: existingUser.line,
      };
    }

    return { valid: true, message: 'Username is available.' };
  }, [username, usersMeta]);

  // Generate the live snippet
  const generatedSnippet = useMemo(() => {
    const cleanUser = username.trim().toLowerCase() || 'first.last';

    if (templateMode === 'preset_all_admin') {
      return generateUserSnippet({
        username: cleanUser,
        templateType: 'preset_all_projects',
        presetAnchor: 'all_projects_admin',
      });
    }

    if (templateMode === 'preset_non_prod') {
      return generateUserSnippet({
        username: cleanUser,
        templateType: 'preset_non_prod',
        presetAnchor: 'all_projects_non_prod_admin',
      });
    }

    if (templateMode === 'clone_user') {
      const sourceUser = usersMeta?.users.find(u => u.username === cloneFromUser);
      if (sourceUser) {
        if ((sourceUser.isSuperAdmin || sourceUser.isPowerAdmin) && sourceUser.projects.length === 1 && sourceUser.projects[0].aliasName) {
          return `  - username: ${cleanUser}\n    projects: *${sourceUser.projects[0].aliasName}\n`;
        }

        let str = `  - username: ${cleanUser}\n    projects:\n`;
        for (const p of sourceUser.projects) {
          if (p.isAlias && p.aliasName) {
            str += `      - name: ${p.name}\n        environments: *${p.aliasName}\n`;
          } else {
            str += `      - name: ${p.name}\n        environments:\n          - name: sandbox\n            roles: *admin_role\n`;
          }
        }
        return str;
      }
    }

    // Custom projects mode
    return generateUserSnippet({
      username: cleanUser,
      templateType: 'custom_projects',
      projects: customProjects,
    });
  }, [username, templateMode, cloneFromUser, customProjects, usersMeta]);

  const handleInsert = () => {
    if (!username.trim()) {
      alert('Please provide a valid username first.');
      return;
    }

    if (!usernameCheck.valid) {
      alert(`Cannot insert: ${usernameCheck.message}`);
      return;
    }

    const result = insertUserIntoYaml(currentYaml, generatedSnippet, insertPosition, username);
    onUpdateYaml(result.updatedYaml);
    onJumpToLine(result.insertedLine);

    const posMsg = insertPosition === 'alphabetical' ? 'alphabetically' : `at ${insertPosition}`;
    setInsertSuccessMsg(`User "${username.trim()}" inserted ${posMsg} at line ${result.insertedLine}!`);
    setTimeout(() => setInsertSuccessMsg(null), 3500);

    // Reset username for next entry
    setUsername('');
  };

  const handleSortAllUsers = () => {
    const sorted = sortUsersInYaml(currentYaml);
    onUpdateYaml(sorted);
    setInsertSuccessMsg('All users in users: have been sorted alphabetically!');
    setTimeout(() => setInsertSuccessMsg(null), 3500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSnippet);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const addProjectRow = () => {
    setCustomProjects(prev => [
      ...prev,
      { projectName: knownProjects[0] || 'shared', envAnchor: availableEnvAnchors[0] || 'admin_non_prod' },
    ]);
  };

  const removeProjectRow = (idx: number) => {
    setCustomProjects(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header card */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Add User Assistant
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                users.yaml
              </span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Easily configure and insert a new user with reusable RBAC anchors.
            </p>
          </div>
        </div>

        {usersMeta?.users && usersMeta.users.length > 0 && (
          <button
            type="button"
            onClick={handleSortAllUsers}
            title="Sort all existing users in the YAML file alphabetically A-Z"
            className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-indigo-600 text-zinc-800 dark:text-zinc-300 dark:hover:text-white border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Sort All Users A-Z</span>
          </button>
        )}
      </div>

      {/* Form Section */}
      <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm">
        {/* Step 1: Username */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            1. New Username <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. john.doe or alex.miller"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Real-time username validation feedback */}
          {username.trim() && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              {usernameCheck.valid ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {usernameCheck.message}
                </span>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{usernameCheck.message}</span>
                  {usernameCheck.line && (
                    <button
                      onClick={() => onJumpToLine(usernameCheck.line!)}
                      className="underline text-[11px] hover:text-rose-700 dark:hover:text-rose-300 ml-1"
                    >
                      Jump to existing user
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Access Pattern Template */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
            2. Access Pattern &amp; Anchor Reusability
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Non-Prod Admin Preset */}
            <button
              type="button"
              onClick={() => setTemplateMode('preset_non_prod')}
              className={`p-3 rounded-lg border text-left transition-all ${
                templateMode === 'preset_non_prod'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200'
                  : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs text-zinc-900 dark:text-zinc-200">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Power Admin Preset</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Admin in sandbox, dev &amp; staging (no prod admin). Reuses <code className="text-purple-600 dark:text-purple-300 font-semibold">*all_projects_non_prod_admin</code>
              </p>
            </button>

            {/* Super Admin Preset */}
            <button
              type="button"
              onClick={() => setTemplateMode('preset_all_admin')}
              className={`p-3 rounded-lg border text-left transition-all ${
                templateMode === 'preset_all_admin'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200'
                  : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs text-zinc-900 dark:text-zinc-200">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Super Admin Preset</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Admin in all projects &amp; all environments. Reuses <code className="text-purple-600 dark:text-purple-300 font-semibold">*all_projects_admin</code>
              </p>
            </button>

            {/* Clone User Template */}
            <button
              type="button"
              onClick={() => {
                setTemplateMode('clone_user');
                if (!cloneFromUser && usersMeta?.users && usersMeta.users.length > 0) {
                  setCloneFromUser(usersMeta.users[0].username);
                }
              }}
              className={`p-3 rounded-lg border text-left transition-all ${
                templateMode === 'clone_user'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200'
                  : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs text-zinc-900 dark:text-zinc-200">
                <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Clone Existing User</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Copy permissions from a current teammate
              </p>
            </button>

            {/* Custom Project Builder */}
            <button
              type="button"
              onClick={() => setTemplateMode('custom')}
              className={`p-3 rounded-lg border text-left transition-all ${
                templateMode === 'custom'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200'
                  : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs text-zinc-900 dark:text-zinc-200">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Custom Project Builder</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Select individual projects &amp; env anchors
              </p>
            </button>
          </div>
        </div>

        {/* Clone User Sub-selector */}
        {templateMode === 'clone_user' && usersMeta?.users && (
          <div className="bg-zinc-50 dark:bg-zinc-950/80 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
            <label className="block text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              Select user to clone permissions from:
            </label>
            <select
              value={cloneFromUser}
              onChange={e => setCloneFromUser(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              {usersMeta.users.map(u => (
                <option key={u.username} value={u.username}>
                  {u.username} ({u.projects.length} {u.projects.length === 1 ? 'project' : 'projects'}{u.isSuperAdmin ? ' • Super Admin' : u.isPowerAdmin ? ' • Power Admin' : ''})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Project Builder Sub-form */}
        {templateMode === 'custom' && (
          <div className="bg-zinc-50 dark:bg-zinc-950/80 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold uppercase tracking-wider">
                Assigned Projects &amp; Environment Anchors
              </span>
              <button
                type="button"
                onClick={addProjectRow}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {customProjects.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Project selector */}
                  <select
                    value={row.projectName}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomProjects(prev =>
                        prev.map((p, i) => (i === idx ? { ...p, projectName: val } : p))
                      );
                    }}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    {knownProjects.map(kp => (
                      <option key={kp} value={kp}>
                        {kp}
                      </option>
                    ))}
                  </select>

                  {/* Environment anchor selector */}
                  <select
                    value={row.envAnchor}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomProjects(prev =>
                        prev.map((p, i) => (i === idx ? { ...p, envAnchor: val } : p))
                      );
                    }}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-purple-700 dark:text-purple-300 focus:outline-none focus:border-indigo-500"
                  >
                    {availableEnvAnchors.map(ea => (
                      <option key={ea} value={ea}>
                        *{ea}
                      </option>
                    ))}
                  </select>

                  {/* Remove row */}
                  {customProjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProjectRow(idx)}
                      className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Remove project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Generated YAML Snippet Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Generated YAML Snippet
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              {copySuccess ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-emerald-800 dark:text-emerald-400/90 overflow-x-auto">
            {generatedSnippet}
          </pre>
        </div>

        {/* Step 4: Insertion Actions */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <span>Insert Location:</span>
            <select
              value={insertPosition}
              onChange={e => setInsertPosition(e.target.value as any)}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="alphabetical">Alphabetical Order (Recommended)</option>
              <option value="start">Top of users: array</option>
              <option value="end">Bottom of users: array</option>
            </select>
          </div>

          <button
            onClick={handleInsert}
            disabled={!username.trim() || !usernameCheck.valid}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Insert into YAML File</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {insertSuccessMsg && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{insertSuccessMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
