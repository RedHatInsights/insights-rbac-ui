import React, { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import type { Role } from './useRolesWithWorkspaces';
import type { GroupRow } from './components/AssignedUserGroupsTable';
import type { PermissionRow } from './components/RolePermissionsTable';
import { DrawerActions } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerCloseButton } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerHead } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerPanelContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { Popover } from '@patternfly/react-core/dist/dynamic/components/Popover';
import { Tab } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { TabTitleText } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import Messages from '../../../Messages';
import { RolePermissionsTable } from './components/RolePermissionsTable';
import { AssignedUserGroupsTable } from './components/AssignedUserGroupsTable';
import { useRoleQuery, useRoleUsageQuery } from '../../data/queries/roles';
import type { RoleBindingsGroupSubject } from '../../data/api/roles';

interface RolesDetailProps {
  selectedRole?: Role;
  setSelectedRole: React.Dispatch<React.SetStateAction<Role | undefined>>;
}

const ouiaId = 'RolesTable';

const RolesDetails: React.FunctionComponent<RolesDetailProps> = ({ selectedRole, setSelectedRole }) => {
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const context = useDataViewEventsContext();
  const intl = useIntl();

  const roleId = selectedRole?.id ?? '';
  const { data: roleDetail, isLoading: isLoadingDetail } = useRoleQuery(roleId, { enabled: !!roleId });
  const { data: roleBindings, isLoading: isLoadingBindings } = useRoleUsageQuery(roleId, { enabled: !!roleId });

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
    setActiveTabKey(tabIndex);
  };

  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (role: Role) => {
      setSelectedRole(role);
    });
    return () => unsubscribe();
  }, []);

  const permissions: PermissionRow[] = useMemo(() => {
    const perms = Array.isArray(roleDetail?.permissions) ? roleDetail.permissions : [];
    return perms.map((p) => ({
      permission: `${p.application}:${p.resource_type}:${p.operation}`,
      application: p.application,
      resource: p.resource_type,
      operation: p.operation,
    }));
  }, [roleDetail?.permissions]);

  const groups: GroupRow[] | undefined = useMemo(() => {
    if (!roleBindings) return undefined;
    return roleBindings.map((binding) => {
      const subject = binding.subject as RoleBindingsGroupSubject | undefined;
      return {
        uuid: subject?.id ?? '',
        name: subject?.group?.name ?? subject?.id ?? '',
        workspaceAssignment: binding.resource?.name ?? '—',
      };
    });
  }, [roleBindings]);

  const assignedUserGroupsPopover = (
    <Popover
      triggerAction="hover"
      headerContent={intl.formatMessage(Messages.assignedUserGroupsTooltipHeader)}
      bodyContent={intl.formatMessage(Messages.assignedUserGroupsTooltipBody)}
    >
      <OutlinedQuestionCircleIcon />
    </Popover>
  );

  return (
    <DrawerPanelContent data-testid="detail-drawer-panel" minSize="600px">
      <DrawerHead>
        <Title className="pf-v6-u-mb-md" headingLevel="h2" ouiaId={`${ouiaId}-drawer-title`}>
          {selectedRole?.name}
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={() => setSelectedRole(undefined)} data-ouia-component-id={`${ouiaId}-drawer-close-button`} />
        </DrawerActions>
      </DrawerHead>
      <Tabs activeKey={activeTabKey} onSelect={handleTabClick} ouiaId={`${ouiaId}-drawer-tabs`}>
        <Tab eventKey={0} title={<TabTitleText>Permissions</TabTitleText>} ouiaId={`${ouiaId}-permissions-tab`}>
          <RolePermissionsTable permissions={isLoadingDetail ? undefined : permissions} />
        </Tab>
        <Tab
          eventKey={1}
          title={<TabTitleText>Assigned user groups {assignedUserGroupsPopover}</TabTitleText>}
          ouiaId={`${ouiaId}-assigned-groups-tab`}
        >
          <AssignedUserGroupsTable groups={isLoadingBindings ? undefined : groups} />
        </Tab>
      </Tabs>
    </DrawerPanelContent>
  );
};

export default RolesDetails;
