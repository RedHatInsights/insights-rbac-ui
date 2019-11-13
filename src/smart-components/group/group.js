import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import GroupPolicies from './policy/policies';
import GroupPrincipals from './principal/principals';
import { fetchGroup } from '../../redux/actions/group-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';

const Group = (props) => {
  const breadcrumbsList = () => [
    { title: 'User Access Management', to: '/groups' },
    { title: 'Group', isActive: true }
  ];

  const tabItems = [{ eventKey: 0, title: 'Members', name: `/groups/detail/${props.match.params.uuid}/members` },
    { eventKey: 1, title: 'Policies', name: `/groups/detail/${props.match.params.uuid}/policies` }];

  const fetchData = (apiProps) => {
    props.fetchGroup(apiProps);
  };

  useEffect(() => {
    fetchData(props.match.params.uuid);
  }, []);

  return (
    <Fragment>
      <TopToolbar breadcrumbs={ breadcrumbsList() }>
        <TopToolbarTitle title= { !props.isFetching && props.group ? props.group.name : undefined }
          description={ !props.isFetching && props.group ? props.group.description : undefined }/>
        <AppTabs tabItems={ tabItems } />
      </TopToolbar>
      <Switch>
        <Route path={ `/groups/detail/:uuid/policies` } component={ GroupPolicies } />
        <Route path={ `/groups/detail/:uuid/members` } component={ GroupPrincipals } />
        <Route render={ () => <Redirect to={ `/groups/detail/${props.match.params.uuid}/members` } /> } />
      </Switch>
      { !props.group && <ListLoader/> }
    </Fragment>
  );
};

const mapStateToProps = ({ groupReducer: { selectedGroup, isLoading }}) => ({
  group: selectedGroup,
  isFetching: isLoading
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchGroup
}, dispatch);

Group.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  match: PropTypes.object,
  group: PropTypes.shape({
    uuid: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string
  }),
  isFetching: PropTypes.bool,
  fetchGroup: PropTypes.func
};

Group.defaultProps = {
  isFetching: false
};

export default connect(mapStateToProps, mapDispatchToProps)(Group);

