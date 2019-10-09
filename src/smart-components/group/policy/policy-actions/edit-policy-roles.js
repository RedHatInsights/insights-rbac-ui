import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { ActionGroup, Button, FormGroup, Modal, Split, SplitItem, Stack, StackItem, Title } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications';
import { updatePolicy, fetchPolicy } from '../../../../redux/actions/policy-actions';
import { PolicyRolesLoader } from '../../../../presentational-components/shared/loader-placeholders';
import PolicySetRoles from '../../add-group/policy-set-roles';
import { fetchFilterRoles } from '../../../../helpers/role/role-helper';
import '../../../../App.scss';

const EditPolicyRolesModal = ({
  history: { push },
  match: { params: { id }},
  addNotification,
  fetchPolicy,
  updatePolicy,
  roles,
  postMethod,
  isFetching,
  closeUrl
}) => {
  const [ formData, setValues ] = useState({});

  const handleChange = data => {
    setValues({ ...formData, ...data });
  };

  const initialValues = (policyData) => {
    const roleOptions = policyData.role_refs.map((role, idx) => {
      return { label: (policyData.role_names[idx] ? policyData.role_names[idx] : role), value: role };
    });
    const data = { ...policyData, policyRoles: roleOptions };
    return data;
  };

  useEffect(() => {
    fetchPolicy(id).then((result) => setValues(initialValues(result.value)));
  }, []);

  useEffect(() => {
    roles = fetchFilterRoles();
  }, []);

  const onSave = () => {
    const { policyRoles } = formData;
    const policyData = { role_refs: policyRoles.map(role => role.value)  };
    updatePolicy({ id, ...policyData }).then(postMethod()).then(push(closeUrl));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: `Edit workflow's roles`,
      description: `Edit workflow's roles was cancelled by the user.`
    });
    push(closeUrl);
  };

  return (
    <Modal
      title={ `Edit policy's roles` }
      width={ '40%' }
      isOpen
      onClose={ onCancel }
      onSave={ onSave }>
      <Stack gutter="md">
        <StackItem>
          <FormGroup>
            { isFetching && <PolicyRolesLoader/> }
            { !isFetching && roles.length === 0 && (
              <Title headingLevel="h2" size="1xl">
                    No roles available.
              </Title>) }
            { !isFetching && roles.length > 0 && (
              <StackItem>
                <PolicySetRoles formData={ formData }
                  handleChange = { handleChange }
                  options={ roles }
                  title={ `Add or remove ${formData.name}'s roles` }/>
              </StackItem>) }
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
  closeUrl: '/policies',
  isFetching: false
};

EditPolicyRolesModal.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }),
  addPolicy: PropTypes.func.isRequired,
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
  fetchPolicy
}, dispatch);

const mapStateToProps = ({ policyReducer: { policy, isRecordLoading }}) => ({
  policy: policy.data,
  isFetching: isRecordLoading
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPolicyRolesModal));
