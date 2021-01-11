/* eslint-disable camelcase */
import { nowrap } from '@patternfly/react-table';
import React, { Fragment, useState, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Link, Route, useHistory, useParams } from 'react-router-dom';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './principal-table-helpers';
import { fetchMembersForGroup, removeMembersFromGroup } from '../../../redux/actions/group-actions';
import { Button, Card, CardBody, Text, TextVariants, Bullseye, TextContent } from '@patternfly/react-core';
import AddGroupMembers from './add-group-members';
import { Section } from '@redhat-cloud-services/frontend-components';
import RemoveModal from '../../../presentational-components/shared/RemoveModal';
import UsersRow from '../../../presentational-components/shared/UsersRow';
import { routes as paths } from '../../../../package.json';

const columns = [
  { title: 'Status', transforms: [nowrap] },
  { title: 'Username' },
  { title: 'Email' },
  { title: 'Last name' },
  { title: 'First name' },
];

const selector = ({ groupReducer: { groups, selectedGroup } }) => ({
  principals: selectedGroup.members.data,
  pagination: selectedGroup.members.meta,
  userIdentity: groups.identity,
  groupName: selectedGroup.name,
  platform_default: selectedGroup.platform_default,
  isLoading: selectedGroup.members.isLoading,
});

const removeModalText = (name, group, plural) =>
  plural ? (
    <p>
      These <b> {`${name}`}</b> members will lose all the roles associated with the <b>{`${group}`}</b> group.
    </p>
  ) : (
    <p>
      <b>{`${name}`}</b> will lose all the roles associated with the <b> {`${group}`}</b> group.
    </p>
  );

const GroupPrincipals = () => {
  const [filterValue, setFilterValue] = useState('');
  const [selectedPrincipals, setSelectedPrincipals] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(() => null);
  const [deleteInfo, setDeleteInfo] = useState({});

  const { uuid } = useParams();
  const { principals, pagination, groupName, userIdentity, isLoading, platform_default } = useSelector(selector, shallowEqual);

  const dispatch = useDispatch();

  const fetchData = (usernames, options = pagination) => {
    dispatch(fetchMembersForGroup(uuid, usernames, options));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const setCheckedPrincipals = (newSelection) => {
    setSelectedPrincipals((principals) => newSelection(principals));
  };

  const removeMembers = (userNames) => {
    return dispatch(removeMembersFromGroup(uuid, userNames)).then(() => {
      setSelectedPrincipals([]);
      fetchData(undefined, { ...pagination, offset: 0 });
    });
  };

  const actionResolver = () =>
    !(userIdentity && userIdentity.user && userIdentity.user.is_org_admin)
      ? null
      : [
          {
            title: 'Remove',
            onClick: (_event, _rowId, principal) => {
              setConfirmDelete(() => () => removeMembers([principal.username.title]));
              setDeleteInfo({
                title: 'Remove member?',
                text: removeModalText(principal.username.title, groupName, false),
                confirmButtonLabel: 'Remove member',
              });
              setShowRemoveModal(true);
            },
          },
        ];

  const routes = () => (
    <Fragment>
      <Route
        path={paths['group-add-members']}
        render={(args) => <AddGroupMembers fetchData={fetchData} closeUrl={`/groups/detail/${uuid}/members`} {...args} />}
      />
    </Fragment>
  );

  const history = useHistory();

  const toolbarButtons = () => [
    ...(userIdentity && userIdentity.user && userIdentity.user.is_org_admin
      ? [
          <Link to={`/groups/detail/${uuid}/members/add_members`} key="remove-from-group" className="pf-m-visible-on-md">
            <Button variant="primary" aria-label="Add member">
              Add member
            </Button>
          </Link>,
          {
            label: 'Add member',
            props: {
              className: 'pf-m-hidden-on-md',
            },
            onClick: () => {
              history.push(`/groups/detail/${uuid}/members/add_members`);
            },
          },
          {
            label: 'Remove',
            props: {
              isDisabled: !selectedPrincipals || !selectedPrincipals.length > 0,
              variant: 'danger',
            },
            onClick: () => {
              const multipleMembersSelected = selectedPrincipals.length > 1;
              const removeText = multipleMembersSelected ? 'Remove members?' : 'Remove member?';
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
        {platform_default ? (
          <Card>
            <CardBody>
              <Bullseye>
                <TextContent>
                  <Text component={TextVariants.h1}>All users in this organization are members of this group.</Text>
                </TextContent>
              </Bullseye>
            </CardBody>
          </Card>
        ) : (
          <TableToolbarView
            data={(principals || []).map((user) => ({ ...user, uuid: user.username }))}
            isSelectable={userIdentity && userIdentity.user && userIdentity.user.is_org_admin}
            createRows={createRows}
            columns={columns}
            routes={routes}
            actionResolver={actionResolver}
            filterPlaceholder="username"
            titlePlural="members"
            titleSingular="member"
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
            emptyProps={{ title: 'There are no members in this group', description: ['Add a user to configure user access.', ''] }}
          />
        )}
      </Section>
    </Fragment>
  );
};

export default GroupPrincipals;
