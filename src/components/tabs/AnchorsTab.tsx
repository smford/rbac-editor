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
} from 'lucide-react';
import { ValidationResult } from '../../types/yaml';

interface AnchorsTabProps {
  validationResult: ValidationResult;
  onJumpToLine: (line: number, column?: number) => void;
}

export const AnchorsTab: React.FC<AnchorsTabProps> = ({
  validationResult,
  onJumpToLine,
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
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                YAML Anchor &amp; Alias Architecture
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {stats.anchorCount} defined anchors • {stats.aliasCount} references • {stats.mergeKeyCount} merge keys
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showGuide ? 'Hide Guide' : 'YAML Anchors 101'}</span>
          </button>
        </div>

        {/* Quick Guide Accordion */}
        {showGuide && (
          <div className="bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-700 dark:text-zinc-300 space-y-2 leading-relaxed">
            <div className="font-semibold text-indigo-600 dark:text-indigo-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Quick YAML Cheat Sheet:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] pt-1">
              <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">&amp;anchor_name</span>
                <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">Defines a reusable node anchor. Does not alter document structure on its own.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">*anchor_name</span>
                <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">Alias referencing an anchor. Evaluates directly to the anchored node.</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">&lt;&lt;: *anchor_name</span>
                <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">Merge key. Injects all mapping pairs from target anchor into current dictionary.</p>
              </div>
            </div>
          </div>
        )}

        {/* Anchor Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              Total Anchors
            </span>
            <div className="text-sm font-semibold mt-0.5 text-indigo-600 dark:text-indigo-400">
              {stats.anchorCount}
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              Total Aliases
            </span>
            <div className="text-sm font-semibold mt-0.5 text-purple-600 dark:text-purple-400">
              {stats.aliasCount}
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              Merge Keys (&lt;&lt;)
            </span>
            <div className="text-sm font-semibold mt-0.5 text-cyan-600 dark:text-cyan-400">
              {stats.mergeKeyCount}
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              Dead / Unused
            </span>
            <div className="text-sm font-semibold mt-0.5">
              {stats.unusedAnchorCount === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">0</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">{stats.unusedAnchorCount}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter anchors by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filter === 'all' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            All ({anchors.length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filter === 'used' ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 font-medium shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Active ({anchors.filter(a => a.isUsed).length})
          </button>
          <button
            onClick={() => setFilter('unused')}
            className={`px-2 py-1 rounded-md transition-colors ${
              filter === 'unused' ? 'bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 font-medium shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Unused ({anchors.filter(a => !a.isUsed).length})
          </button>
          {mergeKeys.length > 0 && (
            <button
              onClick={() => setFilter('merges')}
              className={`px-2 py-1 rounded-md transition-colors ${
                filter === 'merges' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 font-medium shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Merges ({mergeKeys.length})
            </button>
          )}
        </div>
      </div>

      {/* Merges View Mode */}
      {filter === 'merges' ? (
        <div className="space-y-2">
          {mergeKeys.map((mk, idx) => (
            <div
              key={idx}
              className="p-3 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between gap-2 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">&lt;&lt;:</span>
                  <span className="font-mono text-xs text-purple-600 dark:text-purple-300">
                    {mk.targetAnchors.map(t => `*${t}`).join(', ')}
                  </span>
                </div>
                {mk.contextSnippet && (
                  <p className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-md">
                    {mk.contextSnippet}
                  </p>
                )}
              </div>

              <button
                onClick={() => onJumpToLine(mk.line, mk.column)}
                className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-zinc-100 hover:bg-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-colors"
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
            <div className="py-12 text-center text-zinc-500 bg-white/60 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-300">No anchors match your filter</p>
              <p className="text-xs text-zinc-500 mt-1">
                Define reusable blocks with <code className="text-indigo-600 dark:text-indigo-400">&amp;anchor_name</code> in the editor.
              </p>
            </div>
          ) : (
            filteredAnchors.map(anchor => {
              const isExpanded = expandedAnchors[anchor.name] ?? false;

              return (
                <div
                  key={anchor.name}
                  className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-lg overflow-hidden transition-all shadow-sm"
                >
                  {/* Card Header */}
                  <div className="p-3 flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <span>&amp;</span>
                          <span>{anchor.name}</span>
                        </span>

                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {anchor.type}
                        </span>

                        {anchor.isUsed ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {anchor.references.length} {anchor.references.length === 1 ? 'ref' : 'refs'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Unused
                          </span>
                        )}
                      </div>

                      {/* Snippet preview */}
                      <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 line-clamp-2 max-w-xl">
                        {anchor.valuePreview}
                      </p>
                    </div>

                    {/* Actions on right */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyAlias(anchor.name)}
                        title="Copy alias *name to clipboard"
                        className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        {copiedAnchor === anchor.name ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => onJumpToLine(anchor.line, anchor.column)}
                        title={`Jump to definition at line ${anchor.line}`}
                        className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-zinc-100 hover:bg-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-colors"
                      >
                        <span>Line {anchor.line}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>

                      {anchor.references.length > 0 && (
                        <button
                          onClick={() => toggleAnchorExpand(anchor.name)}
                          className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
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
                    <div className="border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-black/30 p-3 space-y-1.5">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
                        Alias References ({anchor.references.length}):
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {anchor.references.map((ref, rIdx) => (
                          <div
                            key={rIdx}
                            onClick={() => onJumpToLine(ref.line, ref.column)}
                            className="flex items-center justify-between text-xs font-mono p-1.5 rounded bg-white dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-transparent text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors group shadow-2xs"
                          >
                            <span className="truncate mr-2 text-[11px] text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                              {ref.contextSnippet || `Line ${ref.line}`}
                            </span>
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 group-hover:underline shrink-0 font-semibold">
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
