import React, { useEffect, useState }  from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getPrincipalAccess } from '../../redux/actions/access-actions';
import { defaultSettings } from '../../helpers/shared/pagination';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './mua-table-helpers';

const columns = [
  { title: 'Application' },
  { title: 'Resource type' },
  { title: 'Operation' }
];

const MUAAccessTable = () => {

  const dispatch = useDispatch();
  const { permissions, isLoading } = useSelector(state => ({
    permissions: state.accessReducer.access,
    isLoading: state.accessReducer.isLoading
  }), shallowEqual);

  const [ config, setConfig ] = useState({
    pagination: {
      ...defaultSettings,
      filter: ''
    }
  });

  const fetchData = () => {
    dispatch(getPrincipalAccess());
  };

  useEffect(() => {
    fetchData();
    setConfig({
      ...config,
      pagination: {
        ...config.pagination,
        count: permissions?.length || 0
      }
    });
  }, []);

  const { pagination, filter } = config;

  const filteredRows = permissions?.data?.filter(({ permission }) => permission === '*' || filter ? permission.includes(filter) : true);

  return <TableToolbarView
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
    isLoading={ isLoading }
    pagination={ {
      ...pagination,
      count: filteredRows.length
    } }
    titlePlural="permissions"
    titleSingular="permission"
  />;
};

export default MUAAccessTable;
