import { Button, ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import { MenuContainer } from '@patternfly/react-core/dist/dynamic/components/Menu';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Panel, PanelFooter, PanelHeader, PanelMain, PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { Flex, FlexItem, SearchInput } from '@patternfly/react-core';
import * as React from 'react';
import './WorkspaceSelector.scss';

export interface WorkspaceSelectorProps<T extends TreeViewDataItem> {
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

export const WorkspaceSelector = <T extends TreeViewDataItem>({
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
  searchPlaceholder = 'Find a workspace by name',
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
    <Panel isScrollable ref={menuRef} variant="raised" className="rbac-c-workspace-selector-menu">
      <PanelHeader className="pf-v6-u-pb-0">
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchInputValue}
          onChange={(_e, value) => onSearchFilter(value)}
          onClear={() => onSearchFilter('')}
        />
      </PanelHeader>
      <PanelMain>
        <PanelMainBody className="pf-v6-u-p-0">{memoizedTreeView}</PanelMainBody>
      </PanelMain>
      <PanelFooter>
        <Flex justifyContent={{ default: 'justifyContentCenter' }}>
          <FlexItem>
            <Button onClick={onButtonClick} variant={ButtonVariant.secondary}>
              {buttonText}
            </Button>
          </FlexItem>
        </Flex>
      </PanelFooter>
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
