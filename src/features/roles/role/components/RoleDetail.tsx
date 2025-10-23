import React, { Fragment, ReactNode } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Level } from '@patternfly/react-core';
import { LevelItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated';
import NotAuthorized from '@patternfly/react-component-groups/dist/dynamic/NotAuthorized';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { ToolbarTitlePlaceholder } from '../../../../components/ui-states/LoaderPlaceholders';
import { EmptyWithAction } from '../../../../components/ui-states/EmptyState';
import { RbacBreadcrumbs } from '../../../../components/navigation/Breadcrumbs';
import { AppLink } from '../../../../components/navigation/AppLink';
import '../../role.scss';

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
  const dropdownItems = [
    <DropdownItem
      component={
        <AppLink onClick={() => onDropdownToggle(false)} to={editLink}>
          Edit
        </AppLink>
      }
      key="edit-role"
    />,
    <DropdownItem
      component={
        <AppLink onClick={onDelete} to={deleteLink}>
          Delete
        </AppLink>
      }
      className="rbac-c-role__action"
      key="delete-role"
    />,
  ];

  // Show NotAuthorized component for users without proper permissions
  if (!hasPermission) {
    return (
      <NotAuthorized
        serviceName="User Access Administration"
        description="You need User Access Administrator or Organization Administrator permissions to view roles."
      />
    );
  }

  return (
    <Fragment>
      {(groupExists || breadcrumbs.length > 0) && roleExists ? (
        <Fragment>
          <PageLayout breadcrumbs={breadcrumbs}>
            <Level>
              <LevelItem>
                <PageHeaderTitle title={title || <ToolbarTitlePlaceholder />} className="rbac-page-header__title" />
              </LevelItem>
              {!isLoading && title && !isSystemRole && (
                <LevelItem>
                  <Dropdown
                    ouiaId="role-title-actions-dropdown"
                    toggle={<KebabToggle onToggle={(_event, isOpen) => onDropdownToggle(isOpen)} id="role-actions-dropdown" />}
                    isOpen={isDropdownOpen}
                    isPlain
                    position="right"
                    dropdownItems={dropdownItems}
                  />
                </LevelItem>
              )}
            </Level>
            {description && (
              <TextContent className="rbac-page-header__description">
                <Text component="p">{description}</Text>
              </TextContent>
            )}
          </PageLayout>
          {children}
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-v5-c-page__main-breadcrumb pf-v5-u-pb-md">
            <RbacBreadcrumbs breadcrumbs={breadcrumbs} />
          </section>
          <EmptyWithAction
            title={`${errorType === 'role' ? 'Role' : 'Group'} not found`}
            description={[`${errorType === 'role' ? 'Role' : 'Group'} with ID does not exist.`]}
            actions={[
              <Button
                key="back-button"
                className="pf-v5-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={onBackClick}
              >
                Back to previous page
              </Button>,
            ]}
          />
        </Fragment>
      )}
    </Fragment>
  );
};
