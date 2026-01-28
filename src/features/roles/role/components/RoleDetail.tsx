import React, { Fragment, ReactNode } from 'react';
import { Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';

import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { EmptyWithAction } from '../../../../components/ui-states/EmptyState';
import { AppLink } from '../../../../components/navigation/AppLink';
export interface RoleDetailProps {
  title?: string;
  description?: string;
  isLoading: boolean;
  isSystemRole: boolean;
  roleExists: boolean;
  groupExists: boolean;
  isDropdownOpen: boolean;
  onDropdownToggle: (isOpen: boolean) => void;
  breadcrumbs: Array<{ title?: string; to?: string; isLoading?: boolean; isActive?: boolean }>;
  editLink: string;
  deleteLink: string;
  onDelete?: () => void;
  onBackClick: () => void;
  hasPermission: boolean;
  children: ReactNode;
  errorType?: 'role' | 'group';
}

export const RoleDetail: React.FC<RoleDetailProps> = ({
  title,
  description,
  isLoading,
  isSystemRole,
  roleExists,
  groupExists,
  isDropdownOpen,
  onDropdownToggle,
  breadcrumbs,
  editLink,
  deleteLink,
  onDelete,
  onBackClick,
  hasPermission,
  children,
  errorType = 'role',
}) => {
  // Show NotAuthorized component for users without proper permissions
  if (!hasPermission) {
    return (
      <UnauthorizedAccess
        serviceName="User Access Administration"
        bodyText="You need User Access Administrator or Organization Administrator permissions to view roles."
      />
    );
  }

  return (
    <Fragment>
      {(groupExists || breadcrumbs.length > 0) && roleExists ? (
        <PageLayout
          breadcrumbs={breadcrumbs}
          title={{
            title,
            description,
            actionMenu:
              !isLoading && title && !isSystemRole ? (
                <Dropdown
                  popperProps={{ position: 'right' }}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      variant="plain"
                      onClick={() => onDropdownToggle(!isDropdownOpen)}
                      isExpanded={isDropdownOpen}
                      id="role-actions-dropdown"
                      data-ouia-component-id="role-title-actions-dropdown"
                      aria-label="Actions"
                    >
                      <EllipsisVIcon />
                    </MenuToggle>
                  )}
                  isOpen={isDropdownOpen}
                  onOpenChange={onDropdownToggle}
                >
                  <DropdownList>
                    <DropdownItem key="edit-role" onClick={() => onDropdownToggle(false)}>
                      <AppLink to={editLink}>Edit</AppLink>
                    </DropdownItem>
                    <DropdownItem key="delete-role" onClick={onDelete}>
                      <AppLink to={deleteLink}>Delete</AppLink>
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              ) : undefined,
          }}
        >
          {children}
        </PageLayout>
      ) : (
        <PageLayout breadcrumbs={breadcrumbs}>
          <EmptyWithAction
            title={`${errorType === 'role' ? 'Role' : 'Group'} not found`}
            description={[`${errorType === 'role' ? 'Role' : 'Group'} with ID does not exist.`]}
            actions={[
              <Button
                key="back-button"
                className="pf-v6-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={onBackClick}
              >
                Back to previous page
              </Button>,
            ]}
          />
        </PageLayout>
      )}
    </Fragment>
  );
};
