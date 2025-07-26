import { nowrap } from '@patternfly/react-table';
import React, { Fragment, Suspense, useContext, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Outlet, useParams } from 'react-router-dom';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import Section from '@redhat-cloud-services/frontend-components/Section';
import { TableToolbarView } from '../../../components/tables/TableToolbarView';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { createRows } from './member-table-helpers';
import { fetchGroup, fetchGroups, fetchMembersForGroup, removeMembersFromGroup } from '../../../redux/groups/actions';
import { getBackRoute } from '../../../helpers/navigation';
import { UsersRow } from '../../users/components/UsersRow';
import PermissionsContext from '../../../utilities/permissionsContext';
import { AppLink } from '../../../components/navigation/AppLink';
import { DefaultMembersCard } from '../components/DefaultMembersCard';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

const selector = ({ groupReducer: { selectedGroup, groups } }) => ({
  members: selectedGroup.members.data,
  pagination: selectedGroup.members.meta,
  groupsPagination: groups.pagination || groups.meta,
  groupsFilters: groups.filters,
  group: selectedGroup,
  adminDefault: selectedGroup.admin_default,
  platformDefault: selectedGroup.platform_default,
  isLoading: selectedGroup.members.isLoading,
});

const removeModalText = (name, group, plural) => (
  <FormattedMessage
    {...(plural ? messages.removeMembersText : messages.removeMemberText)}
    values={{
      b: (text) => <b>{text}</b>,
      name,
      group,
    }}
  />
);
const GroupMembers = () => {
  const intl = useIntl();
  const chrome = useChrome();
  const [filterValue, setFilterValue] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});

  const { groupId } = useParams();
  const { members, pagination, groupsPagination, groupsFilters, isLoading, adminDefault, platformDefault, group } = useSelector(
    selector,
    shallowEqual,
  );
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = useRef(orgAdmin || userAccessAdministrator);

  const columns = [
    { title: intl.formatMessage(messages.status), transforms: [nowrap] },
    { title: intl.formatMessage(messages.username) },
    { title: intl.formatMessage(messages.email) },
    { title: intl.formatMessage(messages.lastName) },
    { title: intl.formatMessage(messages.firstName) },
  ];

  const dispatch = useDispatch();

  const fetchData = (usernames, options = pagination) => {
    dispatch(fetchMembersForGroup(groupId, usernames, options));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

  const setCheckedMembers = (newSelection) => {
    setSelectedMembers((members) => newSelection(members));
  };

  const removeMembers = (userNames) => {
    return dispatch(removeMembersFromGroup(groupId, userNames)).then(() => {
      setSelectedMembers([]);
      fetchData(undefined, { ...pagination, offset: 0 });
      dispatch(fetchGroups({ usesMetaInURL: true, chrome }));
    });
  };

  const actionResolver = () =>
    !hasPermissions.current
      ? null
      : [
          {
            title: intl.formatMessage(messages.remove),
            onClick: (_event, _rowId, member) => {
              setConfirmDelete(() => () => removeMembers([member.username.title]));
              setDeleteInfo({
                title: intl.formatMessage(messages.removeMemberQuestion),
                text: removeModalText(member.username.title, group.name, false),
                confirmButtonLabel: intl.formatMessage(messages.removeMember),
              });
              setShowRemoveModal(true);
            },
          },
        ];

  const navigate = useAppNavigate();

  const toolbarButtons = () => [
    ...(hasPermissions.current
      ? [
          <AppLink to={pathnames['group-add-members'].link.replace(':groupId', groupId)} key="remove-from-group" className="rbac-m-hide-on-sm">
            <Button variant="primary" aria-label="Add member">
              {intl.formatMessage(messages.addMember)}
            </Button>
          </AppLink>,
          {
            label: intl.formatMessage(messages.addMember),
            props: {
              className: 'rbac-m-hide-on-md',
            },
            onClick: () => {
              () => navigate(pathnames['group-add-members'].link.replace(':groupId', groupId));
            },
          },
          {
            label: intl.formatMessage(messages.remove),
            props: {
              isDisabled: !selectedMembers || !selectedMembers.length > 0,
              variant: 'danger',
            },
            onClick: () => {
              const multipleMembersSelected = selectedMembers.length > 1;
              const removeText = intl.formatMessage(multipleMembersSelected ? messages.removeMembersQuestion : messages.removeMemberQuestion);
              setConfirmDelete(() => () => removeMembers(selectedMembers.map((user) => user.uuid)));
              setDeleteInfo({
                title: removeText,
                confirmButtonLabel: removeText,
                text: removeModalText(
                  multipleMembersSelected ? selectedMembers.length : selectedMembers[0].uuid,
                  group.name,
                  multipleMembersSelected,
                ),
              });
              setShowRemoveModal(true);
            },
          },
        ]
      : []),
  ];
  const data = (members || []).map((user) => ({ ...user, uuid: user.username }));
  const rows = createRows(data, selectedMembers);

  return (
    <Fragment>
      <WarningModal
        title={deleteInfo.title}
        confirmButtonLabel={deleteInfo.confirmButtonLabel}
        confirmButtonVariant={ButtonVariant.danger}
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => {
          setShowRemoveModal(false);
          confirmDelete();
        }}
      >
        {deleteInfo.text}
      </WarningModal>
      <Section type="content" id="tab-principals">
        {platformDefault || adminDefault ? (
          <DefaultMembersCard isAdminDefault={adminDefault} />
        ) : (
          <TableToolbarView
            data={data}
            isSelectable={hasPermissions.current}
            rows={rows}
            columns={columns}
            actionResolver={actionResolver}
            filterPlaceholder={intl.formatMessage(messages.username).toLowerCase()}
            titlePlural={intl.formatMessage(messages.members).toLowerCase()}
            titleSingular={intl.formatMessage(messages.member)}
            ouiaId="members-table"
            pagination={pagination}
            filterValue={filterValue}
            fetchData={({ limit, offset, name }) => fetchData(name, { limit, offset })}
            setFilterValue={({ name }) => setFilterValue(name)}
            checkedRows={selectedMembers}
            isLoading={isLoading}
            rowWrapper={UsersRow}
            setCheckedItems={setCheckedMembers}
            toolbarButtons={toolbarButtons}
            emptyProps={{ title: intl.formatMessage(messages.noGroupMembers), description: [intl.formatMessage(messages.addUserToConfigure), ''] }}
            tableId="group-members"
          />
        )}
      </Section>
      <Suspense>
        <Outlet
          context={{
            [pathnames['group-members-edit-group'].path]: {
              group,
              cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
              postMethod: () => dispatch(fetchGroup(group.uuid)),
            },
            [pathnames['group-members-remove-group'].path]: {
              postMethod: () => dispatch(fetchGroups({ ...groupsPagination, offset: 0, filters: groupsFilters, usesMetaInURL: true, chrome })),
              cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
              submitRoute: getBackRoute(pathnames.groups.link, { ...groupsPagination, offset: 0 }, groupsFilters),
              groupsUuid: [group],
            },
            [pathnames['group-add-members'].path]: {
              fetchData,
              cancelRoute: pathnames['group-detail-members'].link.replace(':groupId', groupId),
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

export default GroupMembers;
