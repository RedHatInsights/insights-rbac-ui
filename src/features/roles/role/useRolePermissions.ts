import { useEffect, useMemo, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { fetchRole, removeRolePermissions } from '../../../redux/roles/actions';
import { Role as RoleType } from '../../../redux/roles/reducer';
import { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';

interface RootState {
  roleReducer: {
    selectedRole?: RoleType;
    isRecordLoading: boolean;
  };
}

interface FilteredPermission {
  uuid: string;
  permission: string;
  resourceDefinitions: any[];
  modified: string;
}

interface UseRolePermissionsReturn {
  role: RoleType | undefined;
  isRecordLoading: boolean;
  filteredPermissions: FilteredPermission[];
  applications: string[];
  resources: Array<{ label: string; value: string }>;
  operations: Array<{ label: string; value: string }>;
  showResourceDefinitions: boolean;
  onRemovePermissions: (permissions: Array<{ uuid: string }>) => Promise<void>;
  onNavigateToAddPermissions: () => void;
}

export const useRolePermissions = (filters: { applications: string[]; resources: string[]; operations: string[] }): UseRolePermissionsReturn => {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const intl = useIntl();
  const addNotification = useAddNotification();

  const { role, isRecordLoading } = useSelector(
    (state: RootState) => ({
      role: state.roleReducer.selectedRole,
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual,
  );

  const [showResourceDefinitions, setShowResourceDefinitions] = useState(true);

  // Extract unique resources and operations from role permissions
  const { resources, operations } = useMemo(() => {
    if (!role || !role.access || role.access.length === 0) {
      return { resources: [], operations: [] };
    }

    const extracted = role.access.reduce(
      (acc, { permission }) => {
        const [, resource, operation] = permission.split(':');
        return {
          resources: acc.resources.includes(resource) ? acc.resources : [...acc.resources, resource],
          operations: acc.operations.includes(operation) ? acc.operations : [...acc.operations, operation],
        };
      },
      { resources: [] as string[], operations: [] as string[] },
    );

    return {
      resources: extracted.resources.map((item) => ({ label: item, value: item })),
      operations: extracted.operations.map((item) => ({ label: item, value: item })),
    };
  }, [role]);

  // Determine if resource definitions column should be shown
  useEffect(() => {
    if (role?.access) {
      const hasResourceDefinitions = role.access.some((a) => a.permission.includes('cost-management') || a.permission.includes('inventory'));
      setShowResourceDefinitions(hasResourceDefinitions);
    }
  }, [role]);

  // Filter permissions based on selected filters
  const filteredPermissions = useMemo(() => {
    if (!role || !role.access) {
      return [];
    }

    return role.access
      .filter(({ permission }) => {
        const [application, resource, operation] = permission.split(':');
        return (
          (filters.applications.length > 0 ? filters.applications.includes(application) : true) &&
          (filters.resources.length > 0 ? filters.resources.includes(resource) : true) &&
          (filters.operations.length > 0 ? filters.operations.includes(operation) : true)
        );
      })
      .map((perm) => ({
        uuid: perm.permission,
        permission: perm.permission,
        resourceDefinitions: perm.resourceDefinitions,
        modified: role.modified,
      }));
  }, [role, filters]);

  // Remove permissions from role
  const onRemovePermissions = async (permissions: Array<{ uuid: string }>) => {
    if (!role) return;

    const permissionsToRemove = permissions.map((p) => p.uuid);
    try {
      // Cast role to RoleWithAccess since our Role type is compatible
      await dispatch(removeRolePermissions(role as any as RoleWithAccess, permissionsToRemove) as any);
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.editRoleSuccessTitle),
        description: intl.formatMessage(messages.editRoleSuccessDescription),
      });
      await dispatch(fetchRole(role.uuid) as any);
    } catch (error) {
      console.error('Failed to remove permissions:', error);
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editRoleErrorTitle),
        description: intl.formatMessage(messages.editRoleErrorDescription),
      });
    }
  };

  // Navigate to add permissions wizard
  const onNavigateToAddPermissions = () => {
    if (!role) return;
    navigate(pathnames['role-add-permission'].link.replace(':roleId', role.uuid));
  };

  return {
    role,
    isRecordLoading,
    filteredPermissions,
    applications: role?.applications || [],
    resources,
    operations,
    showResourceDefinitions,
    onRemovePermissions,
    onNavigateToAddPermissions,
  };
};
