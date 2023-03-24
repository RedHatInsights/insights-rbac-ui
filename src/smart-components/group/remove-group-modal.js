import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Button, Checkbox, Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { fetchGroup, removeGroups } from '../../redux/actions/group-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';
import pathnames from '../../utilities/pathnames';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';
import './remove-group-modal.scss';

const RemoveGroupModal = ({ groupsUuid, isModalOpen, postMethod, pagination, filters, cancelRoute, submitRoute = cancelRoute }) => {
  const intl = useIntl();
  const { group, isLoading } = useSelector(
    ({ groupReducer: { selectedGroup } }) => ({
      group: selectedGroup,
      isLoading: !selectedGroup.loaded,
    }),
    shallowEqual
  );
  const dispatch = useDispatch();
  useEffect(() => {
    if (groupsUuid.length === 1) {
      dispatch(fetchGroup(groupsUuid[0].uuid));
    }
  }, []);

  const { push } = useHistory();

  const [checked, setChecked] = useState(false);

  const multipleGroups = groupsUuid.length > 1;

  const onSubmit = () => {
    const uuids = groupsUuid.map((group) => group.uuid);
    dispatch(removeGroups(uuids))
      .then(() => postMethod(uuids, { limit: pagination?.limit, filters }))
      .then(push(submitRoute));
  };

  const onCancel = () => push(cancelRoute);

  return (
    <Modal
      className="rbac"
      isOpen={isModalOpen}
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
  isModalOpen: false,
  group: {},
  groupsUuid: [],
  isLoading: true,
  cancelUrl: pathnames.groups.path,
};

RemoveGroupModal.propTypes = {
  isModalOpen: PropTypes.bool,
  removeGroups: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
  }).isRequired,
  filters: PropTypes.object.isRequired,
  isLoading: PropTypes.bool,
  group: PropTypes.object,
  groupsUuid: PropTypes.array,
  submitRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]),
  cancelRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]),
};

export default RemoveGroupModal;
