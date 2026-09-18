import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode,
  Braces,
  Info,
} from 'lucide-react';
import { ValidationResult } from '../../types/yaml';

interface ResolvedTabProps {
  validationResult: ValidationResult;
}

export const ResolvedTab: React.FC<ResolvedTabProps> = ({ validationResult }) => {
  const [viewMode, setViewMode] = useState<'yaml' | 'json'>('yaml');
  const [copied, setCopied] = useState(false);

  const { resolvedYaml, jsonString, isValid } = validationResult;
  const content = viewMode === 'yaml' ? resolvedYaml : jsonString;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = viewMode === 'yaml' ? 'resolved-config.yaml' : 'resolved-config.json';
    const mimeType = viewMode === 'yaml' ? 'text/yaml' : 'application/json';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isValid) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 dark:text-zinc-400">
        <Info className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-3" />
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">Cannot Generate Resolved Output</h4>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Fix the syntax or dangling alias errors in the Diagnostics tab first to inspect fully expanded output.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-3">
      {/* Top Banner */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Dereferenced &amp; Evaluated Output
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              Anchors Expanded
            </span>
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            All anchors, aliases, and merge keys (&lt;&lt;) are fully expanded into explicit values.
          </p>
        </div>

        {/* View mode toggle & actions */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('yaml')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'yaml'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>YAML</span>
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'json'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Braces className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 min-h-0 bg-zinc-100 dark:bg-black/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="h-8 px-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-200/70 dark:bg-zinc-900/40 flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
          <span>{viewMode === 'yaml' ? 'Resolved YAML (Pure Objects)' : 'Resolved JSON'}</span>
          <span>{content.split('\n').length} lines</span>
        </div>
        <pre className="flex-1 min-h-0 p-3 overflow-auto text-xs font-mono text-zinc-800 dark:text-zinc-300 leading-relaxed select-text">
          {content}
        </pre>
      </div>
    </div>
  );
};
