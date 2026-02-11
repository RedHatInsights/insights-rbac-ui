import React, { useCallback, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { useSearchParams } from 'react-router-dom';
import { TableView } from './TableView';
import { useTableState } from './hooks/useTableState';
import type { CursorLinks } from './hooks/useCursorPaginationState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from './components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, ExpansionRendererMap, FilterConfig } from './types';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { withRouter } from '../../../.storybook/helpers/router-test-utils';

// =============================================================================
// Mock Data Types & Factories
// =============================================================================

interface Role {
  uuid: string;
  name: string;
  display_name: string;
  description: string;
  accessCount: number;
  modified: string;
  system: boolean;
}

interface Permission {
  permission: string;
  description: string;
}

// Generate more mock data for pagination testing
const generateMockRoles = (count: number): Role[] => {
  const roles: Role[] = [];
  const names = ['Administrator', 'Viewer', 'Editor', 'Auditor', 'Developer', 'Manager', 'Analyst', 'Support', 'Tester', 'Designer'];
  const descriptions = [
    'Full system access',
    'Read-only access',
    'Content management',
    'Audit and compliance',
    'Development access',
    'Team management',
    'Data analysis',
    'Customer support',
    'Quality assurance',
    'UI/UX design',
  ];

  for (let i = 1; i <= count; i++) {
    const nameIdx = (i - 1) % names.length;
    roles.push({
      uuid: `role-${i}`,
      name: `role_${i}`,
      display_name: `${names[nameIdx]} ${Math.ceil(i / names.length)}`,
      description: descriptions[nameIdx],
      // Use deterministic values derived from i to avoid flaky visual/interaction tests
      accessCount: (i % 20) + 1,
      // Spread modified dates over the past year deterministically based on i
      modified: new Date(Date.now() - ((i % 365) + 1) * 24 * 60 * 60 * 1000).toISOString(),
      system: i === 4, // Only one system role for testing
    });
  }
  return roles;
};

const allMockRoles = generateMockRoles(50);

// Mock permissions for expansion
const mockPermissions: Record<string, Permission[]> = {
  'role-1': [
    { permission: 'rbac:role:read', description: 'Read roles' },
    { permission: 'rbac:role:write', description: 'Write roles' },
    { permission: 'rbac:group:read', description: 'Read groups' },
  ],
  'role-2': [{ permission: 'rbac:role:read', description: 'Read roles' }],
  'role-3': [
    { permission: 'rbac:content:read', description: 'Read content' },
    { permission: 'rbac:content:write', description: 'Write content' },
  ],
};

// =============================================================================
// Column Definitions (Type-Safe)
// =============================================================================

const columns = ['name', 'description', 'permissions', 'modified'] as const;
const sortableColumns = ['name', 'modified'] as const;
type SortableColumnId = (typeof sortableColumns)[number];
type CompoundColumnId = 'permissions';

// Column config WITH expansion
const columnConfigWithExpansion: ColumnConfigMap<typeof columns> = {
  name: { label: 'Name', sortable: true },
  description: { label: 'Description' },
  permissions: { label: 'Permissions', isCompound: true },
  modified: { label: 'Last Modified', sortable: true },
};

// Column config WITHOUT expansion (permissions is NOT compound)
const columnConfigWithoutExpansion: ColumnConfigMap<typeof columns> = {
  name: { label: 'Name', sortable: true },
  description: { label: 'Description' },
  permissions: { label: 'Permissions', isCompound: false },
  modified: { label: 'Last Modified', sortable: true },
};

// =============================================================================
// Cell Renderers
// =============================================================================

const cellRenderers: CellRendererMap<typeof columns, Role> = {
  name: (row) => row.display_name,
  description: (row) => row.description || '—',
  permissions: (row) => row.accessCount,
  modified: (row) => new Date(row.modified).toLocaleDateString(),
};

