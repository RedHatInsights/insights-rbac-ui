import React, { Fragment, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import GroupPolicies from './policy/policies';
import GroupPrincipals from './principal/principals';
import { fetchGroup } from '../../redux/actions/group-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';

const initialState = {
  isFetching: true
};

const groupUIReducer = (state, { type, payload }) => ({
  setIsFetching: ({ ...state, isFetching: payload })
})[type];

const Group = (props) => {
  const breadcrumbsList = () => [
    { title: 'User Access Management', to: '/groups' },
    { title: 'Group', isActive: true }
  ];

  const tabItems = [{ eventKey: 0, title: 'Members', name: `/groups/detail/${props.match.params.uuid}/members` },
    { eventKey: 1, title: 'Policies', name: `/groups/detail/${props.match.params.uuid}/policies` }];

  const [{ isFetching }, dispatch ] = useReducer(groupUIReducer, initialState);

  const fetchData = (apiProps) => {
    dispatch({ type: 'setIsFetching', payload: true });
    props.fetchGroup(apiProps).then(() => dispatch({ type: 'setIsFetching', payload: false }))
    .catch(() => dispatch({ type: 'setIsFetching', payload: false }));
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
      { !isFetching && props.group &&
      <Switch>
        <Route path={ tabItems[0].name } render={ args => <GroupPrincipals uuid={ props.group.uuid } { ...args }/> } />
        <Route path={ tabItems[1].name } render={ args => <GroupPolicies uuid={ props.group.uuid } { ...args }/> } />
        <Route path={ `${props.location.pathname}` }
          render={ args => <GroupPrincipals uuid={ props.group.uuid } { ...args }/> } />
      </Switch> }
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

