import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, Checkbox, Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { fetchGroup, removeGroups } from '../../redux/actions/group-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';
import pathnames from '../../utilities/pathnames';
import './remove-group-modal.scss';

const RemoveGroupModal = ({
  removeGroups,
  group,
  isLoading,
  fetchGroup,
  groupsUuid,
  isModalOpen,
  postMethod,
  pagination,
  filters,
  cancelRoute,
  submitRoute = cancelRoute,
}) => {
  useEffect(() => {
    if (groupsUuid.length === 1) {
      fetchGroup(groupsUuid[0].uuid);
    }
  }, []);

  const { push } = useHistory();

  const [checked, setChecked] = useState(false);

  const multipleGroups = groupsUuid.length > 1;

  const onSubmit = () => {
    const uuids = groupsUuid.map((group) => group.uuid);
    removeGroups(uuids)
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
          &nbsp; {multipleGroups ? 'Delete groups?' : 'Delete group?'}
        </Text>
      }
      onClose={onCancel}
      actions={[
        <Button key="submit" isDisabled={!checked} variant="danger" type="button" onClick={onSubmit}>
          {multipleGroups ? 'Delete groups' : 'Delete group'}
        </Button>,
        <Button key="cancel" variant="link" type="button" onClick={onCancel}>
          Cancel
        </Button>,
      ]}
    >
      <TextContent>
        {multipleGroups ? (
          <Text>
            Deleting these <b>{groupsUuid.length}</b> groups removes all roles from the members inside the group.
          </Text>
        ) : isLoading ? (
          <FormItemLoader />
        ) : (
          <Text>
            Deleting the <b>{group.name}</b> group removes all roles from the members inside the group.
          </Text>
        )}
      </TextContent>
      &nbsp;
      <Checkbox
        isChecked={checked}
        onChange={() => setChecked(!checked)}
        label="I understand that this action cannot be undone."
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

const mapStateToProps = ({ groupReducer: { selectedGroup } }) => ({
  group: selectedGroup,
  isLoading: !selectedGroup.loaded,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      fetchGroup,
      removeGroups,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(RemoveGroupModal);
