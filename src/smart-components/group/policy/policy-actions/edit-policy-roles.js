import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { ActionGroup, Button, FormGroup, Modal, Split, SplitItem, Stack, StackItem } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications';
import { updatePolicy, fetchPolicy } from '../../../../redux/actions/policy-actions';
import { fetchRoles } from '../../../../redux/actions/role-actions';
import { PolicyRolesLoader } from '../../../../presentational-components/shared/loader-placeholders';
import PolicySetRoles from '../../add-group/policy-set-roles';
import '../../../../App.scss';

const EditPolicyRolesModal = ({
  roles,
  history: { push },
  match: { params: { id }},
  addNotification,
  policy,
  fetchPolicy,
  updatePolicy,
  postMethod,
  isFetching,
  closeUrl
}) => {
  const [ selectedRoles, setSelectedRoles ] = useState([]);

  const fetchData = () => {
    fetchPolicy(id);
  };

  useEffect(() => {
    fetchData();
    setSelectedRoles(roles);
  }, [ roles ]);

  const onSave = () => {
    if (policy) {
      const policy_data = {
        name: policy.name,
        group: policy.group.uuid,
        roles: selectedRoles.map(role => role.uuid)
      };
      return postMethod ? updatePolicy(policy.uuid, policy_data).then(() => postMethod()).then(() => push(closeUrl)) :
        updatePolicy(policy.uuid, policy_data).then(() => push(closeUrl));
    }

    push(closeUrl);
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: `Edit policy's roles`,
      dismissable: true,
      description: `Edit policy's roles was cancelled by the user.`
    });
    push(closeUrl);
  };

  return (
    <Modal
      title={ `Edit policy roles` }
      width={ '60%' }
      isOpen
      onClose={ onCancel }
      onSave={ onSave }>
      <Stack gutter="md">
        <StackItem>
          <FormGroup>
            { isFetching && <PolicyRolesLoader/> }
            { !isFetching &&
                  <PolicySetRoles formValue={ policy }
                    selectedRoles = { selectedRoles }
                    setSelectedRoles = { setSelectedRoles }
                    roles={ roles }
                    description = { `At least one role must be selected for the ${policy.name} policy.` }
                  /> }
          </FormGroup>
        </StackItem>
        <StackItem>
          <ActionGroup>
            <Split gutter="md">
              <SplitItem>
                <Button aria-label={ 'Save' }
                  variant="primary"
                  type="submit"
                  isDisabled={ isFetching }
                  onClick={ onSave }>Save</Button>
              </SplitItem>
              <SplitItem>
                <Button  aria-label='Cancel'
                  variant='secondary'
                  type='button'
                  onClick={ onCancel }>Cancel</Button>
              </SplitItem>
            </Split>
          </ActionGroup>
        </StackItem>
      </Stack>
    </Modal>
  );
};

EditPolicyRolesModal.defaultProps = {
  selectedRoles: [],
  inputValue: '',
  closeUrl: '/policies',
  isFetching: false
};

EditPolicyRolesModal.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  match: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
  fetchPolicy: PropTypes.func.isRequired,
  postMethod: PropTypes.func.isRequired,
  updatePolicy: PropTypes.func.isRequired,
  id: PropTypes.string,
  editType: PropTypes.string,
  policy: PropTypes.any,
  roles: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([ PropTypes.number, PropTypes.string ]).isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  closeUrl: PropTypes.string,
  isFetching: PropTypes.bool
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  updatePolicy,
  fetchPolicy
}, dispatch);

const mapStateToProps = ({ policyReducer: { isRecordLoading, policies: { data } } }, { match: { params: { id } } }) => {
  const selectedPolicy = data.find(({ uuid }) => uuid === id) || {};
  return ({
    isFetching: isRecordLoading,
    policy: selectedPolicy,
    roles: selectedPolicy.roles
  });
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPolicyRolesModal));
