import React, { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getPrincipalAccess } from '../../redux/actions/access-actions';
import { defaultSettings } from '../../helpers/shared/pagination';
import { TableToolbarViewOld } from '../../presentational-components/shared/table-toolbar-view-old';
import { createRows } from './mua-table-helpers';
import ResourceDefinitionsModal from './ResourceDefinitionsModal';
import { sortable } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const MUAAccessTable = ({ filters, setFilters, apps, hasActiveFilters, showResourceDefinitions }) => {
  const intl = useIntl();
  const [{ rdOpen, rdPermission, resourceDefinitions }, setRdConfig] = useState({ rdOpen: false });
  const { current: columns } = useRef([
    { title: intl.formatMessage(messages.application), key: 'application', transforms: [sortable] },
    { title: intl.formatMessage(messages.resourceType), key: 'resource_type', transforms: [sortable] },
    { title: intl.formatMessage(messages.operation), key: 'verb', transforms: [sortable] },
    ...(showResourceDefinitions ? [{ title: intl.formatMessage(messages.resourceDefinitions) }] : []),
  ]);

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

  const handleRdClick = (index) =>
    setRdConfig({
      rdOpen: true,
      rdPermission: permissions.data[index].permission,
      resourceDefinitions: permissions.data[index].resourceDefinitions,
    });

  useEffect(() => {
    fetchData(defaultSettings);
  }, []);

  const filteredRows = permissions?.data || [];

  return (
    <Fragment>
      <TableToolbarViewOld
        columns={columns}
        createRows={(data) => createRows(data, showResourceDefinitions, handleRdClick)}
        data={filteredRows}
        fetchData={fetchData}
        filters={filters}
        setFilterValue={setFilters}
        isLoading={isLoading}
        pagination={permissions?.meta}
        ouiaId="permissions-table"
        titlePlural={intl.formatMessage(messages.permissions).toLowerCase()}
        titleSingular={intl.formatMessage(messages.permission).toLowerCase()}
        noData={!isLoading && !hasActiveFilters && filteredRows.length === 0}
        noDataDescription={[intl.formatMessage(messages.noPermissionsForInsights), intl.formatMessage(messages.contactOrgAdministrator)]}
        tableId="mua-access"
      />
      <Suspense fallback={<Fragment />}>
        {rdOpen && (
          <ResourceDefinitionsModal
            resourceDefinitions={resourceDefinitions}
            isOpen={rdOpen}
            handleClose={() => setRdConfig({ rdOpen: false })}
            permission={rdPermission}
          />
        )}
      </Suspense>
    </Fragment>
  );
};

MUAAccessTable.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.object).isRequired,
  setFilters: PropTypes.func.isRequired,
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
  hasActiveFilters: PropTypes.bool,
  showResourceDefinitions: PropTypes.bool,
};

export default MUAAccessTable;
