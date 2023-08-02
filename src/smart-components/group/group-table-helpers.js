import React, { Fragment, useRef, useState } from 'react';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Popover } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import AppLink from '../../presentational-components/shared/AppLink';
import { getDateFormat } from '../../helpers/shared/helpers';
import pathnames from '../../utilities/pathnames';
import messages from '../../Messages';
import { Text } from '@patternfly/react-core';
import { Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table';

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
          className={classNames('pf-c-question-circle-icon', { 'icon-active': isPopoverVisible })}
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
    (acc, { uuid, name, roleCount, principalCount, modified, platform_default: isPlatformDefault, admin_default: isAdminDefault }, i) => [
      ...acc,
      {
        uuid,
        isAdminDefault,
        isPlatformDefault,
        selected: Boolean(selectedRows && selectedRows.find((row) => row.uuid === uuid)),
        cells: [
          {
            title: isAdmin ? (
              <AppLink
                key={`${uuid}-link`}
                state={{ uuid }}
                to={pathnames['group-detail'].link.replace(':groupId', isPlatformDefault ? 'default-access' : uuid)}
              >
                {name}
              </AppLink>
            ) : (
              name
            ),
          },
          { title: roleCount, props: { isOpen: expanded[uuid] === 2 } },
          { title: principalCount, props: { isOpen: expanded[uuid] === 3 } },
          { title: <DateFormat date={modified} type={getDateFormat(modified)} /> },
        ],
      },
      {
        uuid: `${uuid}-roles`,
        parent: 2 * i,
        compoundParent: 1,
        fullWidth: true,
        noPadding: true,
        cells: [
          {
            props: { colSpan: 7, className: 'pf-m-no-padding' },
            title:
              roleCount.length > 0 ? (
                <Table
                  ouiaId="roles-in-group-nested-table"
                  aria-label="Simple Table"
                  variant={TableVariant.compact}
                  cells={[
                    intl.formatMessage(messages.roleName),
                    intl.formatMessage(messages.description),
                    intl.formatMessage(messages.permissions),
                    intl.formatMessage(messages.lastModified),
                  ]}
                  rows={roleCount.map((roles) => {
                    const [roleName, description, permissions] = roles.permission.split(':');
                    return {
                      cells: [
                        roleName,
                        description,
                        permissions,
                        <Fragment key={`${uuid}-modified`}>
                          <DateFormat date={modified} type={getDateFormat(modified)} />
                        </Fragment>,
                      ],
                    };
                  })}
                >
                  <TableHeader />
                  <TableBody />
                </Table>
              ) : (
                <Text className="pf-u-mx-lg pf-u-my-sm">{intl.formatMessage(messages.noRolePermissions)}</Text>
              ),
          },
        ],
      },
      {
        uuid: `${uuid}-members`,
        parent: 3 * i,
        compoundParent: 2,
        fullwidth: true,
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
                    intl.formatMessage(messages.orgAdmin),
                    intl.formatMessage(messages.username),
                    intl.formatMessage(messages.email),
                    intl.formatMessage(messages.firstName),
                    intl.formatMessage(messages.lastName),
                    intl.formatMessage(messages.status),
                  ]}
                  rows={principalCount.map((member) => ({
                    cells: [member.orgAdmin, member.username, member.email, member.firstName, member.lastName, member.status],
                  }))}
                >
                  <TableHeader />
                  <TableBody />
                </Table>
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
console.log(createRows);
// cells: [
//   <Fragment key={uuid}>
//     <div className="pf-m-inline-flex">
//       {isAdmin ? (
//         <AppLink
//           key={`${uuid}-link`}
//           state={{ uuid }}
//           to={pathnames['group-detail'].link.replace(':groupId', isPlatformDefault ? 'default-access' : uuid)}
//         >
//           {name}
//         </AppLink>
//       ) : (
//         name
//       )}
//       {(isPlatformDefault || isAdminDefault) && (
//         <DefaultPlatformPopover
//           id={`default${isAdminDefault ? '-admin' : ''}-group-popover`}
//           uuid={uuid}
//           key={`${uuid}-popover`}
//           bodyContent={intl.formatMessage(isAdminDefault ? messages.orgAdminInheritedRoles : messages.usersInheritedRoles)}
//         />
//       )}
//     </div>
//   </Fragment>,
//   roleCount,
//   principalCount,
//   <Fragment key={`${uuid}-modified`}>
//     <DateFormat date={modified} type={getDateFormat(modified)} />
//   </Fragment>,
// ],
