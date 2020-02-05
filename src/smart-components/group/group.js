import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Route, Switch, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import AppTabs from '../app-tabs/app-tabs';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import GroupPrincipals from './principal/principals';
import GroupRoles from './role/group-roles';
import { fetchGroup } from '../../redux/actions/group-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import { Button, Level, LevelItem } from '@patternfly/react-core';
import EditGroup from './edit-group-modal';

const Group = ({
  match: { params: { uuid }},
  group,
  fetchGroup,
  isFetching
}) => {
  const breadcrumbsList = () => [
    { title: 'User Access Management', to: '/groups' },
    { title: group.name, isActive: true }
  ];

  const tabItems = [
    { eventKey: 0, title: 'Roles', name: `/groups/detail/${uuid}/roles` },
    { eventKey: 1, title: 'Members', name: `/groups/detail/${uuid}/members` }
  ];
  const [ showEdit, setShowEdit ] = useState(false);

  const fetchData = (apiProps) => {
    fetchGroup(apiProps);
  };

  useEffect(() => {
    fetchData(uuid);
  }, []);

  return (
    <Fragment>
      <TopToolbar breadcrumbs={ breadcrumbsList() }>
        <Level>
          <LevelItem>
            <TopToolbarTitle title={ !isFetching && group ? group.name : undefined }
              description={ !isFetching && group ? group.description : undefined } />
            <AppTabs tabItems={ tabItems } />
          </LevelItem>

          <LevelItem>
            <Button onClick={ () => setShowEdit(true) } variant='secondary'>Edit Group</Button>
          </LevelItem>
          <EditGroup
            isOpen={ showEdit }
            group={ group }
            closeUrl={ `group/detail/${uuid}` }
            onClose={ () => setShowEdit(false) }
            postMethod={ () => {
              fetchData(uuid);
              setShowEdit(false);
            }
            }
          />

        </Level>

      </TopToolbar>
      <Switch>
        <Route path={ `/groups/detail/:uuid/roles` } component={ GroupRoles } />
        <Route path={ `/groups/detail/:uuid/members` } component={ GroupPrincipals } />
        <Route render={ () => <Redirect to={ `/groups/detail/${uuid}/members` } /> } />
      </Switch>
      { !group && <ListLoader/> }
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

