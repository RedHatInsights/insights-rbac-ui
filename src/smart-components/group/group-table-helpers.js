import React, { Fragment, useRef, useState } from 'react';
import { CheckIcon, CloseIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Label, Popover, Text, TextContent } from '@patternfly/react-core';
import { TableVariant } from '@patternfly/react-table';
import { Table, TableBody, TableHeader } from '@patternfly/react-table/deprecated';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import AppLink from '../../presentational-components/shared/AppLink';
import { getDateFormat } from '../../helpers/shared/helpers';
import pathnames from '../../utilities/pathnames';
import { DEFAULT_ACCESS_GROUP_ID } from '../../utilities/constants';
import messages from '../../Messages';

const DefaultPlatformPopover = ({ id, uuid, bodyContent }) => {
  const [isPopoverVisible, setPopoverVisible] = useState(false);
  const popoverRootRef = useRef(null);

  return (
    <span ref={popoverRootRef} key={`${uuid}-popover`} id={id}>
      <Popover
        zIndex="110"
        position="right"
        isVisible={isPopoverVisible}
        shouldClose={() => setPopoverVisible(false)}
        hideOnOutsideClick
        bodyContent={bodyContent}
        appendTo={popoverRootRef.current}
      >
        <OutlinedQuestionCircleIcon
          onClick={() => setPopoverVisible(!isPopoverVisible)}
          className={classNames('pf-v5-c-question-circle-icon', { 'icon-active': isPopoverVisible })}
        />
      </Popover>
    </span>
  );
};

DefaultPlatformPopover.propTypes = {
  id: PropTypes.string.isRequired,
  uuid: PropTypes.string.isRequired,
  bodyContent: PropTypes.string.isRequired,
};

export const createRows = (isAdmin, data, selectedRows, expanded = []) => {
  const intl = useIntl();

  const compoundRolesCells = [
    { title: intl.formatMessage(messages.roleName) },
    { title: intl.formatMessage(messages.description) },
    { title: intl.formatMessage(messages.lastModified) },
  ];

  const compoundMembersCells = [
    { title: intl.formatMessage(messages.orgAdministrator) },
    { title: intl.formatMessage(messages.firstName) },
    { title: intl.formatMessage(messages.lastName) },
    { title: intl.formatMessage(messages.username) },
    { title: intl.formatMessage(messages.email) },
    { title: intl.formatMessage(messages.status) },
  ];

  return data.reduce(
    (
      acc,
      {
        uuid,
        name,
        roleCount,
        principalCount,
        modified,
        roles,
        members,
        platform_default: isPlatformDefault,
        admin_default: isAdminDefault,
        isLoadingRoles,
        isLoadingMembers,
      },
      i,
    ) => {
      const compoundRolesId = `compound-roles-${uuid}`;
      const compoundMembersId = `compound-members-${uuid}`;
      return [
        ...acc,
        {
          uuid,
          isAdminDefault,
          isPlatformDefault,
          selected: Boolean(selectedRows && selectedRows.find((row) => row.uuid === uuid)),
          cells: [
            {
              title: isAdmin ? (
                <>
                  <AppLink
                    key={`${uuid}-link`}
                    state={{ uuid }}
                    to={pathnames['group-detail-roles'].link.replace(':groupId', isPlatformDefault ? DEFAULT_ACCESS_GROUP_ID : uuid)}
                  >
                    {name}
                  </AppLink>
                  <Fragment>
                    {(isPlatformDefault || isAdminDefault) && (
                      <DefaultPlatformPopover
                        id={`default${isAdminDefault ? '-admin' : ''}-group-popover`}
                        uuid={uuid}
                        key={`${uuid}-popover`}
                        bodyContent={intl.formatMessage(isAdminDefault ? messages.orgAdminInheritedRoles : messages.usersInheritedRoles)}
                      />
                    )}
                  </Fragment>
                </>
              ) : (
                name
              ),
            },
            { title: roleCount, props: { isOpen: expanded[uuid] === 2, ariaControls: compoundRolesId } },
            {
              title: principalCount,
              props:
                isPlatformDefault || isAdminDefault
                  ? { className: 'rbac-c-not-expandable-cell' }
                  : { isOpen: expanded[uuid] === 3, ariaControls: compoundMembersId },
            },
            { title: <DateFormat date={modified} type={getDateFormat(modified)} /> },
          ],
        },
        {
          uuid: `${uuid}-roles`,
          parent: 3 * i,
          compoundParent: 1,
          fullWidth: true,
          noPadding: true,
          cells: [
            {
              props: { colSpan: 7, className: 'pf-m-no-padding' },
              title: isLoadingRoles ? (
                <SkeletonTable rows={roleCount} variant={TableVariant.compact} columns={compoundRolesCells.map((item) => item.title)} />
              ) : roleCount > 0 ? (
                <Table
                  id={compoundRolesId}
                  ouiaId={compoundRolesId}
                  aria-label="Compound roles table"
                  variant={TableVariant.compact}
                  cells={compoundRolesCells}
                  rows={roles?.map((role) => ({
                    cells: [
                      { title: <AppLink to={pathnames['role-detail'].link.replace(':roleId', role.uuid)}>{role.name}</AppLink> },
                      role.description,
                      <Fragment key={`${uuid}-modified`}>
                        <DateFormat date={modified} type={getDateFormat(modified)} />
                      </Fragment>,
                    ],
                  }))}
                >
                  <TableHeader />
                  <TableBody />
                </Table>
              ) : (
                <Text id={compoundRolesId} className="pf-v5-u-mx-lg pf-v5-u-my-sm">
                  {intl.formatMessage(messages.noGroupRoles)}
                </Text>
              ),
            },
          ],
        },
        {
          uuid: `${uuid}-members`,
          parent: 3 * i,
          compoundParent: 2,
          fullWidth: true,
          noPadding: true,
          cells: [
            {
              props: { colSpan: 7, className: 'pf-m-no-padding' },
              title: isLoadingMembers ? (
                <SkeletonTable rows={principalCount} variant={TableVariant.compact} columns={compoundMembersCells.map((item) => item.title)} />
              ) : principalCount > 0 ? (
                <Table
                  id={compoundMembersId}
                  ouiaId={compoundMembersId}
                  aria-label="Compound members table"
                  variant={TableVariant.compact}
                  cells={compoundMembersCells}
                  rows={members?.map((member) => [
                    <TextContent key={member.is_org_admin}>
                      {member?.is_org_admin ? (
                        <CheckIcon key="yes-icon" className="pf-v5-u-mx-sm" />
                      ) : (
                        <CloseIcon key="no-icon" className="pf-v5-u-mx-sm" />
                      )}
                      {intl.formatMessage(member?.is_org_admin ? messages.yes : messages.no)}
                    </TextContent>,
                    member.first_name,
                    member.last_name,
                    member.username,
                    member.email,
                    <Label key={member.is_active} color={member.is_active ? 'green' : 'grey'}>
                      {intl.formatMessage(member?.is_active ? messages.active : messages.inactive)}
                    </Label>,
                  ])}
                >
                  <TableHeader />
                  <TableBody />
                </Table>
              ) : isAdminDefault || isPlatformDefault ? (
                ''
              ) : (
                <Text id={compoundMembersId} className="pf-v5-u-mx-lg pf-v5-u-my-sm">
                  {intl.formatMessage(messages.noGroupMembers)}
                </Text>
              ),
            },
          ],
        },
      ];
    },
    [],
  );
};
