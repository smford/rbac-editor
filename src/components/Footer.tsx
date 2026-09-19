import React from 'react';
import { ShieldCheck, Keyboard } from 'lucide-react';
import { ValidationStats } from '../types/yaml';

interface FooterProps {
  stats: ValidationStats;
  onOpenShortcuts: () => void;
  isUsersConfig: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  stats,
  onOpenShortcuts,
  isUsersConfig,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <footer
      className="bg-govuk-grey dark:bg-zinc-900 border-t border-govuk-grey-border dark:border-zinc-800 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-govuk-text-secondary dark:text-zinc-400 select-none shrink-0 gap-2 z-10"
      role="contentinfo"
      aria-label="Service Information and License"
    >
      {/* Left: OGL Licensing & Privacy Notice */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <a
          href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
          target="_blank"
          rel="noreferrer"
          className="govuk-link inline-flex items-center gap-1.5 text-[11px] text-govuk-black dark:text-zinc-300"
          title="View the Open Government Licence v3.0"
        >
          {/* OGL Crown Logo */}
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-7 h-3.5 fill-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 483.2 195.7"
          >
            <path d="M421.5 142.8V.1l-50.7 32.3v161.1h112.4v-50.7zm-122.3-9.6A47.12 47.12 0 0 1 221 97.8c0-26 21.1-47.1 47.1-47.1 16.7 0 31.4 8.7 39.7 21.8l42.7-27.2A97.63 97.63 0 0 0 268.1 0c-54.1 0-97.9 43.8-97.9 97.9 0 54.1 43.8 97.8 97.9 97.8 28.7 0 54.6-12.4 72.8-32.2l-42.3-26.9c-7.9 10-19.8 16.6-30.8 16.6zM80.6 133.2a47.12 47.12 0 0 1-47.1-47.1c0-26 21.1-47.1 47.1-47.1 16.7 0 31.4 8.7 39.7 21.8l42.7-27.2A97.63 97.63 0 0 0 80.6 0C26.5 0 0 43.8 0 97.9s43.8 97.8 97.9 97.8c28.7 0 54.6-12.4 72.8-32.2l-42.3-26.9c-7.9 10-19.8 16.6-30.8 16.6z" />
          </svg>
          <span>Open Government Licence v3.0</span>
        </a>

        <span className="text-govuk-grey-border dark:text-zinc-700 hidden sm:inline">•</span>

        <span className="inline-flex items-center gap-1 text-[11px] text-[#005a30] dark:text-emerald-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-govuk-green" />
          <span>Client-side only • No server transmission</span>
        </span>
      </div>

      {/* Right: Quick Stats, Shortcuts, and Crown Copyright */}
      <div className="flex items-center gap-2.5 flex-wrap ml-auto">
        <span className="hidden md:inline font-mono text-[11px] text-govuk-text-secondary dark:text-zinc-400">
          {stats.lines} lines · {formatSize(stats.bytes)}
          {stats.documentCount > 1 ? ` · ${stats.documentCount} docs` : ''}
          {isUsersConfig ? ` · ${stats.usersCount} users` : ` · ${stats.anchorCount} anchors`}
        </span>

        <span className="text-govuk-grey-border dark:text-zinc-700 hidden md:inline">•</span>

        {/* Keyboard Shortcuts trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="View Keyboard Shortcuts (?)"
          className="govuk-link inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer text-govuk-black dark:text-zinc-200"
        >
          <Keyboard className="w-3.5 h-3.5 shrink-0 text-govuk-blue dark:text-sky-400" />
          <span>Shortcuts</span>
          <kbd className="font-mono text-[10px] px-1 py-0.2 bg-white dark:bg-zinc-800 border border-govuk-grey-border dark:border-zinc-700 rounded-none shadow-xs font-bold">
            ?
          </kbd>
        </button>

        <span className="text-govuk-grey-border dark:text-zinc-700">•</span>

        <span className="text-[11px] text-govuk-text-secondary dark:text-zinc-400">
          &copy; Crown copyright
        </span>
      </div>
    </footer>
  );
};