const expansionRenderers: ExpansionRendererMap<CompoundColumnId, Role> = {
  permissions: (row) => {
    const permissions = mockPermissions[row.uuid] || [{ permission: 'No permissions defined', description: 'N/A' }];
    return (
      <div data-testid={`expanded-permissions-${row.uuid}`}>
        <Table aria-label={`Permissions for ${row.display_name}`} variant="compact">
          <Thead>
            <Tr>
              <Th>Permission</Th>
              <Th>Description</Th>
            </Tr>
          </Thead>
          <Tbody>
            {permissions.map((p) => (
              <Tr key={p.permission}>
                <Td dataLabel="Permission">{p.permission}</Td>
                <Td dataLabel="Description">{p.description}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    );
  },
};

// =============================================================================
// Filter Configuration
// =============================================================================

const filterConfig: FilterConfig[] = [
  { type: 'text', id: 'name', label: 'Name', placeholder: 'Filter by name...' },
  {
    type: 'checkbox',
    id: 'type',
    label: 'Type',
    options: [
      { id: 'custom', label: 'Custom' },
      { id: 'system', label: 'System' },
    ],
  },
];

// =============================================================================
// Row Actions Component
// =============================================================================

interface RoleActionsProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

const RoleActions: React.FC<RoleActionsProps> = ({ role, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={`Actions for ${role.display_name}`}
          variant="plain"
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem
          key="edit"
          onClick={() => {
            setIsOpen(false);
            onEdit(role);
          }}
          isDisabled={role.system}
        >
          Edit
        </DropdownItem>
        <DropdownItem
          key="delete"
          onClick={() => {
            setIsOpen(false);
            onDelete(role);
          }}
          isDisabled={role.system}
        >
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

// =============================================================================
// Spies for Testing
// =============================================================================

// API call spy - tracks all "API" calls with parameters
const apiCallSpy = fn();

// Action spies
const onEditSpy = fn();
const onDeleteSpy = fn();
const onBulkDeleteSpy = fn();
const onCreateSpy = fn();

// =============================================================================
// Test Helpers - Reduce duplication in play functions
// =============================================================================

/**
 * Wait for initial data to load and return canvas.
 * Most play functions need to wait for data before interacting.
 */
async function waitForInitialLoad(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await waitFor(() => {
    expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
  });
  return canvas;
}

/**
 * Apply a text filter to the name filter input.
 */
async function applyNameFilter(canvas: ReturnType<typeof within>, value: string) {
  const input = canvas.getByPlaceholderText(/filter by name/i);
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

/**
 * Get the last API call parameters from the spy.
 */
function getLastApiCall(spy: ReturnType<typeof fn>) {
  const { calls } = spy.mock;
  return calls.length > 0 ? calls[calls.length - 1][0] : null;
}

/**
 * Click the "Clear filters" button.
 */
async function clickClearFilters(canvas: ReturnType<typeof within>) {
  const clearButtons = canvas.getAllByText('Clear filters');
  await userEvent.click(clearButtons[0]);
}

// =============================================================================
// Shared API Fetch Helper
// =============================================================================

interface RolesApiParams {
  offset: number;
  limit: number;
  orderBy?: string;
  filters: Record<string, string | string[]>;
}

interface RolesApiResponse {
  data: Role[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

/**
 * Fetch roles data from the mock API.
 * Used by both InteractiveTable and UrlSyncTable.
 */
async function fetchRolesData(apiParams: RolesApiParams, options?: { forceEmpty?: boolean }): Promise<RolesApiResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(apiParams.limit));
  params.set('offset', String(apiParams.offset));

  if (apiParams.orderBy) {
    params.set('order_by', apiParams.orderBy);
  }

  const nameFilter = apiParams.filters.name;
  if (nameFilter && typeof nameFilter === 'string' && nameFilter.trim()) {
    params.set('name', nameFilter);
  }

  const typeFilter = apiParams.filters.type;
  if (Array.isArray(typeFilter) && typeFilter.length > 0) {
    params.set('type', typeFilter.join(','));
  }

  if (options?.forceEmpty) {
    params.set('force_empty', 'true');
  }

  const response = await fetch(`/api/rbac/v1/roles/?${params.toString()}`);
  return response.json();
}

// =============================================================================
// Interactive Table Wrapper Component
// =============================================================================

interface InteractiveTableProps {
  initialLoading?: boolean;
  forceEmpty?: boolean;
  enableSelection?: boolean;
  enableExpansion?: boolean;
  /** If true, only allows expansion on rows that have permissions defined */
  conditionalExpansion?: boolean;
  enableActions?: boolean;
  enableFilters?: boolean;
  syncWithUrl?: boolean;
  variant?: 'default' | 'compact';
  ouiaId?: string;
  /** Custom empty state for no data - uses default if not provided */
  customEmptyStateNoData?: React.ReactNode;
  /** Custom empty state for no results - uses default if not provided */
  customEmptyStateNoResults?: React.ReactNode;
}

/**
 * Wrapper component that uses useTableState for proper state management.
 * Fetches data from a fake API (MSW handler) to demonstrate real-world usage.
 */
const InteractiveTable: React.FC<InteractiveTableProps> = ({
  forceEmpty = false,
  enableSelection = true,
  enableExpansion = true,
  conditionalExpansion = false,
  enableActions = true,
  enableFilters = true,
  syncWithUrl = false,
  variant = 'default',
  ouiaId = 'interactive-table',
  customEmptyStateNoData,
  customEmptyStateNoResults,
}) => {
  // Data state - undefined means loading
  const [data, setData] = useState<Role[] | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);

  // Choose column config based on expansion setting
  const columnConfig = enableExpansion ? columnConfigWithExpansion : columnConfigWithoutExpansion;

  // Fetch data from API - called by useTableState via onStaleData
  const handleStaleData = useCallback(
    async (apiParams: RolesApiParams) => {
      setData(undefined);
      try {
        const json = await fetchRolesData(apiParams, { forceEmpty });
        setData(json.data);
        setTotalCount(json.meta.count);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        setData([]);
        setTotalCount(0);
      }
    },
    [forceEmpty],
  );

  // Use the hook for all state management - onStaleData handles fetching automatically
  const tableState = useTableState<typeof columns, Role, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns,
    compoundColumns: enableExpansion ? (['permissions'] as const) : ([] as const),
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    getRowId: (role) => role.uuid,
    isRowSelectable: (role) => !role.system,
    syncWithUrl,
    onStaleData: handleStaleData,
  });

  // Wrap clearAllFilters to immediately set loading state
  // This prevents a flash of "no data" empty state when clearing from "no results"
  const handleClearAllFilters = useCallback(() => {
    setData(undefined); // Show loading immediately
    tableState.clearAllFilters();
  }, [tableState]);

  // Bulk delete handler
  const handleBulkDelete = () => {
    onBulkDeleteSpy(tableState.selectedRows);
    // Clear selection after delete
    tableState.clearSelection();
  };

  return (
    <TableView
      // Column definitions
      columns={columns}
      columnConfig={columnConfig}
      sortableColumns={sortableColumns}
      // Data - undefined means loading, empty array means no data
      data={data}
      totalCount={totalCount}
      getRowId={(role) => role.uuid}
      // Renderers
      cellRenderers={cellRenderers}
      expansionRenderers={enableExpansion ? expansionRenderers : undefined}
      // Conditional expansion - only rows with permissions defined can expand
      isCellExpandable={
        conditionalExpansion
          ? (role) => {
              // Only allow expansion if the role has permissions defined
              return !!mockPermissions[role.uuid];
            }
          : undefined
      }
      // Filtering
      filterConfig={enableFilters ? filterConfig : undefined}
      // Selection
      selectable={enableSelection}
      isRowSelectable={(role) => !role.system}
      // Row actions
      renderActions={enableActions ? (role) => <RoleActions role={role} onEdit={onEditSpy} onDelete={onDeleteSpy} /> : undefined}
      // Toolbar
      toolbarActions={
        <Button variant="primary" onClick={() => onCreateSpy()}>
          Create role
        </Button>
      }
      bulkActions={
        tableState.selectedRows.length > 0 ? (
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete selected ({tableState.selectedRows.length})
          </Button>
        ) : undefined
      }
      // Empty states - pass custom ones if provided, otherwise use defaults
      emptyStateNoData={customEmptyStateNoData}
      emptyStateNoResults={customEmptyStateNoResults}
      // Config
      variant={variant}
      ouiaId={ouiaId}
      ariaLabel="Roles table"
      // Spread all state from hook, but override clearAllFilters with wrapped version
      {...tableState}
      clearAllFilters={handleClearAllFilters}
    />
  );
};

// =============================================================================
// Out of Range Page Test Component
// =============================================================================

/**
 * Component for testing out-of-range page clamping.
 * Expects to be rendered inside a MemoryRouter with initialEntries set to an out-of-range page.
 */
const OutOfRangePageTable: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<Role[] | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);

  const handleStaleData = useCallback(async (apiParams: RolesApiParams) => {
    setData(undefined);
    try {
      const json = await fetchRolesData(apiParams);
      setData(json.data);
      setTotalCount(json.meta.count);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setData([]);
      setTotalCount(0);
    }
  }, []);

  const tableState = useTableState<typeof columns, Role, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns,
    compoundColumns: ['permissions'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    getRowId: (role) => role.uuid,
    syncWithUrl: true,
    onStaleData: handleStaleData,
  });

  return (
    <div>
      <div data-testid="url-params" style={{ marginBottom: '16px', padding: '8px', background: '#f0f0f0', fontFamily: 'monospace' }}>
        URL: ?{searchParams.toString() || '(empty)'}
      </div>
      <TableView
        columns={columns}
        columnConfig={columnConfigWithExpansion}
        sortableColumns={sortableColumns}
        data={data}
        totalCount={totalCount}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        expansionRenderers={expansionRenderers}
        ariaLabel="Out of range page test table"
        ouiaId="out-of-range-table"
        {...tableState}
      />
    </div>
  );
};

// =============================================================================
// URL Sync Test Component
// =============================================================================

interface UrlSyncTableProps {
  ouiaId?: string;
}

/**
 * Component that syncs state with URL for testing URL parameters.
 */
const UrlSyncTable: React.FC<UrlSyncTableProps> = ({ ouiaId = 'url-sync-table' }) => {
  const [searchParams] = useSearchParams();

  // Data state - undefined means loading
  const [data, setData] = useState<Role[] | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch data from API - called by useTableState via onStaleData
  const handleStaleData = useCallback(async (apiParams: RolesApiParams) => {
    setData(undefined);
    try {
      const json = await fetchRolesData(apiParams);
      setData(json.data);
      setTotalCount(json.meta.count);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setData([]);
      setTotalCount(0);
    }
  }, []);

  // Use the hook with URL sync enabled - onStaleData handles fetching automatically
  const tableState = useTableState<typeof columns, Role, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns,
    compoundColumns: ['permissions'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    getRowId: (role) => role.uuid,
    isRowSelectable: (role) => !role.system,
    syncWithUrl: true, // Enable URL sync
    onStaleData: handleStaleData,
  });

  // Track URL params for testing
  useEffect(() => {
    apiCallSpy({
      urlParams: Object.fromEntries(searchParams.entries()),
      page: tableState.page,
      perPage: tableState.perPage,
      sort: tableState.sort,
      filters: tableState.filters,
    });
  }, [searchParams, tableState.page, tableState.perPage, tableState.sort, tableState.filters]);

  return (
    <div>
      {/* Debug: Show current URL params */}
      <div data-testid="url-params" style={{ marginBottom: '16px', padding: '8px', background: '#f0f0f0', fontFamily: 'monospace' }}>
        URL: ?{searchParams.toString() || '(empty)'}
      </div>
      <TableView
        columns={columns}
        columnConfig={columnConfigWithExpansion}
        sortableColumns={sortableColumns}
        data={data}
        totalCount={totalCount}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        expansionRenderers={expansionRenderers}
        filterConfig={filterConfig}
        selectable
        isRowSelectable={(role) => !role.system}
        variant="default"
        ouiaId={ouiaId}
        ariaLabel="URL Sync Test Table"
        {...tableState}
      />
    </div>
  );
};

