import React, { Fragment } from 'react';
import { IntlShape } from 'react-intl';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import AppLink from '../../presentational-components/shared/AppLink';
import OrgAdminDropdown from './OrgAdminDropdown';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import ActivateToggle from './ActivateToggle';
import { Label } from '@patternfly/react-core';
export interface UserProps {
  isSelected: boolean;
  email: string;
  first_name: string;
  is_active: boolean;
  is_org_admin: boolean;
  last_name: string;
  username: string;
  uuid: string;
  external_source_id?: number;
}

export type CellObject = { title: string | React.RefAttributes<HTMLAnchorElement>; props?: { 'data-is-active': boolean } };
export type SelectCell = {
  select: {
    rowIndex: number;
    onSelect: (_event: unknown, isSelecting: boolean) => void;
    isSelected: boolean;
  };
};
export type CellType = SelectCell | React.ReactNode | CellObject | string;

export interface RowProps {
  uuid: string; // username
  cells: CellType[];
  selected: boolean;
  authModel?: boolean;
  orgAdmin?: boolean;
  fetchData?: () => void;
}

export const createRows = (
  userLinks: boolean,
  data: UserProps[] = [],
  intl: IntlShape,
  checkedRows = [],
  isSelectable = false,
  onSelectUser?: (user: UserProps, isSelecting: boolean) => void,
  handleToggle?: (_ev: unknown, isActive: boolean, updatedUsers: any[]) => void,
  authModel?: boolean,
  orgAdmin?: boolean,
  fetchData?: () => void,
  currAccountId?: string,
): RowProps[] => {
  return data?.reduce<RowProps[]>(
    (
      acc,
      { isSelected, username, is_active: isActive, email, first_name: firstName, last_name: lastName, is_org_admin: isOrgAdmin, external_source_id },
      rowIndex,
    ) => {
      const user = {
        isSelected,
        username,
        is_active: isActive,
        email,
        first_name: firstName,
        last_name: lastName,
        is_org_admin: isOrgAdmin,
        external_source_id,
        uuid: username,
      };
      const newEntry: RowProps = {
        uuid: username,
        cells: [
          ...(onSelectUser && orgAdmin && authModel
            ? [
                {
                  select: {
                    rowIndex,
                    onSelect: (_event: unknown, isSelecting: boolean) => onSelectUser(user, isSelecting),
                    isSelected: isSelected,
                  },
                },
              ]
            : []),
          authModel && orgAdmin ? (
            <OrgAdminDropdown
              key={`dropdown-${username}`}
              isOrgAdmin={isOrgAdmin}
              username={username}
              intl={intl}
              userId={external_source_id}
              fetchData={fetchData}
            />
          ) : isOrgAdmin ? (
            <Fragment>
              <CheckIcon key="yes-icon" className="pf-v5-u-mr-sm" />
              <span key="yes">{intl.formatMessage(messages.yes)}</span>
            </Fragment>
          ) : (
            <Fragment>
              <CloseIcon key="no-icon" className="pf-v5-u-mr-sm" />
              <span key="no">{intl.formatMessage(messages.no)}</span>
            </Fragment>
          ),
          {
            title: userLinks ? (
              <AppLink to={pathnames['user-detail'].link.replace(':username', username)}>{username.toString()}</AppLink>
            ) : (
              username.toString()
            ),
          },
          email,
          firstName,
          lastName,
          ...(handleToggle && orgAdmin && authModel
            ? [<ActivateToggle key="active-toggle" user={user} handleToggle={handleToggle} intl={intl} accountId={currAccountId} />]
            : [
                {
                  title: (
                    <Label key="status" color={isActive ? 'green' : 'grey'}>
                      {intl.formatMessage(isActive ? messages.active : messages.inactive)}
                    </Label>
                  ),
                  props: {
                    'data-is-active': isActive,
                  },
                },
              ]),
        ],
        selected: isSelectable ? Boolean(checkedRows?.find?.(({ uuid }) => uuid === username)) : false,
      };

      return [...acc, newEntry];
    },
    [],
  );
};
