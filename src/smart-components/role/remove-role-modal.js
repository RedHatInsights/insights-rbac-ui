import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { Button, Checkbox, Modal, Text, TextContent, TextVariants, Split, SplitItem } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/cjs/actions';
import { removeRole } from '../../redux/actions/role-actions';
import { fetchRole } from '../../helpers/role/role-helper';
import useIsMounted from '../../hooks/useIsMounted';
import { roleNameSelector } from './role-selectors';

const RemoveRoleModal = ({ routeMatch, cancelRoute, afterSubmit }) => {
  const isMounted = useIsMounted();
  const {
    params: { id },
  } = useRouteMatch(routeMatch);
  const roleName = useSelector((state) => roleNameSelector(state, id));
  const [isDisabled, setIsDisabled] = useState(true);
  const [internalRoleName, setInternalRoleName] = useState(roleName);
  const dispatch = useDispatch();
  const { push, replace } = useHistory();

  useEffect(() => {
    !internalRoleName &&
      fetchRole(id)
        .then((role) => {
          if (isMounted.current) {
            setInternalRoleName(role.name);
          }
        })
        .catch((error) => dispatch(addNotification({ variant: 'danger', title: 'Could not get role', description: error?.errors?.[0]?.detail })));
  }, []);

  const onSubmit = () =>
    dispatch(removeRole(id)).then(() => {
      push('/roles');
      return afterSubmit();
    });

  const onCancel = () => replace(cancelRoute);
  if (!internalRoleName) {
    return null;
  }

  return (
    <Modal
      aria-label="remove-role"
      header={
        <TextContent>
          <Split hasGutter>
            <SplitItem>
              <ExclamationTriangleIcon size="lg" style={{ fill: '#f0ab00' }} />
            </SplitItem>
            <SplitItem>
              <Text component="h1">Delete role?</Text>
            </SplitItem>
          </Split>
        </TextContent>
      }
      isOpen
      variant="small"
      onClose={onCancel}
      actions={[
        <Button isDisabled={isDisabled} key="submit" variant="danger" type="button" id="confirm-delete-portfolio" onClick={onSubmit}>
          Confirm
        </Button>,
        <Button key="cancel" variant="link" type="button" onClick={onCancel}>
          Cancel
        </Button>,
      ]}
    >
      <TextContent>
        <Text component={TextVariants.p}>
          The <strong>{internalRoleName}</strong> role will be removed from any group it’s in, and members in the groups will no longer be granted the
          permissions in the role.
        </Text>
        <Checkbox
          id="remove-role-checkbox"
          label="I understand that this action cannot be undone."
          isChecked={!isDisabled}
          onChange={() => setIsDisabled((prev) => !prev)}
        />
      </TextContent>
    </Modal>
  );
};

RemoveRoleModal.propTypes = {
  routeMatch: PropTypes.string.isRequired,
  cancelRoute: PropTypes.string.isRequired,
  afterSubmit: PropTypes.func.isRequired,
};

export default RemoveRoleModal;
