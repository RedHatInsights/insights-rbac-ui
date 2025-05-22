import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import { Skeleton } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';
import { fetchGroup, useGroupActions } from '../../redux/actions/group-actions';
import pathnames from '../../utilities/pathnames';
import FormRenderer from '../common/form-renderer';
import ModalFormTemplate from '../common/ModalFormTemplate';
import { debouncedAsyncValidator } from './validators';

interface Pagination {
  limit: number;
}

interface RouteObject {
  pathname: string;
  search?: string;
  hash?: string;
}

type RouteType = string | RouteObject;

interface EditGroupModalProps {
  postMethod?: (params: { limit?: number }) => Promise<void>;
  pagination?: Pagination;
  filters?: Record<string, unknown>;
  cancelRoute?: RouteType;
  submitRoute?: RouteType;
  group?: Group;
  onClose?: () => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
  postMethod,
  pagination,
  cancelRoute = pathnames.groups.path,
  submitRoute,
  group,
  onClose = () => null,
}) => {
  const intl = useIntl();
  const { updateGroup } = useGroupActions();
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);

  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  const setGroupData = (groupData: Group | undefined) => {
    setSelectedGroup(groupData);
  };

  const fetchData = () => {
    groupId &&
      fetchGroup(groupId)
        .payload.then((response) => {
          if ('error' in response) {
            throw response;
          }
          setGroupData(response.data);
        })
        .catch(() => setGroupData(undefined));
  };

  const dispatch = useDispatch();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedGroup(group);
  }, [group]);

  const onSubmit = (data: Group) => {
    const user_data = {
      uuid: data.uuid,
      description: data.description,
      name: data.name,
    };
    postMethod
      ? updateGroup(user_data)
          // @ts-expect-error missing TS redux-thunks config
          .then(() => postMethod({ limit: pagination?.limit }))
          .then(() => navigate(submitRoute || cancelRoute))
      : dispatch(updateGroup(user_data))
          // @ts-expect-error missing TS redux-thunks config
          .then(() => {
            navigate(submitRoute || cancelRoute);
          });
  };

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        dismissable: true,
        title: intl.formatMessage(selectedGroup ? messages.editingGroupTitle : messages.addingGroupTitle),
        description: intl.formatMessage(selectedGroup ? messages.editGroupCanceledDescription : messages.addingGroupCanceledDescription),
      })
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
          { type: 'validate-group-name', id: groupId ?? group?.uuid, idKey: 'uuid' },
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
      ({ idKey, id }: { idKey: string; id: string }) =>
      (value: string) =>
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
          ModalProps={{
            onClose: onCancel,
            isOpen: true,
            variant: 'medium',
            title: intl.formatMessage(messages.editGroupInfo),
          }}
        />
      )}
    />
  );
};

export default EditGroupModal;
