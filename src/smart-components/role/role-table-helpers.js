import React, { Fragment } from 'react';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { Link } from 'react-router-dom';
import { getDateFormat } from '../../helpers/shared/helpers';
import { Text } from '@patternfly/react-core';
import { Table, TableBody, TableHeader, TableVariant } from '@patternfly/react-table';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import messages from '../../Messages';

export const createRows = (data, selectedRows, intl, expanded) =>
  data.reduce(
    (
      acc,
      {
        uuid,
        access = [],
        display_name,
        name,
        description,
        system,
        accessCount,
        groups_in_count: groupsCount,
        groups_in: groups,
        isLoading,
        modified,
      },
      i
    ) => [
      ...acc,
      {
        uuid,
        system,
        disableSelection: !!system,
        selected: Boolean(selectedRows?.find?.((row) => row.uuid === uuid)),
        cells: [
          { title: <Link to={`/roles/detail/${uuid}`}>{display_name || name}</Link> },
          { title: description },
          { title: accessCount, props: { isOpen: expanded[uuid] === 3 } },
          { title: groupsCount, props: { isOpen: expanded[uuid] === 4 } },
          { title: <DateFormat date={modified} type={getDateFormat(modified)} /> },
        ],
      },
      {
        uuid: `${uuid}-permissions`,
        parent: 3 * i,
        compoundParent: 2,
        fullWidth: true,
        noPadding: true,
        cells: [
          {
            props: { colSpan: 7, className: 'pf-m-no-padding' },
            title:
              access.length > 0 ? (
                <Table
                  ouiaId="groups-in-role-nested-table"
                  aria-label="Simple Table"
                  variant={TableVariant.compact}
                  cells={[
                    intl.formatMessage(messages.application),
                    intl.formatMessage(messages.resourceType),
                    intl.formatMessage(messages.operation),
                    intl.formatMessage(messages.lastCommit),
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
              ) : isLoading ? (
                <ListLoader items={3} isCompact />
              ) : (
                <Text className="pf-u-mx-lg pf-u-my-sm">{intl.formatMessage(messages.noPermissions)}</Text>
              ),
          },
        ],
      },
      {
        uuid: `${uuid}-groups`,
        parent: 3 * i,
        compoundParent: 3,
        fullWidth: true,
        noPadding: true,
        cells: [
          {
            props: { colSpan: 7, className: 'pf-m-no-padding' },
            title:
              groupsCount > 0 ? (
                <Table
                  aria-label="Simple Table"
                  ouiaId="permissions-in-role-nested-table"
                  variant={TableVariant.compact}
                  cells={[intl.formatMessage(messages.groupName), intl.formatMessage(messages.description)]}
                  rows={groups.map((group) => ({ cells: [group.name, group.description] }))}
                >
                  <TableHeader />
                  <TableBody />
                </Table>
              ) : (
                <Text className="pf-u-mx-lg pf-u-my-sm">{intl.formatMessage(messages.noGroups)}</Text>
              ),
          },
        ],
      },
    ],
    []
  );
