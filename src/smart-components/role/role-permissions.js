import React, { useEffect, useState } from 'react';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { shallowEqual, useSelector } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './role-permissions-table-helpers';
import { cellWidth } from '@patternfly/react-table';
import './role-permissions.scss';
import { defaultSettings } from '../../helpers/shared/pagination';
import RemovePermissionsModal from './remove-permissions-modal';

const columns = [{ title: 'Application' }, { title: 'Resource type' }, { title: 'Operation' }, { title: 'Last commit', transforms: [cellWidth(15)] }];

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
  const [selectedRows, setSelectedRows] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});

  const actionResolver = () =>
  [
    {
      title: 'Delete',
      onClick: (_event, _rowId, permission) => {
        console.log('event', _event, 'row_id', _rowId, 'perm', permission);
        setConfirmDelete(() => () => null); /*removeRoles(uuid, [ role.uuid ], () => fetchRolesForGroup({ ...pagination, offset: 0 })(uuid)));*/
            setDeleteInfo({
              title: 'Remove permission?',
              confirmButtonLabel: 'Remove permission',
              text: 'text'//removeModalText(name, permission.title, false)
            });
            setShowRemoveModal(true);
      }
    }
  ];

  const { pagination, filter } = config;

  const filteredRows =
    role && role.access
      ? (role.access || [])
          .filter(({ permission }) => (permission === '*' || filter ? permission.includes(filter) : true))
          .map((acc) => ({ uuid: acc.permission.replace(/:/g, '-'), ...acc, modified: role.modified }))
      : [];

  const setCheckedItems = (newSelection) => {
    setSelectedRows((rows) => newSelection(rows).map(({ uuid, permission, label }) => ({ uuid, label: permission ? permission : label })));
  };

  const actionResolver = () => [
    {
      title: 'Delete',
      onClick: (_event, _rowId, permission) => {
        console.log('event', _event, 'row_id', _rowId, 'perm', permission);
        setConfirmDelete(() => () => null); /*removeRoles(uuid, [ role.uuid ], () => fetchRolesForGroup({ ...pagination, offset: 0 })(uuid)));*/
        setDeleteInfo({
          title: 'Remove permission?',
          confirmButtonLabel: 'Remove permission',
          text: 'text', //removeModalText(name, permission.title, false)
        });
        setShowRemoveModal(true);
      },
    },
  ];

  useEffect(() => {
    setConfig({
      ...config,
      pagination: {
        ...config.pagination,
        count: role.access ? role.access.length : 0,
      },
    });
  }, [role]);

  const filteredRows = (role && role.access) ?
    (role.access || [])
    .filter(({ permission }) => permission === '*' || filter ? permission.includes(filter) : true)
    .map(acc => ({ ...acc, modified: role.modified })) :
    [];

  return <section className="pf-c-page__main-section ins-c-role__permissions">
    { showRemoveModal && <RemovePermissionsModal
        text={ deleteInfo.text }
        title={ deleteInfo.title }
        isOpen={ showRemoveModal }
        isChanged={ true } //isChanged }
        isDefault={ false } // isDefault }
        confirmButtonLabel={ deleteInfo.confirmButtonLabel }
        onClose={ () => setShowRemoveModal(false) }

        onSubmit={ () => {
          setShowRemoveModal(false);
          confirmDelete();
          //setSelectedRoles([]);
          // onDefaultGroupChanged(isDefault && !isChanged);
        } }
      />}
    <TextContent>
      <Text component={ TextVariants.h1 }>Permissions</Text>
    </TextContent>
    <TableToolbarView
      columns={ columns }
      createRows={ createRows }
      actionResolver={ actionResolver }
      data={ filteredRows.slice(pagination.offset, pagination.offset + pagination.limit) }
      filterValue={ filter }
      fetchData={ ({ limit, offset, name }) => setConfig({
        ...config,
        filter: name,
        pagination: {
          ...config.pagination,
          limit,
          offset
        }
      }) }
      isSelectable={ true }
      setCheckedItems={ setCheckedItems }
      checkedRows={ selectedRows }
      setFilterValue={ ({ name }) => setConfig({
        ...config,
        filter: name
      })  }
      isLoading={ isRecordLoading }
      pagination={ {
        ...pagination,
        count: filteredRows.length
      } }
      titlePlural="permissions"
      titleSingular="permission"
    />
  </section>;
};

export default Permissions;
