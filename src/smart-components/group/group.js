import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { fetchGroup } from '../../helpers/group/group-helper';

const tabItems = [{ eventKey: 0, title: 'Members', name: '/members' }, { eventKey: 0, title: 'Policies', name: '/policies' }];

const Group = ({ match: { params: { id }}}) => {
  const breadcrumbsList = () => [
    { title: 'Groups', to: '/groups' },
    { title: 'Group', isActive: true }
  ];
  const [ isFetching, setFetching ] = useState(true);
  const [ group, setGroup ] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      const groupData = await fetchGroup(id);
      setGroup(groupData);
      console.log('Debug: group', group, group);
      setFetching(false);
    };

    fetchData();
  }, []);

  return (
    <Fragment>
      <TopToolbar breadcrumbs={ breadcrumbsList() }>
        <TopToolbarTitle title= { !isFetching && group ? group.name : undefined } />
        <AppTabs tabItems={ tabItems } />
      </TopToolbar>
    </Fragment>
  );
};

Group.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  match: PropTypes.object
};

export default withRouter(Group);
