export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueSource = 'syntax' | 'anchor' | 'schema' | 'rbac';

export interface ValidationIssue {
  id: string;
  code?: string;
  severity: IssueSeverity;
  message: string;
  line: number;
  column: number;
  source: IssueSource;
  snippet?: string;
  suggestion?: string;
}

export interface YamlAliasReference {
  targetAnchor: string;
  line: number;
  column: number;
  isMergeKey: boolean;
  isDangling: boolean;
  contextSnippet?: string;
}

export interface YamlAnchor {
  name: string;
  line: number;
  column: number;
  type: 'mapping' | 'sequence' | 'scalar' | 'unknown';
  valuePreview: string;
  references: YamlAliasReference[];
  isUsed: boolean;
}

export interface MergeKeyInfo {
  line: number;
  column: number;
  targetAnchors: string[];
  isResolved: boolean;
  contextSnippet?: string;
}

export interface RbacEnvironment {
  name: string;
  roles: string[];
  isAlias?: boolean;
  aliasName?: string;
}

export interface RbacUserProject {
  name: string;
  environments: RbacEnvironment[];
  rawEnvironments?: any;
  environmentsDisplay: string;
  isAlias: boolean;
  aliasName?: string;
}

export interface RbacUser {
  username: string;
  line: number;
  projects: RbacUserProject[];
  isSuperAdmin: boolean;
  isPowerAdmin: boolean;
  rawYamlSnippet?: string;
}

export interface HierarchyUser {
  username: string;
  line: number;
  isSuperAdmin: boolean;
  isPowerAdmin: boolean;
}

export interface HierarchyRole {
  roleName: string;
  users: HierarchyUser[];
}

export interface HierarchyEnvironment {
  envName: string;
  roles: HierarchyRole[];
  userCount: number;
}

export interface HierarchyProject {
  projectName: string;
  environments: HierarchyEnvironment[];
  userCount: number;
}

export interface UsersMetadata {
  users: RbacUser[];
  availableRoleAnchors: string[];
  availableEnvAnchors: string[];
  availableProjectAnchors: string[];
  knownProjects: string[];
  knownEnvironments: string[];
  knownRoles: string[];
  allAnchorNames: string[];
}

export interface ValidationStats {
  lines: number;
  characters: number;
  bytes: number;
  anchorCount: number;
  aliasCount: number;
  mergeKeyCount: number;
  unusedAnchorCount: number;
  danglingAliasCount: number;
  usersCount: number;
  parseTimeMs: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  anchors: YamlAnchor[];
  aliases: YamlAliasReference[];
  mergeKeys: MergeKeyInfo[];
  parsedData: any;
  resolvedYaml: string;
  jsonString: string;
  stats: ValidationStats;
  isUsersConfig: boolean;
  usersMetadata?: UsersMetadata;
}
