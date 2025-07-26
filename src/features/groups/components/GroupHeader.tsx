import React, { Fragment, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Alert, Button, Popover, PopoverPosition, Split, SplitItem } from '@patternfly/react-core';
import { Dropdown, DropdownItem, KebabToggle } from '@patternfly/react-core/deprecated';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import { PageLayout, PageTitle } from '../../../components/layout/PageLayout';
import { AppLink } from '../../../components/navigation/AppLink';
import { EmptyWithAction } from '../../../components/ui-states/EmptyState';
import { RbacBreadcrumbs } from '../../../components/navigation/Breadcrumbs';

/**
 * Group data structure
 *
 * @interface Group
 * @description Represents a group with its basic information
 */
export interface Group {
  id: string;
  name: string;
  description?: string;
  platform_default?: boolean;
  system?: boolean;
  admin_default?: boolean;
}

/**
 * Breadcrumb navigation item
 *
 * @interface BreadcrumbItem
 * @description Represents a single breadcrumb item in the navigation hierarchy
 */
export interface BreadcrumbItem {
  title?: string;
  to?: string;
  isActive?: boolean;
}

export interface TabItem {
  eventKey: number;
  title: string;
  name: string;
  to: string;
}

/**
 * Props for the GroupHeader component
 *
 * @interface GroupHeaderProps
 * @description Props for rendering a group header with navigation, actions, and status information
 */
export interface GroupHeaderProps {
  /**
   * Group data to display
   * @description The group object containing name, description, and other group information
   */
  group?: Group;
  /**
   * Whether the group is currently loading
   * @description Controls the display of loading skeleton while group data is being fetched
   */
  isGroupLoading: boolean;
  /**
   * Whether the group exists
   * @description Determines whether to show the group content or an error state
   */
  groupExists: boolean;
  /**
   * The group ID
   * @description Unique identifier for the group, used in navigation and error messages
   */
  groupId: string;
  /**
   * Whether this is the platform default group
   * @description Controls special behavior for the default access group, including restore functionality
   */
  isPlatformDefault: boolean;

  /**
   * Whether the reset warning modal is visible
   * @description Controls the display of the confirmation modal for restoring default group settings
   */
  isResetWarningVisible: boolean;
  /**
   * Whether the dropdown menu is open
   * @description Controls the visibility of the action dropdown menu (Edit/Delete)
   */
  isDropdownOpen: boolean;
  /**
   * Whether to show the default group changed info alert
   * @description Controls the display of an informational alert when the default group has been modified
   */
  showDefaultGroupChangedInfo: boolean;

  /**
   * Callback when reset warning visibility changes
   * @description Called when the user opens or closes the reset confirmation modal
   * @param visible - Whether the reset warning modal should be visible
   */
  onResetWarningToggle: (visible: boolean) => void;
  /**
   * Callback when dropdown toggle state changes
   * @description Called when the user opens or closes the action dropdown menu
   * @param isOpen - Whether the dropdown menu should be open
   */
  onDropdownToggle: (isOpen: boolean) => void;

  /**
   * Callback when reset is confirmed
   * @description Called when the user confirms the reset action in the warning modal
   */
  onResetConfirm: () => void;
  /**
   * Callback when back button is clicked
   * @description Called when the user clicks the back button in the error state
   */
  onBackClick: () => void;

  /**
   * Breadcrumb navigation items
   * @description Array of breadcrumb items for navigation hierarchy display
   */
  breadcrumbs: BreadcrumbItem[];
  /**
   * Current location object
   * @description Current route location used to determine which action links to show
   */
  location: { pathname: string };

  /**
   * Child components to render
   * @description Optional child components to render within the header (e.g., tab navigation)
   */
  children?: ReactNode;
}

/**
 * GroupHeader component that displays the header for a group detail page
 *
 * This component handles the visual presentation of group information including:
 * - Group title and description
 * - Breadcrumb navigation
 * - Action dropdown menu
 * - Platform default group restore functionality
 * - Loading states and error states
 *
 * @param props - The component props
 * @returns The rendered GroupHeader component
 */
/**
 * GroupHeader Component
 *
 * A presentational component that displays the header section for a group detail page.
 * Includes breadcrumb navigation, group information, action buttons, and various states
 * such as loading, error, and informational alerts.
 *
 * @component
 * @param {GroupHeaderProps} props - The component props
 * @returns {JSX.Element} The rendered group header component
 *
 * @example
 * ```tsx
 * <GroupHeader
 *   group={groupData}
 *   isGroupLoading={false}
 *   groupExists={true}
 *   groupId="test-group-1"
 *   isPlatformDefault={false}
 *   isResetWarningVisible={false}
 *   isDropdownOpen={false}
 *   showDefaultGroupChangedInfo={false}
 *   onResetWarningToggle={(visible) => setResetWarningVisible(visible)}
 *   onDropdownToggle={(isOpen) => setDropdownOpen(isOpen)}
 *   onResetConfirm={() => handleReset()}
 *   onBackClick={() => navigateBack()}
 *   breadcrumbs={breadcrumbItems}
 *   location={{ pathname: '/groups/test-group-1/roles' }}
 * >
 *   <AppTabs tabItems={tabItems} />
 * </GroupHeader>
 * ```
 */
