import YAML from 'yaml';
import {
  ValidationResult,
  ValidationIssue,
  YamlAnchor,
  YamlAliasReference,
  MergeKeyInfo,
  RbacUser,
  RbacEnvironment,
  UsersMetadata,
  ValidationStats,
  HierarchyProject,
  HierarchyEnvironment,
  HierarchyRole,
  HierarchyUser,
} from '../types/yaml';

export interface ParseOptions {
  maxAliasCount?: number;
  checkUnusedAnchors?: boolean;
}

/**
 * Validates and analyzes a YAML document completely in-browser.
 */
export function validateYaml(text: string, options: ParseOptions = {}): ValidationResult {
  const startTime = performance.now();
  const maxAliasCount = options.maxAliasCount ?? 50000;
  const checkUnusedAnchors = options.checkUnusedAnchors ?? true;

  const lines = text.split('\n');
  const lineCount = lines.length;
  const characterCount = text.length;
  const byteCount = new TextEncoder().encode(text).length;

  // Empty string handling
  if (!text.trim()) {
    const emptyStats: ValidationStats = {
      lines: lineCount,
      characters: characterCount,
      bytes: byteCount,
      anchorCount: 0,
      aliasCount: 0,
      mergeKeyCount: 0,
      unusedAnchorCount: 0,
      danglingAliasCount: 0,
      usersCount: 0,
      parseTimeMs: performance.now() - startTime,
    };
    return {
      isValid: true,
      issues: [],
      anchors: [],
      aliases: [],
      mergeKeys: [],
      parsedData: null,
      resolvedYaml: '',
      jsonString: '',
      stats: emptyStats,
      isUsersConfig: false,
    };
  }

  const issues: ValidationIssue[] = [];
  const lineCounter = new YAML.LineCounter();
  let doc: YAML.Document.Parsed | null = null;

  try {
    doc = YAML.parseDocument(text, {
      lineCounter,
      merge: true,
      keepSourceTokens: true,
    });
  } catch (err: any) {
    issues.push({
      id: 'parse-exception',
      severity: 'error',
      message: err.message || 'Failed to parse YAML document',
      line: 1,
      column: 1,
      source: 'syntax',
    });
  }

  // Collect parse errors from YAML parser
  if (doc && doc.errors && doc.errors.length > 0) {
    for (const err of doc.errors) {
      const pos = err.linePos ? { line: err.linePos[0].line, col: err.linePos[0].col } : { line: 1, col: 1 };
      issues.push({
        id: `syntax-err-${pos.line}-${pos.col}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'error',
        message: err.message || 'Syntax error',
        line: pos.line,
        column: pos.col,
        source: 'syntax',
        snippet: lines[pos.line - 1] || undefined,
      });
    }
  }

  // Collect parser warnings
  if (doc && doc.warnings && doc.warnings.length > 0) {
    for (const warn of doc.warnings) {
      const pos = warn.linePos ? { line: warn.linePos[0].line, col: warn.linePos[0].col } : { line: 1, col: 1 };
      issues.push({
        id: `syntax-warn-${pos.line}-${pos.col}-${Math.random().toString(36).slice(2, 6)}`,
        severity: 'warning',
        message: warn.message || 'Parser warning',
        line: pos.line,
        column: pos.col,
        source: 'syntax',
        snippet: lines[pos.line - 1] || undefined,
      });
    }
  }

  const anchorMap = new Map<string, YamlAnchor>();
  const aliases: YamlAliasReference[] = [];
  const mergeKeys: MergeKeyInfo[] = [];

  if (doc && doc.contents) {
    // Traverse AST to collect Anchors, Aliases, and Merge keys
    YAML.visit(doc, {
      Node(_key, node) {
        if (node && (node as any).anchor) {
          const anchorName = (node as any).anchor as string;
          const range = (node as any).range;
          const pos = range ? lineCounter.linePos(range[0]) : { line: 1, col: 1 };

          let nodeType: 'mapping' | 'sequence' | 'scalar' | 'unknown' = 'unknown';
          if (YAML.isMap(node)) nodeType = 'mapping';
          else if (YAML.isSeq(node)) nodeType = 'sequence';
          else if (YAML.isScalar(node)) nodeType = 'scalar';

          let preview = '';
          try {
            preview = String(node.toString()).trim().slice(0, 100);
          } catch {
            preview = `<${nodeType}>`;
          }

          if (!anchorMap.has(anchorName)) {
            anchorMap.set(anchorName, {
              name: anchorName,
              line: pos.line,
              column: pos.col,
              type: nodeType,
              valuePreview: preview,
              references: [],
              isUsed: false,
            });
          }
        }

        if (node && YAML.isAlias(node)) {
          const target = (node as any).source as string;
          const range = (node as any).range;
          const pos = range ? lineCounter.linePos(range[0]) : { line: 1, col: 1 };
          const contextLine = lines[pos.line - 1] || '';

          aliases.push({
            targetAnchor: target,
            line: pos.line,
            column: pos.col,
            isMergeKey: false,
            isDangling: false, // will update below
            contextSnippet: contextLine.trim(),
          });
        }
      },

      Pair(_key, pair) {
        if (pair && pair.key) {
          const keySource = (pair.key as any).source;
          const keyValue = (pair.key as any).value;
          const isMerge = keySource === '<<' || String(keyValue).includes('<<');

          if (isMerge) {
            const range = (pair.key as any).range;
            const pos = range ? lineCounter.linePos(range[0]) : { line: 1, col: 1 };
            const targets: string[] = [];

            if (YAML.isAlias(pair.value)) {
              targets.push((pair.value as any).source);
            } else if (YAML.isSeq(pair.value)) {
              for (const item of (pair.value as any).items) {
                if (YAML.isAlias(item)) {
                  targets.push((item as any).source);
                }
              }
            }

            mergeKeys.push({
              line: pos.line,
              column: pos.col,
              targetAnchors: targets,
              isResolved: true,
              contextSnippet: (lines[pos.line - 1] || '').trim(),
            });
          }
        }
      },
    });
  }

  // Cross-reference aliases with anchors
  let danglingCount = 0;
  for (const alias of aliases) {
    const anchor = anchorMap.get(alias.targetAnchor);
    if (anchor) {
      anchor.references.push(alias);
      anchor.isUsed = true;
    } else {
      alias.isDangling = true;
      danglingCount++;
      issues.push({
        id: `dangling-alias-${alias.line}-${alias.column}-${alias.targetAnchor}`,
        severity: 'error',
        message: `Dangling alias "*${alias.targetAnchor}": Anchor "&${alias.targetAnchor}" is not defined in this document.`,
        line: alias.line,
        column: alias.column,
        source: 'anchor',
        snippet: lines[alias.line - 1] || undefined,
        suggestion: `Define "&${alias.targetAnchor}" before using it, or verify the anchor name spelling.`,
      });
    }
  }

  // Check for unused anchors
  let unusedCount = 0;
  if (checkUnusedAnchors) {
    for (const [name, anchor] of anchorMap) {
      if (!anchor.isUsed) {
        unusedCount++;
        issues.push({
          id: `unused-anchor-${anchor.line}-${anchor.column}-${name}`,
          severity: 'warning',
          message: `Unused anchor "&${name}": Defined at line ${anchor.line} but never referenced by any alias.`,
          line: anchor.line,
          column: anchor.column,
          source: 'anchor',
          snippet: lines[anchor.line - 1] || undefined,
          suggestion: `Remove this anchor if it is obsolete, or use "*${name}" to reference it.`,
        });
      }
    }
  }

  // Resolve JS object and generate dereferenced YAML and JSON
  let parsedData: any = null;
  let resolvedYaml = '';
  let jsonString = '';

  if (issues.filter(i => i.severity === 'error').length === 0 && doc) {
    try {
      parsedData = doc.toJS({ maxAliasCount });
      try {
        jsonString = JSON.stringify(parsedData, null, 2);
      } catch (err: any) {
        jsonString = `// Could not serialize to JSON: ${err.message}`;
      }

      try {
        // Deep clone to strip internal object identity sharing so stringify expands all aliases
        const deepCloned = JSON.parse(jsonString);
        resolvedYaml = YAML.stringify(deepCloned, { indent: 2 });
      } catch {
        resolvedYaml = YAML.stringify(parsedData, { indent: 2 });
      }
    } catch (err: any) {
      issues.push({
        id: 'resolve-error',
        severity: 'error',
        message: `Failed to resolve YAML references: ${err.message}`,
        line: 1,
        column: 1,
        source: 'anchor',
      });
    }
  }

  // Domain-specific inspection for users.yaml
  let isUsersConfig = false;
  let usersMetadata: UsersMetadata | undefined = undefined;

  if (parsedData && typeof parsedData === 'object') {
    const hasUsers = Array.isArray(parsedData.users);
    const hasXRoles = Boolean(parsedData['x-roles']);
    const hasXEnvs = Boolean(parsedData['x-environments']);
    const hasXProjects = Boolean(parsedData['x-projects']);

    if (hasUsers || hasXRoles || hasXEnvs || hasXProjects) {
      isUsersConfig = true;
      usersMetadata = extractUsersMetadata(parsedData, lines, anchorMap);

      // Perform RBAC validation
      validateUsersRbac(usersMetadata, issues);
    }
  }

  const valid = issues.filter(i => i.severity === 'error').length === 0;
  const anchorsList = Array.from(anchorMap.values()).sort((a, b) => a.line - b.line);

  const stats: ValidationStats = {
    lines: lineCount,
    characters: characterCount,
    bytes: byteCount,
    anchorCount: anchorsList.length,
    aliasCount: aliases.length,
    mergeKeyCount: mergeKeys.length,
    unusedAnchorCount: unusedCount,
    danglingAliasCount: danglingCount,
    usersCount: usersMetadata?.users.length ?? 0,
    parseTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
  };

  return {
    isValid: valid,
    issues: issues.sort((a, b) => a.line - b.line || a.column - b.column),
    anchors: anchorsList,
    aliases,
    mergeKeys,
    parsedData,
    resolvedYaml,
    jsonString,
    stats,
    isUsersConfig,
    usersMetadata,
  };
}

/**
 * Normalizes environment definitions into structured RbacEnvironment items with roles.
 */
function parseEnvironments(rawEnvs: any, allXEnvs?: Record<string, any>): RbacEnvironment[] {
  let target = rawEnvs;

  // If string alias, look up in x-environments if present
  if (typeof target === 'string' && allXEnvs) {
    const cleanKey = target.replace(/^\*/, '');
    if (allXEnvs[cleanKey]) {
      target = allXEnvs[cleanKey];
    }
  }

  if (Array.isArray(target)) {
    return target.map((e: any) => {
      if (typeof e === 'string') {
        return { name: e, roles: [] };
      }
      if (e && typeof e === 'object') {
        const envName = String(e.name || 'unnamed-env');
        let roles: string[] = [];
        if (Array.isArray(e.roles)) {
          roles = e.roles.map((r: any) => String(r?.name || r));
        } else if (typeof e.roles === 'string') {
          roles = [e.roles];
        }
        return { name: envName, roles };
      }
      return { name: String(e || 'unknown'), roles: [] };
    });
  }

  if (target && typeof target === 'object') {
    const envName = String(target.name || 'default');
    let roles: string[] = [];
    if (Array.isArray(target.roles)) {
      roles = target.roles.map((r: any) => String(r?.name || r));
    } else if (typeof target.roles === 'string') {
      roles = [target.roles];
    }
    return [{ name: envName, roles }];
  }

  if (typeof target === 'string' && target.trim().length > 0) {
    return [{ name: target.trim(), roles: [] }];
  }

  return [];
}

/**
 * Extracts users, known projects, environments, and roles from users.yaml structure
 */
function extractUsersMetadata(
  data: any,
  lines: string[],
  anchorMap: Map<string, YamlAnchor>
): UsersMetadata {
  const users: RbacUser[] = [];
  const knownProjects = new Set<string>();
  const knownEnvironments = new Set<string>();
  const knownRoles = new Set<string>();

  const availableRoleAnchors: string[] = [];
  const availableEnvAnchors: string[] = [];
  const availableProjectAnchors: string[] = [];

  // Categorize anchors based on where they were defined
  for (const [name, anchor] of anchorMap) {
    const defLine = anchor.line;
    let foundSection = '';
    for (let l = defLine - 1; l >= 0; l--) {
      const lineStr = lines[l] || '';
      if (lineStr.startsWith('x-roles:')) {
        foundSection = 'roles';
        break;
      }
      if (lineStr.startsWith('x-environments:')) {
        foundSection = 'environments';
        break;
      }
      if (lineStr.startsWith('x-projects:')) {
        foundSection = 'projects';
        break;
      }
      if (lineStr.startsWith('users:')) {
        break;
      }
    }

    if (foundSection === 'roles' || name.includes('role')) {
      availableRoleAnchors.push(name);
    } else if (foundSection === 'environments' || name.includes('env') || name === 'dev' || name === 'admin_non_prod' || name === 'admin_everywhere') {
      availableEnvAnchors.push(name);
    } else if (foundSection === 'projects' || name.includes('project')) {
      availableProjectAnchors.push(name);
    }
  }

  // Traverse data to populate known projects, environments, and roles
  function extractEntities(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(extractEntities);
      return;
    }

    if (obj.name && (obj.environments || obj.roles)) {
      if (obj.environments) knownProjects.add(obj.name);
      if (obj.roles) {
        knownEnvironments.add(obj.name);
        if (Array.isArray(obj.roles)) {
          obj.roles.forEach((r: any) => {
            if (typeof r === 'string') knownRoles.add(r);
          });
        } else if (typeof obj.roles === 'string') {
          knownRoles.add(obj.roles);
        }
      }
    }

    for (const key of Object.keys(obj)) {
      extractEntities(obj[key]);
    }
  }

  extractEntities(data);

  // Parse individual users
  if (Array.isArray(data.users)) {
    for (let i = 0; i < data.users.length; i++) {
      const u = data.users[i];
      if (!u || typeof u !== 'object') continue;

      const username = String(u.username || '').trim();
      let userLine = 1;

      // Find approximate line of this username in the original lines
      for (let l = 0; l < lines.length; l++) {
        if (lines[l].includes(`username: ${username}`) || lines[l].includes(`username: "${username}"`) || lines[l].includes(`username: '${username}'`)) {
          userLine = l + 1;
          break;
        }
      }

      const projectsList: RbacUser['projects'] = [];
      let usedProjectPresetAnchor = '';

      let rawProjects = u.projects;
      if (typeof rawProjects === 'string') {
        const cleanKey = rawProjects.replace(/^\*/, '');
        usedProjectPresetAnchor = cleanKey;
        if (data && data['x-projects'] && data['x-projects'][cleanKey]) {
          rawProjects = data['x-projects'][cleanKey];
        }
      }

      if (Array.isArray(rawProjects)) {
        for (const p of rawProjects) {
          if (!p || typeof p !== 'object') continue;
          const pName = p.name || 'unnamed-project';
          let isAlias = false;
          let aliasName = '';

          if (typeof p.environments === 'string') {
            isAlias = true;
            aliasName = p.environments;
          }

          const envList = parseEnvironments(p.environments, data['x-environments']);
          const envDisplay = envList.length > 0
            ? `${envList.length} ${envList.length === 1 ? 'env' : 'envs'} (${envList.map(e => e.name).join(', ')})`
            : typeof p.environments === 'string' ? p.environments : 'custom';

          projectsList.push({
            name: pName,
            environments: envList,
            rawEnvironments: p.environments,
            environmentsDisplay: envDisplay,
            isAlias,
            aliasName,
          });
        }
      } else if (typeof u.projects === 'string') {
        // e.g. projects: *all_projects_admin
        projectsList.push({
          name: 'All Projects (Preset)',
          environments: [],
          environmentsDisplay: u.projects,
          isAlias: true,
          aliasName: u.projects,
        });
      }

      // Analyze administrative privileges across projects and environments:
      // - Super Admins: Users that have admin access in all projects and all environments.
      // - Power Admins: Users that have admin access in sandbox, development and staging environments.
      //   They do not have admin access in projects that have production environments.
      const totalKnown = knownProjects.size;
      const coversAllProjects = totalKnown > 0 && projectsList.length >= totalKnown;

      let hasAdminEverywhere = projectsList.length > 0;
      let hasSandboxAdmin = false;
      let hasDevAdmin = false;
      let hasStagingAdmin = false;
      let hasProdAdmin = false;
      let nonProdMissingAdmin = false;

      for (const p of projectsList) {
        if (p.environments.length === 0) {
          hasAdminEverywhere = false;
        }
        for (const env of p.environments) {
          const isAdmin = env.roles.includes('admin');
          if (!isAdmin) {
            hasAdminEverywhere = false;
          }

          if (env.name === 'sandbox') {
            if (isAdmin) hasSandboxAdmin = true;
            else nonProdMissingAdmin = true;
          } else if (env.name === 'development') {
            if (isAdmin) hasDevAdmin = true;
            else nonProdMissingAdmin = true;
          } else if (env.name === 'staging') {
            if (isAdmin) hasStagingAdmin = true;
            else nonProdMissingAdmin = true;
          } else if (env.name === 'production') {
            if (isAdmin) hasProdAdmin = true;
          }
        }
      }

      let isSuperAdmin = false;
      let isPowerAdmin = false;

      if (
        (coversAllProjects && hasAdminEverywhere && hasProdAdmin) ||
        usedProjectPresetAnchor === 'all_projects_admin' ||
        (usedProjectPresetAnchor.includes('all_projects') && usedProjectPresetAnchor.includes('admin') && !usedProjectPresetAnchor.includes('non_prod'))
      ) {
        isSuperAdmin = true;
        isPowerAdmin = false;
      } else if (
        usedProjectPresetAnchor === 'all_projects_non_prod_admin' ||
        (coversAllProjects && hasSandboxAdmin && hasDevAdmin && hasStagingAdmin && !hasProdAdmin && !nonProdMissingAdmin)
      ) {
        isSuperAdmin = false;
        isPowerAdmin = true;
      }

      users.push({
        username: username || `(unnamed user #${i + 1})`,
        line: userLine,
        projects: projectsList,
        isSuperAdmin,
        isPowerAdmin,
      });
    }
  }

  return {
    users,
    availableRoleAnchors,
    availableEnvAnchors,
    availableProjectAnchors,
    knownProjects: Array.from(knownProjects).sort(),
    knownEnvironments: Array.from(knownEnvironments).sort(),
    knownRoles: Array.from(knownRoles).sort(),
    allAnchorNames: Array.from(anchorMap.keys()).sort(),
  };
}

