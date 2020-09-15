import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getPrincipalAccess } from '../../redux/actions/access-actions';
import { defaultSettings } from '../../helpers/shared/pagination';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { createRows } from './mua-table-helpers';

const columns = [{ title: 'Application' }, { title: 'Resource type' }, { title: 'Operation' }];

const MUAAccessTable = ({ filters, setFilters, apps }) => {
  const dispatch = useDispatch();
  const { permissions, isLoading } = useSelector(
    (state) => ({
      permissions: state.accessReducer.access,
      isLoading: state.accessReducer.isLoading,
    }),
    shallowEqual
  );

  const fetchData = ({ application, ...apiProps }) => {
    const applicationParam = application?.length > 0 ? application : apps;
    dispatch(getPrincipalAccess({ application: applicationParam.join(','), ...apiProps }));
  };

  useEffect(() => {
    fetchData(defaultSettings);
  }, []);

  const filteredRows = permissions?.data;

  return (
    <TableToolbarView
      columns={columns}
      createRows={createRows}
      data={filteredRows}
      fetchData={fetchData}
      filters={filters}
      setFilterValue={setFilters}
      isLoading={isLoading}
      pagination={permissions?.meta}
      titlePlural="permissions"
      titleSingular="permission"
    />
  );
};

MUAAccessTable.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.object).isRequired,
  setFilters: PropTypes.func.isRequired,
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default MUAAccessTable;