const GroupHeader: React.FC<GroupHeaderProps> = ({
  group,
  isGroupLoading,
  groupExists,
  groupId,
  isPlatformDefault,
  isResetWarningVisible,
  isDropdownOpen,
  showDefaultGroupChangedInfo,
  onResetWarningToggle,
  onDropdownToggle,

  onResetConfirm,
  onBackClick,
  breadcrumbs,
  location,

  children,
}) => {
  /**
   * Renders an icon with popover for default group changes
   *
   * @param {string} name - The name to display in the popover
   * @returns {JSX.Element} The icon with informational popover
   */
  const defaultGroupChangedIcon = (name: string) => (
    <div style={{ display: 'inline-flex' }}>
      {name}
      <div className="pf-v5-u-ml-sm">
        <Popover
          aria-label="default-group-icon"
          bodyContent={
            <FormattedMessage
              id="defaultAccessGroupNameChanged"
              defaultMessage="The default access group name has been changed."
              values={{
                b: (text) => <b>{text}</b>,
              }}
            />
          }
        >
          <OutlinedQuestionCircleIcon className="rbac-default-group-info-icon" />
        </Popover>
      </div>
    </div>
  );

  const defaultGroupRestore = () => (
    <div className="rbac-default-group-reset-btn">
      <Button variant="link" onClick={() => onResetWarningToggle(true)}>
        <FormattedMessage id="restoreToDefault" defaultMessage="Restore to default" />
      </Button>
      <Popover
        aria-label="default-group-icon"
        position={PopoverPosition.bottomEnd}
        bodyContent={
          <FormattedMessage
            id="restoreDefaultAccessInfo"
            defaultMessage="Restore the default access group to its original configuration."
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        }
      >
        <OutlinedQuestionCircleIcon className="rbac-default-group-info-icon pf-v5-u-mt-sm" />
      </Popover>
    </div>
  );

  const dropdownItems = [
    <DropdownItem
      component={
        <AppLink
          onClick={() => onDropdownToggle(false)}
          to={(location.pathname.includes('members') ? '/groups/:groupId/members/edit' : '/groups/:groupId/roles/edit').replace(
            ':groupId',
            isPlatformDefault ? 'default-access-group' : groupId,
          )}
        >
          <FormattedMessage id="edit" defaultMessage="Edit" />
        </AppLink>
      }
      key="edit-group"
    />,
    <DropdownItem
      component={
        <AppLink
          to={(location.pathname.includes('members') ? '/groups/:groupId/members/remove' : '/groups/:groupId/roles/remove').replace(
            ':groupId',
            groupId,
          )}
        >
          <FormattedMessage id="delete" defaultMessage="Delete" />
        </AppLink>
      }
      className="rbac-c-group__action"
      key="delete-group"
    />,
  ];

  return (
    <Fragment>
      {isResetWarningVisible && (
        <WarningModal
          isOpen={isResetWarningVisible}
          title="Restore default access group?"
          confirmButtonLabel="Continue"
          onClose={() => onResetWarningToggle(false)}
          onConfirm={onResetConfirm}
        >
          <FormattedMessage
            id="restoreDefaultAccessDescription"
            defaultMessage="This will restore the default access group to its original state."
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        </WarningModal>
      )}
      {groupExists ? (
        <Fragment>
          <PageLayout breadcrumbs={breadcrumbs}>
            <Split hasGutter>
              <SplitItem isFilled>
                <PageTitle
                  title={
                    !isGroupLoading && group ? (
                      <Fragment>{group.platform_default && !group.system ? defaultGroupChangedIcon(group.name) : group.name}</Fragment>
                    ) : undefined
                  }
                  description={(!isGroupLoading && group?.description) || undefined}
                />
              </SplitItem>
              {group?.platform_default && !group.system ? <SplitItem>{defaultGroupRestore()}</SplitItem> : null}
              <SplitItem>
                {group?.platform_default || group?.admin_default ? null : (
                  <Dropdown
                    ouiaId="group-title-actions-dropdown"
                    toggle={<KebabToggle onToggle={(_event, isOpen) => onDropdownToggle(isOpen)} id="group-actions-dropdown" />}
                    isOpen={isDropdownOpen}
                    isPlain
                    position="right"
                    dropdownItems={dropdownItems}
                  />
                )}
              </SplitItem>
            </Split>
            {showDefaultGroupChangedInfo ? (
              <Alert variant="info" isInline title="Default access group changed" className="pf-v5-u-mb-lg pf-v5-u-mt-sm">
                <FormattedMessage
                  id="defaultAccessGroupNameChanged"
                  defaultMessage="The default access group name has been changed."
                  values={{
                    b: (text) => <b>{text}</b>,
                  }}
                />
              </Alert>
            ) : null}
          </PageLayout>
          {children}
          {!group && <SkeletonTable />}
        </Fragment>
      ) : (
        <Fragment>
          <section className="pf-v5-c-page__main-breadcrumb pf-v5-u-pb-md">
            <RbacBreadcrumbs breadcrumbs={breadcrumbs} />
          </section>
          <EmptyWithAction
            title="Group not found"
            description={[
              <FormattedMessage key="group-not-found" id="groupDoesNotExist" defaultMessage="Group {id} does not exist" values={{ id: groupId }} />,
            ]}
            actions={
              <Button
                key="back-button"
                className="pf-v5-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={onBackClick}
              >
                <FormattedMessage id="backToPreviousPage" defaultMessage="Back to previous page" />
              </Button>
            }
          />
        </Fragment>
      )}
    </Fragment>
  );
};

export { GroupHeader };
