import React, { Fragment } from 'react';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TableVariant } from '@patternfly/react-table';
import { Table, TableBody, TableHeader } from '@patternfly/react-table/deprecated';
import { AppLink } from '../../components/navigation/AppLink';
import { getDateFormat } from '../../helpers/stringUtilities';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';

export const createRows = (data, selectedRows, intl, expanded, adminGroup) =>
  data.reduce(
    (
      acc,
      { uuid, access = [], display_name, name, description, system, accessCount, groups_in_count: groupsCount, groups_in: groups, modified },
      i,
    ) => [
      ...acc,
      {
        uuid,
        system,
        disableSelection: !!system,
        selected: Boolean(selectedRows?.find?.((row) => row.uuid === uuid)),
        cells: [
          { title: <AppLink to={pathnames['role-detail'].link.replace(':roleId', uuid)}>{display_name || name}</AppLink> },
          { title: description },
          { title: groupsCount, props: { isOpen: expanded[uuid] === 3 } },
          { title: accessCount, props: { isOpen: expanded[uuid] === 4 } },
          { title: <DateFormat date={modified} type={getDateFormat(modified)} /> },
        ],
      },
      {
        uuid: `${uuid}-groups`,
        parent: 3 * i,
        compoundParent: 2,
        fullWidth: true,
        noPadding: true,
        cells: [
          {
            props: { colSpan: 7, className: 'pf-m-no-padding' },
            title:
              groupsCount > 0 ? (
                <Table
                  aria-label="Compound groups table"
                  ouiaId="role-in-groups-nested-table"
                  variant={TableVariant.compact}
                  cells={[intl.formatMessage(messages.groupName), intl.formatMessage(messages.description), ' ']}
                  rows={groups?.map((group) => ({
                    cells: [
                      { title: <AppLink to={pathnames['group-detail'].link.replace(':groupId', group.uuid)}>{group.name}</AppLink> },
                      group.description,
                      {
                        title:
                          adminGroup?.uuid === group.uuid ? null : (
                            <AppLink
                              to={pathnames['roles-add-group-roles'].link.replace(':roleId', uuid).replace(':groupId', group.uuid)}
                              state={{ name: group.name }}
                            >
                              {intl.formatMessage(messages.addRoleToThisGroup)}
                            </AppLink>
                          ),
                        props: { className: 'pf-v5-u-text-align-right' },
                      },
                    ],
                  }))}
                >
                  <TableHeader />
                  <TableBody />
                </Table>
              ) : (
                <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroups)}</Text>
              ),
          },
        ],
      },
      {
        uuid: `${uuid}-permissions`,
        parent: 3 * i,
        compoundParent: 3,
        fullWidth: true,
        noPadding: true,
        cells: [
          {
            props: { colSpan: 7, className: 'pf-m-no-padding' },
            title:
              access.length > 0 ? (
                <Table
                  ouiaId="permissions-in-role-nested-table"
                  aria-label="Compound permissions table"
                  variant={TableVariant.compact}
                  cells={[
                    intl.formatMessage(messages.application),
                    intl.formatMessage(messages.resourceType),
                    intl.formatMessage(messages.operation),
                    intl.formatMessage(messages.lastModified),
                  ]}
                  rows={access.map((access) => {
                    const [appName, type, operation] = access.permission.split(':');
                    return {
                      cells: [
                        appName,
                        type,
                        operation,
                        <Fragment key={`${appName}-modified`}>
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
                <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noPermissions)}</Text>
              ),
          },
        ],
      },
    ],
    [],
  );
