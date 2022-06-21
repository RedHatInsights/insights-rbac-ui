import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import ModalFormTemplate from '../common/ModalFormTemplate';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '../common/form-renderer';
import { fetchGroup, updateGroup } from '../../redux/actions/group-actions';
import { Skeleton } from '@patternfly/react-core';
import { debouncedAsyncValidator } from './validators';
import pathnames from '../../utilities/pathnames';

const EditGroupModal = ({
  addNotification,
  updateGroup,
  postMethod,
  pagination,
  filters,
  cancelRoute,
  submitRoute = cancelRoute,
  group,
  onClose,
}) => {
  const [selectedGroup, setSelectedGroup] = useState(undefined);

  const navigate = useNavigate();
  const { id: uuid } = useParams();

  const setGroupData = (groupData) => {
    setSelectedGroup(groupData);
  };

  const fetchData = () => {
    uuid &&
      fetchGroup(uuid)
        .payload.then((data) => setGroupData(data))
        .catch(() => setGroupData(undefined));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedGroup(group);
  }, [group]);

  const onSubmit = (data) => {
    const user_data = {
      uuid: data.uuid,
      description: data.description || null,
      name: data.name,
    };
    postMethod
      ? updateGroup(user_data)
          .then(() => postMethod({ limit: pagination?.limit, filters }))
          .then(navigate(submitRoute))
      : updateGroup(user_data).then(() => navigate(submitRoute));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      dismissDelay: 8000,
      dismissable: false,
      title: selectedGroup ? 'Editing group' : 'Adding group',
      description: selectedGroup ? 'Edit group was canceled by the user.' : 'Adding group was canceled by the user.',
    });
    onClose();
    navigate(cancelRoute);
  };

  const schema = {
    fields: [
      {
        name: 'name',
        label: 'Name',
        component: selectedGroup ? componentTypes.TEXT_FIELD : 'skeleton',
        ...(selectedGroup ? { validateOnMount: true } : {}),
        validate: [
          { type: 'validate-group-name', id: uuid ? uuid : group.uuid, idKey: 'uuid' },
          {
            type: validatorTypes.REQUIRED,
          },
        ],
      },
      {
        name: 'description',
        label: 'Description',
        component: selectedGroup ? componentTypes.TEXTAREA : 'skeleton',
        validate: [
          {
            type: validatorTypes.MAX_LENGTH,
            threshold: 150,
          },
        ],
      },
    ],
  };

  const validatorMapper = {
    'validate-group-name':
      ({ idKey, id }) =>
      (value) =>
        debouncedAsyncValidator(value, idKey, id),
  };

  return (
    <FormRenderer
      schema={schema}
      componentMapper={{
        ...componentMapper,
        skeleton: Skeleton,
      }}
      onCancel={onCancel}
      onSubmit={onSubmit}
      validatorMapper={validatorMapper}
      initialValues={{ ...selectedGroup }}
      FormTemplate={(props) => (
        <ModalFormTemplate {...props} ModalProps={{ onClose: onCancel, isOpen: true, variant: 'medium', title: `Edit group's information` }} />
      )}
    />
  );
};

EditGroupModal.defaultProps = {
  cancelRoute: pathnames.groups.path,
  onClose: () => null,
  onSubmit: () => null,
};

EditGroupModal.propTypes = {
  addNotification: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  updateGroup: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
  }).isRequired,
  filters: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  cancelRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]),
  submitRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]),
  group: PropTypes.object,
  onClose: PropTypes.func,
};

const mapStateToProps = ({ groupReducer: { isLoading } }) => ({
  isLoading,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      addNotification,
      updateGroup,
      fetchGroup,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(EditGroupModal);
