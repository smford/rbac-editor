# RBAC Editor • In-Browser YAML Validator & Access Manager

[![CI](https://github.com/smford/rbac-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/smford/rbac-editor/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/smford/rbac-editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/smford/rbac-editor/actions/workflows/deploy.yml)

---

## Key Features

### 1. 100% Client-Side In-Browser Processing
- **Zero Server Latency & 100% Privacy**: All parsing, AST traversal, anchor dereferencing, and schema validation occur locally in your browser using Web APIs and JavaScript memory.
- **Enterprise Safe**: Sensitive production secrets, IAM roles, and internal infrastructure configs never leave your machine.

### 3. Advanced Anchor (`&`), Alias (`*`), and Merge Key (`<<`) Management
- **Anchor Inventory**: Catalogs all defined anchors (`&name`), their node types (mapping, sequence, scalar), definition line numbers, and live content previews.
- **Usage Metrics & Reverse Cross-References**: Tracks every alias reference (`*name`) across the file. Clicking any reference jumps directly to that line in the editor.
- **Merge Key (`<<`) Support**: Full support for YAML merge keys (`<<: *anchor` and `<<: [*a, *b]`), displaying inherited mapping structures.
- **Dead Code & Dangling Reference Detection**:
  - Highlights **Unused Anchors** (orphaned bookmarks that bloat files).
  - Flags **Dangling Aliases** (aliases referencing missing anchors) as critical errors.

### 4. Specialized `users.yaml` RBAC Engine & "Add User" Assistant
- Designed specifically to handle team access control manifests (such as multi-project, multi-environment RBAC manifests with anchors and aliases):
  - **Human-in-the-Loop "Add User" Wizard**:
    - Real-time username validation and uniqueness checking (prevents duplicate users).
    - Access presets: Super Admin (`*all_projects_admin`), Non-Prod Admin (`*all_projects_non_prod_admin`), Clone permissions from an existing teammate, or Custom Project Builder.
    - One-click insertion into the editor under `users:` preserving comments and formatting.
  - **RBAC User Directory**: Searchable directory of all users, their assigned projects, and effective permissions.

---

## Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Framework**: [React 18](https://react.dev/) + [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Modern dark/light developer theme)
- **Editor**: [CodeMirror 6](https://codemirror.net/) with `@codemirror/lang-yaml`
- **YAML Engine**: [`yaml`](https://eemeli.org/yaml/) (YAML 1.2 & 1.1 merge keys with CST/AST traversal)
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

# Typecheck and lint
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## License

MIT License.
