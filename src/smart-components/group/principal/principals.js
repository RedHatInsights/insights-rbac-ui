import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Link, Route } from 'react-router-dom';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { createRows } from './principal-table-helpers';
import { fetchGroup } from '../../../redux/actions/group-actions';
import { removeMembersFromGroup, addMembersToGroup } from '../../../redux/actions/group-actions';
import { defaultSettings } from '../../../helpers/shared/pagination';
import { Button, Card, CardBody, Text, TextVariants, Bullseye, TextContent } from '@patternfly/react-core';
import AddGroupMembers from './add-group-members';
import { Section } from '@redhat-cloud-services/frontend-components';
import RemoveModal from '../../../presentational-components/shared/RemoveModal';

const columns = [
  { title: 'Username' },
  'Email',
  'Last name',
  'First name'
];

const GroupPrincipals = ({
  match: { params: { uuid }},
  fetchGroup,
  removeMembersFromGroup,
  principals,
  isLoading,
  userIdentity,
  group
}) => {
  const [ filteredPrincipals, setFilteredPrincipals ] = useState([]);
  const [ pagination, setPagination ] = useState(defaultSettings);
  const [ filterValue, setFilterValue ] = useState('');
  const [ selectedPrincipals, setSelectedPrincipals ] = useState([]);
  const [ showRemoveModal, setShowRemoveModal ] = useState(false);
  const [ confirmDelete, setConfirmDelete ] = useState(() => null);
  const [ deleteInfo, setDeleteInfo ] = useState({});

  useEffect(() => {
    const filtered = principals.filter(({ username }) => username.includes(filterValue));
    setPagination({
      ...pagination,
      count: filterValue ? filtered.length : principals.length
    });
    setFilteredPrincipals(filtered);
  }, [ principals ]);

  const fetchData = () => {
    fetchGroup(uuid);
  };

  const removeModalText = (name, group, plural) => (plural
    ? <p>These <b> { `${name}` }</b> members will lose all the roles associated with the <b>{ `${group}` }</b> group.</p>
    : <p> <b>{ `${name}` }</b> will lose all the roles associated with the <b> { `${group}` }</b> group.</p>
  );

  const setCheckedPrincipals = (newSelection) => {
    setSelectedPrincipals((principals) => newSelection(principals));
  };

  const removeMembers = (userNames) => {
    return removeMembersFromGroup(uuid, userNames).then(() => { setSelectedPrincipals([]); fetchData();});
  };

  const actionResolver = () =>
    !(userIdentity && userIdentity.user && userIdentity.user.is_org_admin) ? null :
      [
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)' },
          onClick: (_event, _rowId, principal) => {
            setConfirmDelete(() => () => removeMembers([ principal.username ]));
            setDeleteInfo({
              title: 'Remove member?',
              text: removeModalText(principal.username, group.name, false),
              confirmButtonLabel: 'Remove member'
            });
            setShowRemoveModal(true);
          }
        }
      ];

  const routes = () => <Fragment>
    <Route path={ `/groups/detail/:uuid/members/add_members` }
      render={ args => <AddGroupMembers
        fetchData={ fetchData }
        closeUrl={ `/groups/detail/${uuid}/principals` }
        { ...args }
      /> }
    />
  </Fragment>;

  const toolbarButtons = () => [
    ...userIdentity && userIdentity.user && userIdentity.user.is_org_admin ?
      [
        <Link
          to={ `/groups/detail/${uuid}/members/add_members` }
          key="remove-from-group"
        >
          <Button
            variant="primary"
            aria-label="Add member"
          >
        Add member
          </Button>
        </Link>,
        {
          label: 'Remove',
          props: {
            isDisabled: !selectedPrincipals || !selectedPrincipals.length > 0,
            variant: 'danger'
          },
          onClick: () => {
            const multipleMembersSelected = selectedPrincipals.length > 1;
            setConfirmDelete(() => () => removeMembers(selectedPrincipals.map(user => user.name)));
            setDeleteInfo({
              title: 'Remove members?',
              confirmButtonLabel: multipleMembersSelected ? 'Remove members' : 'Remove member',
              text: removeModalText(
                multipleMembersSelected ? selectedPrincipals.length : selectedPrincipals[0].name,
                group.name,
                multipleMembersSelected
              )
            });
            setShowRemoveModal(true);
          }
        }
      ] : []
  ];

  return (
    <Fragment>
      <RemoveModal
        text={ deleteInfo.text }
        title={ deleteInfo.title }
        confirmButtonLabel={ deleteInfo.confirmButtonLabel }
        isOpen={ showRemoveModal }
        onClose={ () => setShowRemoveModal(false) }
        onSubmit={ () => {
          setShowRemoveModal(false);
          confirmDelete();
        } }
      />
      <Section type="content" id={ 'tab-principals' }>
        {
          group.platform_default ?
            <Card>
              <CardBody>
                <Bullseye>
                  <TextContent>
                    <Text component={ TextVariants.h1 }>
                    All users in this organization are members of this group.
                    </Text>
                  </TextContent>
                </Bullseye>
              </CardBody>
            </Card> :
            <TableToolbarView
              data={
                filteredPrincipals
                .slice(pagination.offset, pagination.offset + pagination.limit)
              }
              isSelectable={ userIdentity && userIdentity.user && userIdentity.user.is_org_admin }
              createRows={ createRows }
              columns={ columns }
              request={ fetchGroup }
              routes={ routes }
              actionResolver={ actionResolver }
              filterPlaceholder="username"
              titlePlural="principals"
              titleSingular="principal"
              pagination={ pagination }
              filterValue={ filterValue }
              fetchData={ ({ limit, offset, count }) => {
                setPagination({ limit, offset, count });
                fetchGroup(uuid);
              } }
              setFilterValue={ ({ name }) => setFilterValue(name) }
              checkedRows={ selectedPrincipals }
              isLoading={ isLoading }
              setCheckedItems={ setCheckedPrincipals }
              toolbarButtons={ toolbarButtons }
              emptyProps={ { title: 'There are no members in this group', description: [ 'Add a user to configure user access.', '' ]} }
            /> }
      </Section>
    </Fragment>
  );
};

const mapStateToProps = ({ groupReducer: { groups, selectedGroup }}) => {
  return {
    principals: (selectedGroup.principals || []).map(principal => ({ ...principal, uuid: principal.username })),
    pagination: { ...defaultSettings, count: selectedGroup.principals && selectedGroup.principals.length },
    isLoading: !selectedGroup.loaded,
    userIdentity: groups.identity,
    group: selectedGroup
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchGroup,
  addMembersToGroup,
  removeMembersFromGroup
}, dispatch);

GroupPrincipals.propTypes = {
  principals: PropTypes.array,
  isLoading: PropTypes.bool,
  fetchGroup: PropTypes.func.isRequired,
  removeMembersFromGroup: PropTypes.func.isRequired,
  uuid: PropTypes.string,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired }).isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number
  }),
  userIdentity: PropTypes.shape({
    user: PropTypes.shape({
      is_org_admin: PropTypes.bool
    })
  }),
  group: PropTypes.shape({
    platform_default: PropTypes.bool,
    loaded: PropTypes.bool
  })
};

GroupPrincipals.defaultProps = {
  principals: [],
  pagination: defaultSettings,
  userIdentity: {},
  group: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(GroupPrincipals);
