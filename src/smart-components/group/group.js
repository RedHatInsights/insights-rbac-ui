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
import { Alert, AlertActionCloseButton, Button, Popover, Split, SplitItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import './group.scss';

import EditGroup from './edit-group-modal';

const Group = ({
  match: { params: { uuid }},
  group,
  fetchGroup,
  isFetching
}) => {
  const breadcrumbsList = () => [
    { title: 'Groups', to: '/groups' },
    { title: group.name, isActive: true }
  ];

  const tabItems = [
    { eventKey: 0, title: 'Roles', name: `/groups/detail/${uuid}/roles` },
    { eventKey: 1, title: 'Members', name: `/groups/detail/${uuid}/members` }
  ];
  const [ showEdit, setShowEdit ] = useState(false);
  const [ showDefaultGroupChangedInfo, setShowDefaultGroupChangedInfo ] = useState(false);

  const fetchData = (apiProps) => {
    fetchGroup(apiProps);
  };

  useEffect(() => {
    fetchData(uuid);
  }, []);

  const defaultGroupChangedIcon = (name) => (
    <div
      style={ { display: 'inline-flex' } }>
      { name }
      <div className="pf-u-ml-sm">
        <Popover
          aria-label="default-group-icon"
          bodyContent={ <div>Now that you have edited the <b>Default user access</b> group, the system will no longer update it with new default access roles.
                The group name has changed to <b>Custom default user access</b>.</div> }
        >
          <InfoCircleIcon className="ins-c-rbac__default-group-info-icon"/>
        </Popover>

      </div>
    </div>
  );

  return (
    <Fragment>
      <TopToolbar breadcrumbs={ breadcrumbsList() }>
        <Split hasGutter>
          <SplitItem isFilled>
            <TopToolbarTitle
              title={ !isFetching && group
                ? <Fragment>{ group.platform_default && !group.system ? defaultGroupChangedIcon(group.name) : group.name }</Fragment>
                : undefined }
              description={ !isFetching && group ? group.description : undefined } />
          </SplitItem>
          <SplitItem>
            { group.platform_default
              ? null
              : <Button onClick={ () => setShowEdit(true) } variant='secondary'>Edit group</Button>
            }
          </SplitItem>
          <EditGroup
            isOpen={ showEdit }
            group={ group }
            closeUrl={ `group/detail/${uuid}` }
            onClose={ () => setShowEdit(false) }
            postMethod={ () => {
              fetchData(uuid);
              setShowEdit(false);
            } }
          />

        </Split>
        { showDefaultGroupChangedInfo
          ? <Alert
            variant="info"
            isInline
            title="Default user access group has changed"
            action={ <AlertActionCloseButton onClose={ () => setShowDefaultGroupChangedInfo(false) } /> }
            className="pf-u-mb-lg pf-u-mt-sm"
          >
            Now that you have edited the <b>Default user access</b> group, the system will no longer update it with new default access roles.
                The group name has changed to <b>Custom default user access</b>.
          </Alert>
          : null
        }
      </TopToolbar>
      <AppTabs isHeader tabItems={ tabItems } />
      <Switch>
        <Route
          path={ `/groups/detail/:uuid/roles` }
          render={ props => <GroupRoles { ...props } onDefaultGroupChanged={ setShowDefaultGroupChangedInfo }/> } />
        <Route path={ `/groups/detail/:uuid/members` } component={ GroupPrincipals } />
        <Route render={ () => <Redirect to={ `/groups/detail/${uuid}/roles` } /> } />
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
    description: PropTypes.string,
    platform_default: PropTypes.string,
    system: PropTypes.string
  }),
  isFetching: PropTypes.bool,
  fetchGroup: PropTypes.func
};

Group.defaultProps = {
  isFetching: false
};

export default connect(mapStateToProps, mapDispatchToProps)(Group);

