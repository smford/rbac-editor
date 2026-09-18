// Default users.yaml embedded sample (sanitized sample data)
export const USERS_YAML_DEFAULT = `---
# Define reusable role sets
x-roles:
  # admin role and all other roles under it
  admin_role: &admin_role
    - admin
    - readonly

# Define reusable environment structures
x-environments:
  admin_everywhere: &admin_everywhere
    - name: sandbox
      roles: *admin_role
    - name: development
      roles: *admin_role
    - name: staging
      roles: *admin_role
    - name: production
      roles: *admin_role

  admin_non_prod: &admin_non_prod
    - name: sandbox
      roles: *admin_role
    - name: development
      roles: *admin_role
    - name: staging
      roles: *admin_role
    - name: production
      roles:
        - readonly

  dev: &dev
    - name: development
      roles: *admin_role
    - name: staging
      roles:
        - readonly
    - name: production
      roles:
        - readonly

  dev_ai_readonly: &dev_ai_readonly
    - name: development
      roles:
        - bedrock

  observability_dev_write: &observability_dev_write
    - name: development
      roles:
        - observability-dev

# Define full project access for super admins
x-projects:
  all_projects_admin: &all_projects_admin
    - name: analytics-platform
      environments: *admin_everywhere
    - name: api-gateway
      environments: *admin_everywhere
    - name: auth-service
      environments: *admin_everywhere
    - name: billing-service
      environments: *admin_everywhere
    - name: chat-service
      environments: *admin_everywhere
    - name: content-delivery
      environments: *admin_everywhere
    - name: customer-portal
      environments: *admin_everywhere
    - name: data-pipeline
      environments: *admin_everywhere
    - name: identity-mgmt
      environments: *admin_everywhere
    - name: inventory-service
      environments: *admin_everywhere
    - name: messaging-hub
      environments: *admin_everywhere
    - name: monitoring-system
      environments: *admin_everywhere
    - name: notifications
      environments: *admin_everywhere
    - name: order-processing
      environments: *admin_everywhere
    - name: recommendations
      environments: *admin_everywhere
    - name: reporting-tool
      environments: *admin_everywhere
    - name: search-engine
      environments: *admin_everywhere
    - name: storage-service
      environments: *admin_everywhere
    - name: user-management
      environments: *admin_everywhere
    - name: workflow-orchestrator
      environments: *admin_everywhere

  all_projects_non_prod_admin: &all_projects_non_prod_admin
    - name: analytics-platform
      environments: *admin_non_prod
    - name: api-gateway
      environments: *admin_non_prod
    - name: auth-service
      environments: *admin_non_prod
    - name: billing-service
      environments: *admin_non_prod
    - name: chat-service
      environments: *admin_non_prod
    - name: content-delivery
      environments: *admin_non_prod
    - name: customer-portal
      environments: *admin_non_prod
    - name: data-pipeline
      environments: *admin_non_prod
    - name: identity-mgmt
      environments: *admin_non_prod
    - name: inventory-service
      environments: *admin_non_prod
    - name: messaging-hub
      environments: *admin_non_prod
    - name: monitoring-system
      environments: *admin_non_prod
    - name: notifications
      environments: *admin_non_prod
    - name: order-processing
      environments: *admin_non_prod
    - name: recommendations
      environments: *admin_non_prod
    - name: reporting-tool
      environments: *admin_non_prod
    - name: search-engine
      environments: *admin_non_prod
    - name: storage-service
      environments: *admin_non_prod
    - name: user-management
      environments: *admin_non_prod
    - name: workflow-orchestrator
      environments: *admin_non_prod

users:

  - username: aaron.brooks
    projects:
      - name: auth-service
        environments:
          - name: development
            roles: *admin_role
          - name: staging
            roles: *admin_role

  - username: alexander.wright
    projects: *all_projects_admin

  - username: alice.smith
    projects:
      - name: chat-service
        environments: *dev_ai_readonly
      - name: recommendations
        environments:
          - name: development
            roles:
              - readonly

  - username: benjamin.clark
    projects:
      - name: monitoring-system
        environments:
          - name: development
            roles: *admin_role
      - name: notifications
        environments:
          - name: development
            roles: *admin_role
          - name: staging
            roles: *admin_role

  - username: bradley.cooper
    projects:
      - name: analytics-platform
        environments: *admin_non_prod

  - username: cameron.diaz
    projects:
      - name: customer-portal
        environments: *dev

  - username: charlotte.king
    projects: *all_projects_non_prod_admin

  - username: clara.oswald
    projects:
      - name: content-delivery
        environments: *admin_non_prod

  - username: daniel.reed
    projects: *all_projects_non_prod_admin

  - username: david.jones
    projects:
      - name: billing-service
        environments:
          - name: development
            roles: *admin_role
          - name: staging
            roles:
              - readonly

  - username: eleanor.vance
    projects: *all_projects_admin

  - username: elena.rostova
    projects:
      - name: search-engine
        environments: *admin_non_prod

  - username: fiona.gallagher
    projects:
      - name: inventory-service
        environments: *admin_non_prod

  - username: george.lucas
    projects:
      - name: messaging-hub
        environments: *admin_non_prod

  - username: grace.hopper
    projects: *all_projects_non_prod_admin

  - username: hannah.abbott
    projects:
      - name: order-processing
        environments: *dev

  - username: ian.wright
    projects:
      - name: reporting-tool
        environments: *admin_non_prod

  - username: jack.sparrow
    projects:
      - name: storage-service
        environments: *admin_non_prod

  - username: jordan.miller
    projects: *all_projects_non_prod_admin

  - username: kate.bishop
    projects:
      - name: api-gateway
        environments: *admin_non_prod

  - username: liam.neeson
    projects:
      - name: monitoring-system
        environments: *observability_dev_write

  - username: lucas.scott
    projects:
      - name: data-pipeline
        environments: *admin_non_prod

  - username: marcus.foster
    projects: *all_projects_admin

  - username: maya.lin
    projects:
      - name: user-management
        environments: *admin_non_prod

  - username: morgan.bailey
    projects: *all_projects_non_prod_admin

  - username: nathan.drake
    projects:
      - name: workflow-orchestrator
        environments: *admin_non_prod

  - username: oliver.queen
    projects:
      - name: identity-mgmt
        environments: *admin_non_prod

  - username: pat.power
    projects: *all_projects_non_prod_admin

  - username: peter.parker
    projects:
      - name: chat-service
        environments: *admin_non_prod

  - username: quinn.fabray
    projects:
      - name: notifications
        environments: *admin_non_prod

  - username: rachel.green
    projects:
      - name: customer-portal
        environments: *admin_non_prod

  - username: riley.carter
    projects: *all_projects_non_prod_admin

  - username: samuel.green
    projects: *all_projects_non_prod_admin

  - username: sophie.turner
    projects:
      - name: analytics-platform
        environments: *admin_non_prod

  - username: tom.holland
    projects:
      - name: api-gateway
        environments:
          - name: development
            roles: *admin_role
          - name: staging
            roles:
              - readonly

  - username: victor.stone
    projects:
      - name: storage-service
        environments:
          - name: development
            roles:
              - readonly

  - username: william.riker
    projects:
      - name: billing-service
        environments: *admin_non_prod

  - username: zoe.saldana
    projects:
      - name: workflow-orchestrator
        environments:
          - name: sandbox
            roles: *admin_role
          - name: development
            roles: *admin_role
`;
