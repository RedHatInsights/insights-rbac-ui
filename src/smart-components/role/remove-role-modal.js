import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { Button, Checkbox, Modal, Text, TextContent, TextVariants, Split, SplitItem } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import { removeRole } from '../../redux/actions/role-actions';
import { fetchRole } from '../../helpers/role/role-helper';
import useIsMounted from '../../hooks/useIsMounted';
import { roleNameSelector } from './role-selectors';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';

const RemoveRoleModal = ({ routeMatch, cancelRoute, submitRoute = cancelRoute, afterSubmit }) => {
  const intl = useIntl();
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
            setInternalRoleName(role.display_name);
          }
        })
        .catch((error) => dispatch(addNotification({ variant: 'danger', title: 'Could not get role', description: error?.errors?.[0]?.detail })));
  }, []);

  const onSubmit = () =>
    dispatch(removeRole(id)).then(() => {
      push(submitRoute);
      return afterSubmit();
    });

  const onCancel = () => replace(cancelRoute);
  if (!internalRoleName) {
    return null;
  }

  return (
    <Modal
      className="rbac"
      aria-label="remove-role"
      header={
        <TextContent>
          <Split hasGutter>
            <SplitItem>
              <ExclamationTriangleIcon size="lg" style={{ fill: '#f0ab00' }} />
            </SplitItem>
            <SplitItem>
              <Text component="h1">{intl.formatMessage(messages.deleteRoleQuestion)}</Text>
            </SplitItem>
          </Split>
        </TextContent>
      }
      isOpen
      variant="small"
      onClose={onCancel}
      actions={[
        <Button isDisabled={isDisabled} key="submit" variant="danger" type="button" id="confirm-delete-portfolio" onClick={onSubmit}>
          {intl.formatMessage(messages.confirm)}
        </Button>,
        <Button key="cancel" variant="link" type="button" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <TextContent>
        <Text component={TextVariants.p}>
          <FormattedMessage
            {...messages.roleWilBeRemovedWithPermissions}
            values={{
              strong: (text) => <strong>{text}</strong>,
              name: internalRoleName,
            }}
          />
        </Text>
        <Checkbox
          id="remove-role-checkbox"
          label={intl.formatMessage(messages.understandActionIrreversible)}
          isChecked={!isDisabled}
          onChange={() => setIsDisabled((prev) => !prev)}
        />
      </TextContent>
    </Modal>
  );
};

RemoveRoleModal.propTypes = {
  routeMatch: PropTypes.string.isRequired,
  cancelRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]).isRequired,
  submitRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]),
  afterSubmit: PropTypes.func.isRequired,
};

export default RemoveRoleModal;
