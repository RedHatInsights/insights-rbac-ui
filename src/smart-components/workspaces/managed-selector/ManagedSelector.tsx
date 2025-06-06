import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuContainer } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel, PanelMain, PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { SearchInput } from '@patternfly/react-core';
import axios, { AxiosResponse } from 'axios';
import * as React from 'react';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';
import WorkspaceTreeView from './WorkspaceTreeView';
import { useWorkspacesStore } from './WorkspacesStore';
import buildWorkspaceTree from './WorkspaceTreeBuilder';
import WorkspaceMenuToggle from './WorkspaceMenuToggle';

interface RBACListWorkspacesResponse {
  data: Workspace[];
}

const fetchWorkspacesFromRBAC = (): Promise<AxiosResponse<RBACListWorkspacesResponse>> => {
  return axios.get<RBACListWorkspacesResponse>('/api/rbac/v2/workspaces/', {
    params: {
      limit: Number.MAX_SAFE_INTEGER,
    },
  });
};

const WorkspaceSwitcher = () => {
  const {
    isWorkspacesMenuExpanded,
    setIsWorkspacesMenuExpanded,
    isFetchingWorkspacesFromRBAC,
    setIsFetchingWorkspacesFromRBAC,
    isFetchingWorkspacesFromRBACError,
    setIsFetchingWorkspacesFromRBACError,
    selectedWorkspace,
    setSelectedWorkspace,
    setFetchedWorkspaces,
    workspaceTree,
    setWorkspaceTree,
  } = useWorkspacesStore();

  const [searchInputValue, setSearchInputValue] = React.useState<string>('');
  const [filteredTreeElements, setFilteredTreeElements] = React.useState<TreeViewWorkspaceItem[]>(workspaceTree ? [workspaceTree] : []);
  const [areElementsFiltered, setElementsAreFiltered] = React.useState<boolean>(false);

  // References for the menu and the menu toggle.
  const menuRef = React.useRef<MenuToggleElement>(null);
  const toggleRef = React.useRef<MenuToggleElement>(null);

  /**
   * Fetches the workspaces of the principal from RBAC and builds the tree with them.
   */
  const fetchWorkspacesFromRBACBuildTree = () => {
    setIsFetchingWorkspacesFromRBAC(true);
    setIsFetchingWorkspacesFromRBACError(false);

    fetchWorkspacesFromRBAC()
      .then((rbacResponse) => {
        setIsFetchingWorkspacesFromRBAC(false);
        setIsFetchingWorkspacesFromRBACError(false);

        // Store the RAW fetched workspaces from RBAC in the state variable
        // fix
        setFetchedWorkspaces(rbacResponse.data.data);

        // Build the tree of workspaces with the fetched results.
        const tree = buildWorkspaceTree(rbacResponse.data.data);
        setWorkspaceTree(tree);
      })
      .catch((error) => {
        setIsFetchingWorkspacesFromRBAC(false);
        setIsFetchingWorkspacesFromRBACError(true);
        console.log(`Unable to fetch workspaces from RBAC: ${error}`);
      });
  };

  /**
   * When the component loads the RBAC workspaces are fetched for the user.
   */
  React.useEffect(() => {
    fetchWorkspacesFromRBACBuildTree();

    const timeout = setInterval(() => {
      fetchWorkspacesFromRBACBuildTree();
    }, 1000 * 60 * 10);

    return () => {
      clearInterval(timeout);
    };
  }, []);

  /**
   * Every time the workspaces tree changes, reset the search filter
   */
  React.useEffect(() => {
    if (!workspaceTree) {
      return;
    }

    // Reset the search filter and the filtered elements to the new tree.
    setSearchInputValue('');
    setFilteredTreeElements([workspaceTree]);
    setElementsAreFiltered(false);
  }, [workspaceTree]);

  const onSearchFilter = (_: React.FormEvent<HTMLInputElement>, searchInput: string) => {
    setSearchInputValue(searchInput);

    if (searchInput === '') {
      // With an empty input we just reset the tree to the full original tree.
      setFilteredTreeElements(workspaceTree ? [workspaceTree] : []);
      setElementsAreFiltered(false);
    } else {
      // When there's no tree there's nothing to filter.
      if (!workspaceTree) {
        setElementsAreFiltered(false);
        return;
      }

      // Filter the elements and the subelements of the given tree.
      const filteredElements = [workspaceTree].map((item) => Object.assign({}, item)).filter((item) => filterItems(item, searchInput));
      setFilteredTreeElements(filteredElements);
      setElementsAreFiltered(true);
    }
  };

  const filterItems = (item: TreeViewDataItem | TreeViewWorkspaceItem, input: string): boolean => {
    // When the item does not have a name, which is an edge case that shouldn't
    // happen, then it can never be part of the filtered results.
    if (!item.name) {
      return false;
    }

    // When the item's name isn't a string, we can't really compare it to the
    // given input.
    if (typeof item.name !== 'string') {
      return false;
    }

    // Match the current item's name and mark it as a partial match, since we
    // are interested in returning the item's children too in the case that
    // we've got a match.
    const partiallyMatched = item.name.toLowerCase().includes(input.toLowerCase());

    // When the item has children, we need to repeat the process to see if we
    // should include the subtree in the results too.
    if (item.children) {
      return (
        partiallyMatched ||
        (item.children = item.children.map((opt) => Object.assign({}, opt)).filter((child) => filterItems(child, input))).length > 0
      );
    } else {
      return partiallyMatched;
    }
  };

  /**
   * Handler which gets called when the user changes the selected workspace.
   * @param _ the fired event which gets ignored.
   * @param item the item that was selected.
   */
  const onSelectTreeViewWorkspaceItem = (_: React.MouseEvent, selectedItem: TreeViewDataItem) => {
    if (!instanceOfTreeViewWorkspaceItem(selectedItem)) {
      return;
    }

    // Update the state variable which contains the selected workspace.
    setSelectedWorkspace(selectedItem);
  };

  const menuToggle = (
    <WorkspaceMenuToggle
      menuToggleRef={toggleRef}
      onMenuToggleClick={() => setIsWorkspacesMenuExpanded(!isWorkspacesMenuExpanded)}
      isDisabled={isFetchingWorkspacesFromRBACError || isFetchingWorkspacesFromRBAC}
      isMenuToggleExpanded={isWorkspacesMenuExpanded}
      selectedWorkspace={selectedWorkspace}
    />
  );

  const menu = (
    <Panel ref={menuRef} variant="raised">
      <PanelMain>
        <section>
          <PanelMainBody>
            <SearchInput
              placeholder="Find a workspace by name"
              value={searchInputValue}
              onChange={onSearchFilter}
              onClear={() => onSearchFilter({} as React.FormEvent<HTMLInputElement>, '')}
            />
            <Panel>
              <PanelMain>
                <section>
                  <PanelMainBody>
                    <WorkspaceTreeView
                      treeElements={filteredTreeElements}
                      areElementsFiltered={areElementsFiltered}
                      selectedWorkspace={selectedWorkspace}
                      onSelect={onSelectTreeViewWorkspaceItem}
                      isLoading={isFetchingWorkspacesFromRBAC}
                    />
                  </PanelMainBody>
                </section>
              </PanelMain>
            </Panel>
          </PanelMainBody>
          <PanelMainBody>
            <Divider />
          </PanelMainBody>
          <PanelMainBody>
            <Button isBlock>View workspace list</Button>
          </PanelMainBody>
        </section>
      </PanelMain>
    </Panel>
  );

  return (
    <MenuContainer
      isOpen={isWorkspacesMenuExpanded}
      menu={menu}
      menuRef={menuRef}
      onOpenChange={(isOpen) => setIsWorkspacesMenuExpanded(isOpen)}
      onOpenChangeKeys={['Escape']}
      toggle={menuToggle}
      toggleRef={toggleRef}
    />
  );
};

export default WorkspaceSwitcher;
