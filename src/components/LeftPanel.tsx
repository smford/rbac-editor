import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { Trash2, Clipboard, WrapText, ArrowDownToLine, ArrowDownAZ } from 'lucide-react';
import { ValidationResult } from '../types/yaml';

export interface LeftPanelHandle {
  jumpToLine: (line: number, column?: number) => void;
}

interface LeftPanelProps {
  value: string;
  onChange: (val: string) => void;
  validationResult: ValidationResult;
  darkMode: boolean;
  onSortUsers?: () => void;
}

export const LeftPanel = forwardRef<LeftPanelHandle, LeftPanelProps>(({
  value,
  onChange,
  validationResult,
  darkMode,
  onSortUsers,
}, ref) => {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [wrapLines, setWrapLines] = useState(false);
  const [jumpFeedback, setJumpFeedback] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Expose jumpToLine method to parent component
  useImperativeHandle(ref, () => ({
    jumpToLine: (line: number, column: number = 1) => {
      const view = cmRef.current?.view;
      if (!view) return;

      try {
        const doc = view.state.doc;
        const targetLineNum = Math.max(1, Math.min(line, doc.lines));
        const lineInfo = doc.line(targetLineNum);
        const colPos = Math.min(lineInfo.from + (column - 1), lineInfo.to);

        view.dispatch({
          selection: { anchor: colPos, head: colPos },
          scrollIntoView: true,
        });
        view.focus();

        setJumpFeedback(`Jumped to line ${targetLineNum}`);
        setTimeout(() => setJumpFeedback(null), 2500);
      } catch (err) {
        console.warn('Failed to jump to line:', err);
      }
    },
  }));

  const handleClear = () => {
    if (value && window.confirm('Clear the current YAML content?')) {
      onChange('');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch {
      alert('Clipboard access denied. Please use Cmd+V / Ctrl+V to paste directly into the editor.');
    }
  };

  // Drag and drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        if (typeof text === 'string') {
          onChange(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`h-full flex flex-col relative transition-colors ${
        isDragOver ? 'ring-2 ring-indigo-500 bg-indigo-950/20' : ''
      }`}
    >
      {/* Editor Sub-Header */}
      <div className="h-9 px-3 border-b border-govuk-grey-border dark:border-zinc-800 bg-govuk-grey dark:bg-zinc-900 flex items-center justify-between text-xs text-govuk-black dark:text-zinc-300 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-govuk-black dark:text-zinc-100 uppercase tracking-wider text-[11px]">
            YAML Source Editor
          </span>
          <span className="text-govuk-grey-border dark:text-zinc-600">|</span>
          <span className="font-mono text-[11px]">{validationResult.stats.lines} lines</span>
          <span className="text-govuk-grey-border dark:text-zinc-600">•</span>
          <span className="font-mono text-[11px]">{formatSize(validationResult.stats.bytes)}</span>

          {jumpFeedback && (
            <span className="govuk-tag govuk-tag--green flex items-center gap-1 text-[11px]">
              <ArrowDownToLine className="w-3 h-3" />
              {jumpFeedback}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {validationResult.isUsersConfig && onSortUsers && (
            <button
              onClick={() => {
                onSortUsers();
                setJumpFeedback('Sorted users A-Z');
                setTimeout(() => setJumpFeedback(null), 2500);
              }}
              title="Sort all users alphabetically (A-Z)"
              className="govuk-button--secondary text-xs px-2 py-0.5 flex items-center gap-1 cursor-pointer"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              <span className="text-[11px]">Sort Users</span>
            </button>
          )}

          <button
            onClick={() => setWrapLines(!wrapLines)}
            title={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}
            className={`p-1 border text-xs cursor-pointer rounded-none transition-colors ${
              wrapLines
                ? 'bg-govuk-blue text-white border-govuk-blue-dark'
                : 'bg-white dark:bg-zinc-800 border-govuk-grey-border dark:border-zinc-700 text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey dark:hover:bg-zinc-700'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handlePaste}
            title="Paste from clipboard"
            className="govuk-button--secondary text-xs px-1.5 py-0.5 flex items-center gap-1 cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span className="text-[11px]">Paste</span>
          </button>

          <button
            onClick={handleClear}
            title="Clear editor"
            className="govuk-button--secondary text-xs px-1.5 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-govuk-red-tint! hover:text-govuk-red!"
          >
            <Trash2 className="w-3.5 h-3.5 text-govuk-red" />
            <span className="text-[11px]">Clear</span>
          </button>
        </div>
      </div>

      {/* Drag & drop overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-govuk-blue/90 flex flex-col items-center justify-center pointer-events-none border-4 border-dashed border-white">
          <p className="text-lg font-bold text-white">Drop YAML file here to inspect</p>
          <p className="text-xs text-govuk-blue-tint mt-1">100% Client-Side validation and anchor analysis</p>
        </div>
      )}

      {/* CodeMirror Editor */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white dark:bg-[#282c34] text-zinc-900 dark:text-zinc-100">
        <CodeMirror
          ref={cmRef}
          value={value}
          height="100%"
          theme={darkMode ? oneDark : 'light'}
          extensions={[yaml()]}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
});

LeftPanel.displayName = 'LeftPanel';