/**
 * Validates domain rules for users.yaml (duplicate usernames, naming patterns)
 */
function validateUsersRbac(metadata: UsersMetadata, issues: ValidationIssue[]): void {
  const seenUsernames = new Map<string, number>();

  for (const user of metadata.users) {
    const uname = user.username.toLowerCase();

    // Check duplicate username
    if (seenUsernames.has(uname)) {
      const prevLine = seenUsernames.get(uname)!;
      issues.push({
        id: `dup-user-${uname}-${user.line}`,
        severity: 'error',
        message: `Duplicate user: "${user.username}" is already defined on line ${prevLine}.`,
        line: user.line,
        column: 1,
        source: 'rbac',
        suggestion: `Each user entry in users.yaml must have a unique username.`,
      });
    } else {
      seenUsernames.set(uname, user.line);
    }

    // Check username conventions (e.g. whitespace, valid characters)
    if (/\s/.test(user.username)) {
      issues.push({
        id: `invalid-username-space-${user.line}`,
        severity: 'error',
        message: `Username "${user.username}" contains whitespace. Usernames should be alphanumeric with dots or dashes.`,
        line: user.line,
        column: 1,
        source: 'rbac',
      });
    }
  }

  // Check alphabetical sorting across users
  for (let i = 0; i < metadata.users.length - 1; i++) {
    const current = metadata.users[i];
    const next = metadata.users[i + 1];
    if (current.username.toLowerCase().localeCompare(next.username.toLowerCase()) > 0) {
      issues.push({
        id: `users-not-sorted-${current.username}-${next.username}`,
        code: 'USERS_NOT_ALPHABETICAL',
        severity: 'info',
        message: `Users are not sorted alphabetically: "${current.username}" (line ${current.line}) appears before "${next.username}" (line ${next.line}).`,
        line: current.line,
        column: 1,
        source: 'rbac',
        suggestion: `Use "Sort Users A-Z" to sort all users alphabetically.`,
      });
      break;
    }
  }
}

