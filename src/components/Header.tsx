import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Upload,
  Download,
  Copy,
  Check,
  Sun,
  Moon,
  Code,
  Sparkles,
  ArrowDownAZ,
  UserPlus,
  FolderPlus,
} from 'lucide-react';
import { ValidationResult } from '../types/yaml';

interface HeaderProps {
  validationResult: ValidationResult;
  onUploadFile: (content: string, filename: string) => void;
  onFormatYaml: () => void;
  onCopyYaml: () => void;
  onDownloadYaml: () => void;
  onSortUsers: () => void;
  onSortProjects?: (targetAnchor?: string) => void;
  onOpenAddUser?: () => void;
  onOpenAddProject?: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  validationResult,
  onUploadFile,
  onFormatYaml,
  onCopyYaml,
  onDownloadYaml,
  onSortUsers,
  onSortProjects,
  onOpenAddUser,
  onOpenAddProject,
  darkMode,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [projectsSorted, setProjectsSorted] = useState(false);

  const hasPresetProjects = Boolean(
    validationResult.hasPresetProjectAnchors ??
    validationResult.anchors.some(a => a.name === 'all_projects_admin' || a.name === 'all_projects_non_prod_admin')
  );

  const errorCount = validationResult.issues.filter(i => i.severity === 'error').length;
  const warningCount = validationResult.issues.filter(i => i.severity === 'warning').length;

