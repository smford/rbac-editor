import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Lightbulb,
  ArrowDownAZ,
} from 'lucide-react';
import { ValidationResult, ValidationIssue, IssueSeverity } from '../../types/yaml';

interface DiagnosticsTabProps {
  validationResult: ValidationResult;
  onJumpToLine: (line: number, column?: number) => void;
  onSortUsers?: () => void;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({
  validationResult,
  onJumpToLine,
  onSortUsers,
}) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const { issues, isValid, stats } = validationResult;
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  const filteredIssues = issues.filter(i => {
    if (filter === 'all') return true;
    return i.severity === filter;
  });

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Top Status Banner */}
      <div
        className={`p-4 rounded-xl border transition-all ${
          isValid
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-300'
        }`}
      >
        <div className="flex items-start gap-3">
          {isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {isValid
                ? 'YAML Syntax & References are Valid'
                : `Validation Failed (${errors.length} ${errors.length === 1 ? 'Error' : 'Errors'})`}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              {isValid
                ? `Successfully parsed in ${stats.parseTimeMs}ms. All anchors, aliases, and merge keys are correctly structured.`
                : 'Please resolve the errors highlighted below to ensure the YAML parses safely.'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
            Syntax Status
          </span>
          <div className="text-sm font-semibold mt-1 flex items-center gap-1.5">
            {errors.filter(e => e.source === 'syntax').length === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">Clean</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400">
                {errors.filter(e => e.source === 'syntax').length} Syntax Err
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
            Dangling Aliases
          </span>
          <div className="text-sm font-semibold mt-1 flex items-center gap-1.5">
            {stats.danglingAliasCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">0 Dangling</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-bold">{stats.danglingAliasCount} Missing</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
            Unused Anchors
          </span>
          <div className="text-sm font-semibold mt-1 flex items-center gap-1.5">
            {stats.unusedAnchorCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">0 Dead Anchors</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">{stats.unusedAnchorCount} Unused</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
            Parse Latency
          </span>
          <div className="text-sm font-semibold mt-1 text-zinc-800 dark:text-zinc-200">
            {stats.parseTimeMs} ms
          </div>
        </div>
      </div>

      {/* Issues List Header & Filter */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Diagnostics &amp; Issues ({issues.length})
        </span>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            All ({issues.length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filter === 'error'
                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Errors ({errors.length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filter === 'warning'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Warnings ({warnings.length})
          </button>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 bg-white/60 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-300">No issues found</p>
          <p className="text-xs text-zinc-500 mt-1">
            {filter === 'all'
              ? 'Your YAML file is syntactically sound and conforms to standards.'
              : `No issues matching the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredIssues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onJumpToLine={onJumpToLine}
              onSortUsers={onSortUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const IssueCard: React.FC<{
  issue: ValidationIssue;
  onJumpToLine: (line: number, column?: number) => void;
  onSortUsers?: () => void;
}> = ({ issue, onJumpToLine, onSortUsers }) => {
  const getSeverityBadge = (sev: IssueSeverity) => {
    switch (sev) {
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      case 'info':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    return (
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        {source}
      </span>
    );
  };

  return (
    <div
      onClick={() => onJumpToLine(issue.line, issue.column)}
      className="p-3 bg-white dark:bg-zinc-900/90 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg cursor-pointer transition-all group shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {getSeverityBadge(issue.severity)}
          {getSourceBadge(issue.source)}
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            onJumpToLine(issue.line, issue.column);
          }}
          className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
        >
          <span>Line {issue.line}:{issue.column}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </button>
      </div>

      <p className="text-xs text-zinc-800 dark:text-zinc-200 mt-2 font-mono leading-relaxed break-words">
        {issue.message}
      </p>

      {issue.snippet && (
        <div className="mt-2 text-[11px] font-mono bg-zinc-50 dark:bg-black/40 text-zinc-800 dark:text-zinc-300 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800/80 overflow-x-auto">
          <span className="text-zinc-400 dark:text-zinc-600 select-none mr-2">{issue.line} |</span>
          <span>{issue.snippet}</span>
        </div>
      )}

      {issue.suggestion && (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-400 bg-amber-50/70 dark:bg-zinc-800/40 border border-amber-200/50 dark:border-transparent p-1.5 rounded">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>{issue.suggestion}</span>
        </div>
      )}

      {onSortUsers && (issue.code === 'USERS_NOT_ALPHABETICAL' || issue.id.startsWith('users-not-sorted')) && (
        <div className="mt-2.5 flex items-center justify-end">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSortUsers();
            }}
            title="Sort users alphabetically in YAML"
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-2.5 py-1 rounded-md shadow-xs transition-colors"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span>Sort Users Alphabetically Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
