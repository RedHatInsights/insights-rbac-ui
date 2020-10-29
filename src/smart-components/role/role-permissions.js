import React, { useEffect, useState } from 'react';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './role-permissions-table-helpers';
import { cellWidth } from '@patternfly/react-table';
import './role-permissions.scss';
import { defaultSettings } from '../../helpers/shared/pagination';
import RemovePermissionsModal from './remove-permissions-modal';
import { removeRolePermissions, fetchRole } from '../../redux/actions/role-actions';
import { Link, Route, useHistory } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import AddRolePermissionWizard from './add-role-permissions/add-role-permission-wizard';
import { routes as paths } from '../../../package.json';

const columns = [{ title: 'Application' }, { title: 'Resource type' }, { title: 'Operation' }, { title: 'Last commit', transforms: [cellWidth(15)] }];

const removeModalText = (permissions, role, plural) =>
  plural ? (
    <p>
      The <b> {`${permissions}`}</b> selected permissions will no longer be granted through the <b>{`${role.name}`}</b> role.
    </p>
  ) : (
    <p>
      The <b>{`${permissions}`}</b> permission will no longer be granted through the <b> {`${role.name}`}</b> role.
    </p>
  );

const Permissions = () => {
  const [config, setConfig] = useState({
    pagination: {
      ...defaultSettings,
      filter: '',
    },
  });
  const { role, isRecordLoading } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual
  );

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});
  const history = useHistory();
  const dispatch = useDispatch();

  const setCheckedItems = (newSelection) => {
    setSelectedPermissions((rows) => newSelection(rows).map(({ uuid }) => ({ uuid })));
  };

  const { pagination, filter } = config;

  useEffect(() => {
    setConfig({
      ...config,
      pagination: {
        ...config.pagination,
        count: role.access ? role.access.length : 0,
      },
    });
  }, [role]);

  const filteredRows =
    role && role.access
      ? (role.access || [])
          .filter(({ permission }) => (permission === '*' || filter ? permission.includes(filter) : true))
          .map((acc) => ({ uuid: acc.permission, ...acc, modified: role.modified }))
      : [];

  const removePermissions = (permissions) => {
    const permissionsToRemove = permissions.reduce((acc, curr) => [...acc, curr.uuid], []);
    return dispatch(removeRolePermissions(role, permissionsToRemove)).then(() => {
      dispatch(fetchRole(role.uuid));
      setSelectedPermissions([]);
    });
  };

  const actionResolver = () => [
    {
      title: 'Remove',
      onClick: (_event, _rowId, permission) => {
        setConfirmDelete(() => () => removePermissions([permission]));
        setDeleteInfo({
          title: 'Remove permission?',
          text: removeModalText(permission.uuid, role, false),
          confirmButtonLabel: 'Remove permission',
        });
        setShowRemoveModal(true);
      },
    },
  ];

  const toolbarButtons = () => [
    ...[
      // eslint-disable-next-line react/jsx-key
      <Link to={`/roles/detail/${role.uuid}/role-add-permission`} key="role-add-permission" className="pf-m-visible-on-md">
        <Button variant="primary" aria-label="Add Permission">
          Add Permission
        </Button>
      </Link>,
      {
        label: 'Add Permission',
        props: {
          className: 'pf-m-hidden-on-md',
        },
        onClick: () => {
          history.push(`/roles/detail/${role.uuid}/role-add-permission`);
          console.log('CLICKEANDO EN LINK-- adding permissions now!');
        },
      },
      {
        label: 'Remove',
        props: {
          isDisabled: !selectedPermissions.length > 0,
        },
        onClick: () => {
          const multiplePermissionsSelected = selectedPermissions.length > 1;
          setConfirmDelete(() => () => removePermissions([...selectedPermissions]));
          setDeleteInfo({
            title: multiplePermissionsSelected ? 'Remove permissions?' : 'Remove permission?',
            text: removeModalText(
              multiplePermissionsSelected ? selectedPermissions.length : selectedPermissions[0].uuid,
              role,
              selectedPermissions.length > 1
            ),
            confirmButtonLabel: multiplePermissionsSelected ? 'Remove permissions' : 'Remove permission',
          });
          setShowRemoveModal(true);
        },
      },
    ],
  ];

  const routes = () => (
    <>
      <Route exact path={paths['role-add-permission']}>
        <AddRolePermissionWizard
          isOpen={true}
          role={role}
          selectedPermissions={selectedPermissions}
          setSelectedPermissions={setSelectedPermissions}
        />
      </Route>
    </>
  );

  return (
    <section className="pf-c-page__main-section ins-c-role__permissions">
      {showRemoveModal && (
        <RemovePermissionsModal
          text={deleteInfo.text}
          title={deleteInfo.title}
          isOpen={showRemoveModal}
          confirmButtonLabel={deleteInfo.confirmButtonLabel}
          onClose={() => setShowRemoveModal(false)}
          onSubmit={() => {
            setShowRemoveModal(false);
            confirmDelete();
            setSelectedPermissions([]);
          }}
        />
      )}
      <TextContent>
        <Text component={TextVariants.h1}>Permissions</Text>
      </TextContent>
      <TableToolbarView
        columns={columns}
        createRows={createRows}
        actionResolver={role.system ? undefined : actionResolver}
        data={filteredRows.slice(pagination.offset, pagination.offset + pagination.limit)}
        filterValue={filter}
        ouiaId="role-permissions-table"
        fetchData={({ limit, offset, name }) =>
          setConfig({
            ...config,
            filter: name,
            pagination: {
              ...config.pagination,
              limit,
              offset,
            },
          })
        }
        isSelectable={!role.system}
        setCheckedItems={setCheckedItems}
        checkedRows={selectedPermissions}
        setFilterValue={({ name }) =>
          setConfig({
            ...config,
            filter: name,
          })
        }
        toolbarButtons={toolbarButtons}
        isLoading={isRecordLoading}
        pagination={{
          ...pagination,
          count: filteredRows.length,
        }}
        titlePlural="permissions"
        titleSingular="permission"
        routes={routes}
      />
    </section>
  );
};

export default Permissions;
