import React from 'react';
import { Overview } from '../../../shared/components/overview/Overview';
import pathnames from '../../utilities/pathnames';

const V2Overview: React.FC = () => (
  <Overview
    links={{
      groups: pathnames['user-groups'].link(),
      roles: pathnames['access-management-roles'].link(),
    }}
  />
);

export { V2Overview };
export default V2Overview;
