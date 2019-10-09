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
  const [ formData, setFormData ] = useState({ policy: undefined });

  const handleChange = data => setFormData({ ...formData, ...data });

  useEffect(() => {
    fetchPolicy(id).then((data) => { console.log('DEBUG - data.value:  ', data.value); setFormData({ ...formData, policy: data.value  });});
  }, []);

  const onSave = () => {
    const policyData = { id, name: formData.policy.name, description: formData.policy.description };
    updatePolicy(policyData).then(postMethod()).then(push(closeUrl || `/groups/detail/${uuid}/policies`));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: `Edit policy's roles`,
      description: `Edit policy's roles was cancelled by the user.`
    });
    push(closeUrl || `/groups/detail/${uuid}/policies`);
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
            { (isFetching || !formData.policy) && <FormItemLoader/> }
            { !isFetching && formData.policy && (
              <PolicyInformation
                editType = { 'edit' }
                formData = { formData }
                handleChange = { handleChange }
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
