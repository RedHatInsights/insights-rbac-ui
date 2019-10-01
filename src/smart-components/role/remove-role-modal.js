import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Grid, GridItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchRoles, fetchRole, removeRole } from '../../redux/actions/role-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';

const RemoveRoleModal = ({
  history: { goBack, push },
  match: { params: { id }},
  removeRole,
  role,
  isLoading,
  fetchRole,
  fetchRoles
}) => {
  useEffect(() => {
    fetchRole(id);
  }, []);

  const onSubmit = () => removeRole(id)
  .then(() => {
    fetchRoles();
    push('/roles');
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
        <Button key="submit" isDisabled={ isLoading  }  variant="primary" type="button" onClick={ onSubmit }>
          Confirm
        </Button>
      ] }
    >
      <Grid gutter="sm">
        <GridItem span={ 5 }>
          <TextContent>
            <Text component={ TextVariants.h1 }>
                Removing Role:
            </Text>
          </TextContent>
        </GridItem>
        <GridItem span={ 6 }>
          <TextContent>
            { !isLoading && <Text component={ TextVariants.h1 }>
              { role.name }
            </Text> }
          </TextContent>
          { isLoading && <FormItemLoader/> }
        </GridItem>
      </Grid>
    </Modal>
  );
};

RemoveRoleModal.defaultProps = {
  role: {},
  isLoading: true
};

RemoveRoleModal.propTypes = {
  addNotification: PropTypes.func.isRequired,
  fetchRole: PropTypes.func.isRequired,
  fetchRoles: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string
    }).isRequired
  }).isRequired,
  removeRole: PropTypes.func.isRequired,
  role: PropTypes.object
};

const mapStateToProps = ({ roleReducer: { roles, selectedRole, isRecordLoading }}) => ({
  role: selectedRole,
  isLoading: isRecordLoading,
  pagination: roles.meta
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  fetchRole,
  fetchRoles,
  removeRole
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemoveRoleModal));
