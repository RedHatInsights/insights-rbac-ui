import React, { useEffect, useState } from 'react';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { shallowEqual, useSelector } from 'react-redux';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './role-permissions-table-helpers';
import { cellWidth } from '@patternfly/react-table';
import './role-permissions.scss';
import { defaultSettings } from '../../helpers/shared/pagination';

const columns = [
  { title: 'Application' },
  { title: 'Resource type' },
  { title: 'Operation' },
  { title: 'Last commit', transforms: [ cellWidth(15) ]}
];

const Permissions = () => {
  const [ config, setConfig ] = useState({
    pagination: {
      ...defaultSettings,
      filter: ''
    }
  });
  const { role, isRecordLoading } = useSelector(state => ({
    role: state.roleReducer.selectedRole,
    isRecordLoading: state.roleReducer.isRecordLoading
  }), shallowEqual);

  const { pagination, filter } = config;

  useEffect(() => {
    setConfig({
      ...config,
      pagination: {
        ...config.pagination,
        count: role.access ? role.access.length : 0
      }
    });
  }, [ role ]);

  const filteredRows = (role && role.access) ?
    (role.access || [])
    .filter(({ permission }) => permission === '*' || filter ? permission.includes(filter) : true)
    .map(acc => ({ ...acc, modified: role.modified })) :
    [];

  return <section className="pf-c-page__main-section ins-c-role__permissions">
    <TextContent>
      <Text component={ TextVariants.h1 }>Permissions</Text>
    </TextContent>
    <TableToolbarView
      columns={ columns }
      createRows={ createRows }
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
