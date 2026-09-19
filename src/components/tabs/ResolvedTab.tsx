import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode,
  Braces,
  GitCompare,
  Info,
} from 'lucide-react';
import { ValidationResult } from '../../types/yaml';

interface ResolvedTabProps {
  validationResult: ValidationResult;
  currentYaml: string;
}

export const ResolvedTab: React.FC<ResolvedTabProps> = ({ validationResult, currentYaml }) => {
  const [viewMode, setViewMode] = useState<'yaml' | 'json' | 'diff'>('yaml');
  const [copied, setCopied] = useState(false);

  const { resolvedYaml, jsonString, isValid } = validationResult;
  const content = viewMode === 'json' ? jsonString : resolvedYaml;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = viewMode === 'json' ? 'resolved-config.json' : 'resolved-config.yaml';
    const mimeType = viewMode === 'json' ? 'application/json' : 'text/yaml';
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
      <div className="bg-white dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h3 className="text-base font-bold text-govuk-black dark:text-zinc-100 flex items-center gap-2">
            Dereferenced &amp; Evaluated Output
            <span className="govuk-tag govuk-tag--green text-[10px]">
              Anchors Expanded
            </span>
          </h3>
          <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mt-0.5">
            All anchors (&amp;), aliases (*), and merge keys (&lt;&lt;) are fully evaluated into explicit values.
          </p>
        </div>

        {/* View mode toggle & actions */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="flex items-center bg-govuk-grey dark:bg-zinc-900 border border-govuk-grey-border dark:border-zinc-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('yaml')}
              className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer ${
                viewMode === 'yaml'
                  ? 'bg-govuk-black text-white font-bold'
                  : 'text-govuk-black dark:text-zinc-300 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>YAML</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('json')}
              className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer ${
                viewMode === 'json'
                  ? 'bg-govuk-black text-white font-bold'
                  : 'text-govuk-black dark:text-zinc-300 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              <Braces className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('diff')}
              className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer ${
                viewMode === 'diff'
                  ? 'bg-govuk-black text-white font-bold'
                  : 'text-govuk-black dark:text-zinc-300 hover:bg-[#e5e5e4] dark:hover:bg-zinc-800 font-medium'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Diff</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="govuk-button--secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-govuk-green" />
                <span className="font-bold text-govuk-green">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="govuk-button text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Viewer: Diff mode vs. Standard view */}
      {viewMode === 'diff' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Left pane: Raw source YAML */}
          <div className="flex flex-col bg-govuk-grey dark:bg-black border border-govuk-grey-border dark:border-zinc-800 overflow-hidden">
            <div className="h-8 px-3 border-b border-govuk-grey-border dark:border-zinc-800 bg-[#e5e5e4] dark:bg-zinc-900 flex items-center justify-between text-[11px] font-mono text-govuk-black dark:text-zinc-400 shrink-0">
              <span className="font-bold flex items-center gap-1.5">
                <span className="govuk-tag govuk-tag--blue text-[10px] py-0 px-1">Raw</span>
                <span>Source YAML (&amp; Anchors &amp; &lt;&lt; Merges)</span>
              </span>
              <span>{currentYaml.split('\n').length} lines</span>
            </div>
            <pre className="flex-1 min-h-0 p-3 overflow-auto text-xs font-mono text-govuk-black dark:text-zinc-300 leading-relaxed select-text">
              {currentYaml}
            </pre>
          </div>

          {/* Right pane: Fully dereferenced evaluated output */}
          <div className="flex flex-col bg-govuk-grey dark:bg-black border border-govuk-grey-border dark:border-zinc-800 overflow-hidden">
            <div className="h-8 px-3 border-b border-govuk-grey-border dark:border-zinc-800 bg-[#e5e5e4] dark:bg-zinc-900 flex items-center justify-between text-[11px] font-mono text-govuk-black dark:text-zinc-400 shrink-0">
              <span className="font-bold flex items-center gap-1.5">
                <span className="govuk-tag govuk-tag--green text-[10px] py-0 px-1">Resolved</span>
                <span>Evaluated Output (Pure Objects)</span>
              </span>
              <span>{resolvedYaml.split('\n').length} lines</span>
            </div>
            <pre className="flex-1 min-h-0 p-3 overflow-auto text-xs font-mono text-govuk-black dark:text-zinc-300 leading-relaxed select-text">
              {resolvedYaml}
            </pre>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-govuk-grey dark:bg-black border border-govuk-grey-border dark:border-zinc-800 flex flex-col">
          <div className="h-8 px-3 border-b border-govuk-grey-border dark:border-zinc-800 bg-[#e5e5e4] dark:bg-zinc-900 flex items-center justify-between text-[11px] font-mono text-govuk-black dark:text-zinc-400">
            <span className="font-bold">{viewMode === 'yaml' ? 'Resolved YAML (Pure Objects)' : 'Resolved JSON'}</span>
            <span>{content.split('\n').length} lines</span>
          </div>
          <pre className="flex-1 min-h-0 p-3 overflow-auto text-xs font-mono text-govuk-black dark:text-zinc-300 leading-relaxed select-text">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
};
