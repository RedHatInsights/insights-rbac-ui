import React from 'react';
import { useIntl } from 'react-intl';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';

export interface WorkspaceMenuToggleProps {
  menuToggleRef: React.Ref<MenuToggleElement> | undefined;
  onMenuToggleClick: React.MouseEventHandler<MenuToggleElement>;
  isDisabled: boolean;
  isMenuToggleExpanded: boolean;
  selectedWorkspaceName?: string;
}

export const WorkspaceMenuToggle: React.FC<WorkspaceMenuToggleProps> = ({
  menuToggleRef,
  onMenuToggleClick,
  isMenuToggleExpanded,
  isDisabled,
  selectedWorkspaceName,
}) => {
  const intl = useIntl();

  let content = '';
  if (isDisabled) {
    content = intl.formatMessage({ id: 'loadingWorkspaces', defaultMessage: 'Loading workspaces...', description: 'Loading workspaces label' });
  } else if (selectedWorkspaceName) {
    content = selectedWorkspaceName;
  } else {
    content = intl.formatMessage({ id: 'selectWorkspaces', defaultMessage: 'Select workspaces', description: 'Select workspaces label' });
  }

  return (
    <MenuToggle
      ref={menuToggleRef}
      onClick={onMenuToggleClick}
      isDisabled={isDisabled}
      isExpanded={isMenuToggleExpanded}
      className="workspace-selector-toggle"
      isFullWidth
      data-testid="workspace-selector-toggle"
    >
      {content}
    </MenuToggle>
  );
};