// =============================================================================
// Story Meta
// =============================================================================

const meta: Meta<typeof InteractiveTable> = {
  title: 'Components/TableView',
  component: InteractiveTable,
  tags: ['table-view'],
  parameters: {
    // MSW handlers for fake API
    msw: {
      handlers: [
        // Roles list API - handles pagination, sorting, filtering
        http.get('/api/rbac/v1/roles/', async ({ request }) => {
          await delay();
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '10');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const orderBy = url.searchParams.get('order_by') || 'name';
          const nameFilter = url.searchParams.get('name') || '';
          const typeFilter = url.searchParams.get('type') || '';
          const forceEmpty = url.searchParams.get('force_empty') === 'true';

          // Track API call with spy
          apiCallSpy({
            limit,
            offset,
            orderBy,
            nameFilter,
            typeFilter,
            forceEmpty,
          });

          // Return empty data if requested
          if (forceEmpty) {
            return HttpResponse.json({
              data: [],
              meta: { count: 0, limit, offset },
            });
          }

          // Start with all mock data
          let result = [...allMockRoles];

          // Apply name filter
          if (nameFilter.trim()) {
            result = result.filter((r) => r.display_name.toLowerCase().includes(nameFilter.toLowerCase()));
          }

          // Apply type filter
          if (typeFilter) {
            const types = typeFilter.split(',');
            result = result.filter((r) => {
              if (types.includes('system') && r.system) return true;
              if (types.includes('custom') && !r.system) return true;
              return false;
            });
          }

          // Apply sorting
          const sortDesc = orderBy.startsWith('-');
          const sortColumn = sortDesc ? orderBy.slice(1) : orderBy;
          result.sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            if (sortColumn === 'name') {
              aVal = a.display_name.toLowerCase();
              bVal = b.display_name.toLowerCase();
            } else if (sortColumn === 'modified') {
              aVal = new Date(a.modified).getTime();
              bVal = new Date(b.modified).getTime();
            } else {
              return 0;
            }

            if (aVal < bVal) return sortDesc ? 1 : -1;
            if (aVal > bVal) return sortDesc ? -1 : 1;
            return 0;
          });

          // Get total before pagination
          const totalCount = result.length;

          // Apply pagination
          const paginatedData = result.slice(offset, offset + limit);

          return HttpResponse.json({
            data: paginatedData,
            meta: { count: totalCount, limit, offset },
          });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# TableView Component

A unified, type-safe table component for the RBAC UI that handles:

- **Columns**: Defined as \`const\` tuples for extreme TypeScript safety
- **Filtering**: Decoupled from columns - supports text and checkbox filters
- **Sorting**: Strongly typed to sortable columns only
- **Pagination**: Page and per-page controls with URL sync
- **Selection**: Row checkboxes with bulk actions
- **Compound Expansion**: Click cells to expand with nested content
- **Row Actions**: Per-row action menus
- **URL Sync**: Optional state persistence to URL query params

## API Integration

Stories use MSW (Mock Service Worker) to simulate a real API. The component fetches
data from \`/api/rbac/v1/roles/\` with query parameters for:
- \`limit\` and \`offset\` for pagination
- \`order_by\` for sorting (prefix with \`-\` for descending)
- \`name\` for text filtering
- \`type\` for checkbox filtering

## Usage

\`\`\`typescript
const columns = ['name', 'description', 'permissions'] as const;
const sortableColumns = ['name'] as const;

const tableState = useTableState({
  columns,
  sortableColumns,
  compoundColumns: ['permissions'],
  getRowId: (r) => r.uuid,
  syncWithUrl: true,
});

// Fetch data using tableState.apiParams
const { data, totalCount } = await fetchRoles(tableState.apiParams);

<TableView
  columns={columns}
  columnConfig={columnConfig}
  data={data}
  totalCount={totalCount}
  cellRenderers={cellRenderers}
  expansionRenderers={expansionRenderers}
  {...tableState}
/>
\`\`\`
        `,
      },
    },
  },
  decorators: [withRouter],
  // Reset spies before each story
  beforeEach: () => {
    apiCallSpy.mockClear();
    onEditSpy.mockClear();
    onDeleteSpy.mockClear();
    onBulkDeleteSpy.mockClear();
    onCreateSpy.mockClear();
  },
};

export default meta;
type Story = StoryObj<typeof InteractiveTable>;

// =============================================================================
// BASIC STORIES
// =============================================================================

/**
 * Default interactive table with all features enabled.
 * Try: sorting columns, filtering by name, selecting rows, expanding permissions.
 */
export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
# TableView Component

A high-level table component that handles pagination, sorting, filtering, selection, 
compound expansion, and row actions with full TypeScript safety.

## Basic Usage

\`\`\`tsx
import { TableView, useTableState } from '@/components/table-view';

const columns = ['name', 'description', 'modified'] as const;

const MyTable = () => {
  const tableState = useTableState({
    columns,
    getRowId: (row) => row.id,
    syncWithUrl: true,
    onStaleData: (params) => fetchData(params),
  });

  return (
    <TableView
      {...tableState}
      columns={columns}
      columnConfig={{
        name: { label: 'Name' },
        description: { label: 'Description' },
        modified: { label: 'Modified' },
      }}
      data={data}
      totalCount={totalCount}
      getRowId={(row) => row.id}
      cellRenderers={{
        name: (row) => row.name,
        description: (row) => row.description,
        modified: (row) => <DateFormat date={row.modified} />,
      }}
      ariaLabel="My Table"
    />
  );
};
\`\`\`

## Features

### Sorting
Add \`sortableColumns\` prop and configure columns with \`sortable: true\`:
\`\`\`tsx
const sortableColumns = ['name', 'modified'] as const;
<TableView sortableColumns={sortableColumns} ... />
\`\`\`

### Filtering
Use \`filterConfig\` to define filters (decoupled from columns):
\`\`\`tsx
<TableView
  filterConfig={[
    { id: 'name', label: 'Name', type: 'text', placeholder: 'Filter by name...' },
    { id: 'type', label: 'Type', type: 'checkbox', options: [
      { value: 'system', label: 'System' },
      { value: 'custom', label: 'Custom' },
    ]},
  ]}
/>
\`\`\`

### Selection
Enable with \`selectable\` prop. Use \`isRowSelectable\` for conditional selection:
\`\`\`tsx
<TableView
  selectable
  isRowSelectable={(row) => !row.system}
  bulkActions={<Button onClick={() => handleBulkDelete(tableState.selectedRows)}>Delete</Button>}
/>
\`\`\`

### Compound Expansion
Define \`compoundColumns\` and provide \`expansionRenderers\`:
\`\`\`tsx
const compoundColumns = ['permissions'] as const;
<TableView
  compoundColumns={compoundColumns}
  expansionRenderers={{
    permissions: (row) => <PermissionsTable roleId={row.id} />,
  }}
/>
\`\`\`

### Custom Empty States
Override default empty states with custom components:
\`\`\`tsx
<TableView
  emptyStateNoData={<DefaultEmptyStateNoData title="No items yet" />}
  emptyStateNoResults={
    <DefaultEmptyStateNoResults
      title="No results"
      onClearFilters={tableState.clearAllFilters}
    />
  }
/>
\`\`\`

## Related Stories
- **Sorting**: SortingInteraction
- **Filtering**: TextFilteringWithClear, MultipleFiltersWithChips
- **Selection**: SelectionWithBulkDelete
- **Expansion**: CompoundExpansion, ConditionalExpansion
- **Empty States**: CustomEmptyStateNoData, CustomEmptyStateNoResults
- **URL Sync**: URLSynchronization
        `,
      },
    },
  },
  args: {
    enableSelection: true,
    enableExpansion: true,
    enableActions: true,
    enableFilters: true,
    variant: 'default',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Verify toolbar actions
    expect(canvas.getByText('Create role')).toBeInTheDocument();
  },
};

