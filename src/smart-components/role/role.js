import React, { useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { fetchRole } from '../../redux/actions/role-actions';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import Permissions from './role-permissions';
import { fetchGroup } from '../../redux/actions/group-actions';

const Role = () => {
  const { uuid, groupUuid } = useParams();
  const { role, group, isRecordLoading } = useSelector(state => ({
    role: state.roleReducer.selectedRole,
    isRecordLoading: state.roleReducer.isRecordLoading,
    ...groupUuid && { group: state.groupReducer.selectedGroup }
  }), shallowEqual);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchRole(uuid));
    groupUuid && dispatch(fetchGroup(groupUuid));
  }, [ uuid, groupUuid ]);

  return <Fragment>
    <TopToolbar breadcrumbs={ [
      ...[ groupUuid ? { title: 'Groups', to: '/groups' } : { title: 'Roles', to: '/roles' } ],
      ...groupUuid ? [{
        title: group && group.name,
        to: `/groups/detail/${groupUuid}/roles`,
        isLoading: group && group.loaded
      }] : [],
      { title: role && role.name, isActive: true }
    ] }>
      <TopToolbarTitle title= { !isRecordLoading && role ? role.name : undefined }
        description={ !isRecordLoading && role ? role.description : undefined }/>
    </TopToolbar>
    { (isRecordLoading || !role) ? <ListLoader/> : <Permissions /> }
  </Fragment>;
};

export default Role;
