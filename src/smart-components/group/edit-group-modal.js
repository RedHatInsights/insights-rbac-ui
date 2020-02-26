import React, { useEffect, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import { Skeleton } from '@redhat-cloud-services/frontend-components';
import { Button, Modal, Grid, GridItem, TextContent, Text } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '../common/form-renderer';
import { fetchGroup, updateGroup } from '../../redux/actions/group-actions';
const EditGroupModal = ({
  addNotification,
  updateGroup,
  postMethod,
  closeUrl,
  isOpen,
  group,
  onClose
}) => {
  const [ selectedGroup, setSelectedGroup ] = useState(undefined);

  const history = useHistory();
  const match = useRouteMatch('/groups/edit/:id');

  const setGroupData = (groupData) => {
    setSelectedGroup(groupData);
  };

  const fetchData = () => {
    match && fetchGroup(match.params.id).payload.then((data) => setGroupData(data)).catch(() => setGroupData(undefined));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedGroup(group);
  }, [ group ]);

  const onSubmit = data => {
    const user_data = { ...data };
    postMethod ? updateGroup(user_data).then(() => postMethod()).then(history.push(closeUrl)) :
      updateGroup(user_data).then(() => history.push(closeUrl));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      dismissDelay: 8000,
      dismissable: false,
      title: selectedGroup ? 'Editing group' : 'Adding group',
      description: selectedGroup ? 'Edit group was cancelled by the user.' : 'Adding group was cancelled by the user.'
    });
    onClose();
    history.push(closeUrl);
  };

  const schema = {
    fields: [{
      name: 'name',
      label: 'Name',
      component: componentTypes.TEXT_FIELD,
      validate: [{
        type: validatorTypes.REQUIRED
      }]
    }, {
      name: 'description',
      label: 'Description',
      component: componentTypes.TEXTAREA_FIELD
    }]
  };

  // eslint-disable-next-line react/prop-types
  const formButtons = ({ pristine, valid, form: { submit }}) => {
    return (
      <div>
        <Button isDisabled={ pristine || !valid } onClick={ submit } variant="primary">Submit</Button>
        <Button variant='link' onClick={ onCancel }>Cancel</Button>
      </div>
    );
  };

  return (
    <Modal
      isLarge
      width={ '50%' }
      title={ 'Edit group\'s information' }
      isOpen={ isOpen }
      onClose={ onCancel }
    > { selectedGroup
        ?
        <Grid gutter="md">
          <TextContent>
            <Text>
              { `Make any changes to ${selectedGroup.name} group.` }
            </Text>
          </TextContent>
          <GridItem>
            <FormRenderer
              schema={ schema }
              schemaType="mozilla"
              onSubmit={ onSubmit }
              formContainer="modal"
              initialValues={ { ...selectedGroup } }
              renderFormButtons={ formButtons }
            />
          </GridItem>
        </Grid>
        : <Skeleton/>
      }
    </Modal>
  );
};

EditGroupModal.defaultProps = {
  closeUrl: '/groups',
  onClose: () => null,
  onSubmit: () => null
};

EditGroupModal.propTypes = {
  addNotification: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  updateGroup: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  closeUrl: PropTypes.string,
  isOpen: PropTypes.bool,
  group: PropTypes.object,
  onClose: PropTypes.func
};

const mapStateToProps = ({ groupReducer: { isLoading }}) => ({
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  updateGroup,
  fetchGroup
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupModal);
