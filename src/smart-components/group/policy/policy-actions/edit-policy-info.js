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
  match: { params: { id }},
  addNotification,
  fetchPolicy,
  updatePolicy,
  postMethod,
  policy,
  isFetching
}) => {
  const [ formData, setFormData ] = useState({});

  const handleChange = data => setFormData({ ...formData, ...data });

  useEffect(() => {
    fetchPolicy(id).then((data) => { setFormData({ ...formData, ...data.value });});
  }, []);

  const onSave = () => {
    const { name, description } = formData;
    const policyData = { id, name, description };
    updatePolicy(policyData).then(postMethod()).then(push('/policies'));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: `Edit policy's roles`,
      description: `Edit policy's roles was cancelled by the user.`
    });
    push('/policies');
  };

  return (
    <Modal
      title={ `Edit policy's information` }
      width={ '40%' }
      isOpen
      onClose={ onCancel }
      onSave={ onSave }>
      <Stack gutter="md">
        <StackItem>
          <FormGroup>
            { isFetching && <FormItemLoader/> }
            { !isFetching && (
              <PolicyInformation formData = { formData }
                handleChange = { handleChange }
                title = { `Make any changes to policy ${policy.name}` }/>) }
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
  policy: PropTypes.object,
  id: PropTypes.string,
  editType: PropTypes.string,
  isFetching: PropTypes.bool
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  updatePolicy,
  fetchPolicy
}, dispatch);

const mapStateToProps = ({ policyReducer: { policy, isRecordLoading }}) => ({
  policy,
  isFetching: isRecordLoading
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPolicyInfoModal));
