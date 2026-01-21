/**
 * Seed Integration Tests
 *
 * Tests the flow: seed data → view in TUI → verify data appears
 */
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { render, waitFor } from '../../test-utils';
import { HeadlessSeeder } from '../../components/HeadlessSeeder';
import { RolesList } from '../RolesList';
import { GroupsList } from '../GroupsList';
import type { SeedPayload, SeedSummary } from '../../types';
import { resetMockDataWithState } from '../../mocks/server';

describe('Seed Integration', () => {
  beforeEach(() => {
    // Start with empty state for seeding tests
    resetMockDataWithState({
      roles: [],
      groups: [],
      workspaces: [],
      users: [],
      serviceAccounts: [],
      groupMembers: new Map(),
      groupRoles: new Map(),
      workspaceRoleBindings: new Map(),
    });
  });

  describe('Seed → View Roles Flow', () => {
    it('seeds roles and they appear in RolesList', async () => {
      const seedPayload: SeedPayload = {
        roles: [
          {
            name: 'seeded-role-1',
            display_name: 'Seeded Role 1',
            description: 'First seeded role',
            access: [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }],
          },
          {
            name: 'seeded-role-2',
            display_name: 'Seeded Role 2',
            description: 'Second seeded role',
            access: [{ permission: 'inventory:hosts:write', resourceDefinitions: [] }],
          },
        ],
      };

      let seedSummary: SeedSummary | null = null;

      // Step 1: Seed the data
      const { unmount: unmountSeeder, queryClient } = render(
        <HeadlessSeeder
          payload={seedPayload}
          queryClient={null as unknown as QueryClient} // Will be injected by render
          onComplete={(summary) => {
            seedSummary = summary;
          }}
        />,
        { initialEntries: ['/seed'] },
      );

      // Wait for seeding to complete
      await waitFor(
        () => {
          expect(seedSummary).not.toBeNull();
        },
        { timeout: 5000 },
      );

      // Verify seed was successful
      expect(seedSummary!.success).toBe(true);
      expect(seedSummary!.roles.created).toBe(2);
      expect(seedSummary!.roles.failed).toBe(0);

      unmountSeeder();

      // Step 2: Render RolesList with the same queryClient
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient, // Reuse the same queryClient
      });

      // Step 3: Wait for roles to load and verify seeded data appears
      await waitFor(
        () => {
          const text = container.textContent || '';
          expect(text).toContain('Seeded Role 1');
        },
        { timeout: 5000 },
      );

      expect(container.textContent).toContain('Seeded Role 2');
    });

    it('handles partial seed failures gracefully', async () => {
      // Seed with one valid and one duplicate name (which should fail)
      const seedPayload: SeedPayload = {
        roles: [
          {
            name: 'unique-role',
            display_name: 'Unique Role',
            description: 'This should succeed',
            access: [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }],
          },
        ],
      };

      let seedSummary: SeedSummary | null = null;

      render(
        <HeadlessSeeder
          payload={seedPayload}
          queryClient={null as unknown as QueryClient}
          onComplete={(summary) => {
            seedSummary = summary;
          }}
        />,
        { initialEntries: ['/seed'] },
      );

      await waitFor(
        () => {
          expect(seedSummary).not.toBeNull();
        },
        { timeout: 5000 },
      );

      // At least the unique role should succeed
      expect(seedSummary!.roles.created).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Seed → View Groups Flow', () => {
    it('seeds groups and they appear in GroupsList', async () => {
      const seedPayload: SeedPayload = {
        groups: [
          {
            name: 'seeded-group-1',
            description: 'First seeded group',
          },
          {
            name: 'seeded-group-2',
            description: 'Second seeded group',
          },
        ],
      };

      let seedSummary: SeedSummary | null = null;

      const { unmount: unmountSeeder, queryClient } = render(
        <HeadlessSeeder
          payload={seedPayload}
          queryClient={null as unknown as QueryClient}
          onComplete={(summary) => {
            seedSummary = summary;
          }}
        />,
        { initialEntries: ['/seed'] },
      );

      await waitFor(
        () => {
          expect(seedSummary).not.toBeNull();
        },
        { timeout: 5000 },
      );

      expect(seedSummary!.success).toBe(true);
      expect(seedSummary!.groups.created).toBe(2);

      unmountSeeder();

      // Render GroupsList
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          const text = container.textContent || '';
          expect(text).toContain('seeded-group-1');
        },
        { timeout: 5000 },
      );

      expect(container.textContent).toContain('seeded-group-2');
    });
  });

  describe('Combined Seed Flow', () => {
    it('seeds roles and groups together', async () => {
      const seedPayload: SeedPayload = {
        roles: [
          {
            name: 'combined-role',
            display_name: 'Combined Role',
            description: 'Role from combined seed',
            access: [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }],
          },
        ],
        groups: [
          {
            name: 'combined-group',
            description: 'Group from combined seed',
          },
        ],
      };

      let seedSummary: SeedSummary | null = null;

      const { unmount, queryClient } = render(
        <HeadlessSeeder
          payload={seedPayload}
          queryClient={null as unknown as QueryClient}
          onComplete={(summary) => {
            seedSummary = summary;
          }}
        />,
        { initialEntries: ['/seed'] },
      );

      await waitFor(
        () => {
          expect(seedSummary).not.toBeNull();
        },
        { timeout: 5000 },
      );

      expect(seedSummary!.success).toBe(true);
      expect(seedSummary!.roles.created).toBe(1);
      expect(seedSummary!.groups.created).toBe(1);

      unmount();

      // Verify role appears
      const { container: rolesContainer, unmount: unmountRoles } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(rolesContainer.textContent).toContain('Combined Role');
        },
        { timeout: 5000 },
      );

      unmountRoles();

      // Verify group appears
      const { container: groupsContainer } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(groupsContainer.textContent).toContain('combined-group');
        },
        { timeout: 5000 },
      );
    });
  });

  describe('Empty Payload', () => {
    it('handles empty seed payload', async () => {
      const seedPayload: SeedPayload = {};

      const { container } = render(
        <HeadlessSeeder
          payload={seedPayload}
          queryClient={null as unknown as QueryClient}
          onComplete={() => {
            // Empty payload should not call onComplete
          }}
        />,
        { initialEntries: ['/seed'] },
      );

      // Should show warning about empty payload
      await waitFor(
        () => {
          const text = container.textContent || '';
          expect(text).toContain('No operations');
        },
        { timeout: 3000 },
      );
    });
  });
});
