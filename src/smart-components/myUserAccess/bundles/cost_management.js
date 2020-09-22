import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import OrgAdminContext from '../../../utilities/org-admin-context';
import MUAAccessTable from '../MUAAccessTable';
import MUARolesTable from '../MUARolesTable';

const createFilter = ({ apps, isOrgAdmin, name = '', application = [] }) => [
  {
    key: 'application',
    value: application,
    placeholder: 'Filter by application',
    type: 'checkbox',
    items: apps.map((app) => ({ label: app, value: app })),
  },
  ...(isOrgAdmin
    ? [
        {
          key: 'name',
          type: 'text',
          value: name,
        },
      ]
    : []),
];

const CostManagementBundle = ({ apps }) => {
  const isOrgAdmin = useContext(OrgAdminContext);
  const [name, setName] = useState('');
  const [application, setApplication] = useState([]);
  const handleSetFilters = ({ name, application }) => {
    if (typeof name === 'string') {
      setName(name);
    }

    if (application) {
      setApplication(typeof application === 'string' ? [] : application);
    }
  };

  const filters = createFilter({ apps, isOrgAdmin, name, application });
  return isOrgAdmin ? (
    <MUARolesTable setFilters={handleSetFilters} filters={filters} apps={apps} showResourceDefinitions />
  ) : (
    <MUAAccessTable
      setFilters={handleSetFilters}
      filters={filters}
      apps={apps}
      hasActiveFilters={name.length > 0 || application.length > 0}
      showResourceDefinitions
    />
  );
};

CostManagementBundle.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default CostManagementBundle;
