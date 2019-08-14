import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Bullseye, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchGroupPolicies, fetchPolicy, removePolicy } from '../../../../redux/actions/policy-actions';

const RemovePolicyModal = ({
  history: { goBack, push },
  removePolicy,
  fetchPolicy,
  fetchGroupPolicies,
  policyId,
  policy
}) => {
  useEffect(() => {
    if (policyId) {
      fetchPolicy(policyId);
    }
  }, []);

  if (!policy) {
    return null;
  }

  const onSubmit = () => removePolicy(policyId)
  .then(() => {
    fetchGroupPolicies();
    push('/policys');
  });

  const onCancel = () => goBack();

  return (
    <Modal
      isOpen
      isSmall
      title = { '' }
      onClose={ onCancel }
      actions={ [
        <Button key="cancel" variant="secondary" type="button" onClick={ onCancel }>
          Cancel
        </Button>,
        <Button key="submit" variant="primary" type="button" onClick={ onSubmit }>
          Confirm
        </Button>
      ] }
    >
      <Bullseye>
        <TextContent>
          <Text component={ TextVariants.h1 }>
            Removing Policy:  { policy.name }
          </Text>
        </TextContent>
      </Bullseye>
    </Modal>
  );
};

RemovePolicyModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  removePolicy: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroupPolicies: PropTypes.func.isRequired,
  fetchPolicy: PropTypes.func.isRequired,
  policyId: PropTypes.string,
  policy: PropTypes.object
};

const mapStateToProps = ({ policyReducer: { selectedPolicy, isLoading }},
  { match: { params: { id }}}) => ({
  policyId: id,
  policy: selectedPolicy,
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  fetchPolicy,
  fetchGroupPolicies,
  removePolicy
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemovePolicyModal));
