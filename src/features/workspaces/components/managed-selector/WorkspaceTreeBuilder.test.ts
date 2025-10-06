// WorkspaceTreeBuilder.test.ts (no JSX needed)
import { default as buildWorkspaceTree, getWorkspaceDescendantIds, getWorkspaceDescendants } from './WorkspaceTreeBuilder';
import Workspace from './Workspace';
import WorkspaceType from './WorkspaceType';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';

describe('WorkspaceTreeBuilder', () => {
  const workspaces: Workspace[] = [
    {
      id: 'root-1',
      name: 'Root 1',
      parent_id: '',
      type: WorkspaceType.ROOT,
    },
    {
      id: 'root-1-child-1',
      name: 'Root 1 > Child 1 ',
      parent_id: 'root-1',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-1-child-2',
      name: 'Root 1 > Child 2',
      parent_id: 'root-1',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-2',
      name: 'Root 2',
      parent_id: '',
      type: WorkspaceType.ROOT,
    },
    {
      id: 'root-2-child-1',
      name: 'Root 2 > Child 1 ',
      parent_id: 'root-2',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-2-child-1-granchild-1',
      name: 'Root 2 > Child 1 > Granchild 1',
      parent_id: 'root-2-child-1',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-2-child-2',
      name: 'Root 2 > Child 2',
      parent_id: 'root-2',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-3',
      name: 'Root 3',
      parent_id: '',
      type: WorkspaceType.ROOT,
    },
    {
      id: 'root-3-child-1',
      name: 'Root 3 > Child 1 ',
      parent_id: 'root-3',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-3-child-2',
      name: 'Root 3 > Child 2',
      parent_id: 'root-3',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-3-child-2-granchild-1',
      name: 'Root 3 > Child 2 > Granchild 1',
      parent_id: 'root-3-child-2',
      type: WorkspaceType.STANDARD,
    },
    {
      id: 'root-3-child-2-granchild-1-greatGranchild-1',
      name: 'Root 3 > Child 2 > Granchild 1 > Great Grantchild 1',
      parent_id: 'root-3-child-2-granchild-1',
      type: WorkspaceType.STANDARD,
    },
  ];

  const [
    root1,
    root1Child1,
    root1Child2,
    root2,
    root2Child1,
    root2Child1Grandchild1,
    root2Child2,
    root3,
    root3Child1,
    root3Child2,
    root3Child2Grandchild1,
    root3Child2Grandchild1GreatGrandchild1,
  ] = workspaces;

  describe('getWorkspaceDescendants()', () => {
    describe('with children', () => {
      it('returns workspace objects', () => {
        const descendants = getWorkspaceDescendants(root1.id, workspaces);
        expect(descendants).toEqual([root1Child1, root1Child2]);
      });
    });

    describe('with granchildren', () => {
      it('returns workspace objects', () => {
        const descendants = getWorkspaceDescendants(root2.id, workspaces);
        expect(descendants).toEqual([root2Child1, root2Child1Grandchild1, root2Child2]);
      });
    });

    describe('with great granchilden', () => {
      it('returns workspace objects', () => {
        const descendants = getWorkspaceDescendants(root3.id, workspaces);
        expect(descendants).toEqual([root3Child1, root3Child2, root3Child2Grandchild1, root3Child2Grandchild1GreatGrandchild1]);
      });
    });
  });

  describe('getWorkspaceDescendantIds()', () => {
    it('returns workspace ids', () => {
      const descendants = getWorkspaceDescendantIds(root3.id, workspaces);
      expect(descendants).toEqual([root3Child1.id, root3Child2.id, root3Child2Grandchild1.id, root3Child2Grandchild1GreatGrandchild1.id]);
    });
  });

  describe('buildWorkspaceTree', () => {
    describe('basic functionality', () => {
      it('should return undefined for empty workspace array', () => {
        const result = buildWorkspaceTree([], []);
        expect(result).toBeUndefined();
      });

      it('should return undefined when no root workspace exists', () => {
        const workspacesWithoutRoot = [root1Child1, root1Child2];
        const result = buildWorkspaceTree(workspacesWithoutRoot, []);
        expect(result).toBeUndefined();
      });

      it('should build tree with root workspace only', () => {
        const result = buildWorkspaceTree([root1], []);
        expect(result?.id).toBe('root-1');
        expect(result?.children).toBeUndefined();
      });
    });

    describe('tree structure', () => {
      it('should build complete tree hierarchy', () => {
        const result = buildWorkspaceTree(workspaces, []);

        // Should return root1 (first root workspace found)
        expect(result?.id).toBe('root-1');
        expect(result?.children).toHaveLength(2);
        expect(result?.children?.[0].id).toBe('root-1-child-1');
        expect(result?.children?.[1].id).toBe('root-1-child-2');
      });

      it('should handle deep hierarchy (3+ levels)', () => {
        const root3Workspaces = workspaces.filter((ws) => ws.id.startsWith('root-3') || ws.id === 'root-3');
        const result = buildWorkspaceTree(root3Workspaces, []);

        // Navigate to great-grandchild
        const child2 = result?.children?.find((c) => c.id === 'root-3-child-2');
        const grandchild = child2?.children?.[0];
        const greatGrandchild = grandchild?.children?.[0];

        expect(greatGrandchild?.id).toBe('root-3-child-2-granchild-1-greatGranchild-1');
      });
    });

    describe('workspace exclusion', () => {
      it('should exclude specified workspace and its descendants', () => {
        const root1Workspaces = workspaces.filter((ws) => ws.id.startsWith('root-1') || ws.id === 'root-1');
        const result = buildWorkspaceTree(root1Workspaces, ['root-1-child-1']);

        // root-1-child-1 and its children should be excluded
        expect(result?.id).toBe('root-1');
        expect(result?.children).toHaveLength(1);
        expect(result?.children?.[0].id).toBe('root-1-child-2');
      });

      it('should exclude multiple workspaces', () => {
        const root1Workspaces = workspaces.filter((ws) => ws.id.startsWith('root-1') || ws.id === 'root-1');
        const result = buildWorkspaceTree(root1Workspaces, ['root-1-child-1', 'root-1-child-2']);

        // Both children should be excluded
        expect(result?.id).toBe('root-1');
        expect(result?.children).toBeUndefined();
      });

      it('should exclude workspace with deep descendants', () => {
        const root3Workspaces = workspaces.filter((ws) => ws.id.startsWith('root-3') || ws.id === 'root-3');
        const result = buildWorkspaceTree(root3Workspaces, ['root-3-child-2']);

        // root-3-child-2 and its descendants should be excluded
        expect(result?.id).toBe('root-3');
        expect(result?.children).toHaveLength(1);
        expect(result?.children?.[0].id).toBe('root-3-child-1');

        // Verify that root-3-child-2-granchild-1 and great-grandchild are also excluded
        const remainingChild = result?.children?.[0];
        expect(remainingChild?.children).toBeUndefined();
      });

      it('should handle excluding non-existent workspace', () => {
        const result = buildWorkspaceTree(workspaces, ['non-existent-id']);

        // Should build normally, ignoring non-existent ID
        expect(result?.children).toHaveLength(2);
      });

      it('should handle empty exclusion array', () => {
        const result = buildWorkspaceTree(workspaces, []);

        // Should build complete tree
        expect(result?.children).toHaveLength(2);
      });
    });

    describe('parent-child relationships', () => {
      it('should set parentTreeViewItem correctly', () => {
        const result = buildWorkspaceTree(workspaces, []);

        const child = result?.children?.[0] as TreeViewWorkspaceItem;
        expect(child?.parentTreeViewItem).toBe(result);
      });

      it('should handle workspace without parent_id gracefully', () => {
        const orphanWorkspace = {
          id: 'orphan',
          name: 'Orphan Workspace',
          parent_id: undefined,
          type: WorkspaceType.STANDARD,
        };

        const workspacesWithOrphan = [...workspaces, orphanWorkspace];
        const result = buildWorkspaceTree(workspacesWithOrphan, []);

        // Should still build tree, orphan should be logged as warning
        expect(result).toBeDefined();
      });
    });
  });
});
