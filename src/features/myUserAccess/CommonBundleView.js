import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import OrgAdminContext from '../../utilities/orgAdminContext';
import MUAAccessTable from './MUAAccessTable';
import MUARolesTable from './MUARolesTable';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

// TODO: Add permissions back when we support partial matching

export const createFilter = ({ apps, isOrgAdmin, name = '', application = [] /* permission = '' */ }) => {
  const intl = useIntl();
  return [
    {
      key: 'application',
      value: application,
      placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.application).toLowerCase() }),
      type: 'checkbox',
      items: apps.map((app) => ({ label: app, value: app })),
    },
    ...(isOrgAdmin
      ? [
          {
            key: 'name',
            type: 'text',
            value: name,
            label: intl.formatMessage(messages.roleName),
            placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.roleName).toLowerCase() }),
          },
          // {
          //   key: 'permission',
          //   value: permission,
          //   placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.permission).toLowerCase() }),
          //   type: 'text',
          // },
        ]
      : []),
  ];
};

const CommonBundleView = ({ apps }) => {
  const isOrgAdmin = useContext(OrgAdminContext);
  const [name, setName] = useState('');
  const [permission, setPermission] = useState('');
  const [application, setApplication] = useState([]);
  const handleSetFilters = ({ name, application, permission }) => {
    if (typeof name === 'string') {
      setName(name);
    }

    if (typeof permission === 'string') {
      setPermission(permission);
    }

    if (application) {
      setApplication(typeof application === 'string' ? [] : application);
    }
  };

  const filters = createFilter({ apps, isOrgAdmin, name, application, permission });
  return isOrgAdmin ? (
    <MUARolesTable setFilters={handleSetFilters} filters={filters} apps={apps} />
  ) : (
    <MUAAccessTable setFilters={handleSetFilters} filters={filters} apps={apps} hasActiveFilters={name.length > 0 || application.length > 0} />
  );
};

CommonBundleView.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default CommonBundleView;
