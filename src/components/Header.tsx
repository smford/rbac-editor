import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
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
} from 'lucide-react';
import { ValidationResult } from '../types/yaml';

interface HeaderProps {
  validationResult: ValidationResult;
  onUploadFile: (content: string, filename: string) => void;
  onFormatYaml: () => void;
  onCopyYaml: () => void;
  onDownloadYaml: () => void;
  onSortUsers: () => void;
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
  darkMode,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [sorted, setSorted] = useState(false);

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
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 select-none z-20 transition-colors">
      {/* Left branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              RBAC Editor
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
                Client-Side
              </span>
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">100% In-Browser YAML • Anchor &amp; RBAC Manager</p>
        </div>
      </div>

      {/* Center status pills */}
      <div className="hidden md:flex items-center gap-2">
        {/* Validation Status Badge */}
        {validationResult.isValid ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Valid YAML</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{errorCount} {errorCount === 1 ? 'Error' : 'Errors'}</span>
          </div>
        )}

        {/* Warnings Pill */}
        {warningCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}</span>
          </div>
        )}

        {/* Anchors Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">&amp;</span>
          <span>{validationResult.stats.anchorCount} Anchors</span>
          <span className="text-zinc-400 dark:text-zinc-500">•</span>
          <span className="text-purple-600 dark:text-purple-400 font-semibold">*</span>
          <span>{validationResult.stats.aliasCount} Aliases</span>
          {validationResult.stats.mergeKeyCount > 0 && (
            <>
              <span className="text-zinc-400 dark:text-zinc-500">•</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">&lt;&lt;</span>
              <span>{validationResult.stats.mergeKeyCount} Merges</span>
            </>
          )}
        </div>

        {validationResult.isUsersConfig && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25">
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>{validationResult.stats.usersCount} Users Config</span>
          </div>
        )}
      </div>

      {/* Right controls */}
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
          className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Prettify / Format */}
        <button
          onClick={onFormatYaml}
          title="Format and Clean YAML Indentation"
          className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <Code className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="hidden sm:inline">Format</span>
        </button>

        {/* Sort Users Alphabetically (if users config) */}
        {validationResult.isUsersConfig && (
          <button
            onClick={() => {
              onSortUsers();
              setSorted(true);
              setTimeout(() => setSorted(false), 2000);
            }}
            title="Sort users alphabetically (A-Z)"
            className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1.5 rounded-md transition-colors font-medium shadow-xs"
          >
            {sorted ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sorted A-Z</span>
              </>
            ) : (
              <>
                <ArrowDownAZ className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Sort Users</span>
              </>
            )}
          </button>
        )}

        {/* Copy YAML */}
        <button
          onClick={handleCopyClick}
          title="Copy YAML to Clipboard"
          className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1.5 rounded-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>

        {/* Download YAML */}
        <button
          onClick={onDownloadYaml}
          title="Download YAML File"
          className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition-colors"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
        </button>
      </div>
    </header>
  );
};
