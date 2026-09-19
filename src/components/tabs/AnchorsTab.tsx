import React, { useState } from 'react';
import {
  GitFork,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  HelpCircle,
  ArrowDownAZ,
} from 'lucide-react';
import { ValidationResult } from '../../types/yaml';

interface AnchorsTabProps {
  validationResult: ValidationResult;
  onJumpToLine: (line: number, column?: number) => void;
  onSortProjects?: (targetAnchor?: string) => void;
}

export const AnchorsTab: React.FC<AnchorsTabProps> = ({
  validationResult,
  onJumpToLine,
  onSortProjects,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'used' | 'unused' | 'merges'>('all');
  const [showGuide, setShowGuide] = useState(false);
  const [expandedAnchors, setExpandedAnchors] = useState<Record<string, boolean>>({});
  const [copiedAnchor, setCopiedAnchor] = useState<string | null>(null);

  const { anchors, mergeKeys, stats } = validationResult;

  const toggleAnchorExpand = (name: string) => {
    setExpandedAnchors(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCopyAlias = (name: string) => {
    navigator.clipboard.writeText(`*${name}`);
    setCopiedAnchor(name);
    setTimeout(() => setCopiedAnchor(null), 1500);
  };

  const filteredAnchors = anchors.filter(anchor => {
    if (search && !anchor.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter === 'used') return anchor.isUsed;
    if (filter === 'unused') return !anchor.isUsed;
    return true;
  });

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-800 rounded-none p-4 space-y-4 shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-govuk-black dark:bg-zinc-800 text-white flex items-center justify-center font-bold">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-govuk-black dark:text-zinc-100">
                YAML Anchor &amp; Alias Architecture
              </h3>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400">
                {stats.anchorCount} defined anchors • {stats.aliasCount} references • {stats.mergeKeyCount} merge keys
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(validationResult.hasPresetProjectAnchors || validationResult.usersMetadata?.hasPresetProjectAnchors) && onSortProjects && (
              <button
                type="button"
                onClick={() => onSortProjects()}
                title="Sort all projects alphabetically in all_projects_admin & all_projects_non_prod_admin"
                className="govuk-button--secondary text-xs font-bold py-1 px-3 rounded-none inline-flex items-center gap-1.5"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>Sort Preset Projects</span>
              </button>
            )}

            <button
              onClick={() => setShowGuide(!showGuide)}
              className="govuk-button--secondary text-xs font-bold py-1 px-3 rounded-none inline-flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Hide Guide' : 'YAML Anchors 101'}</span>
            </button>
          </div>
        </div>

        {/* Quick Guide Accordion */}
        {showGuide && (
          <div className="govuk-inset-text border-l-[10px] border-govuk-grey-border dark:border-zinc-700 bg-govuk-grey/40 dark:bg-zinc-950 p-3.5 text-xs text-govuk-black dark:text-zinc-200 space-y-2">
            <div className="font-bold text-govuk-blue dark:text-sky-400 flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4" /> Quick YAML Cheat Sheet:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1">
              <div className="bg-white dark:bg-zinc-900 p-2.5 border-2 border-govuk-grey-border dark:border-zinc-800">
                <span className="font-mono text-govuk-blue dark:text-sky-400 font-bold">&amp;anchor_name</span>
                <p className="text-govuk-text-secondary dark:text-zinc-400 mt-1">Defines a reusable node anchor. Does not alter document structure on its own.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-2.5 border-2 border-govuk-grey-border dark:border-zinc-800">
                <span className="font-mono text-govuk-purple dark:text-purple-400 font-bold">*anchor_name</span>
                <p className="text-govuk-text-secondary dark:text-zinc-400 mt-1">Alias referencing an anchor. Evaluates directly to the anchored node.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-2.5 border-2 border-govuk-grey-border dark:border-zinc-800">
                <span className="font-mono text-govuk-turquoise dark:text-teal-400 font-bold">&lt;&lt;: *anchor_name</span>
                <p className="text-govuk-text-secondary dark:text-zinc-400 mt-1">Merge key. Injects all mapping pairs from target anchor into current dictionary.</p>
              </div>
            </div>
          </div>
        )}

        {/* Anchor Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-govuk-grey/40 dark:bg-zinc-950 p-3 border-2 border-govuk-grey-border dark:border-zinc-800 rounded-none">
            <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
              Total Anchors
            </span>
            <div className="text-lg font-bold mt-0.5 text-govuk-blue dark:text-sky-400">
              {stats.anchorCount}
            </div>
          </div>
          <div className="bg-govuk-grey/40 dark:bg-zinc-950 p-3 border-2 border-govuk-grey-border dark:border-zinc-800 rounded-none">
            <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
              Total Aliases
            </span>
            <div className="text-lg font-bold mt-0.5 text-govuk-purple dark:text-purple-400">
              {stats.aliasCount}
            </div>
          </div>
          <div className="bg-govuk-grey/40 dark:bg-zinc-950 p-3 border-2 border-govuk-grey-border dark:border-zinc-800 rounded-none">
            <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
              Merge Keys (&lt;&lt;)
            </span>
            <div className="text-lg font-bold mt-0.5 text-govuk-turquoise dark:text-teal-400">
              {stats.mergeKeyCount}
            </div>
          </div>
          <div className="bg-govuk-grey/40 dark:bg-zinc-950 p-3 border-2 border-govuk-grey-border dark:border-zinc-800 rounded-none">
            <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400 uppercase tracking-wider font-bold">
              Dead / Unused
            </span>
            <div className="text-lg font-bold mt-0.5">
              {stats.unusedAnchorCount === 0 ? (
                <span className="text-govuk-green dark:text-emerald-400">0</span>
              ) : (
                <span className="text-govuk-red dark:text-red-400 font-bold">{stats.unusedAnchorCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-govuk-text-secondary dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter anchors by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="govuk-input w-full pl-9 pr-3 py-1.5 text-xs text-govuk-black dark:text-zinc-100 dark:bg-zinc-950 dark:border-zinc-700 placeholder:text-govuk-text-secondary dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-govuk-grey dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-700 p-1 text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
              filter === 'all'
                ? 'bg-govuk-black text-white dark:bg-zinc-100 dark:text-zinc-950'
                : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
            }`}
          >
            All ({anchors.length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
              filter === 'used'
                ? 'bg-govuk-green text-white dark:bg-emerald-600'
                : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
            }`}
          >
            Active ({anchors.filter(a => a.isUsed).length})
          </button>
          <button
            onClick={() => setFilter('unused')}
            className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
              filter === 'unused'
                ? 'bg-govuk-red text-white dark:bg-red-600'
                : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
            }`}
          >
            Unused ({anchors.filter(a => !a.isUsed).length})
          </button>
          {mergeKeys.length > 0 && (
            <button
              onClick={() => setFilter('merges')}
              className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
                filter === 'merges'
                  ? 'bg-govuk-blue text-white dark:bg-blue-600'
                  : 'text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey-border dark:hover:bg-zinc-800'
              }`}
            >
              Merges ({mergeKeys.length})
            </button>
          )}
        </div>
      </div>

      {/* Merges View Mode */}
      {filter === 'merges' ? (
        <div className="space-y-3">
          {mergeKeys.map((mk, idx) => (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-800 rounded-none flex items-center justify-between gap-2 shadow-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="govuk-tag govuk-tag--turquoise font-mono text-xs font-bold">&lt;&lt; MERGE</span>
                  <span className="font-mono text-xs text-govuk-purple dark:text-purple-400 font-bold">
                    {mk.targetAnchors.map(t => `*${t}`).join(', ')}
                  </span>
                </div>
                {mk.contextSnippet && (
                  <p className="text-xs font-mono text-govuk-text-secondary dark:text-zinc-400 truncate max-w-md">
                    {mk.contextSnippet}
                  </p>
                )}
              </div>

              <button
                onClick={() => onJumpToLine(mk.line, mk.column)}
                className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1 font-mono"
              >
                <span>Line {mk.line}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Anchor Cards List */
        <div className="space-y-3">
          {filteredAnchors.length === 0 ? (
            <div className="py-10 text-center bg-white dark:bg-zinc-900 border-2 border-dashed border-govuk-grey-border dark:border-zinc-800 rounded-none p-6">
              <p className="text-sm font-bold text-govuk-black dark:text-zinc-100">No anchors match your filter</p>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mt-1">
                Define reusable blocks with <code className="font-bold text-govuk-blue dark:text-sky-400">&amp;anchor_name</code> in the editor.
              </p>
            </div>
          ) : (
            filteredAnchors.map(anchor => {
              const isExpanded = expandedAnchors[anchor.name] ?? false;

              return (
                <div
                  key={anchor.name}
                  className="bg-white dark:bg-zinc-900 border-2 border-govuk-black dark:border-zinc-800 rounded-none shadow-none"
                >
                  {/* Card Header */}
                  <div className="p-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-govuk-black dark:text-zinc-100 flex items-center gap-1">
                          <span className="text-govuk-blue dark:text-sky-400">&amp;</span>
                          <span>{anchor.name}</span>
                        </span>

                        <span className="govuk-tag govuk-tag--grey text-[10px] font-bold">
                          {anchor.type}
                        </span>

                        {anchor.isUsed ? (
                          <span className="govuk-tag govuk-tag--green text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {anchor.references.length} {anchor.references.length === 1 ? 'REF' : 'REFS'}
                          </span>
                        ) : (
                          <span className="govuk-tag govuk-tag--yellow text-[10px] font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            UNUSED
                          </span>
                        )}
                      </div>

                      {/* Snippet preview */}
                      <p className="text-xs font-mono text-govuk-text-secondary dark:text-zinc-300 bg-govuk-grey/50 dark:bg-zinc-950 p-2 border border-govuk-grey-border dark:border-zinc-800 line-clamp-2 max-w-2xl">
                        {anchor.valuePreview}
                      </p>
                    </div>

                    {/* Actions on right */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyAlias(anchor.name)}
                        title="Copy alias *name to clipboard"
                        className="govuk-button--secondary p-1.5 rounded-none font-bold"
                      >
                        {copiedAnchor === anchor.name ? (
                          <Check className="w-3.5 h-3.5 text-govuk-green" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {(anchor.name === 'all_projects_admin' || anchor.name === 'all_projects_non_prod_admin') && onSortProjects && (
                        <button
                          type="button"
                          onClick={() => onSortProjects(anchor.name)}
                          title={`Sort projects alphabetically in &${anchor.name}`}
                          className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1 font-mono"
                        >
                          <ArrowDownAZ className="w-3.5 h-3.5 text-govuk-blue dark:text-sky-400" />
                          <span>Sort A-Z</span>
                        </button>
                      )}

                      <button
                        onClick={() => onJumpToLine(anchor.line, anchor.column)}
                        title={`Jump to definition at line ${anchor.line}`}
                        className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1 font-mono"
                      >
                        <span>Line {anchor.line}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {anchor.references.length > 0 && (
                        <button
                          onClick={() => toggleAnchorExpand(anchor.name)}
                          className="govuk-button--secondary p-1.5 rounded-none font-bold"
                          title={isExpanded ? 'Collapse references' : 'View references'}
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

                  {/* Expanded Reference Locations List */}
                  {isExpanded && anchor.references.length > 0 && (
                    <div className="govuk-inset-text border-l-[10px] border-govuk-grey-border dark:border-zinc-700 bg-govuk-grey/40 dark:bg-zinc-950 p-3 space-y-2 my-0">
                      <div className="text-xs uppercase tracking-wider font-bold text-govuk-black dark:text-zinc-200 mb-1">
                        Alias References ({anchor.references.length}):
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {anchor.references.map((ref, rIdx) => (
                          <div
                            key={rIdx}
                            onClick={() => onJumpToLine(ref.line, ref.column)}
                            className="flex items-center justify-between text-xs font-mono p-2 bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 hover:border-govuk-black dark:hover:border-zinc-600 cursor-pointer transition-colors group"
                          >
                            <span className="truncate mr-2 text-xs text-govuk-text-secondary dark:text-zinc-400 group-hover:text-govuk-black dark:group-hover:text-zinc-100">
                              {ref.contextSnippet || `Line ${ref.line}`}
                            </span>
                            <span className="text-xs text-govuk-blue dark:text-sky-400 group-hover:underline shrink-0 font-bold">
                              Line {ref.line}:{ref.column} →
                            </span>
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
      )}
    </div>
  );
};
