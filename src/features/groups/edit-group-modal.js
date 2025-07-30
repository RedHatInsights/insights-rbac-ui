import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Skeleton } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import useAppNavigate from '../../hooks/useAppNavigate';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';
import FormRenderer from '../../components/forms/FormRenderer';
import { fetchGroup, updateGroup } from '../../redux/groups/actions';
import { debouncedAsyncValidator } from './validators';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';

const EditGroupModal = ({ postMethod, pagination, cancelRoute, submitRoute = cancelRoute, group, onClose }) => {
  const intl = useIntl();
  const [selectedGroup, setSelectedGroup] = useState(undefined);

  const navigate = useAppNavigate();
  const { groupId } = useParams();

  const setGroupData = (groupData) => {
    setSelectedGroup(groupData);
  };

  const fetchData = () => {
    groupId &&
      fetchGroup(groupId)
        .payload.then((data) => setGroupData(data))
        .catch(() => setGroupData(undefined));
  };

  const dispatch = useDispatch();

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
      ? dispatch(updateGroup(user_data))
          .then(() => postMethod({ limit: pagination?.limit }))
          .then(navigate(submitRoute))
      : dispatch(updateGroup(user_data)).then(() => {
          navigate(submitRoute);
        });
  };

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        dismissDelay: 8000,
        title: intl.formatMessage(selectedGroup ? messages.editingGroupTitle : messages.addingGroupTitle),
        description: intl.formatMessage(selectedGroup ? messages.editGroupCanceledDescription : messages.addingGroupCanceledDescription),
      }),
    );
    onClose();
    navigate(cancelRoute);
  };

  const schema = {
    fields: [
      {
        name: 'name',
        label: intl.formatMessage(messages.name),
        component: selectedGroup ? componentTypes.TEXT_FIELD : 'skeleton',
        ...(selectedGroup ? { validateOnMount: true } : {}),
        validate: [
          { type: 'validate-group-name', id: groupId ?? group.uuid, idKey: 'uuid' },
          {
            type: validatorTypes.REQUIRED,
          },
        ],
      },
      {
        name: 'description',
        label: intl.formatMessage(messages.description),
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
        <ModalFormTemplate
          {...props}
          ModalProps={{ onClose: onCancel, isOpen: true, variant: 'medium', title: intl.formatMessage(messages.editGroupInfo) }}
        />
      )}
    />
  );
};

EditGroupModal.defaultProps = {
  cancelRoute: pathnames.groups.path,
  onClose: () => null,
};

EditGroupModal.propTypes = {
  postMethod: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number,
  }),
  filters: PropTypes.object,
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

export default EditGroupModal;
