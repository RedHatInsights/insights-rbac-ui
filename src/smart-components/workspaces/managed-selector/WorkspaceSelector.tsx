import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { MenuContainer } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel, PanelMain, PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { SearchInput } from '@patternfly/react-core';
import * as React from 'react';

interface WorkspaceSelectorProps<T extends TreeViewDataItem> {
  isMenuExpanded: boolean;
  setIsMenuExpanded: (expanded: boolean) => void;
  isLoading: boolean;
  isError: boolean;
  selectedItem: T | null;
  setSelectedItem: (item: T) => void;
  treeElements: T[];
  filteredTreeElements: T[];
  searchInputValue: string;
  setSearchInputValue: (value: string) => void;
  areElementsFiltered: boolean;
  onSearchFilter: (searchInput: string) => void;
  onSelectItem: (event: React.MouseEvent, selectedItem: TreeViewDataItem) => void;
  onFetchData: () => void;
  renderMenuToggle: (props: {
    menuToggleRef: React.RefObject<MenuToggleElement>;
    onMenuToggleClick: () => void;
    isDisabled: boolean;
    isMenuToggleExpanded: boolean;
    selectedItem: T | null;
  }) => React.ReactNode;
  renderTreeView: (props: {
    treeElements: T[];
    areElementsFiltered: boolean;
    selectedItem: T | null;
    onSelect: (event: React.MouseEvent, selectedItem: TreeViewDataItem) => void;
    isLoading: boolean;
    isError: boolean;
  }) => React.ReactNode;
  searchPlaceholder?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const WorkspaceSelector = <T extends TreeViewDataItem>({
  isMenuExpanded,
  setIsMenuExpanded,
  isLoading,
  isError,
  selectedItem,
  filteredTreeElements,
  searchInputValue,
  areElementsFiltered,
  onSearchFilter,
  onSelectItem,
  onFetchData,
  renderMenuToggle,
  renderTreeView,
  searchPlaceholder = 'Find an item by name',
  buttonText = 'View list',
  onButtonClick,
}: WorkspaceSelectorProps<T>) => {
  // References for the menu and the menu toggle.
  const menuRef = React.useRef<MenuToggleElement>(null);
  const toggleRef = React.useRef<MenuToggleElement>(null);

  /**
   * When the component loads, fetch the data.
   */
  React.useEffect(() => {
    onFetchData();

    const timeout = setInterval(
      () => {
        onFetchData();
      },
      1000 * 60 * 10,
    );

    return () => {
      clearInterval(timeout);
    };
  }, [onFetchData]);

  const menuToggle = renderMenuToggle({
    menuToggleRef: toggleRef,
    onMenuToggleClick: () => setIsMenuExpanded(!isMenuExpanded),
    isDisabled: isLoading,
    isMenuToggleExpanded: isMenuExpanded,
    selectedItem,
  });

  const memoizedTreeView = React.useMemo(() => {
    return renderTreeView({
      treeElements: filteredTreeElements,
      areElementsFiltered,
      selectedItem,
      onSelect: onSelectItem,
      isLoading,
      isError,
    });
  }, [renderTreeView, filteredTreeElements, areElementsFiltered, selectedItem, onSelectItem, isLoading]);

  const menu = (
    <Panel ref={menuRef} variant="raised">
      <PanelMain>
        <section>
          <PanelMainBody>
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchInputValue}
              onChange={(_e, value) => onSearchFilter(value)}
              onClear={() => onSearchFilter('')}
            />
            <Panel>
              <PanelMain>
                <section>
                  <PanelMainBody>{memoizedTreeView}</PanelMainBody>
                </section>
              </PanelMain>
            </Panel>
          </PanelMainBody>
          <PanelMainBody>
            <Divider />
          </PanelMainBody>
          <PanelMainBody>
            <Button isBlock onClick={onButtonClick}>
              {buttonText}
            </Button>
          </PanelMainBody>
        </section>
      </PanelMain>
    </Panel>
  );

  return (
    <MenuContainer
      isOpen={isMenuExpanded}
      menu={menu}
      menuRef={menuRef}
      onOpenChange={(isOpen) => setIsMenuExpanded(isOpen)}
      onOpenChangeKeys={['Escape']}
      toggle={menuToggle}
      toggleRef={toggleRef}
    />
  );
};

export default WorkspaceSelector;
