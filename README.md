# RBAC Editor • In-Browser YAML Validator & Access Manager

> 🚀 **Live Interactive Demo**: **[https://stephenford.org/rbac-editor/](https://stephenford.org/rbac-editor/)**  
> 🔒 **100% Client-Side Privacy**: Zero server transmission. All parsing, anchor evaluation, secret scanning, and validation happen entirely inside your browser.

[![CI](https://github.com/smford/rbac-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/smford/rbac-editor/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/smford/rbac-editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/smford/rbac-editor/actions/workflows/deploy.yml)

---

## Visual Overview

### 1. Multi-Document YAML Streams, Inline Linter & Shift-Left Secret Scanner
![Multi-Document Stream, Inline Linter & Secret Scanner](docs/screenshots/01-multi-doc-stream-security.png)
*Real-time multi-document stream parsing (`---`), inline CodeMirror lint squiggles and gutter markers, stream counters, and heuristic plaintext credential detection with actionable remediation.*

### 2. Deep YAML Anchor & Alias Architecture
![YAML Anchor & Alias Architecture](docs/screenshots/02-anchor-catalog-dependencies.png)
*Comprehensive catalog of defined anchors (`&name`), node type inspection, reverse alias cross-references (`*name`), reference counts, and single-click jump navigation directly into the editor source.*

### 3. Side-by-Side Visual Diff (Raw vs. Evaluated)
![Side-by-Side Visual Diff View](docs/screenshots/03-visual-diff-comparison.png)
*Real-time visual comparison of source YAML (containing active `&` anchors and `<<` merge keys) alongside the fully dereferenced, pure evaluated output.*

### 4. Dark Mode & RBAC Directory Management
![Dark Mode & RBAC Directory](docs/screenshots/04-dark-mode-rbac-directory.png)
*Accessible high-contrast GDS Dark Mode theme with real-time RBAC User Directory, Super Admin and Power Admin classification metrics, and project hierarchy breakdown.*

### 5. "Add User" Assistant & Permission Preset Generator
![Add User Assistant](docs/screenshots/05-add-user-wizard.png)
*Interactive user onboarding assistant with live input validation, preset anchor reusability patterns (`*all_projects_admin`, `*all_projects_non_prod_admin`), permission cloning, and live YAML preview.*

### 6. "Add Project & Environment" Wizard
![Add Project & Environment Wizard](docs/screenshots/06-add-project-wizard.png)
*Structured wizard to register new microservices or environments, bind reusable role templates, auto-register in global presets, and assign user access with batch selection.*

### 7. Keyboard Shortcuts & Quick Navigation Modal
![Keyboard Shortcuts Modal](docs/screenshots/07-keyboard-shortcuts-modal.png)
*Power-user keyboard shortcut modal (accessible via `Ctrl+/` or footer shortcut button) for instant tab switching, auto-formatting, sorting, and file operations.*

---

## Key Features

### 1. 100% Client-Side In-Browser Privacy & Air-Gapped Readiness
- **Zero Server Latency & Complete Confidentiality**: All parsing, AST traversal, anchor dereferencing, security scanning, and schema validation occur strictly in local browser memory.
- **Enterprise Air-Gapped Safe**: Sensitive production configurations, IAM roles, and secret values never touch an external server or backend API.
- **Offline Progressive Web Application (PWA)**: Installable as a standalone desktop application with a lightweight Service Worker (`public/sw.js`) caching the application shell, assets, and Google Fonts for full offline/air-gapped operation.

### 2. In-Editor Inline Linter & Gutter Diagnostics (`@codemirror/lint`)
- **Native Editor Integration**: Integrated `@codemirror/lint` extension delivering real-time linting and diagnostic feedback.
- **Visual Diagnostics**: Inline squiggly underlines (red for syntax and reference errors, amber for warnings and security notices) and clickable gutter markers.
- **Context-Rich Tooltips**: Detailed failure root causes and actionable remediation suggestions directly in hover tooltips.
- **Dynamic Line Wrapping**: One-click "Wrap lines" toggle dynamically reconfigures `EditorView.lineWrapping`.

### 3. Multi-Document YAML Stream Support (`---`)
- **Stream Parser**: Upgraded core parsing engine powered by `YAML.parseAllDocuments()` to parse and validate multi-document YAML streams (such as Kubernetes manifests and Helm templates separated by `---`).
- **Cross-Document Line/Column Accuracy**: Line numbers, column offsets, syntax diagnostics, and anchor scopes are accurately maintained across all document boundaries.
- **Multi-Document Metrics & Formatting**: Displays real-time "X Docs" counters in the header, editor sub-header, and diagnostic metrics cards when streams contain multiple documents. The Prettify/Format action automatically indents and formats each document in the stream separated by `\n---\n`.

### 4. Shift-Left Security & Plaintext Secret Scanner
- **Heuristic Credential Detection**: Proactively alerts engineers to unencrypted plaintext secrets before committing to version control:
  - Detects sensitive key patterns (`api_key`, `auth_token`, `access_token`, `client_secret`, `password`, `passwd`, `db_password`, `private_key`, `jwt_secret`) with non-placeholder values (length ≥ 6).
  - Identifies high-entropy signatures and formats such as PEM private key blocks (`-----BEGIN PRIVATE KEY-----`), AWS Access Key IDs (`AKIA...`), and GitHub Personal Access Tokens (`ghp_...`).
  - Safely ignores variable interpolation and placeholder tokens (e.g. `${ENV_VAR}`, `$VAR`, `CHANGE_ME`, `<REDACTED>`).
- **Dedicated Security Filtering & Badges**: Dedicated amber/shield badges and a "Security" filter tab in the diagnostics panel for focused shift-left remediation.

### 5. LocalStorage Session Persistence & Auto-Save
- **Debounced Auto-Save**: Changes are automatically persisted to browser `localStorage` under key `yaml_clean_session_v1` with a 400ms debounce.
- **Session Restoration**: Automatically restores your in-progress workspace across browser reloads, tabs, and system restarts.
- **One-Click Reset**: Dedicated "Reset" action (`RotateCcw` icon) in the header to confirm, restore the default template, and clear the cached session.

### 6. Side-by-Side Visual Diff View (Raw vs. Resolved)
- **Three Inspection Modes**: Toggle seamlessly between pure **YAML**, formatted **JSON**, and side-by-side **Diff**.
- **Interactive Diff Grid**:
  - **Left Pane (Raw Source)**: Inspect raw YAML containing active `&` anchors and `<<` merge keys alongside real-time line counts.
  - **Right Pane (Evaluated)**: Inspect fully dereferenced, pure object output with expanded aliases and line counts.

### 7. Advanced Anchor (`&`), Alias (`*`), and Merge Key (`<<`) Management
- **Anchor Inventory**: Catalogs all defined anchors (`&name`), their node types (mapping, sequence, scalar), definition line numbers, and live content previews.
- **Usage Metrics & Reverse Cross-References**: Tracks every alias reference (`*name`) across the file. Clicking any reference jumps directly to that line in the editor.
- **Merge Key (`<<`) Support**: Full support for YAML merge keys (`<<: *anchor` and `<<: [*a, *b]`), displaying inherited mapping structures.
- **Dead Code & Dangling Reference Detection**:
  - Highlights **Unused Anchors** (orphaned bookmarks that bloat files).
  - Flags **Dangling Aliases** (aliases referencing missing anchors) as critical errors.

### 8. Specialized `users.yaml` RBAC Engine & "Add User" Assistant
- Designed specifically to handle team access control manifests:
  - **Human-in-the-Loop "Add User" Wizard**: Real-time username validation and uniqueness checking with one-click insertion.
  - **Access Presets**: Super Admin (`*all_projects_admin`), Non-Prod Admin (`*all_projects_non_prod_admin`), or Clone permissions from teammates.
  - **RBAC User Directory & Hierarchy**: Searchable directory of users, projects, and permissions with hierarchical breakdowns.

---

## Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Framework**: [React 18](https://react.dev/) + [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + GOV.UK Design System principles
- **Editor**: [CodeMirror 6](https://codemirror.net/) (`@codemirror/lang-yaml`, `@codemirror/lint`, `@codemirror/view`, `@uiw/react-codemirror`)
- **YAML Engine**: [`yaml`](https://eemeli.org/yaml/) (YAML 1.2 & 1.1 merge keys with CST/AST multi-document stream traversal)
- **PWA / Offline**: Service Worker cache strategy (`public/sw.js`) + Web App Manifest (`public/manifest.json`)
- **Testing**: [Vitest](https://vitest.dev/)
- **CI/CD**: GitHub Actions (Lint, Test, Build, and automated GitHub Pages deployment)

---

## Local Development

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Quick Start
```bash
# 1. Clone the repository
git clone git@github.com:smford/rbac-editor.git
cd rbac-editor

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Tests & Quality Checks
```bash
# Run unit test suite (Vitest)
npm run test

# Typecheck and lint (TypeScript)
npm run lint

# Build production bundle (Vite)
npm run build

# Preview production build locally
npm run preview
```

---

## License

MIT License.
