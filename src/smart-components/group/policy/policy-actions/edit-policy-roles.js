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
  history: { push },
  match: { params: { id }},
  addNotification,
  fetchPolicy,
  updatePolicy,
  postMethod,
  isFetching,
  closeUrl
}) => {
  const [ roles, setRoles ] = useState([]);
  const [ policy, setPolicy ] = useState({});
  const [ selectedRoles, setSelectedRoles ] = useState({});

  const setPolicyData = (policyData) => {
    setPolicy(policyData);
    if (policyData && policyData.roles) {
      setSelectedRoles(policyData.roles.map(role => ({ value: role.uuid, label: role.name, id: role.uuid })));
    }
  };

  const fetchData = () => {
    fetchRoles().payload.then((data) => setRoles(data));
    fetchPolicy(id).then((data) => { setPolicyData(data.value); });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSave = () => {
    if (policy) {
      const policy_data = {
        name: policy.name,
        group: policy.group.uuid,
        roles: selectedRoles.map(role => role.value)
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
      width={ '40%' }
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
  roles: [],
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
  fetchPolicy,
  fetchRoles
}, dispatch);

const mapStateToProps = ({ policyReducer: { isRecordLoading }, roleReducer: { isLoading }}) => ({
  isFetching: isRecordLoading || isLoading
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPolicyRolesModal));
