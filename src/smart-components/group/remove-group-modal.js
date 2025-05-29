import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { ButtonVariant, Text, TextContent } from '@patternfly/react-core';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { fetchGroup, removeGroups } from '../../redux/actions/group-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';
import useAppNavigate from '../../hooks/useAppNavigate';
import messages from '../../Messages';

const RemoveGroupModal = ({ postMethod, pagination, cancelRoute, submitRoute = cancelRoute }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams();
  const groupsToRemove = groupId.split(',');
  const multipleGroups = groupsToRemove.length > 1;

  const { group, isLoading } = useSelector(
    ({ groupReducer: { selectedGroup } }) => ({
      group: selectedGroup,
      isLoading: (groupId || groupsToRemove.length === 1) && !selectedGroup.loaded,
    }),
    shallowEqual,
  );

  useEffect(() => {
    groupsToRemove.length === 1 && dispatch(fetchGroup(groupsToRemove[0]));
  }, []);

  const onSubmit = () => {
    dispatch(removeGroups(groupsToRemove))
      .then(() => postMethod(groupsToRemove, { limit: pagination?.limit }))
      .then(navigate(submitRoute));
  };

  const onCancel = () => navigate(cancelRoute);

  return (
    <WarningModal
      isOpen
      withCheckbox
      title={intl.formatMessage(multipleGroups ? messages.deleteGroupsQuestion : messages.deleteGroupQuestion)}
      checkboxLabel={intl.formatMessage(messages.understandActionIrreversible)}
      confirmButtonLabel={intl.formatMessage(multipleGroups ? messages.deleteGroups : messages.deleteGroup)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onCancel}
      onConfirm={onSubmit}
    >
      <TextContent>
        {multipleGroups ? (
          <Text>
            <FormattedMessage
              {...messages.deletingGroupsRemovesRoles}
              values={{
                b: (text) => <b>{text}</b>,
                count: groupsToRemove.length,
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
    </WarningModal>
  );
};

RemoveGroupModal.propTypes = {
  postMethod: PropTypes.func,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
  }).isRequired,
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
};

export default RemoveGroupModal;
