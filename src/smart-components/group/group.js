import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { fetchGroup } from '../../helpers/group/group-helper';
//import GroupPolicies from './policy/policies';
import GroupPrincipals from './principal/principal';

const Group = ({ match: { params: { uuid }}, location: { pathname }}) => {
  const breadcrumbsList = () => [
    { title: 'Groups', to: '/groups' },
    { title: 'Group', isActive: true }
  ];
  const [ isFetching, setFetching ] = useState(true);
  const [ group, setGroup ] = useState(true);
  const [ tabItems ] = useState([{ eventKey: 0, title: 'Members', name: `${pathname}/members` },
    { eventKey: 1, title: 'Policies', name: `${pathname}/policies` }]);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      const groupData = await fetchGroup(uuid);
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
      <GroupPrincipals uuid={ group.uuid }/>
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
