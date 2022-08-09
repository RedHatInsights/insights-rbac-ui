import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, Modal, ModalVariant, Stack, StackItem, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import { RolesList } from '../add-group/roles-list';
import DefaultGroupChange from './default-group-change-modal';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';
import '../../../App.scss';

const AddGroupRoles = ({
  history: { push },
  selectedRoles,
  setSelectedRoles,
  title,
  closeUrl,
  addRolesToGroup,
  name,
  isDefault,
  isChanged,
  addNotification,
  onDefaultGroupChanged,
  fetchRolesForGroup,
  fetchSystemGroup,
  fetchGroup,
  fetchUuid,
}) => {
  const intl = useIntl();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const onCancel = () => {
    setSelectedRoles && setSelectedRoles([]);
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(messages.addingGroupRolesTitle),
      dismissDelay: 8000,
      description: intl.formatMessage(messages.addingGroupRolesCancelled),
    });
    push(closeUrl);
  };

  const onSubmit = () => {
    const rolesList = selectedRoles.map((role) => role.uuid);
    addRolesToGroup(fetchUuid, rolesList, () => {
      if (isDefault) {
        fetchSystemGroup().then(({ value: { data } }) => {
          fetchRolesForGroup(data[0].uuid);
          fetchGroup(data[0].uuid);
        });
      } else {
        fetchRolesForGroup();
        fetchGroup();
      }
      setSelectedRoles([]);
    });
    if (isDefault && !isChanged) {
      onDefaultGroupChanged(true);
    }

    return push(closeUrl);
  };

  return isDefault && !isChanged && showConfirmModal ? (
    <DefaultGroupChange isOpen={showConfirmModal} onClose={onCancel} onSubmit={onSubmit} />
  ) : (
    <Modal
      title={intl.formatMessage(messages.addRolesToGroup)}
      variant={ModalVariant.medium}
      isOpen
      onClose={() => {
        onCancel();
        setShowConfirmModal(true);
      }}
      actions={[
        <Button
          aria-label="Save"
          ouiaId="primary-save-button"
          variant="primary"
          key="confirm"
          isDisabled={selectedRoles.length === 0}
          onClick={() => {
            setShowConfirmModal(true);
            (!isDefault || isChanged) && onSubmit();
          }}
        >
          {intl.formatMessage(messages.addToGroup)}
        </Button>,
        <Button aria-label="Cancel" ouiaId="secondary-cancel-button" variant="link" key="cancel" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <Stack hasGutter>
        {title && (
          <StackItem>
            <Title headingLevel="h4" size="xl">
              {title}
            </Title>
          </StackItem>
        )}
        <StackItem>
          <TextContent>
            <Text component={TextVariants.p}>
              <FormattedMessage
                {...messages.onlyGroupRolesVisible}
                values={{
                  b: (text) => <b>{text}</b>,
                  name: name,
                }}
              />
            </Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <Card>
            <RolesList selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles} rolesExcluded={true} />
          </Card>
        </StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupRoles.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.any,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired,
  }).isRequired,
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  addRolesToGroup: PropTypes.func,
  closeUrl: PropTypes.string,
  title: PropTypes.string,
  name: PropTypes.string,
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool,
  addNotification: PropTypes.func,
  onDefaultGroupChanged: PropTypes.func,
  fetchRolesForGroup: PropTypes.func,
  fetchGroup: PropTypes.func,
  fetchSystemGroup: PropTypes.func,
  fetchUuid: PropTypes.string,
};

export default AddGroupRoles;
