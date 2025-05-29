import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Alert, Button, Modal, ModalVariant } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import useAppNavigate from '../../../hooks/useAppNavigate';
import PermissionsContext from '../../../utilities/permissions-context';
import GroupRowWrapper from '../../group/group-row-wrapper';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { addMembersToGroup, fetchGroups } from '../../../redux/actions/group-actions';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

const AddUserToGroup = ({ username }) => {
  const chrome = useChrome();
  const dispatch = useDispatch();
  const intl = useIntl();
  const navigate = useAppNavigate();

  const { groups, pagination, filters, isLoading } = useSelector(
    ({ groupReducer: { groups, isLoading } }) => ({
      groups: groups?.data || [],
      pagination: groups?.meta,
      filters: groups?.filters || '',
      isLoading,
    }),
    shallowEqual,
  );

  const textFilterRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [filterValue, setFilterValue] = useState(filters.name || '');
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  const columns = [
    { title: intl.formatMessage(messages.name), key: 'name' },
    { title: intl.formatMessage(messages.description), key: 'description' },
  ];

  const createRows = (data = [], selectedRows) =>
    data.reduce(
      (acc, { uuid, name, description, platform_default: isPlatformDefault, admin_default: isAdminDefault }) => [
        ...acc,
        {
          uuid,
          isAdminDefault,
          isPlatformDefault,
          cells: [
            <Fragment key={uuid}>
              <span aria-label={`group-name-${uuid}`}>{name}</span>
            </Fragment>,
            <Fragment key={`${uuid}-description`}>{description}</Fragment>,
          ],
          selected: Boolean(selectedRows && selectedRows.find((row) => row.uuid === uuid)),
        },
      ],
      [],
    );

  const fetchData = (options) => dispatch(fetchGroups({ ...options, excludeUsername: username, chrome }));
  const setCheckedItems = (newSelection) => setSelectedRows(newSelection(selectedRows).map(({ uuid, name }) => ({ uuid, label: name })));

  useEffect(() => {
    fetchData({ ...pagination, filters: { name: filterValue } });
  }, []);

  const onSubmit = () => {
    selectedRows.forEach((group) => {
      dispatch(addMembersToGroup(group.uuid, [{ username }]));
    });
    navigate({ state: { username }, pathname: pathnames['user-detail'].link.replace(':username', username) });
  };

  const onCancel = () => (selectedRows?.length > 0 && setCancelWarningVisible(true)) || redirectToUserDetail();

  const redirectToUserDetail = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.addingGroupMemberTitle),
        dismissDelay: 8000,
        description: intl.formatMessage(messages.addingGroupMemberCancelled),
      }),
    );
    navigate({ pathname: pathnames['user-detail'].link.replace(':username', username) });
  };

  return (
    <Fragment>
      <WarningModal
        title={intl.formatMessage(messages.exitItemAdding, { item: intl.formatMessage(messages.users).toLocaleLowerCase() })}
        isOpen={cancelWarningVisible}
        onClose={() => setCancelWarningVisible(false)}
        confirmButtonLabel={intl.formatMessage(messages.discard)}
        onConfirm={redirectToUserDetail}
      >
        {intl.formatMessage(messages.changesWillBeLost)}
      </WarningModal>
      <Modal
        variant={ModalVariant.medium}
        isOpen={!cancelWarningVisible}
        title={intl.formatMessage(messages.addSpecificUserToGroup, { username })}
        onClose={onCancel}
        actions={[
          <Button
            aria-label="Save"
            className="pf-v5-u-mr-sm"
            ouiaId="primary-save-button"
            variant="primary"
            key="save"
            onClick={onSubmit}
            isDisabled={selectedRows?.length == 0}
          >
            {intl.formatMessage(messages.addToGroup)}
          </Button>,
          <Button aria-label="Cancel" ouiaId="secondary-cancel-button" variant="link" key="cancel" onClick={onCancel}>
            {intl.formatMessage(messages.cancel)}
          </Button>,
        ]}
      >
        <Alert variant="info" isInline isPlain title={intl.formatMessage(messages.onlyNonUserGroupsVisible)} />
        <TableToolbarView
          isCompact
          data={groups}
          rows={createRows(groups, selectedRows)}
          columns={columns}
          isSelectable={isAdmin}
          checkedRows={selectedRows}
          setCheckedItems={setCheckedItems}
          titlePlural={intl.formatMessage(messages.groups).toLowerCase()}
          titleSingular={intl.formatMessage(messages.group).toLowerCase()}
          pagination={pagination}
          filterValue={filterValue}
          fetchData={({ name, ...options }) => fetchData({ filters: { name }, ...options })}
          setFilterValue={({ name }) => setFilterValue(name ?? '')}
          isLoading={isLoading}
          filterPlaceholder={intl.formatMessage(messages.name).toLowerCase()}
          rowWrapper={GroupRowWrapper}
          textFilterRef={textFilterRef}
          tableId="available-user-groups"
          ouiaId="available-user-groups-table"
          data-testid="group-table"
        />
      </Modal>
    </Fragment>
  );
};

AddUserToGroup.propTypes = {
  username: PropTypes.string,
};

export default AddUserToGroup;
