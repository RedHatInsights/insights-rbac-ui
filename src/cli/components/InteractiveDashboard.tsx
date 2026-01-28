import React from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { AppLayout } from '../layouts/AppLayout.js';
import { GroupDetail, GroupsList, RoleDetail, RolesList, UsersList, WorkspaceDetail, WorkspacesList } from '../routes/index.js';

export interface InteractiveDashboardProps {
  queryClient: QueryClient;
}

/**
 * Main CLI dashboard using react-router-dom's MemoryRouter.
 *
 * Routes:
 * - /roles - List of roles
 * - /roles/:id - Role details
 * - /groups - List of groups
 * - /groups/:id - Group details
 * - /workspaces - List of workspaces
 * - /workspaces/:id - Workspace details (TODO)
 * - /users - List of users
 */
export function InteractiveDashboard({ queryClient }: InteractiveDashboardProps): React.ReactElement {
  return (
    <MemoryRouter initialEntries={['/roles']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout>
        <Routes>
          {/* Redirect root to roles */}
          <Route path="/" element={<Navigate to="/roles" replace />} />

          {/* Roles */}
          <Route path="/roles" element={<RolesList queryClient={queryClient} />} />
          <Route path="/roles/:id" element={<RoleDetail queryClient={queryClient} />} />

          {/* Groups */}
          <Route path="/groups" element={<GroupsList queryClient={queryClient} />} />
          <Route path="/groups/:id" element={<GroupDetail queryClient={queryClient} />} />

          {/* Workspaces */}
          <Route path="/workspaces" element={<WorkspacesList queryClient={queryClient} />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetail queryClient={queryClient} />} />

          {/* Users */}
          <Route path="/users" element={<UsersList queryClient={queryClient} />} />
        </Routes>
      </AppLayout>
    </MemoryRouter>
  );
}