/**
 * Compact variant for denser tables.
 */
export const CompactVariant: Story = {
  args: {
    variant: 'compact',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Verify compact class is applied
    const table = canvasElement.querySelector('.pf-m-compact');
    expect(table).toBeInTheDocument();
  },
};

/**
 * Loading state shows skeleton while data is being fetched.
 * Uses infinite delay MSW handler to keep the table in loading state.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/roles/', async () => {
          await delay('infinite'); // Never resolves - keeps skeleton visible
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const skeletonElements = canvasElement.querySelectorAll('[class*="skeleton"], .pf-v6-c-skeleton');
    expect(skeletonElements.length).toBeGreaterThan(0);
  },
};

/**
 * Default empty state when there's no data.
 * Uses the built-in default empty state component.
 */
export const DefaultEmptyState: Story = {
  args: {
    forceEmpty: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      // Default empty state shows "No data available"
      expect(canvas.getByText('No data available')).toBeInTheDocument();
      expect(canvas.getByText(/There is no data to display/)).toBeInTheDocument();
    });
  },
};

/**
 * Custom empty state for no data using DefaultEmptyStateNoData component.
 * Demonstrates using the exported component with custom title/body props.
 */
export const CustomEmptyStateNoData: Story = {
  args: {
    forceEmpty: true,
    customEmptyStateNoData: (
      <DefaultEmptyStateNoData title="🚀 No roles configured yet" body="Create your first role to start managing permissions." />
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('🚀 No roles configured yet')).toBeInTheDocument();
      expect(canvas.getByText('Create your first role to start managing permissions.')).toBeInTheDocument();
    });
  },
};

/**
 * Custom empty state for no search results using DefaultEmptyStateNoResults.
 * Note: The "Clear filters" button won't appear here because onClearFilters isn't passed
 * (Storybook args are static). In real usage, pass tableState.clearAllFilters to enable it.
 * If you don't provide a custom emptyStateNoResults, TableView automatically wires the button.
 */
export const CustomEmptyStateNoResults: Story = {
  args: {
    customEmptyStateNoResults: (
      <DefaultEmptyStateNoResults title="🔍 No matching roles found" body="Try adjusting your search criteria or removing some filters." />
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Type a filter that will return no results
    const filterInput = canvas.getByPlaceholderText(/filter by name/i);
    await userEvent.type(filterInput, 'nonexistent12345');

    // Verify custom empty state appears
    await waitFor(() => {
      expect(canvas.getByText('🔍 No matching roles found')).toBeInTheDocument();
    });
  },
};

/**
 * Fully custom empty state with action button.
 * Demonstrates using DefaultEmptyStateNoData with a custom action handler.
 */
export const CustomEmptyStateWithAction: Story = {
  args: {
    forceEmpty: true,
    customEmptyStateNoData: (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>🎉 Get started with roles</h3>
        <p style={{ marginBottom: '16px' }}>Roles let you define what users can do in your application.</p>
        <Button variant="primary" onClick={onCreateSpy}>
          Create your first role
        </Button>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('🎉 Get started with roles')).toBeInTheDocument();
    });

    // Click the action button
    const createButton = canvas.getByRole('button', { name: /create your first role/i });
    await userEvent.click(createButton);

    expect(onCreateSpy).toHaveBeenCalled();
  },
};

// =============================================================================
// SELECTION & BULK ACTIONS STORIES
// =============================================================================

/**
 * Selection with bulk delete action.
 * Tests: selecting rows, bulk actions appearing, onBulkDelete callback with correct row data.
 */
export const SelectionWithBulkDelete: Story = {
  args: {
    enableSelection: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Clear spies
    onBulkDeleteSpy.mockClear();

    // Find row checkboxes (skip bulk select which is first)
    const checkboxes = canvas.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1);

    // Select first two rows
    await userEvent.click(checkboxes[1]);
    await userEvent.click(checkboxes[2]);

    // Should see bulk delete button
    await waitFor(() => {
      expect(canvas.getByText(/Delete selected \(2\)/)).toBeInTheDocument();
    });

    // Click bulk delete
    const deleteButton = canvas.getByText(/Delete selected/);
    await userEvent.click(deleteButton);

    // Verify callback was called with correct selected rows data
    await waitFor(() => {
      expect(onBulkDeleteSpy).toHaveBeenCalledTimes(1);
      const selectedRows = onBulkDeleteSpy.mock.calls[0][0];
      expect(selectedRows).toHaveLength(2);

      // Verify each selected row has the expected structure (Role interface)
      selectedRows.forEach((row: Role) => {
        expect(row).toHaveProperty('uuid');
        expect(row).toHaveProperty('display_name');
        expect(row).toHaveProperty('description');
        expect(row).toHaveProperty('accessCount');
        expect(row.uuid).toMatch(/^role-\d+$/);
      });
    });
  },
};

/**
 * Table without selection feature.
 */
export const NoSelection: Story = {
  args: {
    enableSelection: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Should not have checkboxes
    const checkboxes = canvas.queryAllByRole('checkbox');
    expect(checkboxes.length).toBe(0);
  },
};

// =============================================================================
// ROW ACTIONS STORIES
// =============================================================================

/**
 * Row actions with edit/delete callbacks.
 * Tests: clicking actions triggers callbacks with correct row data.
 */
export const RowActionsWithCallbacks: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Clear spies
    onEditSpy.mockClear();
    onDeleteSpy.mockClear();

    // Find and click actions menu for first row
    const actionsToggle = canvas.getByLabelText('Actions for Administrator 1');
    await userEvent.click(actionsToggle);

    // Click Edit
    await waitFor(() => {
      expect(within(document.body).getByText('Edit')).toBeInTheDocument();
    });
    await userEvent.click(within(document.body).getByText('Edit'));

    // Verify edit callback was called with correct role data
    await waitFor(() => {
      expect(onEditSpy).toHaveBeenCalledTimes(1);
      const editedRole = onEditSpy.mock.calls[0][0];
      // Verify the full role object structure
      expect(editedRole).toMatchObject({
        uuid: 'role-1',
        display_name: 'Administrator 1',
        description: 'Full system access',
      });
      expect(editedRole.accessCount).toBeGreaterThan(0);
      expect(editedRole.modified).toBeDefined();
    });

    // Open menu again and click Delete
    await userEvent.click(actionsToggle);
    await waitFor(() => {
      expect(within(document.body).getByText('Delete')).toBeInTheDocument();
    });
    await userEvent.click(within(document.body).getByText('Delete'));

    // Verify delete callback was called with correct role data
    await waitFor(() => {
      expect(onDeleteSpy).toHaveBeenCalledTimes(1);
      const deletedRole = onDeleteSpy.mock.calls[0][0];
      // Verify the full role object structure
      expect(deletedRole).toMatchObject({
        uuid: 'role-1',
        display_name: 'Administrator 1',
        description: 'Full system access',
      });
      expect(deletedRole.accessCount).toBeGreaterThan(0);
      expect(deletedRole.modified).toBeDefined();
    });
  },
};

/**
 * Table without row actions.
 */
export const NoActions: Story = {
  args: {
    enableActions: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    const actionsToggle = canvas.queryByLabelText(/Actions for/);
    expect(actionsToggle).toBeNull();
  },
};

/**
 * Toolbar actions with Create button callback.
 * Tests: clicking toolbar action button triggers callback.
 */
export const ToolbarActionsCallback: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Clear the spy
    onCreateSpy.mockClear();

    // Find and click the Create button
    const createButton = canvas.getByText('Create role');
    expect(createButton).toBeInTheDocument();
    await userEvent.click(createButton);

    // Verify callback was triggered
    await waitFor(() => {
      expect(onCreateSpy).toHaveBeenCalledTimes(1);
    });
  },
};

// =============================================================================
// FILTERING STORIES
// =============================================================================

/**
 * Text filtering with clear all.
 * Tests: filtering updates API params, clear filters resets them.
 */
