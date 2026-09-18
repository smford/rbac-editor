import React, { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUT_GROUPS: { group: string; items: ShortcutItem[] }[] = [
  {
    group: 'Document & Editor',
    items: [
      { keys: ['Ctrl', 'S'], description: 'Export / Download YAML file' },
      { keys: ['Ctrl', 'Shift', 'F'], description: 'Auto-format YAML document' },
      { keys: ['Ctrl', 'Shift', 'U'], description: 'Sort users alphabetically (A-Z)' },
      { keys: ['Ctrl', 'Shift', 'P'], description: 'Sort projects in preset anchors' },
    ],
  },
  {
    group: 'Tabs & Navigation',
    items: [
      { keys: ['Alt', '1'], description: 'Switch to Validation tab' },
      { keys: ['Alt', '2'], description: 'Switch to Anchors tab' },
      { keys: ['Alt', '3'], description: 'Switch to Users & Access directory' },
      { keys: ['Alt', '4'], description: 'Switch to Resolved YAML view' },
      { keys: ['Alt', 'U'], description: 'Open Add User wizard' },
      { keys: ['Alt', 'P'], description: 'Open Add Project wizard' },
    ],
  },
  {
    group: 'General',
    items: [
      { keys: ['?'], description: 'Toggle this keyboard shortcuts dialog' },
      { keys: ['Esc'], description: 'Close active dialog or wizard' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 border-4 border-govuk-black dark:border-zinc-700 max-w-2xl w-full p-6 shadow-2xl space-y-5 select-none relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-govuk-black dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-6 h-6 text-govuk-blue dark:text-sky-400" />
            <div>
              <h2 id="shortcuts-title" className="text-lg font-bold text-govuk-black dark:text-zinc-100 leading-tight">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-govuk-text-secondary dark:text-zinc-400 mt-0.5">
                Quickly navigate tabs, trigger actions, and manage YAML configurations.
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1 text-govuk-black dark:text-zinc-300 hover:bg-govuk-grey dark:hover:bg-zinc-800 cursor-pointer focus:outline-none focus:bg-govuk-yellow focus:text-govuk-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.group} className="space-y-2">
              <h3 className="text-xs font-bold text-govuk-black dark:text-zinc-200 uppercase tracking-wider">
                {group.group}
              </h3>
              <div className="border border-govuk-grey-border dark:border-zinc-800 divide-y divide-govuk-grey-border dark:divide-zinc-800">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 text-xs bg-white dark:bg-zinc-900 hover:bg-govuk-grey/50 dark:hover:bg-zinc-800/50"
                  >
                    <span className="text-govuk-black dark:text-zinc-200">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="font-mono text-xs px-2 py-0.5 bg-govuk-grey dark:bg-zinc-800 border-2 border-govuk-grey-border dark:border-zinc-700 text-govuk-black dark:text-zinc-100 font-bold shadow-xs">
                            {k}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span className="text-govuk-text-secondary text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-govuk-grey-border dark:border-zinc-800 pt-3 flex items-center justify-between">
          <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400">
            Press <kbd className="font-mono px-1 py-0.2 border text-[10px] bg-govuk-grey dark:bg-zinc-800">Esc</kbd> anytime to dismiss
          </span>
          <button
            type="button"
            onClick={onClose}
            className="govuk-button text-xs font-bold py-1.5 px-4 cursor-pointer mb-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
