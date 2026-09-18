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
  Users,
  ChevronLeft,
} from 'lucide-react';
import { ValidationResult } from '../../types/yaml';
import { generateUserSnippet, insertUserIntoYaml, sortUsersInYaml } from '../../utils/yamlValidator';

interface AddUserTabProps {
  validationResult: ValidationResult;
  currentYaml: string;
  onUpdateYaml: (newYaml: string) => void;
  onJumpToLine: (line: number, column?: number) => void;
  onSwitchToDirectory?: () => void;
}

export const AddUserTab: React.FC<AddUserTabProps> = ({
  validationResult,
  currentYaml,
  onUpdateYaml,
  onJumpToLine,
  onSwitchToDirectory,
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
      {onSwitchToDirectory && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={onSwitchToDirectory}
            className="govuk-back-link"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Users &amp; Access</span>
          </button>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-govuk-black text-white flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-govuk-black dark:text-zinc-100 flex items-center gap-2">
              Add User Assistant
              <span className="govuk-tag govuk-tag--purple text-[10px]">
                users.yaml
              </span>
            </h3>
            <p className="text-xs text-govuk-text-secondary dark:text-zinc-400">
              Configure and insert a new user with reusable RBAC anchors.
            </p>
          </div>
        </div>

        {usersMeta?.users && usersMeta.users.length > 0 && (
          <button
            type="button"
            onClick={handleSortAllUsers}
            title="Sort all existing users in the YAML file alphabetically A-Z"
            className="govuk-button--secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowDownAZ className="w-3.5 h-3.5 text-govuk-blue" />
            <span>Sort All Users A-Z</span>
          </button>
        )}
      </div>

      {/* Form Section */}
      <div className="bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-4 space-y-4">
        {/* Step 1: Username */}
        <div className="govuk-form-group">
          <label className="block text-sm font-bold text-govuk-black dark:text-zinc-100 mb-1">
            1. New Username <span className="text-govuk-red">*</span>
          </label>
          <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mb-1.5">
            Lowercase alphanumeric username, typically firstname.lastname
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. john.doe or alex.miller"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="govuk-input w-full font-mono text-xs dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-600 focus:outline-none focus:ring-4 focus:ring-govuk-yellow"
            />
          </div>

          {/* Real-time username validation feedback */}
          {username.trim() && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {usernameCheck.valid ? (
                <span className="govuk-tag govuk-tag--green flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {usernameCheck.message}
                </span>
              ) : (
                <div className="flex items-center gap-1.5 font-bold text-govuk-red">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{usernameCheck.message}</span>
                  {usernameCheck.line && (
                    <button
                      onClick={() => onJumpToLine(usernameCheck.line!)}
                      className="text-govuk-blue dark:text-sky-400 underline text-xs ml-1 hover:text-govuk-blue-dark cursor-pointer"
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
          <label className="block text-sm font-bold text-govuk-black dark:text-zinc-100 mb-1">
            2. Access Pattern &amp; Anchor Reusability
          </label>
          <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mb-2">
            Select an RBAC permission template
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Non-Prod Admin Preset */}
            <button
              type="button"
              onClick={() => setTemplateMode('preset_non_prod')}
              className={`p-3 border-2 text-left cursor-pointer transition-all ${
                templateMode === 'preset_non_prod'
                  ? 'border-govuk-black dark:border-white bg-white dark:bg-zinc-800 shadow-[0_0_0_2px_#0b0c0c]'
                  : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey dark:bg-zinc-900 hover:bg-[#e5e5e4]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-govuk-black dark:text-zinc-100">
                <Zap className="w-3.5 h-3.5 text-govuk-yellow-tint text-amber-600" />
                <span>Power Admin Preset</span>
              </div>
              <p className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 mt-1">
                Admin in sandbox, dev &amp; staging. Reuses <code className="font-mono text-govuk-purple font-bold">*all_projects_non_prod_admin</code>
              </p>
            </button>

            {/* Super Admin Preset */}
            <button
              type="button"
              onClick={() => setTemplateMode('preset_all_admin')}
              className={`p-3 border-2 text-left cursor-pointer transition-all ${
                templateMode === 'preset_all_admin'
                  ? 'border-govuk-black dark:border-white bg-white dark:bg-zinc-800 shadow-[0_0_0_2px_#0b0c0c]'
                  : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey dark:bg-zinc-900 hover:bg-[#e5e5e4]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-govuk-black dark:text-zinc-100">
                <Shield className="w-3.5 h-3.5 text-govuk-purple" />
                <span>Super Admin Preset</span>
              </div>
              <p className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 mt-1">
                Admin in all projects &amp; all environments. Reuses <code className="font-mono text-govuk-purple font-bold">*all_projects_admin</code>
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
              className={`p-3 border-2 text-left cursor-pointer transition-all ${
                templateMode === 'clone_user'
                  ? 'border-govuk-black dark:border-white bg-white dark:bg-zinc-800 shadow-[0_0_0_2px_#0b0c0c]'
                  : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey dark:bg-zinc-900 hover:bg-[#e5e5e4]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-govuk-black dark:text-zinc-100">
                <Copy className="w-3.5 h-3.5 text-govuk-blue" />
                <span>Clone Existing User</span>
              </div>
              <p className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 mt-1">
                Copy permissions from an existing teammate
              </p>
            </button>

            {/* Custom Project Builder */}
            <button
              type="button"
              onClick={() => setTemplateMode('custom')}
              className={`p-3 border-2 text-left cursor-pointer transition-all ${
                templateMode === 'custom'
                  ? 'border-govuk-black dark:border-white bg-white dark:bg-zinc-800 shadow-[0_0_0_2px_#0b0c0c]'
                  : 'border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey dark:bg-zinc-900 hover:bg-[#e5e5e4]'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-govuk-black dark:text-zinc-100">
                <Layers className="w-3.5 h-3.5 text-govuk-green" />
                <span>Custom Project Builder</span>
              </div>
              <p className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 mt-1">
                Select individual projects &amp; environment anchors
              </p>
            </button>
          </div>
        </div>

        {/* Clone User Sub-selector */}
        {templateMode === 'clone_user' && usersMeta?.users && (
          <div className="bg-govuk-grey dark:bg-zinc-950 p-3 border border-govuk-grey-border dark:border-zinc-800 space-y-2">
            <label className="block text-xs font-bold text-govuk-black dark:text-zinc-300">
              Select user to clone permissions from:
            </label>
            <select
              value={cloneFromUser}
              onChange={e => setCloneFromUser(e.target.value)}
              className="govuk-input w-full text-xs font-mono dark:bg-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-4 focus:ring-govuk-yellow"
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
          <div className="bg-govuk-grey dark:bg-zinc-950 p-3 border border-govuk-grey-border dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-govuk-black dark:text-zinc-300 font-bold uppercase tracking-wider">
                Assigned Projects &amp; Environment Anchors
              </span>
              <button
                type="button"
                onClick={addProjectRow}
                className="govuk-button--secondary text-xs px-2 py-1 flex items-center gap-1 cursor-pointer"
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
                    className="govuk-input flex-1 text-xs dark:bg-zinc-900 dark:text-zinc-200"
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
                    className="govuk-input flex-1 text-xs font-mono text-govuk-purple dark:text-purple-300 dark:bg-zinc-900"
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
                      className="p-1.5 text-govuk-text-secondary hover:text-govuk-red cursor-pointer"
                      title="Remove project"
                    >
                      <Trash2 className="w-4 h-4" />
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
            <label className="text-xs font-bold text-govuk-black dark:text-zinc-300 uppercase tracking-wider">
              Generated YAML Snippet
            </label>
            <button
              onClick={handleCopy}
              className="govuk-button--secondary text-xs px-2.5 py-1 flex items-center gap-1 cursor-pointer"
            >
              {copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-govuk-green" />
                  <span className="font-bold text-govuk-green">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-3 bg-govuk-grey dark:bg-black/60 border border-govuk-grey-border dark:border-zinc-800 text-xs font-mono text-govuk-black dark:text-emerald-400 overflow-x-auto">
            {generatedSnippet}
          </pre>
        </div>

        {/* Step 4: Insertion Actions */}
        <div className="pt-3 border-t border-govuk-grey-border dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-govuk-black dark:text-zinc-300">
            <span className="font-bold">Insert Location:</span>
            <select
              value={insertPosition}
              onChange={e => setInsertPosition(e.target.value as any)}
              className="govuk-input text-xs dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="alphabetical">Alphabetical Order (Recommended)</option>
              <option value="start">Top of users: array</option>
              <option value="end">Bottom of users: array</option>
            </select>
          </div>

          <button
            onClick={handleInsert}
            disabled={!username.trim() || !usernameCheck.valid}
            className="govuk-button text-xs px-4 py-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Insert into YAML File</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {insertSuccessMsg && (
          <div className="border-4 border-govuk-green bg-[#cce2d8]/40 dark:bg-emerald-950/20 text-[#005a30] dark:text-emerald-300 p-3 text-xs flex flex-wrap items-center justify-between gap-2 font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-govuk-green" />
              <span>{insertSuccessMsg}</span>
            </div>
            {onSwitchToDirectory && (
              <button
                type="button"
                onClick={onSwitchToDirectory}
                className="govuk-button--secondary text-xs px-3 py-1 flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <Users className="w-3.5 h-3.5" />
                <span>View in User Directory</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
