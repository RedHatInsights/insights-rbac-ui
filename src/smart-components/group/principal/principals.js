/* eslint-disable camelcase */
import { nowrap } from '@patternfly/react-table';
import React, { Fragment, useState, useEffect, useContext, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Link, Route, useHistory, useParams } from 'react-router-dom';
import { TableToolbarViewOld } from '../../../presentational-components/shared/table-toolbar-view-old';
import { createRows } from './principal-table-helpers';
import { fetchMembersForGroup, removeMembersFromGroup, fetchGroups } from '../../../redux/actions/group-actions';
import { Button, Card, CardBody, Text, TextVariants, Bullseye, TextContent } from '@patternfly/react-core';
import AddGroupMembers from './add-group-members';
import Section from '@redhat-cloud-services/frontend-components/Section';
import RemoveModal from '../../../presentational-components/shared/RemoveModal';
import UsersRow from '../../../presentational-components/shared/UsersRow';
import paths from '../../../utilities/pathnames';
import PermissionsContext from '../../../utilities/permissions-context';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';

const selector = ({ groupReducer: { selectedGroup } }) => ({
  principals: selectedGroup.members.data,
  pagination: selectedGroup.members.meta,
  groupName: selectedGroup.name,
  admin_default: selectedGroup.admin_default,
  platform_default: selectedGroup.platform_default,
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
const GroupPrincipals = () => {
  const intl = useIntl();
  const [filterValue, setFilterValue] = useState('');
  const [selectedPrincipals, setSelectedPrincipals] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});

  const { uuid } = useParams();
  const { principals, pagination, groupName, isLoading, admin_default, platform_default } = useSelector(selector, shallowEqual);
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
    dispatch(fetchMembersForGroup(uuid, usernames, options));
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

  const setCheckedPrincipals = (newSelection) => {
    setSelectedPrincipals((principals) => newSelection(principals));
  };

  const removeMembers = (userNames) => {
    return dispatch(removeMembersFromGroup(uuid, userNames)).then(() => {
      setSelectedPrincipals([]);
      fetchData(undefined, { ...pagination, offset: 0 });
      dispatch(fetchGroups({ inModal: false }));
    });
  };

  const actionResolver = () =>
    !hasPermissions.current
      ? null
      : [
          {
            title: intl.formatMessage(messages.remove),
            onClick: (_event, _rowId, principal) => {
              setConfirmDelete(() => () => removeMembers([principal.username.title]));
              setDeleteInfo({
                title: intl.formatMessage(messages.removeMemberQuestion),
                text: removeModalText(principal.username.title, groupName, false),
                confirmButtonLabel: intl.formatMessage(messages.removeMember),
              });
              setShowRemoveModal(true);
            },
          },
        ];

  const routes = () => (
    <Fragment>
      <Route
        path={paths['group-add-members'].path}
        render={(args) => <AddGroupMembers fetchData={fetchData} closeUrl={`/groups/detail/${uuid}/members`} {...args} />}
      />
    </Fragment>
  );

  const history = useHistory();

  const toolbarButtons = () => [
    ...(hasPermissions.current
      ? [
          <Link to={`/groups/detail/${uuid}/members/add_members`} key="remove-from-group" className="rbac-m-hide-on-sm">
            <Button variant="primary" aria-label="Add member">
              {intl.formatMessage(messages.addMember)}
            </Button>
          </Link>,
          {
            label: intl.formatMessage(messages.addMember),
            props: {
              className: 'rbac-m-hide-on-md',
            },
            onClick: () => {
              history.push(`/groups/detail/${uuid}/members/add_members`);
            },
          },
          {
            label: intl.formatMessage(messages.remove),
            props: {
              isDisabled: !selectedPrincipals || !selectedPrincipals.length > 0,
              variant: 'danger',
            },
            onClick: () => {
              const multipleMembersSelected = selectedPrincipals.length > 1;
              const removeText = intl.formatMessage(multipleMembersSelected ? messages.removeMembersQuestion : messages.removeMemberQuestion);
              setConfirmDelete(() => () => removeMembers(selectedPrincipals.map((user) => user.uuid)));
              setDeleteInfo({
                title: removeText,
                confirmButtonLabel: removeText,
                text: removeModalText(
                  multipleMembersSelected ? selectedPrincipals.length : selectedPrincipals[0].uuid,
                  groupName,
                  multipleMembersSelected
                ),
              });
              setShowRemoveModal(true);
            },
          },
        ]
      : []),
  ];

  return (
    <Fragment>
      <RemoveModal
        text={deleteInfo.text}
        title={deleteInfo.title}
        confirmButtonLabel={deleteInfo.confirmButtonLabel}
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onSubmit={() => {
          setShowRemoveModal(false);
          confirmDelete();
        }}
      />
      <Section type="content" id={'tab-principals'}>
        {platform_default || admin_default ? (
          <Card>
            <CardBody>
              <Bullseye>
                <TextContent>
                  <Text component={TextVariants.h1}>
                    {intl.formatMessage(admin_default ? messages.allOrgAdminsAreMembers : messages.allUsersAreMembers)}
                  </Text>
                </TextContent>
              </Bullseye>
            </CardBody>
          </Card>
        ) : (
          <TableToolbarViewOld
            data={(principals || []).map((user) => ({ ...user, uuid: user.username }))}
            isSelectable={hasPermissions.current}
            createRows={createRows}
            columns={columns}
            routes={routes}
            actionResolver={actionResolver}
            filterPlaceholder={intl.formatMessage(messages.username).toLowerCase()}
            titlePlural={intl.formatMessage(messages.members).toLowerCase()}
            titleSingular={intl.formatMessage(messages.member)}
            ouiaId="members-table"
            pagination={pagination}
            filterValue={filterValue}
            fetchData={({ limit, offset, name }) => fetchData(name, { limit, offset })}
            setFilterValue={({ name }) => setFilterValue(name)}
            checkedRows={selectedPrincipals}
            isLoading={isLoading}
            rowWrapper={UsersRow}
            setCheckedItems={setCheckedPrincipals}
            toolbarButtons={toolbarButtons}
            emptyProps={{ title: intl.formatMessage(messages.noGroupMembers), description: [intl.formatMessage(messages.addUserToConfigure), ''] }}
            tableId="group-members"
          />
        )}
      </Section>
    </Fragment>
  );
};

export default GroupPrincipals;
