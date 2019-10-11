import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { ActionGroup, Button, FormGroup, Modal, Split, SplitItem, Stack, StackItem } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications';
import { updatePolicy, fetchPolicy } from '../../../../redux/actions/policy-actions';
import { FormItemLoader } from '../../../../presentational-components/shared/loader-placeholders';
import PolicyInformation from '../../add-group/policy-information';
import '../../../../App.scss';

const EditPolicyInfoModal = ({
  history: { push },
  match: { params: { uuid, id }},
  addNotification,
  fetchPolicy,
  updatePolicy,
  postMethod,
  closeUrl,
  isFetching
}) => {
  const [ policy, setPolicy ] = useState(undefined);

  const handleChange = data => { setPolicy(data.policy); };

  useEffect(() => {
    fetchPolicy(id).then((data) => setPolicy(data.value));
  }, []);

  const onSave = () => {
    if (policy) {
      const policy_data = {
        name: policy.name,
        description: policy.description,
        group: policy.group.uuid,
        roles: policy.roles.map(role => role.uuid)
      };
      return postMethod ? updatePolicy(policy.uuid, policy_data).then(() => postMethod()).then(() => push(closeUrl)) :
        updatePolicy(policy.uuid, policy_data).then(() => push(closeUrl));
    }
    else {
      if (postMethod) {
        postMethod();
      }

      push(closeUrl || `/groups/detail/${uuid}/policies`);
    }
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: `Edit policy's information`,
      dismissable: true,
      description: `Edit policy's information was cancelled by the user.`
    });
    push(closeUrl);
  };

  return (
    <Modal
      title={ `Edit policy information` }
      width={ '40%' }
      isOpen
      onClose={ onCancel }
      onSave={ onSave }>
      <Stack gutter="md">
        <StackItem>
          <FormGroup>
            { (isFetching || !policy) && <FormItemLoader/> }
            { !isFetching && policy && (
              <PolicyInformation
                editType = { 'edit' }
                formData = { { policy } }
                onHandleChange = { handleChange }
              />) }
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

EditPolicyInfoModal.defaultProps = {
  isFetching: false
};

EditPolicyInfoModal.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  match: PropTypes.object,
  addNotification: PropTypes.func.isRequired,
  fetchPolicy: PropTypes.func.isRequired,
  postMethod: PropTypes.func.isRequired,
  updatePolicy: PropTypes.func.isRequired,
  id: PropTypes.string,
  editType: PropTypes.string,
  closeUrl: PropTypes.string,
  isFetching: PropTypes.bool
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  updatePolicy,
  fetchPolicy
}, dispatch);

const mapStateToProps = ({ policyReducer: { isRecordLoading }}) => ({
  isFetching: isRecordLoading
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPolicyInfoModal));