/**
 * Helper to generate a new user YAML snippet
 */
export interface NewUserConfig {
  username: string;
  templateType: 'preset_all_projects' | 'preset_non_prod' | 'custom_projects' | 'clone_user';
  presetAnchor?: string;
  projects?: {
    projectName: string;
    envAnchor?: string;
  }[];
}

export function generateUserSnippet(config: NewUserConfig): string {
  const username = config.username.trim().toLowerCase();

  if (config.templateType === 'preset_all_projects') {
    const anchor = config.presetAnchor || 'all_projects_admin';
    return `  - username: ${username}\n    projects: *${anchor}\n`;
  }

  if (config.templateType === 'preset_non_prod') {
    const anchor = config.presetAnchor || 'all_projects_non_prod_admin';
    return `  - username: ${username}\n    projects: *${anchor}\n`;
  }

  if (config.projects && config.projects.length > 0) {
    let out = `  - username: ${username}\n    projects:\n`;
    for (const p of config.projects) {
      if (p.envAnchor) {
        out += `      - name: ${p.projectName}\n        environments: *${p.envAnchor}\n`;
      } else {
        out += `      - name: ${p.projectName}\n        environments:\n          - name: development\n            roles: *admin_role\n`;
      }
    }
    return out;
  }

  // Default fallback
  return `  - username: ${username}\n    projects:\n      - name: shared\n        environments: *admin_non_prod\n`;
}

