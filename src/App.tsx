import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import YAML from 'yaml';
import { Header } from './components/Header';
import { LeftPanel, LeftPanelHandle } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { validateYaml, sortUsersInYaml, sortProjectsInPresetYaml } from './utils/yamlValidator';
import { USERS_YAML_DEFAULT } from './data/defaultUsersYaml';

export const App: React.FC = () => {
  // Pre-load with users.yaml as requested
  const [yamlContent, setYamlContent] = useState<string>(() => {
    return USERS_YAML_DEFAULT || '';
  });

  // Default to GDS light mode
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const leftPanelRef = useRef<LeftPanelHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync dark mode class with <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // In-browser validation engine execution
  const validationResult = useMemo(() => {
    return validateYaml(yamlContent);
  }, [yamlContent]);

  // Jump to specific line in editor
  const handleJumpToLine = useCallback((line: number, column?: number) => {
    leftPanelRef.current?.jumpToLine(line, column);
  }, []);

  // Upload file handler
  const handleUploadFile = useCallback((content: string) => {
    setYamlContent(content);
  }, []);

  // Format / Prettify YAML
  const handleFormatYaml = useCallback(() => {
    try {
      const doc = YAML.parseDocument(yamlContent, {
        keepSourceTokens: true,
        merge: true,
      });

      if (doc.errors.length === 0) {
        setYamlContent(doc.toString());
      } else {
        alert(`Cannot auto-format YAML with syntax errors:\n${doc.errors[0].message}`);
      }
    } catch (err: any) {
      alert(`Format failed: ${err.message}`);
    }
  }, [yamlContent]);

  // Copy YAML
  const handleCopyYaml = useCallback(() => {
    navigator.clipboard.writeText(yamlContent);
  }, [yamlContent]);

  // Download YAML file
  const handleDownloadYaml = useCallback(() => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [yamlContent]);

  // Sort users in YAML alphabetically
  const handleSortUsers = useCallback(() => {
    const sorted = sortUsersInYaml(yamlContent);
    if (sorted !== yamlContent) {
      setYamlContent(sorted);
    }
  }, [yamlContent]);

  // Sort projects in preset anchors (all_projects_admin & all_projects_non_prod_admin) alphabetically
  const handleSortProjects = useCallback((targetAnchor?: string) => {
    const res = sortProjectsInPresetYaml(
      yamlContent,
      targetAnchor ? [targetAnchor] : undefined
    );
    if (res.changed) {
      setYamlContent(res.updatedYaml);
    }
  }, [yamlContent]);

  // Resizable split divider drag handlers
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((e.clientX - rect.left) / rect.width) * 100;
      if (newPercent >= 25 && newPercent <= 75) {
        setLeftWidthPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className={`h-screen w-screen flex flex-col ${darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-govuk-grey text-govuk-black'}`}>
      {/* Top Header */}
      <Header
        validationResult={validationResult}
        onUploadFile={handleUploadFile}
        onFormatYaml={handleFormatYaml}
        onCopyYaml={handleCopyYaml}
        onDownloadYaml={handleDownloadYaml}
        onSortUsers={handleSortUsers}
        onSortProjects={handleSortProjects}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      {/* Main Two-Panel Split View */}
      <main
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-col md:flex-row relative overflow-hidden bg-white dark:bg-zinc-950"
      >
        {/* Left Panel: Source YAML Editor */}
        <section
          style={{ width: `${leftWidthPercent}%` }}
          aria-label="YAML Editor Panel"
          className="h-full flex flex-col min-w-[280px]"
        >
          <LeftPanel
            ref={leftPanelRef}
            value={yamlContent}
            onChange={setYamlContent}
            validationResult={validationResult}
            darkMode={darkMode}
            onSortUsers={handleSortUsers}
            onSortProjects={handleSortProjects}
          />
        </section>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className={`hidden md:flex w-1.5 bg-govuk-grey-border dark:bg-zinc-800 hover:bg-govuk-blue dark:hover:bg-govuk-blue cursor-col-resize transition-colors items-center justify-center shrink-0 z-10 ${
            isResizing ? 'bg-govuk-blue' : ''
          }`}
          title="Drag to resize panels"
        />

        {/* Right Panel: Validation, Anchors, Add User, User Directory */}
        <section
          style={{ width: `${100 - leftWidthPercent}%` }}
          aria-label="Validation & Tools Panel"
          className="h-full flex flex-col min-w-[320px]"
        >
          <RightPanel
            validationResult={validationResult}
            currentYaml={yamlContent}
            onUpdateYaml={setYamlContent}
            onJumpToLine={handleJumpToLine}
            onSortUsers={handleSortUsers}
            onSortProjects={handleSortProjects}
          />
        </section>
      </main>
    </div>
  );
};