  const handleCopyClick = () => {
    onCopyYaml();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (typeof text === 'string') {
        onUploadFile(text, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="shrink-0 z-20 select-none">
      {/* GOV.UK Primary Header */}
      <header className="bg-govuk-black text-white border-b-[10px] border-govuk-blue px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Crown Logo + Service Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {/* GOV.UK Crown SVG */}
            <svg
              focusable="false"
              role="presentation"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 60"
              className="w-8 h-7 text-white fill-current shrink-0"
              aria-hidden="true"
            >
              <g>
                <circle cx="20" cy="17.6" r="3.7"/>
                <circle cx="10.2" cy="23.5" r="3.7"/>
                <circle cx="3.7" cy="33.2" r="3.7"/>
                <circle cx="31.7" cy="30.6" r="3.7"/>
                <circle cx="43.3" cy="17.6" r="3.7"/>
                <circle cx="53.2" cy="23.5" r="3.7"/>
                <circle cx="59.7" cy="33.2" r="3.7"/>
                <circle cx="31.7" cy="30.6" r="3.7"/>
                <path d="M33.1,9.8c.2-.1.3-.3.5-.5l4.6,2.4v-6.8l-4.6,1.5c-.1-.2-.3-.3-.5-.5l1.9-5.9h-6.7l1.9,5.9c-.2.1-.3.3-.5.5l-4.6-1.5v6.8l4.6-2.4c.1.2.3.3.5.5l-2.6,8c-.9,2.8,1.2,5.7,4.1,5.7h0c3,0,5.1-2.9,4.1-5.7l-2.6-8ZM37,37.9s-3.4,3.8-4.1,6.1c2.2,0,4.2-.5,6.4-2.8l-.7,8.5c-2-2.8-4.4-4.1-5.7-3.8.1,3.1.5,6.7,5.8,7.2,3.7.3,6.7-1.5,7-3.8.4-2.6-2-4.3-3.7-1.6-1.4-4.5,2.4-6.1,4.9-3.2-1.9-4.5-1.8-7.7,2.4-10.9,3,4,2.6,7.3-1.2,11.1,2.4-1.3,6.2,0,4,4.6-1.2-2.8-3.7-2.2-4.2.2-.3,1.7.7,3.7,3,4.2,1.9.3,4.7-.9,7-5.9-1.3,0-2.4.7-3.9,1.7l2.4-8c.6,2.3,1.4,3.7,2.2,4.5.6-1.6.5-2.8,0-5.3l5,1.8c-2.6,3.6-5.2,8.7-7.3,17.5-7.4-1.1-15.7-1.7-24.5-1.7h0c-8.8,0-17.1.6-24.5,1.7-2.1-8.9-4.7-13.9-7.3-17.5l5-1.8c-.5,2.5-.6,3.7,0,5.3.8-.8,1.6-2.3,2.2-4.5l2.4,8c-1.5-1-2.6-1.7-3.9-1.7,2.3,5,5.2,6.2,7,5.9,2.3-.4,3.3-2.4,3-4.2-.5-2.4-3-3.1-4.2-.2-2.2-4.6,1.6-6,4-4.6-3.7-3.7-4.2-7.1-1.2-11.1,4.2,3.2,4.3,6.4,2.4,10.9,2.5-2.8,6.3-1.3,4.9,3.2-1.8-2.7-4.1-1-3.7,1.6.3,2.3,3.3,4.1,7,3.8,5.4-.5,5.7-4.2,5.8-7.2-1.3-.2-3.7,1-5.7,3.8l-.7-8.5c2.2,2.3,4.2,2.7,6.4,2.8-.7-2.3-4.1-6.1-4.1-6.1h10.6,0Z"/>
              </g>
            </svg>
            <span className="font-bold text-lg tracking-tight hover:underline cursor-pointer">GOV.UK</span>
          </div>

          <div className="h-5 w-px bg-zinc-700 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-normal text-white">
              RBAC Editor
            </span>
            <span className="text-zinc-400 text-xs hidden lg:inline">
              – Role-Based Access Control &amp; YAML Validator
            </span>
          </div>
        </div>

        {/* Center: Real-Time Status Tags */}
        <div className="hidden md:flex items-center gap-2">
          {validationResult.isValid ? (
            <span className="govuk-tag govuk-tag--green flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Valid YAML
            </span>
          ) : (
            <span className="govuk-tag govuk-tag--red flex items-center gap-1 text-[11px]">
              <AlertCircle className="w-3 h-3" />
              {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
            </span>
          )}

          {warningCount > 0 && (
            <span className="govuk-tag govuk-tag--yellow flex items-center gap-1 text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} Warnings
            </span>
          )}

          <span className="govuk-tag govuk-tag--grey text-[11px] text-govuk-black font-mono">
            {validationResult.stats.anchorCount} &amp; / {validationResult.stats.aliasCount} *
          </span>

          {validationResult.isUsersConfig && (
            <span className="govuk-tag govuk-tag--purple flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3" />
              {validationResult.stats.usersCount} Users
            </span>
          )}
        </div>

        {/* Right: Actions (Toolbar Buttons) */}
        <div className="flex items-center gap-2">
          {/* Upload file */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".yaml,.yml,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload YAML File from Disk"
            className="govuk-button--secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Format / Prettify */}
          <button
            onClick={onFormatYaml}
            title="Format and Clean YAML Indentation"
            className="govuk-button--secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Format</span>
          </button>

          {/* Add User Wizard Button */}
          {validationResult.isUsersConfig && onOpenAddUser && (
            <button
              onClick={onOpenAddUser}
              title="Add a new user (Wizard)"
              className="govuk-button text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          )}

          {/* Add Project Wizard Button */}
          {validationResult.isUsersConfig && onOpenAddProject && (
            <button
              onClick={onOpenAddProject}
              title="Add a new project & environment (Wizard)"
              className="govuk-button--secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer font-bold"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          )}

          {/* Sort Users Alphabetically */}
          {validationResult.isUsersConfig && (
            <button
              onClick={() => {
                onSortUsers();
                setSorted(true);
                setTimeout(() => setSorted(false), 2000);
              }}
              title="Sort users alphabetically (A-Z)"
              className="govuk-button--secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
            >
              {sorted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-govuk-green" />
                  <span>Sorted A-Z</span>
                </>
              ) : (
                <>
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                  <span>Sort Users</span>
                </>
              )}
            </button>
          )}

          {/* Sort Projects in Presets (all_projects_admin and all_projects_non_prod_admin) */}
          {hasPresetProjects && onSortProjects && (
            <button
              onClick={() => {
                onSortProjects();
                setProjectsSorted(true);
                setTimeout(() => setProjectsSorted(false), 2000);
              }}
              title="Sort all projects alphabetically in all_projects_admin and all_projects_non_prod_admin"
              className="govuk-button--secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
            >
              {projectsSorted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-govuk-green" />
                  <span>Projects Sorted</span>
                </>
              ) : (
                <>
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                  <span>Sort Projects</span>
                </>
              )}
            </button>
          )}

          {/* Copy YAML */}
          <button
            onClick={handleCopyClick}
            title="Copy YAML to Clipboard"
            className="govuk-button--secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-govuk-green" />
                <span className="font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Download YAML (Primary Button) */}
          <button
            onClick={onDownloadYaml}
            title="Download YAML File"
            className="govuk-button text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="govuk-button--secondary text-xs p-1.5 flex items-center justify-center cursor-pointer"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-govuk-yellow" /> : <Moon className="w-3.5 h-3.5 text-govuk-blue" />}
          </button>
        </div>
      </header>

      {/* GOV.UK Phase Banner */}
      <div className="bg-govuk-grey dark:bg-zinc-900 border-b border-govuk-grey-border dark:border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-govuk-black dark:text-zinc-200">
        <div className="flex items-center gap-2.5">
          <strong className="govuk-tag">BETA</strong>
          <span>
            This is a new service – validate, explore and manage role-based access control YAML in your browser.
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-govuk-text-secondary dark:text-zinc-400 text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-govuk-green"></span>
          <span>100% In-Browser Privacy • Zero Server Transmission</span>
        </div>
      </div>
    </div>
  );
};
