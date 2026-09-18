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
  onSortProjects?: (targetAnchor?: string) => void;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({
  validationResult,
  onJumpToLine,
  onSortUsers,
  onSortProjects,
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
      {/* Top Status Banner - GOV.UK Error Summary or Success Banner */}
      {!isValid ? (
        <div className="govuk-error-summary bg-white dark:bg-zinc-900 text-govuk-black dark:text-zinc-100" role="alert">
          <h2 className="font-bold text-lg text-govuk-red mb-2">There is a problem</h2>
          <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mb-3">
            {errors.length} {errors.length === 1 ? 'error' : 'errors'} must be fixed to ensure the YAML parses safely.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs">
            {errors.slice(0, 5).map(err => (
              <li key={err.id}>
                <button
                  type="button"
                  onClick={() => onJumpToLine(err.line, err.column)}
                  className="text-govuk-blue dark:text-sky-400 underline hover:text-govuk-blue-dark dark:hover:text-sky-300 font-bold text-left cursor-pointer"
                >
                  Line {err.line}: {err.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="border-4 border-govuk-green bg-[#cce2d8]/30 dark:bg-emerald-950/20 p-4 text-govuk-black dark:text-emerald-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-govuk-green mt-0.5 shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-[#005a30] dark:text-emerald-300">
                YAML Syntax &amp; References are Valid
              </h3>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mt-1">
                Parsed in {stats.parseTimeMs}ms. All anchors, aliases, and merge keys are correctly structured.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-3">
          <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
            Syntax Status
          </span>
          <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
            {errors.filter(e => e.source === 'syntax').length === 0 ? (
              <span className="text-govuk-green">Clean</span>
            ) : (
              <span className="text-govuk-red">
                {errors.filter(e => e.source === 'syntax').length} Syntax Err
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-3">
          <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
            Dangling Aliases
          </span>
          <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
            {stats.danglingAliasCount === 0 ? (
              <span className="text-govuk-green">0 Dangling</span>
            ) : (
              <span className="text-govuk-red">{stats.danglingAliasCount} Missing</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-3">
          <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
            Unused Anchors
          </span>
          <div className="text-sm font-bold mt-1 flex items-center gap-1.5">
            {stats.unusedAnchorCount === 0 ? (
              <span className="text-govuk-green">0 Dead Anchors</span>
            ) : (
              <span className="text-govuk-text-secondary">{stats.unusedAnchorCount} Unused</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-3">
          <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
            Parse Latency
          </span>
          <div className="text-sm font-bold mt-1 text-govuk-black dark:text-zinc-200">
            {stats.parseTimeMs} ms
          </div>
        </div>
      </div>

      {/* Issues List Header & Filter */}
      <div className="flex items-center justify-between pt-2 border-t border-govuk-grey-border dark:border-zinc-800">
        <span className="text-xs font-bold text-govuk-black dark:text-zinc-200">
          Diagnostics &amp; Issues ({issues.length})
        </span>

        <div className="flex items-center gap-1 bg-govuk-grey dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-0.5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 text-xs cursor-pointer ${
              filter === 'all'
                ? 'bg-govuk-black text-white font-bold'
                : 'text-govuk-black dark:text-zinc-300 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
            }`}
          >
            All ({issues.length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-2.5 py-1 text-xs cursor-pointer ${
              filter === 'error'
                ? 'bg-govuk-red text-white font-bold'
                : 'text-govuk-black dark:text-zinc-300 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
            }`}
          >
            Errors ({errors.length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-2.5 py-1 text-xs cursor-pointer ${
              filter === 'warning'
                ? 'bg-govuk-black text-govuk-yellow font-bold'
                : 'text-govuk-black dark:text-zinc-300 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
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
              onSortProjects={onSortProjects}
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
  onSortProjects?: (targetAnchor?: string) => void;
}> = ({ issue, onJumpToLine, onSortUsers, onSortProjects }) => {
  const getSeverityBadge = (sev: IssueSeverity) => {
    switch (sev) {
      case 'error':
        return (
          <span className="govuk-tag govuk-tag--red flex items-center gap-1 text-[10px]">
            <AlertCircle className="w-3 h-3" /> Error
          </span>
        );
      case 'warning':
        return (
          <span className="govuk-tag govuk-tag--yellow text-govuk-black flex items-center gap-1 text-[10px]">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      case 'info':
        return (
          <span className="govuk-tag govuk-tag--blue flex items-center gap-1 text-[10px]">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    return (
      <span className="govuk-tag govuk-tag--grey text-[10px] font-mono text-govuk-black">
        {source}
      </span>
    );
  };

  return (
    <div
      onClick={() => onJumpToLine(issue.line, issue.column)}
      className="p-3 bg-white dark:bg-zinc-900 hover:bg-govuk-grey dark:hover:bg-zinc-800/60 border border-govuk-grey-border dark:border-zinc-800 cursor-pointer transition-all group"
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
          className="flex items-center gap-1 text-xs font-mono text-govuk-blue dark:text-sky-400 group-hover:underline cursor-pointer"
        >
          <span>Line {issue.line}:{issue.column}</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </button>
      </div>

      <p className="text-xs text-govuk-black dark:text-zinc-200 mt-2 font-mono leading-relaxed break-words">
        {issue.message}
      </p>

      {issue.snippet && (
        <div className="mt-2 text-[11px] font-mono bg-govuk-grey dark:bg-black/40 text-govuk-black dark:text-zinc-300 px-2.5 py-1.5 border border-govuk-grey-border dark:border-zinc-800 overflow-x-auto">
          <span className="text-govuk-text-secondary select-none mr-2 font-bold">{issue.line} |</span>
          <span>{issue.snippet}</span>
        </div>
      )}

      {issue.suggestion && (
        <div className="govuk-inset-text my-2 py-1.5 px-3 text-xs text-govuk-black dark:text-zinc-300">
          <div className="flex items-start gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-govuk-blue shrink-0 mt-0.5" />
            <span>{issue.suggestion}</span>
          </div>
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
            className="govuk-button text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span>Sort Users Alphabetically Now</span>
          </button>
        </div>
      )}

      {onSortProjects && (issue.code === 'PROJECTS_NOT_ALPHABETICAL' || issue.id.startsWith('projects-not-sorted')) && (
        <div className="mt-2.5 flex items-center justify-end">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSortProjects();
            }}
            title="Sort all preset projects alphabetically in YAML"
            className="govuk-button text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span>Sort Projects Alphabetically Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
