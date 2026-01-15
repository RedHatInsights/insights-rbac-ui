import { http, HttpResponse, delay } from 'msw';

// Mock workspace data
const mockWorkspaces = [
  {
    id: 'workspace-1',
    name: 'Production Environment',
    description: 'Main production workspace',
    parent_id: null,
    type: 'root',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-2',
    name: 'Web Services',
    description: 'Production web services',
    parent_id: 'workspace-1',
    type: 'standard',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-3',
    name: 'API Services',
    description: 'Production API services',
    parent_id: 'workspace-1',
    type: 'standard',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-4',
    name: 'Development Environment',
    description: 'Development workspace',
    parent_id: 'workspace-1',
    type: 'standard',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
  },
];

// Fast handlers for most stories
export const workspaceHandlers = [
  // Successful workspace fetch - fast response
  http.get('/api/rbac/v2/workspaces/', () => {
    return HttpResponse.json({
      data: mockWorkspaces,
      meta: {
        count: mockWorkspaces.length,
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0,
      },
    });
  }),
];

// Slow handlers for testing loading states
export const slowWorkspaceHandlers = [
  // Successful workspace fetch with realistic delay
  http.get('/api/rbac/v2/workspaces/', async () => {
    // Add 1 second delay to simulate realistic network response
    await delay(1000);

    return HttpResponse.json({
      data: mockWorkspaces,
      meta: {
        count: mockWorkspaces.length,
        limit: Number.MAX_SAFE_INTEGER,
        offset: 0,
      },
    });
  }),
];

// Handler variations for different scenarios - fast responses
export const emptyWorkspacesHandler = http.get('/api/rbac/v2/workspaces/', () => {
  return HttpResponse.json({
    data: [],
    meta: {
      count: 0,
      limit: Number.MAX_SAFE_INTEGER,
      offset: 0,
    },
  });
});

export const errorWorkspacesHandler = http.get('/api/rbac/v2/workspaces/', () => {
  return HttpResponse.json(
    {
      error: 'Failed to fetch workspaces',
      message: 'Internal server error',
    },
    { status: 500 },
  );
});

export const networkErrorHandler = http.get('/api/rbac/v2/workspaces/', () => {
  return HttpResponse.error();
});

// Default handlers export
export const handlers = workspaceHandlers;
