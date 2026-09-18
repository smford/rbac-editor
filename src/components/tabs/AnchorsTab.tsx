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
      <div className="bg-white border-2 border-govuk-black rounded-none p-4 space-y-4 shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-govuk-black text-white flex items-center justify-center font-bold">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-govuk-black">
                YAML Anchor &amp; Alias Architecture
              </h3>
              <p className="text-xs text-govuk-text-secondary">
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
          <div className="govuk-inset-text border-l-[10px] border-govuk-grey-border bg-govuk-grey/40 p-3.5 text-xs text-govuk-black space-y-2">
            <div className="font-bold text-govuk-blue flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4" /> Quick YAML Cheat Sheet:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1">
              <div className="bg-white p-2.5 border-2 border-govuk-grey-border">
                <span className="font-mono text-govuk-blue font-bold">&amp;anchor_name</span>
                <p className="text-govuk-text-secondary mt-1">Defines a reusable node anchor. Does not alter document structure on its own.</p>
              </div>
              <div className="bg-white p-2.5 border-2 border-govuk-grey-border">
                <span className="font-mono text-govuk-purple font-bold">*anchor_name</span>
                <p className="text-govuk-text-secondary mt-1">Alias referencing an anchor. Evaluates directly to the anchored node.</p>
              </div>
              <div className="bg-white p-2.5 border-2 border-govuk-grey-border">
                <span className="font-mono text-govuk-turquoise font-bold">&lt;&lt;: *anchor_name</span>
                <p className="text-govuk-text-secondary mt-1">Merge key. Injects all mapping pairs from target anchor into current dictionary.</p>
              </div>
            </div>
          </div>
        )}

        {/* Anchor Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-govuk-grey/40 p-3 border-2 border-govuk-grey-border rounded-none">
            <span className="text-[11px] text-govuk-text-secondary uppercase tracking-wider font-bold">
              Total Anchors
            </span>
            <div className="text-lg font-bold mt-0.5 text-govuk-blue">
              {stats.anchorCount}
            </div>
          </div>
          <div className="bg-govuk-grey/40 p-3 border-2 border-govuk-grey-border rounded-none">
            <span className="text-[11px] text-govuk-text-secondary uppercase tracking-wider font-bold">
              Total Aliases
            </span>
            <div className="text-lg font-bold mt-0.5 text-govuk-purple">
              {stats.aliasCount}
            </div>
          </div>
          <div className="bg-govuk-grey/40 p-3 border-2 border-govuk-grey-border rounded-none">
            <span className="text-[11px] text-govuk-text-secondary uppercase tracking-wider font-bold">
              Merge Keys (&lt;&lt;)
            </span>
            <div className="text-lg font-bold mt-0.5 text-govuk-turquoise">
              {stats.mergeKeyCount}
            </div>
          </div>
          <div className="bg-govuk-grey/40 p-3 border-2 border-govuk-grey-border rounded-none">
            <span className="text-[11px] text-govuk-text-secondary uppercase tracking-wider font-bold">
              Dead / Unused
            </span>
            <div className="text-lg font-bold mt-0.5">
              {stats.unusedAnchorCount === 0 ? (
                <span className="text-govuk-green">0</span>
              ) : (
                <span className="text-govuk-red font-bold">{stats.unusedAnchorCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-govuk-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter anchors by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="govuk-input w-full pl-9 pr-3 py-1.5 text-xs text-govuk-black placeholder:text-govuk-text-secondary"
          />
        </div>

        <div className="flex items-center gap-1 bg-govuk-grey border-2 border-govuk-black p-1 text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
              filter === 'all' ? 'bg-govuk-black text-white' : 'text-govuk-black hover:bg-govuk-grey-border'
            }`}
          >
            All ({anchors.length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
              filter === 'used' ? 'bg-govuk-green text-white' : 'text-govuk-black hover:bg-govuk-grey-border'
            }`}
          >
            Active ({anchors.filter(a => a.isUsed).length})
          </button>
          <button
            onClick={() => setFilter('unused')}
            className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
              filter === 'unused' ? 'bg-govuk-red text-white' : 'text-govuk-black hover:bg-govuk-grey-border'
            }`}
          >
            Unused ({anchors.filter(a => !a.isUsed).length})
          </button>
          {mergeKeys.length > 0 && (
            <button
              onClick={() => setFilter('merges')}
              className={`px-3 py-1 font-bold text-xs rounded-none transition-colors ${
                filter === 'merges' ? 'bg-govuk-blue text-white' : 'text-govuk-black hover:bg-govuk-grey-border'
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
              className="p-3 bg-white border-2 border-govuk-black rounded-none flex items-center justify-between gap-2 shadow-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="govuk-tag govuk-tag--turquoise font-mono text-xs font-bold">&lt;&lt; MERGE</span>
                  <span className="font-mono text-xs text-govuk-purple font-bold">
                    {mk.targetAnchors.map(t => `*${t}`).join(', ')}
                  </span>
                </div>
                {mk.contextSnippet && (
                  <p className="text-xs font-mono text-govuk-text-secondary truncate max-w-md">
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
            <div className="py-10 text-center bg-white border-2 border-dashed border-govuk-grey-border rounded-none p-6">
              <p className="text-sm font-bold text-govuk-black">No anchors match your filter</p>
              <p className="text-xs text-govuk-text-secondary mt-1">
                Define reusable blocks with <code className="font-bold text-govuk-blue">&amp;anchor_name</code> in the editor.
              </p>
            </div>
          ) : (
            filteredAnchors.map(anchor => {
              const isExpanded = expandedAnchors[anchor.name] ?? false;

              return (
                <div
                  key={anchor.name}
                  className="bg-white border-2 border-govuk-black rounded-none shadow-none"
                >
                  {/* Card Header */}
                  <div className="p-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-govuk-black flex items-center gap-1">
                          <span className="text-govuk-blue">&amp;</span>
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
                      <p className="text-xs font-mono text-govuk-text-secondary bg-govuk-grey/50 p-2 border border-govuk-grey-border line-clamp-2 max-w-2xl">
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
                          className="govuk-button--secondary text-xs font-bold py-1 px-2.5 rounded-none inline-flex items-center gap-1 font-mono text-govuk-black hover:bg-govuk-grey-border"
                        >
                          <ArrowDownAZ className="w-3.5 h-3.5 text-govuk-blue" />
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
                    <div className="govuk-inset-text border-l-[10px] border-govuk-grey-border bg-govuk-grey/40 p-3 space-y-2 my-0">
                      <div className="text-xs uppercase tracking-wider font-bold text-govuk-black mb-1">
                        Alias References ({anchor.references.length}):
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {anchor.references.map((ref, rIdx) => (
                          <div
                            key={rIdx}
                            onClick={() => onJumpToLine(ref.line, ref.column)}
                            className="flex items-center justify-between text-xs font-mono p-2 bg-white border border-govuk-grey-border hover:border-govuk-black cursor-pointer transition-colors group"
                          >
                            <span className="truncate mr-2 text-xs text-govuk-text-secondary group-hover:text-govuk-black">
                              {ref.contextSnippet || `Line ${ref.line}`}
                            </span>
                            <span className="text-xs text-govuk-blue group-hover:underline shrink-0 font-bold">
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
