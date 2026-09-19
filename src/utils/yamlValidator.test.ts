import { describe, it, expect } from 'vitest';
import { USERS_YAML_DEFAULT } from '../data/defaultUsersYaml';
import {
  validateYaml,
  generateUserSnippet,
  insertUserIntoYaml,
  sortUsersInYaml,
  sortProjectsInPresetYaml,
  hasPresetProjectAnchors,
  addProjectAndEnvironmentToYaml,
  buildProjectHierarchy,
} from './yamlValidator';

describe('YAML In-Browser Validator Engine', () => {
  it('should validate simple valid YAML', () => {
    const yaml = `
name: test-service
replicas: 3
enabled: true
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(true);
    expect(res.issues).toHaveLength(0);
    expect(res.parsedData.replicas).toBe(3);
  });

  it('should detect syntax errors with line and column', () => {
    const invalidYaml = `
services:
  app:
    name: test
   bad_indentation: true
`;
    const res = validateYaml(invalidYaml);
    expect(res.isValid).toBe(false);
    expect(res.issues.length).toBeGreaterThan(0);
    const syntaxErr = res.issues.find(i => i.source === 'syntax');
    expect(syntaxErr).toBeDefined();
    expect(syntaxErr?.line).toBeGreaterThan(0);
  });

  it('should detect anchors, aliases, and count usage', () => {
    const yaml = `
defaults: &default_cfg
  timeout: 30
  retry: true

prod_svc:
  config: *default_cfg

staging_svc:
  config: *default_cfg
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(true);
    expect(res.anchors).toHaveLength(1);
    expect(res.anchors[0].name).toBe('default_cfg');
    expect(res.anchors[0].references).toHaveLength(2);
    expect(res.anchors[0].isUsed).toBe(true);
    expect(res.stats.aliasCount).toBe(2);
  });

  it('should flag dangling aliases as errors', () => {
    const yaml = `
service:
  roles: *undefined_role_anchor
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(false);
    const dangling = res.issues.find(i => i.source === 'anchor' && i.severity === 'error');
    expect(dangling).toBeDefined();
    expect(dangling?.message).toContain('undefined_role_anchor');
  });

  it('should flag unused anchors as warnings', () => {
    const yaml = `
orphan_anchor: &unused_conf
  foo: bar

active_conf:
  hello: world
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(true); // Warnings don't invalidate document
    const unused = res.issues.find(i => i.source === 'anchor' && i.severity === 'warning');
    expect(unused).toBeDefined();
    expect(unused?.message).toContain('unused_conf');
  });

  it('should properly process merge keys', () => {
    const yaml = `
base: &base
  port: 8080
  debug: false

web:
  <<: *base
  port: 9000
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(true);
    expect(res.mergeKeys).toHaveLength(1);
    expect(res.mergeKeys[0].targetAnchors).toContain('base');
    expect(res.parsedData.web.port).toBe(9000);
    expect(res.parsedData.web.debug).toBe(false);
  });

  it('should validate and parse users config sample', () => {
    const res = validateYaml(USERS_YAML_DEFAULT);
    expect(res.isValid).toBe(true);
    expect(res.isUsersConfig).toBe(true);
    expect(res.anchors.length).toBe(8);
    expect(res.stats.aliasCount).toBeGreaterThan(40);
    expect(res.usersMetadata).toBeDefined();
    expect(res.usersMetadata?.users.length).toBe(38);

    // Verify entities discovered
    expect(res.usersMetadata?.knownEnvironments).toContain('development');
    expect(res.usersMetadata?.knownEnvironments).toContain('production');
    expect(res.usersMetadata?.knownRoles).toContain('admin');
    expect(res.usersMetadata?.knownRoles).toContain('readonly');

    // Verify project -> environment -> roles breakdown for benjamin.clark
    const benjamin = res.usersMetadata?.users.find(u => u.username === 'benjamin.clark');
    expect(benjamin).toBeDefined();
    expect(benjamin?.projects[0].name).toBe('monitoring-system');
    expect(benjamin?.projects[0].environments[0].name).toBe('development');
    expect(benjamin?.projects[0].environments[0].roles).toEqual(['admin', 'readonly']);

    // Verify alice.smith with *dev_ai_readonly alias
    const alice = res.usersMetadata?.users.find(u => u.username === 'alice.smith');
    expect(alice).toBeDefined();
    expect(alice?.projects[0].name).toBe('chat-service');
    expect(alice?.projects[0].environments[0].name).toBe('development');
    expect(alice?.projects[0].environments[0].roles).toEqual(['bedrock']);
  });

  it('should flag duplicate users in users.yaml schema', () => {
    const yaml = `
x-roles:
  admin_role: &admin_role
    - admin

users:
  - username: alice.smith
    projects:
      - name: chat
        environments:
          - name: development
            roles: *admin_role
  - username: alice.smith
    projects:
      - name: infra
        environments:
          - name: development
            roles: *admin_role
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(false);
    const dupIssue = res.issues.find(i => i.id.startsWith('dup-user'));
    expect(dupIssue).toBeDefined();
    expect(dupIssue?.message).toContain('Duplicate user: "alice.smith"');
  });

  it('should generate valid user YAML snippet and insert it', () => {
    const snippet = generateUserSnippet({
      username: 'john.doe',
      templateType: 'preset_all_projects',
      presetAnchor: 'all_projects_admin',
    });
    expect(snippet).toContain('username: john.doe');
    expect(snippet).toContain('projects: *all_projects_admin');

    const originalYaml = `
users:
  - username: adam.smith
    projects: []
`;
    const resInsert = insertUserIntoYaml(originalYaml, snippet, 'end', 'john.doe');
    expect(resInsert.updatedYaml).toContain('username: john.doe');

    const res = validateYaml(resInsert.updatedYaml, { checkUnusedAnchors: false });
    expect(res.stats.lines).toBeGreaterThan(originalYaml.split('\n').length);
  });

  it('should insert users in strictly alphabetical order', () => {
    const originalYaml = `
users:
  - username: adam.smith
    projects: []

  - username: charlie.brown
    projects: []
`;
    // 1. Insert in the middle (ben.smith)
    const benSnippet = `  - username: ben.smith\n    projects: []\n`;
    const r1 = insertUserIntoYaml(originalYaml, benSnippet, 'alphabetical', 'ben.smith');
    const parsed1 = validateYaml(r1.updatedYaml, { checkUnusedAnchors: false });
    const u1 = parsed1.usersMetadata?.users.map(u => u.username);
    expect(u1).toEqual(['adam.smith', 'ben.smith', 'charlie.brown']);

    // 2. Insert at the start (aaron.adams)
    const aaronSnippet = `  - username: aaron.adams\n    projects: []\n`;
    const r2 = insertUserIntoYaml(originalYaml, aaronSnippet, 'alphabetical', 'aaron.adams');
    const parsed2 = validateYaml(r2.updatedYaml, { checkUnusedAnchors: false });
    const u2 = parsed2.usersMetadata?.users.map(u => u.username);
    expect(u2).toEqual(['aaron.adams', 'adam.smith', 'charlie.brown']);

    // 3. Insert at the end (zoe.williams)
    const zoeSnippet = `  - username: zoe.williams\n    projects: []\n`;
    const r3 = insertUserIntoYaml(originalYaml, zoeSnippet, 'alphabetical', 'zoe.williams');
    const parsed3 = validateYaml(r3.updatedYaml, { checkUnusedAnchors: false });
    const u3 = parsed3.usersMetadata?.users.map(u => u.username);
    expect(u3).toEqual(['adam.smith', 'charlie.brown', 'zoe.williams']);
  });

  it('should insert user alphabetically into the users config sample', () => {
    const content = USERS_YAML_DEFAULT;

    const bernardSnippet = `  - username: bernard.lowe\n    projects:\n      - name: auth-service\n        environments: *admin_non_prod\n`;
    const result = insertUserIntoYaml(content, bernardSnippet, 'alphabetical', 'bernard.lowe');

    const res = validateYaml(result.updatedYaml);
    expect(res.isValid).toBe(true);
    expect(res.usersMetadata?.users.length).toBe(39);

    const usernames = res.usersMetadata?.users.map(u => u.username) || [];
    const bernardIndex = usernames.indexOf('bernard.lowe');
    expect(bernardIndex).toBeGreaterThan(0);
    expect(usernames[bernardIndex - 1]).toBe('benjamin.clark');
    expect(usernames[bernardIndex + 1]).toBe('bradley.cooper');
  });

  it('should sort out-of-order users in YAML alphabetically with sortUsersInYaml', () => {
    const unsortedYaml = `
x-header: test

users:
  - username: zoe.williams
    projects: []

  - username: adam.smith
    projects: []

  - username: charlie.brown
    projects: []

x-footer: end
`;
    const sorted = sortUsersInYaml(unsortedYaml);
    const res = validateYaml(sorted, { checkUnusedAnchors: false });
    const usernames = res.usersMetadata?.users.map(u => u.username);
    expect(usernames).toEqual(['adam.smith', 'charlie.brown', 'zoe.williams']);
    expect(sorted).toContain('x-header: test');
    expect(sorted).toContain('x-footer: end');
  });

  it('should sort an out-of-order users config alphabetically and resolve order issues', () => {
    const unsorted = USERS_YAML_DEFAULT.replace('  - username: aaron.brooks', '  - username: z_temp_user');
    const beforeRes = validateYaml(unsorted);
    const orderIssuesBefore = beforeRes.issues.filter(i => i.code === 'USERS_NOT_ALPHABETICAL');
    expect(orderIssuesBefore.length).toBeGreaterThan(0);

    const sorted = sortUsersInYaml(unsorted);
    const afterRes = validateYaml(sorted);

    expect(afterRes.isValid).toBe(true);
    expect(afterRes.usersMetadata?.users.length).toBe(38);

    const orderIssuesAfter = afterRes.issues.filter(i => i.code === 'USERS_NOT_ALPHABETICAL');
    expect(orderIssuesAfter.length).toBe(0);

    const usernames = afterRes.usersMetadata?.users.map(u => u.username) || [];
    for (let i = 0; i < usernames.length - 1; i++) {
      expect(usernames[i].localeCompare(usernames[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  it('should correctly classify Super Admins and Power Admins in users config', () => {
    const res = validateYaml(USERS_YAML_DEFAULT);

    const superAdmins = res.usersMetadata?.users.filter(u => u.isSuperAdmin).map(u => u.username) || [];
    const powerAdmins = res.usersMetadata?.users.filter(u => u.isPowerAdmin).map(u => u.username) || [];

    // Super Admins: admin in all projects and all environments
    expect(superAdmins).toEqual(['alexander.wright', 'eleanor.vance', 'marcus.foster']);
    expect(superAdmins.length).toBe(3);

    // Power Admins: admin in sandbox, dev, staging; no admin in production (8 users)
    expect(powerAdmins.length).toBe(8);
    expect(powerAdmins).toContain('charlotte.king');
    expect(powerAdmins).toContain('daniel.reed');
    expect(powerAdmins).toContain('grace.hopper');
    expect(powerAdmins).toContain('jordan.miller');
    expect(powerAdmins).toContain('morgan.bailey');
    expect(powerAdmins).toContain('pat.power');
    expect(powerAdmins).toContain('riley.carter');
    expect(powerAdmins).toContain('samuel.green');

    // Super Admins and Power Admins are mutually exclusive
    for (const u of res.usersMetadata?.users || []) {
      expect(u.isSuperAdmin && u.isPowerAdmin).toBe(false);
    }

    // Standard user (e.g. benjamin.clark) has neither
    const benjamin = res.usersMetadata?.users.find(u => u.username === 'benjamin.clark');
    expect(benjamin?.isSuperAdmin).toBe(false);
    expect(benjamin?.isPowerAdmin).toBe(false);
  });

  it('should distinguish Super Admin vs Power Admin based on environment admin access', () => {
    const yaml = `
x-roles:
  admin_role: &admin_role
    - admin
    - readonly
  readonly_role: &readonly_role
    - readonly

x-environments:
  all_envs_admin: &all_envs_admin
    - name: sandbox
      roles: *admin_role
    - name: development
      roles: *admin_role
    - name: staging
      roles: *admin_role
    - name: production
      roles: *admin_role

  non_prod_admin: &non_prod_admin
    - name: sandbox
      roles: *admin_role
    - name: development
      roles: *admin_role
    - name: staging
      roles: *admin_role
    - name: production
      roles: *readonly_role

x-projects:
  super_preset: &super_preset
    - name: auth-svc
      environments: *all_envs_admin
  power_preset: &power_preset
    - name: auth-svc
      environments: *non_prod_admin

users:
  - username: alice.super
    projects: *super_preset

  - username: bob.power
    projects: *power_preset

  - username: charlie.dev
    projects:
      - name: auth-svc
        environments:
          - name: development
            roles: *admin_role
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(true);

    const alice = res.usersMetadata?.users.find(u => u.username === 'alice.super');
    const bob = res.usersMetadata?.users.find(u => u.username === 'bob.power');
    const charlie = res.usersMetadata?.users.find(u => u.username === 'charlie.dev');

    expect(alice?.isSuperAdmin).toBe(true);
    expect(alice?.isPowerAdmin).toBe(false);

    expect(bob?.isSuperAdmin).toBe(false);
    expect(bob?.isPowerAdmin).toBe(true);

    expect(charlie?.isSuperAdmin).toBe(false);
    expect(charlie?.isPowerAdmin).toBe(false);
  });

  it('should add a new project and environment with user access and selectable roles', () => {
    const yaml = `
x-roles:
  admin_role: &admin_role
    - admin
    - readonly

users:
  - username: alice.dev
    projects:
      - name: auth-svc
        environments:
          - name: development
            roles: *admin_role

  - username: bob.qa
    projects: []
`;
    const result = addProjectAndEnvironmentToYaml(yaml, {
      projectName: 'payments-api',
      environmentName: 'staging',
      userAssignments: [
        { username: 'alice.dev', roleAnchor: 'admin_role', roles: ['admin', 'readonly'] },
        { username: 'bob.qa', roles: ['readonly'] },
      ],
    });

    expect(result.updatedUsersCount).toBe(2);
    expect(result.firstModifiedLine).toBeGreaterThan(0);

    const res = validateYaml(result.updatedYaml);
    expect(res.isValid).toBe(true);

    const alice = res.usersMetadata?.users.find(u => u.username === 'alice.dev');
    expect(alice?.projects).toHaveLength(2);
    const paymentsProj = alice?.projects.find(p => p.name === 'payments-api');
    expect(paymentsProj).toBeDefined();
    expect(paymentsProj?.environments[0].name).toBe('staging');
    expect(paymentsProj?.environments[0].roles).toEqual(['admin', 'readonly']);

    const bob = res.usersMetadata?.users.find(u => u.username === 'bob.qa');
    expect(bob?.projects).toHaveLength(1);
    expect(bob?.projects[0].name).toBe('payments-api');
    expect(bob?.projects[0].environments[0].roles).toEqual(['readonly']);
  });

  it('should add a project and environment to users config and keep it valid', () => {
    const content = USERS_YAML_DEFAULT;

    const result = addProjectAndEnvironmentToYaml(content, {
      projectName: 'kubernetes-cluster',
      environmentName: 'production',
      addToGlobalPresets: true,
      userAssignments: [
        { username: 'benjamin.clark', roleAnchor: 'admin_role', roles: ['admin', 'readonly'] },
        { username: 'alice.smith', roles: ['readonly'] },
      ],
    });

    expect(result.updatedUsersCount).toBe(2);
    const res = validateYaml(result.updatedYaml);
    expect(res.isValid).toBe(true);
    expect(res.usersMetadata?.knownProjects).toContain('kubernetes-cluster');

    const benjamin = res.usersMetadata?.users.find(u => u.username === 'benjamin.clark');
    expect(benjamin?.projects.some(p => p.name === 'kubernetes-cluster')).toBe(true);
  });

  it('should build hierarchical breakdown: Project -> Environments -> Roles -> List of Users', () => {
    const yaml = `
users:
  - username: dev.alice
    projects:
      - name: payments
        environments:
          - name: development
            roles:
              - admin
              - readonly
          - name: production
            roles:
              - readonly
  - username: dev.bob
    projects:
      - name: payments
        environments:
          - name: development
            roles:
              - readonly
`;
    const res = validateYaml(yaml);
    expect(res.isValid).toBe(true);

    const hierarchy = buildProjectHierarchy(res.usersMetadata?.users || [], res.usersMetadata?.knownProjects);
    expect(hierarchy).toHaveLength(1);

    const paymentsProj = hierarchy[0];
    expect(paymentsProj.projectName).toBe('payments');
    expect(paymentsProj.userCount).toBe(2);
    expect(paymentsProj.environments).toHaveLength(2);

    // Environment 1: development
    const devEnv = paymentsProj.environments[0];
    expect(devEnv.envName).toBe('development');
    expect(devEnv.userCount).toBe(2);
    expect(devEnv.roles).toHaveLength(2);

    // Role 1: admin (admin ordered first)
    const adminRole = devEnv.roles[0];
    expect(adminRole.roleName).toBe('admin');
    expect(adminRole.users).toHaveLength(1);
    expect(adminRole.users[0].username).toBe('dev.alice');

    // Role 2: readonly
    const readonlyRole = devEnv.roles[1];
    expect(readonlyRole.roleName).toBe('readonly');
    expect(readonlyRole.users).toHaveLength(2);
    expect(readonlyRole.users.map(u => u.username)).toEqual(['dev.alice', 'dev.bob']);

    // Environment 2: production
    const prodEnv = paymentsProj.environments[1];
    expect(prodEnv.envName).toBe('production');
    expect(prodEnv.roles).toHaveLength(1);
    expect(prodEnv.roles[0].roleName).toBe('readonly');
    expect(prodEnv.roles[0].users).toHaveLength(1);
    expect(prodEnv.roles[0].users[0].username).toBe('dev.alice');
  });

  it('should correctly build project hierarchy for users config', () => {
    const content = USERS_YAML_DEFAULT;
    const res = validateYaml(content);

    const hierarchy = buildProjectHierarchy(res.usersMetadata?.users || [], res.usersMetadata?.knownProjects);
    expect(hierarchy.length).toBeGreaterThan(10);

    const chatProject = hierarchy.find(p => p.projectName === 'chat-service');
    expect(chatProject).toBeDefined();

    // Check environments exist
    const devEnv = chatProject?.environments.find(e => e.envName === 'development');
    expect(devEnv).toBeDefined();

    // In chat-service -> development, bedrock role should contain alice.smith
    const bedrockRole = devEnv?.roles.find(r => r.roleName === 'bedrock');
    expect(bedrockRole).toBeDefined();
    expect(bedrockRole?.users.some(u => u.username === 'alice.smith')).toBe(true);

    // Filter by search
    const filtered = buildProjectHierarchy(res.usersMetadata?.users || [], res.usersMetadata?.knownProjects, 'alice');
    expect(filtered).toHaveLength(2);
    expect(filtered.some(p => p.projectName === 'chat-service')).toBe(true);
  });

  it('should detect preset project anchors with hasPresetProjectAnchors', () => {
    expect(hasPresetProjectAnchors(USERS_YAML_DEFAULT)).toBe(true);
    expect(hasPresetProjectAnchors('name: sample\nfoo: bar')).toBe(false);
  });

  it('should sort projects alphabetically in all_projects_admin and all_projects_non_prod_admin', () => {
    const unorderedYaml = `---
x-roles:
  admin_role: &admin_role
    - admin
    - readonly

x-environments:
  admin_everywhere: &admin_everywhere
    - name: dev
      roles: *admin_role
  admin_non_prod: &admin_non_prod
    - name: dev
      roles: *admin_role

x-projects:
  all_projects_admin: &all_projects_admin
    - name: zebra-service
      environments: *admin_everywhere
    - name: beta-service
      environments: *admin_everywhere
    - name: alpha-service
      environments: *admin_everywhere

  all_projects_non_prod_admin: &all_projects_non_prod_admin
    - name: yellow-service
      environments: *admin_non_prod
    - name: apple-service
      environments: *admin_non_prod

users:
  - username: test.user
    projects: *all_projects_admin
`;

    // 1. Check validator detects out-of-order projects
    const beforeValidation = validateYaml(unorderedYaml);
    const orderIssues = beforeValidation.issues.filter(i => i.code === 'PROJECTS_NOT_ALPHABETICAL');
    expect(orderIssues.length).toBe(2);
    expect(orderIssues.some(i => i.message.includes('all_projects_admin'))).toBe(true);
    expect(orderIssues.some(i => i.message.includes('all_projects_non_prod_admin'))).toBe(true);

    // 2. Sort both preset anchors
    const sortResult = sortProjectsInPresetYaml(unorderedYaml);
    expect(sortResult.changed).toBe(true);
    expect(sortResult.totalSorted).toBe(5);
    expect(sortResult.sortedAnchors).toContain('all_projects_admin');
    expect(sortResult.sortedAnchors).toContain('all_projects_non_prod_admin');

    // 3. Verify order in updated YAML
    const lines = sortResult.updatedYaml.split('\n');
    const allAdminIdx = lines.findIndex(l => l.includes('all_projects_admin: &all_projects_admin'));
    const allNonProdIdx = lines.findIndex(l => l.includes('all_projects_non_prod_admin: &all_projects_non_prod_admin'));

    expect(allAdminIdx).toBeGreaterThan(-1);
    expect(allNonProdIdx).toBeGreaterThan(allAdminIdx);

    // In all_projects_admin: alpha-service -> beta-service -> zebra-service
    const adminSegment = lines.slice(allAdminIdx, allNonProdIdx).join('\n');
    const alphaPos = adminSegment.indexOf('name: alpha-service');
    const betaPos = adminSegment.indexOf('name: beta-service');
    const zebraPos = adminSegment.indexOf('name: zebra-service');
    expect(alphaPos).toBeLessThan(betaPos);
    expect(betaPos).toBeLessThan(zebraPos);

    // In all_projects_non_prod_admin: apple-service -> yellow-service
    const nonProdSegment = lines.slice(allNonProdIdx).join('\n');
    const applePos = nonProdSegment.indexOf('name: apple-service');
    const yellowPos = nonProdSegment.indexOf('name: yellow-service');
    expect(applePos).toBeLessThan(yellowPos);

    // 4. Validate updated YAML has 0 project order issues and is valid
    const afterValidation = validateYaml(sortResult.updatedYaml);
    expect(afterValidation.isValid).toBe(true);
    const orderIssuesAfter = afterValidation.issues.filter(i => i.code === 'PROJECTS_NOT_ALPHABETICAL');
    expect(orderIssuesAfter).toHaveLength(0);
  });

  it('should allow sorting a single preset anchor individually', () => {
    const unorderedYaml = `---
x-projects:
  all_projects_admin: &all_projects_admin
    - name: zulu
      environments: *admin_everywhere
    - name: alpha
      environments: *admin_everywhere

  all_projects_non_prod_admin: &all_projects_non_prod_admin
    - name: zulu
      environments: *admin_non_prod
    - name: alpha
      environments: *admin_non_prod
`;

    const sortAdminOnly = sortProjectsInPresetYaml(unorderedYaml, ['all_projects_admin']);
    expect(sortAdminOnly.changed).toBe(true);
    expect(sortAdminOnly.sortedAnchors).toEqual(['all_projects_admin']);

    // all_projects_admin is sorted
    expect(sortAdminOnly.updatedYaml.indexOf('name: alpha')).toBeLessThan(
      sortAdminOnly.updatedYaml.indexOf('name: zulu')
    );
  });

  describe('Multi-Document YAML Stream Engine', () => {
    it('should parse multi-document stream and count documents accurately', () => {
      const multiDoc = `apiVersion: v1
kind: Service
metadata:
  name: my-service
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
spec:
  replicas: 2
`;
      const res = validateYaml(multiDoc);
      expect(res.isValid).toBe(true);
      expect(res.stats.documentCount).toBe(2);
      expect(Array.isArray(res.parsedData)).toBe(true);
      expect(res.parsedData).toHaveLength(2);
      expect(res.parsedData[0].kind).toBe('Service');
      expect(res.parsedData[1].kind).toBe('Deployment');
      expect(res.resolvedYaml).toContain('kind: Service');
      expect(res.resolvedYaml).toContain('kind: Deployment');
      expect(res.resolvedYaml).toContain('---');
    });

    it('should catch syntax errors across document boundaries', () => {
      const multiDocWithError = `apiVersion: v1
kind: Service
---
apiVersion: apps/v1
kind: Deployment
bad_indentation:
 [unclosed_bracket
`;
      const res = validateYaml(multiDocWithError);
      expect(res.isValid).toBe(false);
      expect(res.stats.documentCount).toBe(2);
      const syntaxErrors = res.issues.filter(i => i.source === 'syntax' && i.severity === 'error');
      expect(syntaxErrors.length).toBeGreaterThan(0);
      expect(syntaxErrors[0].line).toBeGreaterThan(3);
    });

    it('should correctly scope anchors and aliases within documents', () => {
      const multiDocAnchors = `defaults: &svc_defaults
  timeout: 30
service:
  <<: *svc_defaults
---
app:
  # Reference to anchor in other document should be flagged as dangling
  config: *svc_defaults
`;
      const res = validateYaml(multiDocAnchors);
      expect(res.isValid).toBe(false);
      expect(res.stats.documentCount).toBe(2);
      const dangling = res.issues.find(i => i.source === 'anchor' && i.severity === 'error');
      expect(dangling).toBeDefined();
      expect(dangling?.message).toContain('svc_defaults');
    });

    it('should handle 0 documents for empty strings and 1 document for single-doc YAML', () => {
      const emptyRes = validateYaml('');
      expect(emptyRes.stats.documentCount).toBe(0);

      const singleDoc = `name: standalone-doc\nstatus: active\n`;
      const singleRes = validateYaml(singleDoc);
      expect(singleRes.stats.documentCount).toBe(1);
      expect(singleRes.parsedData.name).toBe('standalone-doc');
    });
  });

  describe('Shift-Left Security & Secret Scanner', () => {
    it('should detect sensitive plaintext keys with non-placeholder values >= 6 chars', () => {
      const yamlWithSecrets = `database:
  db_password: SuperSecretPassword123!
  username: postgres
api:
  api_key: key_live_998877665544332211
auth:
  jwt_secret: ultra_secure_jwt_signing_key_456
`;
      const res = validateYaml(yamlWithSecrets);
      const securityIssues = res.issues.filter(i => i.source === 'security');
      expect(securityIssues.length).toBe(3);

      const dbPass = securityIssues.find(i => i.message.includes('db_password'));
      expect(dbPass).toBeDefined();
      expect(dbPass?.severity).toBe('warning');
      expect(dbPass?.suggestion).toContain('environment variable');

      const apiKey = securityIssues.find(i => i.message.includes('api_key'));
      expect(apiKey).toBeDefined();

      const jwt = securityIssues.find(i => i.message.includes('jwt_secret'));
      expect(jwt).toBeDefined();
    });

    it('should not flag sensitive keys if value length is under 6 characters', () => {
      const yamlWithShortPass = `db:
  password: 12345
  passwd: abc
`;
      const res = validateYaml(yamlWithShortPass);
      const securityIssues = res.issues.filter(i => i.source === 'security');
      expect(securityIssues).toHaveLength(0);
    });

    it('should detect high-entropy and format patterns (PEM keys, AWS keys, GitHub tokens)', () => {
      const yamlWithFormats = `credentials:
  aws_access_key: AKIAIOSFODNN7ABCD123
  github_pat: ghp_123456789012345678901234567890123456
  ssl_private_key: |
    -----BEGIN PRIVATE KEY-----
    MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7
    -----END PRIVATE KEY-----
`;
      const res = validateYaml(yamlWithFormats);
      const securityIssues = res.issues.filter(i => i.source === 'security');
      expect(securityIssues.length).toBeGreaterThanOrEqual(3);

      const awsIssue = securityIssues.find(i => i.message.includes('AWS Access Key ID'));
      expect(awsIssue).toBeDefined();

      const ghIssue = securityIssues.find(i => i.message.includes('GitHub'));
      expect(ghIssue).toBeDefined();

      const pemIssue = securityIssues.find(i => i.message.includes('PEM Private Key'));
      expect(pemIssue).toBeDefined();
    });

    it('should safely ignore variable interpolations and known placeholders', () => {
      const yamlWithPlaceholders = `services:
  db:
    password: \${DATABASE_PASSWORD}
    db_password: $DB_PASS
    api_key: CHANGE_ME
    auth_token: <REDACTED>
    client_secret: replace_me
    jwt_secret: "{{ .Values.jwtSecret }}"
    private_key: TODO_INSERT_KEY
`;
      const res = validateYaml(yamlWithPlaceholders);
      const securityIssues = res.issues.filter(i => i.source === 'security');
      expect(securityIssues).toHaveLength(0);
    });
  });
});

