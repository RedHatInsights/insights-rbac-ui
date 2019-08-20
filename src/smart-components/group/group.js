import React, { Fragment, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch, withRouter } from 'react-router-dom';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { fetchGroup, resetSelectedGroup } from '../../redux/actions/group-actions';
import GroupPolicies from './policy/policies';
import GroupPrincipals from './principal/principal';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

const initialState = {
  group: '',
  isFetching: true
};

const groupUiReducer = (state, { type, payload }) => ({
  setGroup: ({ ...state, group: payload }),
  setIsFetching: ({ ...state, isFetching: payload })
})[type];

const Group = ({ match: { params: { uuid }}, location: { pathname }}) => {

  const [{ group, isFetching }, dispatch ] = useReducer(groupUiReducer, initialState);
  const tabItems = [{ eventKey: 0, title: 'Members', name: `/groups/detail/${uuid}/members` },
    { eventKey: 1, title: 'Policies', name: `/groups/detail/${uuid}/policies` }];

  const breadcrumbsList = () => [
    { title: 'Groups', to: '/groups' },
    { title: 'Group', isActive: true }
  ];
  const fetchData = (uuid) => {
    dispatch({ type: 'setIsFetching', payload: true });
    fetchGroup(uuid).then(() => dispatch({ type: 'setIsFetching', payload: false }))
    .catch(() => dispatch({ type: 'setIsFetching', payload: false }));
  };

  useEffect(() => {
    fetchData(uuid);
  }, [ uuid ]);

  return (
    <Fragment>
      <TopToolbar breadcrumbs={ breadcrumbsList() }>
        <TopToolbarTitle title= { !isFetching && group ? group.name : undefined }
          description={ !isFetching && group ? group.description : undefined }/>
        <AppTabs tabItems={ tabItems } />
      </TopToolbar>
      <Switch>
        <Route path={ tabItems[0].name } render={ props => <GroupPrincipals uuid={ group.uuid } { ...props }/> } />
        <Route path={ tabItems[1].name } render={ props => <GroupPolicies uuid={ group.uuid } { ...props }/> } />
        <Route path={ `${pathname}` } render={ props => <GroupPrincipals uuid={ group.uuid } { ...props }/> } />
      </Switch>
    </Fragment>
  );
};

Group.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }),
  match: PropTypes.object
};

const mapStateToProps = ({ groupReducer: { selectedGroup, isLoading }}) => ({
  group: selectedGroup,
  isLoading
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchGroup,
  resetSelectedGroup
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Group));
