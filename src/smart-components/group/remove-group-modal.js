import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Button, Checkbox, Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { removeGroups } from '../../redux/actions/group-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';
import useAppNavigate from '../../hooks/useAppNavigate';
import pathnames from '../../utilities/pathnames';
import messages from '../../Messages';
import './remove-group-modal.scss';

const RemoveGroupModal = ({ groupsUuid, postMethod, pagination, filters, cancelRoute, submitRoute = cancelRoute }) => {
  const intl = useIntl();
  const { group, isLoading } = useSelector(
    ({ groupReducer: { selectedGroup } }) => ({
      group: selectedGroup,
      isLoading: !selectedGroup.loaded,
    }),
    shallowEqual
  );
  const dispatch = useDispatch();

  const navigate = useAppNavigate();

  const [checked, setChecked] = useState(false);

  const multipleGroups = groupsUuid.length > 1;

  const onSubmit = () => {
    const uuids = groupsUuid.map((group) => group.uuid);
    dispatch(removeGroups(uuids))
      .then(() => postMethod(uuids, { limit: pagination?.limit, filters }))
      .then(navigate(submitRoute));
  };

  const onCancel = () => navigate(cancelRoute);

  return (
    <Modal
      className="rbac"
      isOpen
      variant={ModalVariant.small}
      title={
        <Text>
          <ExclamationTriangleIcon className="delete-group-warning-icon" />
          &nbsp; {intl.formatMessage(multipleGroups ? messages.deleteGroupsQuestion : messages.deleteGroupQuestion)}
        </Text>
      }
      onClose={onCancel}
      actions={[
        <Button key="submit" isDisabled={!checked} variant="danger" type="button" onClick={onSubmit}>
          {intl.formatMessage(multipleGroups ? messages.deleteGroups : messages.deleteGroup)}
        </Button>,
        <Button key="cancel" variant="link" type="button" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <TextContent>
        {multipleGroups ? (
          <Text>
            <FormattedMessage
              {...messages.deletingGroupsRemovesRoles}
              values={{
                b: (text) => <b>{text}</b>,
                count: groupsUuid.length,
              }}
            />
          </Text>
        ) : isLoading ? (
          <FormItemLoader />
        ) : (
          <Text>
            <FormattedMessage
              {...messages.deletingGroupRemovesRoles}
              values={{
                b: (text) => <b>{text}</b>,
                name: group.name,
              }}
            />
          </Text>
        )}
      </TextContent>
      &nbsp;
      <Checkbox
        isChecked={checked}
        onChange={() => setChecked(!checked)}
        label={intl.formatMessage(messages.understandActionIrreversible)}
        id="delete-group-check"
      />
    </Modal>
  );
};

RemoveGroupModal.defaultProps = {
  groupsUuid: [],
  cancelUrl: pathnames.groups.path,
};

RemoveGroupModal.propTypes = {
  groupsUuid: PropTypes.array.isRequired,
  postMethod: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
  }).isRequired,
  filters: PropTypes.object.isRequired,
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
};

export default RemoveGroupModal;