export const TextFilteringWithClear: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = await waitForInitialLoad(canvasElement);
    apiCallSpy.mockClear();

    // Apply filter using helper
    await applyNameFilter(canvas, 'Admin');

    // Verify API was called with filter parameter
    await waitFor(() => {
      const lastCall = getLastApiCall(apiCallSpy);
      expect(lastCall?.nameFilter).toContain('Admin');
      expect(lastCall?.offset).toBe(0);
    });

    // Clear filters using helper
    await clickClearFilters(canvas);

    // Verify API was called with cleared filter
    await waitFor(() => {
      const lastCall = getLastApiCall(apiCallSpy);
      expect(lastCall?.nameFilter).toBe('');
    });
  },
};

/**
 * Multiple filters (text + checkbox) with chips.
 * Tests: applying text filter, switching filter type, and applying checkbox filter.
 */
export const MultipleFiltersWithChips: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    apiCallSpy.mockClear();

    // 1. Apply name filter (text filter)
    const filterInput = canvas.getByPlaceholderText(/filter by name/i);
    await userEvent.type(filterInput, 'Admin');

    // Verify name filter was sent to API (wait for debounce)
    await waitFor(() => {
      const { calls } = apiCallSpy.mock;
      expect(calls.length).toBeGreaterThan(0);
      const filterCall = calls.find((c) => c[0].nameFilter?.includes('Admin'));
      expect(filterCall).toBeDefined();
    });

    // 2. Switch to Type filter - find the filter type toggle within DataViewFilters
    // The toggle is a MenuToggle button that shows the current filter type (initially "Name")
    const filterContainer = canvasElement.querySelector('[data-ouia-component-id="DataViewFilters"]');
    expect(filterContainer).toBeTruthy();
    const filterCanvas = within(filterContainer as HTMLElement);

    // Find the filter type dropdown button (it shows "Name" as current selection)
    const filterTypeButtons = filterCanvas.getAllByRole('button');
    // The first MenuToggle with text content is the filter type selector
    const filterDropdownButton = filterTypeButtons.find((btn) => btn.textContent?.includes('Name'));
    expect(filterDropdownButton).toBeTruthy();
    await userEvent.click(filterDropdownButton!);

    // Wait for dropdown menu and select "Type" option
    const typeOption = await within(document.body).findByRole('menuitem', { name: /Type/i });
    await userEvent.click(typeOption);

    // 3. Now interact with the Type filter checkbox dropdown
    // The checkbox filter toggle has a specific OUIA ID
    const typeFilterToggle = canvasElement.querySelector('[data-ouia-component-id="DataViewCheckboxFilter-toggle"]') as HTMLElement;
    expect(typeFilterToggle).toBeTruthy();
    await userEvent.click(typeFilterToggle);

    // Select "Custom" checkbox option from the dropdown
    const customMenuItem = await within(document.body).findByRole('menuitem', { name: /Custom/i });
    const customCheckbox = within(customMenuItem).getByRole('checkbox');

    apiCallSpy.mockClear();
    await userEvent.click(customCheckbox);

    // Verify both filters are sent to API
    await waitFor(() => {
      const { calls } = apiCallSpy.mock;
      expect(calls.length).toBeGreaterThan(0);
      const filterCall = calls.find((c) => c[0].nameFilter?.includes('Admin') && c[0].typeFilter?.includes('custom'));
      expect(filterCall).toBeDefined();
    });
  },
};

/**
 * Clear all filters button test.
 * Tests the default empty state with "Clear all filters" link.
 */
export const ClearAllFilters: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Apply a filter that returns no results
    const filterInput = canvas.getByPlaceholderText(/filter by name/i);
    await userEvent.type(filterInput, 'nonexistent12345');

    // Should see default empty state with clear filters option
    await waitFor(() => {
      expect(canvas.getByText('No results found')).toBeInTheDocument();
      expect(canvas.getByText('Clear all filters')).toBeInTheDocument();
    });

    // Click clear all filters
    await userEvent.click(canvas.getByText('Clear all filters'));

    // Should see data again
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });
  },
};

/**
 * Table without filters.
 */
export const NoFilters: Story = {
  args: {
    enableFilters: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    const filterInput = canvas.queryByPlaceholderText(/filter/i);
    expect(filterInput).toBeNull();
  },
};

// =============================================================================
// PAGINATION STORIES
// =============================================================================

/**
 * Pagination resets to page 1 when filter changes.
 */
export const PaginationResetsOnFilterChange: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    apiCallSpy.mockClear();

    // Navigate to page 2
    const nextButtons = canvas.getAllByRole('button', { name: /next/i });
    if (nextButtons.length > 0) {
      await userEvent.click(nextButtons[0]);

      // Verify we're on page 2 (offset = 10 for page 2 with limit 10)
      await waitFor(() => {
        const { calls } = apiCallSpy.mock;
        const pageCall = calls.find((c) => c[0].offset === 10);
        expect(pageCall).toBeDefined();
      });

      // Now apply a filter
      const filterInput = canvas.getByPlaceholderText(/filter by name/i);
      await userEvent.type(filterInput, 'Admin');

      // Page should reset to 1 (offset = 0)
      await waitFor(() => {
        const { calls } = apiCallSpy.mock;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.offset).toBe(0);
        expect(lastCall.nameFilter).toContain('Admin');
      });
    }
  },
};

/**
 * Page clamping - auto-corrects out-of-range page numbers.
 * When the URL contains a page number that exceeds the total pages,
 * TableView automatically clamps to the last valid page.
 *
 * This is tested at the TableView level so ALL tables get this behavior
 * without needing to implement it individually.
 */
