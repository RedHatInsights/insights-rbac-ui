import React, { Fragment, useRef, useState } from 'react';
import { OutlinedQuestionCircleIcon, CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { Popover, TextContent, Label, Text } from '@patternfly/react-core';
import { Table, Tbody, Thead, TableVariant } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
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
  return data.reduce(
    (
      acc,
      { uuid, name, roleCount, principalCount, modified, roles, members, platform_default: isPlatformDefault, admin_default: isAdminDefault },
      i
    ) => [
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
                  to={pathnames['group-detail'].link.replace(':groupId', isPlatformDefault ? DEFAULT_ACCESS_GROUP_ID : uuid)}
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
          { title: roleCount, props: { isOpen: expanded[uuid] === 2 } },
          {
            title: principalCount,
            props: isPlatformDefault || isAdminDefault ? {} : { isOpen: expanded[uuid] === 3 },
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
            title:
              roleCount > 0 ? (
                <Table
                  ouiaId="roles-in-group-nested-table"
                  aria-label="Simple Table"
                  variant={TableVariant.compact}
                  cells={[
                    { title: intl.formatMessage(messages.roleName) },
                    { title: intl.formatMessage(messages.description) },
                    { title: intl.formatMessage(messages.permissions) },
                    { title: intl.formatMessage(messages.lastModified) },
                  ]}
                  rows={roles?.map((role) => ({
                    cells: [
                      { title: <AppLink to={pathnames['role-detail'].link.replace(':roleId', role.uuid)}>{role.name}</AppLink> },
                      role.description,
                      role.accessCount,
                      <Fragment key={`${uuid}-modified`}>
                        <DateFormat date={modified} type={getDateFormat(modified)} />
                      </Fragment>,
                    ],
                  }))}
                >
                  <Thead />
                  <Tbody />
                </Table>
              ) : (
                <Text className="pf-u-mx-lg pf-u-my-sm">{intl.formatMessage(messages.noGroupRoles)}</Text>
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
            title:
              principalCount > 0 ? (
                <Table
                  aria-label="Simple Table"
                  ouiaId="members-in-group-nested-table"
                  variant={TableVariant.compact}
                  cells={[
                    { title: intl.formatMessage(messages.orgAdministrator) },
                    { title: intl.formatMessage(messages.firstName) },
                    { title: intl.formatMessage(messages.lastName) },
                    { title: intl.formatMessage(messages.username) },
                    { title: intl.formatMessage(messages.email) },
                    intl.formatMessage(messages.status),
                  ]}
                  rows={members?.map((member) => ({
                    cells: [
                      <TextContent key={member.is_org_admin}>
                        {member?.is_org_admin ? (
                          <CheckIcon key="yes-icon" className="pf-u-mx-sm" />
                        ) : (
                          <CloseIcon key="no-icon" className="pf-u-mx-sm" />
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
                    ],
                  }))}
                >
                  <Thead />
                  <Tbody />
                </Table>
              ) : isAdminDefault || isPlatformDefault ? (
                ''
              ) : (
                <Text className="pf-u-mx-lg pf-u-my-sm">{intl.formatMessage(messages.noGroupMembers)}</Text>
              ),
          },
        ],
      },
    ],
    []
  );
};