export interface InsertUserResult {
  updatedYaml: string;
  insertedLine: number;
}

/**
 * Inserts a new user snippet into the YAML text.
 * By default, places the user in alphabetical order among existing users under `users:`.
 */
export function insertUserIntoYaml(
  yamlText: string,
  snippet: string,
  position: 'alphabetical' | 'start' | 'end' = 'alphabetical',
  newUsername?: string
): InsertUserResult {
  const lines = yamlText.split('\n');
  const usersIndex = lines.findIndex(l => /^users:\s*$/.test(l.trim()));

  // Extract username from argument or snippet
  let targetUsername = (newUsername || '').trim().toLowerCase();
  if (!targetUsername) {
    const match = snippet.match(/^\s*-\s*username:\s*["']?([a-zA-Z0-9._-]+)["']?/m);
    if (match) {
      targetUsername = match[1].toLowerCase();
    }
  }

  const snippetLines = snippet.trimEnd().split('\n');

  if (usersIndex === -1) {
    // If users: doesn't exist, append it at the end
    const trimmed = yamlText.trimEnd();
    const updated = `${trimmed}\n\nusers:\n${snippet.trimEnd()}\n`;
    const insertedLine = trimmed.split('\n').length + 3;
    return { updatedYaml: updated, insertedLine };
  }

  // Parse existing users and their start lines under users:
  const userRegex = /^\s*-\s*username:\s*["']?([a-zA-Z0-9._-]+)["']?/;
  const existingUsers: { username: string; lineIndex: number }[] = [];

  for (let i = usersIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop if encountering a new unindented top-level key
    if (line.trim().length > 0 && !line.startsWith(' ') && !line.startsWith('#') && !line.startsWith('---')) {
      break;
    }
    const match = line.match(userRegex);
    if (match) {
      existingUsers.push({ username: match[1], lineIndex: i });
    }
  }

  if (position === 'alphabetical' && targetUsername && existingUsers.length > 0) {
    // Find the first existing user who is alphabetically greater than targetUsername
    const targetUser = existingUsers.find(
      u => u.username.toLowerCase().localeCompare(targetUsername) > 0
    );

    if (targetUser) {
      // Insert right before targetUser
      const before = lines.slice(0, targetUser.lineIndex);
      const after = lines.slice(targetUser.lineIndex);
      const resultLines = [...before, ...snippetLines, '', ...after];
      return {
        updatedYaml: resultLines.join('\n'),
        insertedLine: targetUser.lineIndex + 1,
      };
    } else {
      // targetUsername belongs after the last existing user
      const lastUser = existingUsers[existingUsers.length - 1];
      let endOfUsersIndex = lines.length;

      for (let i = lastUser.lineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().length > 0 && !line.startsWith(' ') && !line.startsWith('#') && !line.startsWith('---')) {
          endOfUsersIndex = i;
          break;
        }
      }

      const before = lines.slice(0, endOfUsersIndex);
      const after = lines.slice(endOfUsersIndex);

      // Add blank line before if needed
      const needsBlankBefore = before.length > 0 && before[before.length - 1].trim() !== '';
      const resultLines = [
        ...before,
        ...(needsBlankBefore ? [''] : []),
        ...snippetLines,
        '',
        ...after,
      ];

      return {
        updatedYaml: resultLines.join('\n'),
        insertedLine: before.length + (needsBlankBefore ? 2 : 1),
      };
    }
  }

  if (position === 'start') {
    // Insert immediately after users:
    const before = lines.slice(0, usersIndex + 1);
    const after = lines.slice(usersIndex + 1);
    const resultLines = [...before, '', ...snippetLines, ...after];
    return {
      updatedYaml: resultLines.join('\n'),
      insertedLine: usersIndex + 3,
    };
  }

  // Append to the end of file/users
  const trimmed = yamlText.trimEnd();
  const updated = `${trimmed}\n\n${snippet.trimEnd()}\n`;
  return {
    updatedYaml: updated,
    insertedLine: trimmed.split('\n').length + 2,
  };
}

/**
 * Sorts all user items under `users:` alphabetically by username,
 * while preserving indentation, properties, comments, and document structure.
 */
export function sortUsersInYaml(yamlText: string): string {
  const lines = yamlText.split('\n');
  const usersIndex = lines.findIndex(l => /^users:\s*$/.test(l.trim()));
  if (usersIndex === -1) return yamlText;

  const userRegex = /^\s*-\s*username:\s*["']?([a-zA-Z0-9._-]+)["']?/;
  const userBlocks: { username: string; lines: string[] }[] = [];
  let currentUser: { username: string; lines: string[] } | null = null;
  let sectionEndIndex = lines.length;

  for (let i = usersIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Check if we exited users section
    if (line.trim().length > 0 && !line.startsWith(' ') && !line.startsWith('#') && !line.startsWith('---')) {
      sectionEndIndex = i;
      break;
    }

    const match = line.match(userRegex);
    if (match) {
      if (currentUser) {
        userBlocks.push(currentUser);
      }
      currentUser = {
        username: match[1],
        lines: [line],
      };
    } else if (currentUser) {
      currentUser.lines.push(line);
    }
  }

  if (currentUser) {
    userBlocks.push(currentUser);
  }

  if (userBlocks.length <= 1) return yamlText;

  // Sort blocks alphabetically by username
  userBlocks.sort((a, b) =>
    a.username.toLowerCase().localeCompare(b.username.toLowerCase())
  );

  const beforeUsers = lines.slice(0, usersIndex + 1);
  const afterUsers = lines.slice(sectionEndIndex);

  const sortedUsersText = userBlocks
    .map(b => b.lines.join('\n').trimEnd())
    .join('\n\n');

  return [
    beforeUsers.join('\n'),
    '',
    sortedUsersText,
    ...(afterUsers.length > 0 ? ['', afterUsers.join('\n')] : ['']),
  ].join('\n');
}

export interface ProjectUserAssignment {
  username: string;
  roles: string[];
  roleAnchor?: string;
}

export interface AddProjectConfig {
  projectName: string;
  environmentName: string;
  userAssignments: ProjectUserAssignment[];
  addToGlobalPresets?: boolean;
}

export interface AddProjectResult {
  updatedYaml: string;
  updatedUsersCount: number;
  firstModifiedLine: number;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Adds a project and environment to the YAML file and assigns it to specified users with selectable roles.
 * Optionally also adds the project to global presets (all_projects_admin & all_projects_non_prod_admin) if x-projects exists.
 */
export function addProjectAndEnvironmentToYaml(
  yamlText: string,
  config: AddProjectConfig
): AddProjectResult {
  const lines = yamlText.split('\n');
  const pName = config.projectName.trim().toLowerCase();
  const envName = config.environmentName.trim().toLowerCase();

  if (!pName || !envName) {
    return { updatedYaml: yamlText, updatedUsersCount: 0, firstModifiedLine: -1 };
  }

  let firstModifiedLine = -1;
  let updatedUsersCount = 0;

  // 1. Optionally register project into global x-projects presets if present
  if (config.addToGlobalPresets) {
    const allAdminIdx = lines.findIndex(l => /^\s*all_projects_admin:\s*&all_projects_admin/.test(l));
    const allNonProdIdx = lines.findIndex(l => /^\s*all_projects_non_prod_admin:\s*&all_projects_non_prod_admin/.test(l));

    if (allAdminIdx !== -1 && allNonProdIdx !== -1) {
      // Find end of all_projects_admin list before all_projects_non_prod_admin
      let insertAllAdmin = allNonProdIdx - 1;
      while (insertAllAdmin > allAdminIdx && lines[insertAllAdmin].trim() === '') {
        insertAllAdmin--;
      }
      lines.splice(insertAllAdmin + 1, 0, `    - name: ${pName}\n      environments: *admin_everywhere`);

      // Recalculate allNonProdIdx after insertion
      const updatedNonProdIdx = lines.findIndex(l => /^\s*all_projects_non_prod_admin:\s*&all_projects_non_prod_admin/.test(l));
      const usersIdx = lines.findIndex(l => /^users:\s*$/.test(l.trim()));
      const searchBound = usersIdx !== -1 ? usersIdx : lines.length;
      let insertAllNonProd = searchBound - 1;
      while (insertAllNonProd > updatedNonProdIdx && lines[insertAllNonProd].trim() === '') {
        insertAllNonProd--;
      }
      lines.splice(insertAllNonProd + 1, 0, `    - name: ${pName}\n      environments: *admin_non_prod`);
    }
  }

  // 2. Update each selected user in userAssignments
  for (const sel of config.userAssignments) {
    const uname = sel.username.trim().toLowerCase();
    const userLineIdx = lines.findIndex(l => {
      const match = l.match(/^\s*-\s*username:\s*["']?([a-zA-Z0-9._-]+)["']?/);
      return match && match[1].toLowerCase() === uname;
    });

    if (userLineIdx === -1) continue;

    // Find user block bounds
    let userEndIdx = lines.length;
    for (let i = userLineIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*-\s*username:/.test(line) || (line.trim().length > 0 && !line.startsWith(' ') && !line.startsWith('#') && !line.startsWith('---'))) {
        userEndIdx = i;
        break;
      }
    }

    // Determine roles block
    let rolesText = '';
    if (sel.roleAnchor) {
      const cleanAnchor = sel.roleAnchor.replace(/^\*/, '');
      rolesText = `roles: *${cleanAnchor}`;
    } else if (sel.roles && sel.roles.length === 1 && sel.roles[0].startsWith('*')) {
      rolesText = `roles: ${sel.roles[0]}`;
    } else if (sel.roles && sel.roles.length > 0) {
      rolesText = 'roles:\n' + sel.roles.map(r => `            - ${r}`).join('\n');
    } else {
      rolesText = 'roles:\n            - readonly';
    }

    // Check if user has projects:
    let projectsLineIdx = -1;
    let projectsIsAlias = false;
    for (let i = userLineIdx; i < userEndIdx; i++) {
      const line = lines[i];
      if (/^\s+projects:\s*\*([a-zA-Z0-9._-]+)/.test(line)) {
        projectsLineIdx = i;
        projectsIsAlias = true;
        break;
      }
      if (/^\s+projects:\s*(\[\])?\s*$/.test(line)) {
        projectsLineIdx = i;
        break;
      }
    }

    if (projectsIsAlias) {
      // User uses global preset alias (e.g. *all_projects_admin)
      continue;
    }

    const envSnippet = [
      `      - name: ${pName}`,
      `        environments:`,
      `          - name: ${envName}`,
      `            ${rolesText}`,
    ].join('\n');

    if (projectsLineIdx === -1) {
      lines.splice(userLineIdx + 1, 0, `    projects:\n${envSnippet}`);
      updatedUsersCount++;
      if (firstModifiedLine === -1) firstModifiedLine = userLineIdx + 2;
    } else if (lines[projectsLineIdx].includes('[]')) {
      lines[projectsLineIdx] = '    projects:';
      lines.splice(projectsLineIdx + 1, 0, envSnippet);
      updatedUsersCount++;
      if (firstModifiedLine === -1) firstModifiedLine = projectsLineIdx + 2;
    } else {
      // Search for existing project under this user
      let projLineIdx = -1;
      for (let i = projectsLineIdx + 1; i < userEndIdx; i++) {
        if (lines[i].match(new RegExp(`^\\s+-\\s*name:\\s*["']?${escapeRegExp(pName)}["']?\\s*$`))) {
          projLineIdx = i;
          break;
        }
      }

      if (projLineIdx === -1) {
        let insertAt = userEndIdx;
        while (insertAt > projectsLineIdx && lines[insertAt - 1].trim() === '') {
          insertAt--;
        }
        lines.splice(insertAt, 0, envSnippet);
        updatedUsersCount++;
        if (firstModifiedLine === -1) firstModifiedLine = insertAt + 1;
      } else {
        // Project exists, append environment under its environments:
        let envLineIdx = -1;
        for (let i = projLineIdx + 1; i < userEndIdx; i++) {
          if (/^\s+environments:/.test(lines[i])) {
            envLineIdx = i;
            break;
          }
          if (/^\s+-\s*name:/.test(lines[i])) break;
        }

        const envItemSnippet = [
          `          - name: ${envName}`,
          `            ${rolesText}`,
        ].join('\n');

        if (envLineIdx !== -1) {
          lines.splice(envLineIdx + 1, 0, envItemSnippet);
          updatedUsersCount++;
          if (firstModifiedLine === -1) firstModifiedLine = envLineIdx + 2;
        }
      }
    }
  }

  return { updatedYaml: lines.join('\n'), updatedUsersCount, firstModifiedLine };
}

/**
 * Builds a 4-level hierarchical breakdown:
 * Project -> Environments -> Roles -> List of Users
 */
export function buildProjectHierarchy(
  users: RbacUser[],
  knownProjects: string[] = [],
  search: string = ''
): HierarchyProject[] {
  const allProjectNames = new Set<string>(knownProjects);
  for (const u of users) {
    for (const p of u.projects) {
      if (p.name) allProjectNames.add(p.name);
    }
  }

  // Map: projectName -> envName -> roleName -> Map<username, HierarchyUser>
  const projMap = new Map<string, Map<string, Map<string, Map<string, HierarchyUser>>>>();

  for (const pName of allProjectNames) {
    projMap.set(pName, new Map());
  }

  for (const u of users) {
    const hierarchyUser: HierarchyUser = {
      username: u.username,
      line: u.line,
      isSuperAdmin: u.isSuperAdmin,
      isPowerAdmin: u.isPowerAdmin,
    };

    for (const p of u.projects) {
      if (!projMap.has(p.name)) {
        projMap.set(p.name, new Map());
      }
      const envMap = projMap.get(p.name)!;

      if (p.environments.length === 0) {
        const envName = 'default';
        if (!envMap.has(envName)) envMap.set(envName, new Map());
        const roleMap = envMap.get(envName)!;
        const roleName = 'general';
        if (!roleMap.has(roleName)) roleMap.set(roleName, new Map());
        roleMap.get(roleName)!.set(u.username, hierarchyUser);
      } else {
        for (const env of p.environments) {
          const envName = env.name || 'default';
          if (!envMap.has(envName)) envMap.set(envName, new Map());
          const roleMap = envMap.get(envName)!;

          const roles = env.roles.length > 0 ? env.roles : ['default'];
          for (const r of roles) {
            if (!roleMap.has(r)) roleMap.set(r, new Map());
            roleMap.get(r)!.set(u.username, hierarchyUser);
          }
        }
      }
    }
  }

  const envOrder: Record<string, number> = {
    sandbox: 1,
    development: 2,
    dev: 2,
    staging: 3,
    stage: 3,
    production: 4,
    prod: 4,
  };

  const roleOrder: Record<string, number> = {
    admin: 1,
    readonly: 2,
  };

  const q = search.trim().toLowerCase();
  const result: HierarchyProject[] = [];

  for (const [pName, envMap] of projMap.entries()) {
    const pMatches = !q || pName.toLowerCase().includes(q);

    const environments: HierarchyEnvironment[] = [];
    const projectUsernames = new Set<string>();

    for (const [eName, roleMap] of envMap.entries()) {
      const eMatches = pMatches || eName.toLowerCase().includes(q);

      const roles: HierarchyRole[] = [];
      const envUsernames = new Set<string>();

      for (const [rName, userMap] of roleMap.entries()) {
        const rMatches = eMatches || rName.toLowerCase().includes(q);

        const roleUsers: HierarchyUser[] = [];
        for (const u of userMap.values()) {
          if (rMatches || u.username.toLowerCase().includes(q)) {
            roleUsers.push(u);
            envUsernames.add(u.username);
            projectUsernames.add(u.username);
          }
        }

        if (roleUsers.length > 0 || (!q && userMap.size === 0)) {
          roleUsers.sort((a, b) => a.username.localeCompare(b.username));
          roles.push({
            roleName: rName,
            users: roleUsers,
          });
        }
      }

      roles.sort((a, b) => {
        const ordA = roleOrder[a.roleName.toLowerCase()] ?? 99;
        const ordB = roleOrder[b.roleName.toLowerCase()] ?? 99;
        if (ordA !== ordB) return ordA - ordB;
        return a.roleName.localeCompare(b.roleName);
      });

      if (roles.length > 0 || (!q && roleMap.size === 0)) {
        environments.push({
          envName: eName,
          roles,
          userCount: envUsernames.size,
        });
      }
    }

    environments.sort((a, b) => {
      const ordA = envOrder[a.envName.toLowerCase()] ?? 99;
      const ordB = envOrder[b.envName.toLowerCase()] ?? 99;
      if (ordA !== ordB) return ordA - ordB;
      return a.envName.localeCompare(b.envName);
    });

    if (environments.length > 0 || (!q && allProjectNames.has(pName))) {
      result.push({
        projectName: pName,
        environments,
        userCount: projectUsernames.size,
      });
    }
  }

  return result.sort((a, b) => a.projectName.localeCompare(b.projectName));
}

