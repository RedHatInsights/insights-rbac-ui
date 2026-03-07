import React from 'react';
import { Overview } from '../../../shared/components/overview/Overview';
import pathnames from '../../utilities/pathnames';

const V1Overview: React.FC = () => <Overview links={{ groups: pathnames.groups.link(), roles: pathnames.roles.link() }} />;

export { V1Overview };
export default V1Overview;