export const PageClampingOutOfRange: StoryObj<typeof OutOfRangePageTable> = {
  render: () => <OutOfRangePageTable />,
  parameters: {
    // Use MemoryRouter with out-of-range page URL
    routerInitialEntries: ['/test?page=1000&perPage=10'],
    docs: {
      description: {
        story: `
## Page Clamping Behavior

When a user navigates to a URL with an out-of-range page number (e.g., \`?page=1000\` when there are only 50 items),
TableView automatically detects this and clamps to the last valid page.

This behavior is centralized in TableView so:
- ✅ All tables using TableView get this behavior automatically
- ✅ No need to implement in individual components
- ✅ Consistent UX across all tables
- ✅ Single place to fix bugs or improve behavior

### How it works:
1. TableView receives \`page\`, \`perPage\`, \`totalCount\`, and \`onPageChange\`
2. When data loads, it checks if \`page > Math.ceil(totalCount / perPage)\`
3. If so, it calls \`onPageChange(maxPage)\` to correct the page
4. This triggers a new data fetch with the valid offset
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load and TableView to clamp to last valid page
    // With 50 items and perPage=10, max page is 5
    // Note: Clamping happens after data loads (when totalCount is known)
    await waitFor(
      () => {
        // Should see items from the last page (page 5 = items 41-50)
        // Item naming: role-42 = "Viewer 5" (nameIdx = (42-1) % 10 = 1, ceil(42/10) = 5)
        expect(canvas.getByText('Viewer 5')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // URL should be updated to the clamped page
    await waitFor(() => {
      const urlDisplay = canvas.getByTestId('url-params');
      expect(urlDisplay.textContent).toContain('page=5');
    });

    // Verify we don't see items from page 1
    expect(canvas.queryByText('Administrator 1')).not.toBeInTheDocument();
  },
};

/**
 * Interactive pagination - navigate between pages.
 */
export const Pagination: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    apiCallSpy.mockClear();

    // Navigate to next page
    const nextButtons = canvas.getAllByRole('button', { name: /next/i });
    if (nextButtons.length > 0) {
      await userEvent.click(nextButtons[0]);

      // Verify API was called with offset for page 2 (offset = 10)
      await waitFor(() => {
        const { calls } = apiCallSpy.mock;
        expect(calls.some((c) => c[0].offset === 10)).toBe(true);
      });
    }
  },
};

// =============================================================================
// SORTING STORIES
// =============================================================================

/**
 * Interactive sorting - click column headers to sort.
 * Tests: clicking sort triggers data reload and updates UI.
 */
export const Sorting: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial data load
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Find and click the Name column header to sort
    const columnHeaders = canvas.getAllByRole('columnheader');
    const nameHeader = columnHeaders.find((h) => h.textContent?.includes('Name'));
    expect(nameHeader).toBeTruthy();

    const sortButton = nameHeader?.querySelector('button');
    expect(sortButton).toBeTruthy();

    // Initial state is sorted by name ascending (A-Z)
    // First click toggles to descending (Z-A)
    apiCallSpy.mockClear();
    await userEvent.click(sortButton!);

    // Wait for the API to be called with descending sort
    await waitFor(() => {
      const { calls } = apiCallSpy.mock;
      // Check that at least one call was made with descending sort
      const hasDescSort = calls.some((c) => c[0].orderBy === '-name');
      expect(hasDescSort).toBe(true);
    });
  },
};

// =============================================================================
// EXPANSION STORIES
// =============================================================================

/**
 * Interactive compound expansion - click permission counts to expand.
 * Renders a nested table inside the expanded area (real use case).
 */
export const CompoundExpansion: Story = {
  args: {
    enableExpansion: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Find the expandable cells (they have compoundExpand buttons)
    const rows = canvas.getAllByRole('row');
    const dataRow = rows[1]; // First data row after header

    // Find the expand button in the permissions cell
    const expandButtons = within(dataRow).getAllByRole('button');
    const expandButton = expandButtons.find((btn) => {
      const cell = btn.closest('td');
      return cell?.getAttribute('data-label') === 'Permissions';
    });

    expect(expandButton).toBeTruthy();
    await userEvent.click(expandButton!);

    // Wait for expansion content - verify nested table is rendered
    await waitFor(() => {
      const expandedContent = canvasElement.querySelector('[data-testid="expanded-permissions-role-1"]');
      expect(expandedContent).toBeInTheDocument();

      // Verify nested table exists with permission data
      const nestedTable = expandedContent?.querySelector('table');
      expect(nestedTable).toBeInTheDocument();

      // Scope assertions to the expanded content area
      const expandedArea = within(expandedContent as HTMLElement);

      // Verify nested table has headers
      expect(expandedArea.getByText('Permission')).toBeInTheDocument();
      expect(expandedArea.getByText('Description')).toBeInTheDocument();

      // Verify actual permission data from mockPermissions['role-1']
      expect(expandedArea.getByText('rbac:role:read')).toBeInTheDocument();
      expect(expandedArea.getByText('Read roles')).toBeInTheDocument();
      expect(expandedArea.getByText('rbac:role:write')).toBeInTheDocument();
      expect(expandedArea.getByText('Write roles')).toBeInTheDocument();
    });

    // Click again to collapse
    await userEvent.click(expandButton!);

    // Verify expanded content is hidden
    await waitFor(() => {
      // The element might still be in DOM but row should be collapsed
      const expandedRow = canvasElement.querySelector('tr.pf-m-expanded');
      expect(expandedRow).toBeNull();
    });
  },
};

/**
 * Table without expansion - permissions column is NOT expandable.
 */
export const NoExpansion: Story = {
  args: {
    enableExpansion: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Permissions cells should NOT have expand buttons
    const rows = canvas.getAllByRole('row');
    const dataRow = rows[1];
    const cells = within(dataRow).getAllByRole('cell');

    // Find permissions cell
    const permissionsCell = cells.find((c) => c.getAttribute('data-label') === 'Permissions');
    if (permissionsCell) {
      // Should NOT have a compound expand button (only plain content)
      const expandButton = within(permissionsCell).queryByRole('button');
      expect(expandButton).toBeNull();
    }
  },
};

/**
 * Conditional expansion - only some rows can expand based on data.
 * Uses isCellExpandable to determine which rows have expand buttons.
 * In this example, only roles with permissions defined (role-1, role-2, role-3) can expand.
 */
export const ConditionalExpansion: Story = {
  args: {
    enableExpansion: true,
    conditionalExpansion: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    const rows = canvas.getAllByRole('row');

    // Row 1 (Administrator 1 - role-1) should have an expand button (has permissions)
    const row1 = rows[1];
    const row1PermissionsCell = within(row1)
      .getAllByRole('cell')
      .find((c) => c.getAttribute('data-label') === 'Permissions');
    expect(row1PermissionsCell).toBeDefined();
    const row1ExpandButton = within(row1PermissionsCell!).queryByRole('button');
    expect(row1ExpandButton).toBeInTheDocument();

    // Row 4 (Auditor 1 - role-4) should NOT have an expand button (no permissions)
    const row4 = rows[4];
    const row4PermissionsCell = within(row4)
      .getAllByRole('cell')
      .find((c) => c.getAttribute('data-label') === 'Permissions');
    expect(row4PermissionsCell).toBeDefined();
    const row4ExpandButton = within(row4PermissionsCell!).queryByRole('button');
    expect(row4ExpandButton).toBeNull();

    // Click the expand button on row 1 to expand it
    await userEvent.click(row1ExpandButton!);

    // Verify expanded content appears
    await waitFor(() => {
      expect(canvas.getByTestId('expanded-permissions-role-1')).toBeInTheDocument();
    });

    // Verify the nested table shows the permissions
    const expandedContent = canvas.getByTestId('expanded-permissions-role-1');
    expect(within(expandedContent).getByText('rbac:role:read')).toBeInTheDocument();
    expect(within(expandedContent).getByText('rbac:role:write')).toBeInTheDocument();
  },
};

// =============================================================================
// URL SYNC STORIES
// =============================================================================

/**
 * URL synchronization test - verifies query params are set/cleared.
 * This is the reference story for E2E test patterns.
 */
export const UrlSyncWithQueryParams: StoryObj<typeof UrlSyncTable> = {
  render: () => <UrlSyncTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Check URL params display element exists
    const urlDisplay = canvas.getByTestId('url-params');
    expect(urlDisplay).toBeInTheDocument();

    apiCallSpy.mockClear();

    // Apply a filter
    const filterInput = canvas.getByPlaceholderText(/filter by name/i);
    await userEvent.type(filterInput, 'Admin');

    // Wait for API to be called with filter and URL to update
    await waitFor(() => {
      const { calls } = apiCallSpy.mock;
      const filterCall = calls.find((c) => c[0].nameFilter?.includes('Admin'));
      expect(filterCall).toBeDefined();
    });

    // Check URL params display shows the filter
    await waitFor(() => {
      expect(urlDisplay.textContent).toContain('name=');
    });

    // Sort by a column
    const columnHeaders = canvas.getAllByRole('columnheader');
    const nameHeader = columnHeaders.find((h) => h.textContent?.includes('Name'));
    const sortButton = nameHeader?.querySelector('button');
    if (sortButton) {
      await userEvent.click(sortButton);

      // URL should have sort params
      await waitFor(() => {
        expect(urlDisplay.textContent).toContain('sortBy=');
        expect(urlDisplay.textContent).toContain('sortDir=');
      });
    }

    // Clear filters
    await userEvent.clear(filterInput);

    // API should be called with empty filter
    await waitFor(() => {
      const { calls } = apiCallSpy.mock;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.nameFilter).toBe('');
    });
  },
};

// =============================================================================
// API TESTING REFERENCE STORY
// =============================================================================

/**
 * API Testing Reference Story
 *
 * This story demonstrates how to test API integration with spies.
 * Use this as a reference for E2E tests to verify:
 * - Correct API parameters are passed
 * - Pagination offset/limit calculation
 * - Sort order_by formatting
 * - Filter parameter serialization
 */
export const ApiTestingReference: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
## API Testing Reference

This story demonstrates how to test API calls with the MSW spy.
The \`apiCallSpy\` is called from the MSW handler with the actual
API parameters received by the mock server.

### What's tested:
- Page/perPage → offset/limit calculation
- Sort column/direction → orderBy format (\`name\` or \`-name\`)
- Filters → nameFilter, typeFilter params

### How to use in E2E tests:
\`\`\`typescript
// After user interaction
await waitFor(() => {
  const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
  expect(lastCall.offset).toBe(10);      // Page 2 with limit 10
  expect(lastCall.limit).toBe(10);
  expect(lastCall.orderBy).toBe('-name'); // Descending sort
  expect(lastCall.nameFilter).toBe('Admin');
});
\`\`\`
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    apiCallSpy.mockClear();

    // 1. Test pagination API params
    const nextButtons = canvas.getAllByRole('button', { name: /next/i });
    if (nextButtons.length > 0) {
      await userEvent.click(nextButtons[0]);

      await waitFor(() => {
        const { calls } = apiCallSpy.mock;
        // Find call with offset = 10 (page 2 with limit 10)
        const pageCall = calls.find((c) => c[0].offset === 10);
        expect(pageCall).toBeDefined();
        expect(pageCall![0].limit).toBe(10);
      });
    }

    // 2. Test sort API params
    const columnHeaders = canvas.getAllByRole('columnheader');
    const nameHeader = columnHeaders.find((h) => h.textContent?.includes('Name'));
    const sortButton = nameHeader?.querySelector('button');
    if (sortButton) {
      await userEvent.click(sortButton);

      await waitFor(() => {
        const { calls } = apiCallSpy.mock;
        // Find call with descending sort (orderBy = '-name')
        const sortCall = calls.find((c) => c[0].orderBy === '-name');
        expect(sortCall).toBeDefined();
      });
    }

    // 3. Test filter API params
    const filterInput = canvas.getByPlaceholderText(/filter by name/i);
    await userEvent.type(filterInput, 'Admin');

    await waitFor(() => {
      const { calls } = apiCallSpy.mock;
      // Find call with nameFilter containing 'Admin'
      const filterCall = calls.find((c) => c[0].nameFilter?.includes('Admin'));
      expect(filterCall).toBeDefined();
      // Page should reset to 1 (offset = 0)
      expect(filterCall![0].offset).toBe(0);
    });
  },
};

// =============================================================================
// Initial Selection Test Component
// =============================================================================

interface InitialSelectionTableProps {
  ouiaId?: string;
}

/**
 * Component that demonstrates useTableState with initialSelectedRows.
 */
const InitialSelectionTable: React.FC<InitialSelectionTableProps> = ({ ouiaId = 'initial-selection-table' }) => {
  const [data, setData] = useState<Role[] | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);

  // Pre-select first two roles
  const initialSelectedRows = [allMockRoles[0], allMockRoles[1]];

  const handleStaleData = useCallback(async (apiParams: RolesApiParams) => {
    setData(undefined);
    try {
      const json = await fetchRolesData(apiParams);
      setData(json.data);
      setTotalCount(json.meta.count);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setData([]);
      setTotalCount(0);
    }
  }, []);

  const tableState = useTableState<typeof columns, Role, SortableColumnId, CompoundColumnId>({
    columns,
    sortableColumns,
    compoundColumns: ['permissions'] as const,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    getRowId: (role) => role.uuid,
    isRowSelectable: (role) => !role.system,
    initialSelectedRows,
    onStaleData: handleStaleData,
  });

  return (
    <TableView
      columns={columns}
      columnConfig={columnConfigWithExpansion}
      sortableColumns={sortableColumns}
      data={data}
      totalCount={totalCount}
      getRowId={(role) => role.uuid}
      cellRenderers={cellRenderers}
      expansionRenderers={expansionRenderers}
      ariaLabel="Roles table with initial selection"
      ouiaId={ouiaId}
      selectable
      bulkActions={
        tableState.selectedRows.length > 0 ? (
          <Button variant="secondary" onClick={() => tableState.clearSelection()}>
            Clear selection ({tableState.selectedRows.length})
          </Button>
        ) : undefined
      }
      {...tableState}
    />
  );
};

/**
 * Test story for initialSelectedRows functionality.
 *
 * Verifies that:
 * - Rows passed to initialSelectedRows are selected on mount
 * - Selection count displays correctly
 * - Clear selection works
 */
export const InitialSelectionTest: StoryObj<typeof InitialSelectionTable> = {
  render: (args) => <InitialSelectionTable {...args} />,
  args: {},
  parameters: {
    docs: {
      description: {
        story: `
## Initial Selection

Use \`initialSelectedRows\` in \`useTableState\` to pre-select rows on mount.
Useful for edit forms where existing selections need to be restored.

\`\`\`typescript
const tableState = useTableState({
  columns,
  getRowId: (row) => row.id,
  initialSelectedRows: existingSelections,
  onStaleData: handleStaleData,
});
\`\`\`
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for data to load
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Verify initial selection - 2 rows should be selected
    const clearButton = canvas.getByRole('button', { name: /clear selection \(2\)/i });
    expect(clearButton).toBeInTheDocument();

    // Verify checkboxes are checked for initial rows
    const checkboxes = canvas.getAllByRole('checkbox');
    // First row (Administrator 1) should be checked
    expect(checkboxes[1]).toBeChecked(); // [0] is bulk select

    // Clear selection
    await userEvent.click(clearButton);

    // Verify selection is cleared
    await waitFor(() => {
      expect(canvas.queryByRole('button', { name: /clear selection/i })).not.toBeInTheDocument();
    });
  },
};

// =============================================================================
// CURSOR PAGINATION STORIES
// =============================================================================

/**
 * MSW handler factory for cursor-paginated APIs.
 * Simulates a V2 API that uses cursor-based pagination with CursorPaginationMeta + CursorPaginationLinks.
 */
function createCursorPaginatedHandler() {
  const cursorApiCallSpy = fn();

  const handler = http.get('/api/rbac/v2/roles/', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const cursorParam = url.searchParams.get('cursor') || null;
    const orderBy = url.searchParams.get('order_by') || 'name';
    const nameFilter = url.searchParams.get('name') || '';

    // Decode cursor to determine offset (cursor is base64-encoded offset)
    let offset = 0;
    if (cursorParam) {
      try {
        offset = parseInt(atob(cursorParam));
      } catch {
        offset = 0;
      }
    }

    cursorApiCallSpy({
      limit,
      cursor: cursorParam,
      offset,
      orderBy,
      nameFilter,
    });

    // Start with all mock data
    let result = [...allMockRoles];

    // Apply name filter
    if (nameFilter.trim()) {
      result = result.filter((r) => r.display_name.toLowerCase().includes(nameFilter.toLowerCase()));
    }

    // Apply sorting
    const sortDesc = orderBy.startsWith('-');
    const sortColumn = sortDesc ? orderBy.slice(1) : orderBy;
    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortColumn === 'name') {
        aVal = a.display_name.toLowerCase();
        bVal = b.display_name.toLowerCase();
      } else if (sortColumn === 'modified') {
        aVal = new Date(a.modified).getTime();
        bVal = new Date(b.modified).getTime();
      } else {
        return 0;
      }
      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

    // Get total before pagination
    const totalItems = result.length;

    // Apply cursor-based pagination
    const paginatedData = result.slice(offset, offset + limit);

    // Build cursor links
    const nextOffset = offset + limit;
    const prevOffset = offset - limit;

    const links: CursorLinks = {
      next: nextOffset < totalItems ? `/api/rbac/v2/roles/?limit=${limit}&cursor=${btoa(String(nextOffset))}` : null,
      previous: prevOffset >= 0 ? `/api/rbac/v2/roles/?limit=${limit}&cursor=${btoa(String(prevOffset))}` : null,
    };

    return HttpResponse.json({
      data: paginatedData,
      meta: { limit }, // CursorPaginationMeta - no count, no offset
      links,
    });
  });

  return { handler, cursorApiCallSpy };
}

// =============================================================================
// Cursor Pagination Table Wrapper Component
// =============================================================================

interface CursorPaginationResponse {
  data: Role[];
  meta: { limit: number };
  links: CursorLinks;
}

interface CursorPaginatedTableProps {
  ouiaId?: string;
  enableFilters?: boolean;
}

/**
 * Wrapper component that uses useTableState in cursor mode.
 * Fetches data from a cursor-paginated V2 API.
 */
const CursorPaginatedTable: React.FC<CursorPaginatedTableProps> = ({ ouiaId = 'cursor-paginated-table', enableFilters = true }) => {
  const [data, setData] = useState<Role[] | undefined>(undefined);

  const tableState = useTableState<typeof columns, Role, SortableColumnId, never>({
    columns,
    sortableColumns,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    getRowId: (role) => role.uuid,
    paginationMode: 'cursor',
  });

  // Fetch data when apiParams change
  const fetchData = useCallback(async () => {
    setData(undefined);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(tableState.apiParams.limit));

      if (tableState.apiParams.cursor) {
        params.set('cursor', tableState.apiParams.cursor);
      }

      if (tableState.apiParams.orderBy) {
        params.set('order_by', tableState.apiParams.orderBy);
      }

      const nameFilter = tableState.apiParams.filters.name;
      if (nameFilter && typeof nameFilter === 'string' && nameFilter.trim()) {
        params.set('name', nameFilter);
      }

      const response = await fetch(`/api/rbac/v2/roles/?${params.toString()}`);
      const json: CursorPaginationResponse = await response.json();
      setData(json.data);
      // Feed cursor links back to the hook
      tableState.cursorMeta?.setCursorLinks(json.links);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setData([]);
    }
  }, [
    tableState.apiParams.limit,
    tableState.apiParams.cursor,
    tableState.apiParams.orderBy,
    tableState.apiParams.filters,
    tableState.cursorMeta?.setCursorLinks,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <TableView
      columns={columns}
      columnConfig={columnConfigWithoutExpansion}
      sortableColumns={sortableColumns}
      data={data}
      // totalCount is intentionally omitted for cursor pagination (indeterminate mode)
      getRowId={(role) => role.uuid}
      cellRenderers={cellRenderers}
      filterConfig={enableFilters ? [filterConfig[0]] : undefined}
      variant="default"
      ouiaId={ouiaId}
      ariaLabel="Cursor-paginated roles table"
      {...tableState}
    />
  );
};

// Create shared handler and spy for cursor pagination stories
const { handler: cursorHandler, cursorApiCallSpy } = createCursorPaginatedHandler();

/**
 * Cursor Pagination - Indeterminate mode.
 *
 * Demonstrates TableView with cursor-based pagination (paginationMode: 'cursor').
 * - The API returns `meta.limit` (no count/offset) and `links.next`/`links.previous`
 * - PF Pagination renders in indeterminate mode: "1 - 10 of many"
 * - Only next/previous navigation is available (no page input, no first/last)
 * - Page resets to 1 when filters or sort change
 */
export const CursorPagination: StoryObj<typeof CursorPaginatedTable> = {
  render: (args) => <CursorPaginatedTable {...args} />,
  parameters: {
    msw: {
      handlers: [cursorHandler],
    },
    docs: {
      description: {
        story: `
## Cursor-Based Pagination

For APIs that use cursor pagination (no total count), set \`paginationMode: 'cursor'\` on \`useTableState\`.
Omit \`totalCount\` from \`TableView\` to activate PF's indeterminate pagination display.

### API Response Shape:
\`\`\`json
{
  "data": [...],
  "meta": { "limit": 10 },
  "links": {
    "next": "/api/rbac/v2/roles/?limit=10&cursor=abc123",
    "previous": null
  }
}
\`\`\`

### Usage:
\`\`\`tsx
const tableState = useTableState({
  columns,
  getRowId: (r) => r.id,
  paginationMode: 'cursor',
});

// After fetching data:
tableState.cursorMeta?.setCursorLinks(response.links);

<TableView {...tableState} data={data} />
// Note: no totalCount prop = indeterminate mode
\`\`\`
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial data to load
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Verify pagination renders in indeterminate mode
    // PF renders "1 - 10 of many" when itemCount is omitted
    await waitFor(() => {
      const paginationText = canvasElement.querySelector('.pf-v6-c-pagination__total-items, .pf-v6-c-pagination');
      expect(paginationText).toBeInTheDocument();
    });

    // Verify "next" button exists
    const nextButtons = canvas.getAllByRole('button', { name: /next/i });
    expect(nextButtons.length).toBeGreaterThan(0);
  },
};

/**
 * Cursor Pagination - Forward/Backward Navigation.
 *
 * Tests that navigating forward and backward works correctly:
 * - Forward: cursor from links.next is sent to API
 * - Backward: returns to previous cursor from stack
 * - Data updates on each navigation
 */
export const CursorPaginationNavigation: StoryObj<typeof CursorPaginatedTable> = {
  render: (args) => <CursorPaginatedTable {...args} enableFilters={false} />,
  parameters: {
    msw: {
      handlers: [cursorHandler],
    },
  },
  beforeEach: () => {
    cursorApiCallSpy.mockClear();
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial data
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    // Verify first page data (should show first 10 items sorted by name)
    expect(canvas.getByText('Administrator 1')).toBeInTheDocument();

    cursorApiCallSpy.mockClear();

    // Navigate to page 2
    const nextButtons = canvas.getAllByRole('button', { name: /next/i });
    await userEvent.click(nextButtons[0]);

    // Wait for page 2 to load
    await waitFor(() => {
      const { calls } = cursorApiCallSpy.mock;
      // Should have been called with a cursor (non-null)
      const cursorCall = calls.find((c) => c[0].cursor !== null);
      expect(cursorCall).toBeDefined();
    });

    // Wait for page 2 data to render (different items)
    await waitFor(() => {
      // Page 2 should not show page 1's first item
      expect(canvas.queryByText('Administrator 1')).not.toBeInTheDocument();
    });

    cursorApiCallSpy.mockClear();

    // Navigate back to page 1
    const prevButtons = canvas.getAllByRole('button', { name: /previous/i });
    await userEvent.click(prevButtons[0]);

    // Wait for page 1 to load again
    await waitFor(() => {
      const { calls } = cursorApiCallSpy.mock;
      // Should have been called with null cursor (page 1)
      const firstPageCall = calls.find((c) => c[0].cursor === null);
      expect(firstPageCall).toBeDefined();
    });

    // Page 1 data should be back
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });
  },
};

/**
 * Cursor Pagination - Filter resets page.
 *
 * Tests that applying a filter resets cursor pagination to page 1.
 */
export const CursorPaginationFilterReset: StoryObj<typeof CursorPaginatedTable> = {
  render: (args) => <CursorPaginatedTable {...args} />,
  parameters: {
    msw: {
      handlers: [cursorHandler],
    },
  },
  beforeEach: () => {
    cursorApiCallSpy.mockClear();
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial data
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });

    cursorApiCallSpy.mockClear();

    // Navigate to page 2
    const nextButtons = canvas.getAllByRole('button', { name: /next/i });
    await userEvent.click(nextButtons[0]);

    // Wait for page 2 data
    await waitFor(() => {
      expect(canvas.queryByText('Administrator 1')).not.toBeInTheDocument();
    });

    cursorApiCallSpy.mockClear();

    // Apply a name filter
    const filterInput = canvas.getByPlaceholderText(/filter by name/i);
    await userEvent.type(filterInput, 'Admin');

    // Wait for API to be called - should be back to first page (no cursor)
    await waitFor(() => {
      const { calls } = cursorApiCallSpy.mock;
      const lastCall = calls[calls.length - 1]?.[0];
      // Filter call should have no cursor (page 1)
      expect(lastCall?.cursor).toBeNull();
      expect(lastCall?.nameFilter).toContain('Admin');
    });

    // Filtered results should appear
    await waitFor(() => {
      expect(canvas.getByText('Administrator 1')).toBeInTheDocument();
    });
  },
};
