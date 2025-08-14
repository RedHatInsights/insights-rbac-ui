import React from 'react';
import { useIntl } from 'react-intl';
import { Skeleton } from '@patternfly/react-core';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { ModalFormTemplate } from '../../../components/forms/ModalFormTemplate';
import FormRenderer from '../../../components/forms/FormRenderer';
import { fetchGroups } from '../../../redux/groups/helper';
import asyncDebounce from '../../../utilities/async-debounce';
import messages from '../../../Messages';
import type { Group } from '../types';

// Async validator for group name uniqueness
const asyncValidator = async (groupName: string, idKey: string, id: string) => {
  if (!groupName) {
    return undefined;
  }

  if (groupName.length > 150) {
    throw 'Name must be 150 characters or less';
  }

  const response = await fetchGroups({
    limit: 10,
    offset: 0,
    filters: { name: groupName },
    nameMatch: 'exact',
  }).catch((error) => {
    console.error(error);
    return undefined;
  });

  if (id ? response?.data?.some((item: any) => item[idKey] !== id) : (response?.data?.length || 0) > 0) {
    throw 'Name has already been taken';
  }

  return undefined;
};

const debouncedAsyncValidator = asyncDebounce((value: string, idKey: string, id: string) => asyncValidator(value, idKey, id), 250);

export interface EditGroupModalProps {
  /** The group being edited */
  group: Group;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed/cancelled */
  onClose: () => void;
  /** Callback when form is submitted with the updated group data */
  onSubmit: (groupData: { uuid: string; name: string; description?: string | null }) => void;
  /** Whether the form is currently being submitted */
  isSubmitting?: boolean;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ group, isOpen, onClose, onSubmit }) => {
  const intl = useIntl();

  const handleSubmit = (data: any) => {
    const groupData = {
      uuid: data.uuid,
      description: data.description || null,
      name: data.name,
    };
    onSubmit(groupData);
  };

  const schema = {
    fields: [
      {
        name: 'name',
        label: intl.formatMessage(messages.name),
        component: group ? componentTypes.TEXT_FIELD : 'skeleton',
        ...(group ? { validateOnMount: true } : {}),
        validate: [
          { type: 'validate-group-name', id: group?.uuid, idKey: 'uuid' },
          {
            type: validatorTypes.REQUIRED,
          },
        ],
      },
      {
        name: 'description',
        label: intl.formatMessage(messages.description),
        component: group ? componentTypes.TEXTAREA : 'skeleton',
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

  if (!isOpen) {
    return null;
  }

  return (
    <FormRenderer
      schema={schema}
      componentMapper={{
        ...componentMapper,
        skeleton: Skeleton,
      }}
      onCancel={onClose}
      onSubmit={handleSubmit}
      validatorMapper={validatorMapper}
      initialValues={{ ...group }}
      FormTemplate={(props: any) => (
        <ModalFormTemplate
          {...props}
          ModalProps={{
            onClose,
            isOpen: true,
            variant: 'medium',
            title: intl.formatMessage(messages.editGroupInfo),
          }}
        />
      )}
    />
  );
};
