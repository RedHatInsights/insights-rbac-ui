import React, { Fragment } from 'react';
import { IntlShape } from 'react-intl';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import AppLink from '../../presentational-components/shared/AppLink';
import OrgAdminDropdown from './OrgAdminDropdown';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import ActivateToggle from './ActivateToggle';
import { Td } from '@patternfly/react-table';
export interface UserProps {
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

export interface RowProps {
  uuid: string; // username
  cells: [
    React.ReactNode, // select
    React.ReactNode, // yes or no for isOrgAdmin
    CellObject, // link to user or just username
    string, // email
    string, // firstName
    string, // lastName
    React.ReactNode // status
  ];
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
  authModel?: boolean,
  orgAdmin?: boolean,
  fetchData?: () => void
): RowProps[] => {
  const [selectedUserNames, setSelectedUsernames] = React.useState<UserProps[]>([]);
  const setUserSelected = (user: UserProps, isSelecting = true) => {
    setSelectedUsernames((prevSelected: UserProps[]) => {
      const otherSelectedUserNames = prevSelected.filter((r) => r.username !== user.username);
      console.log('selected: ', isSelecting ? [...otherSelectedUserNames, user] : otherSelectedUserNames);
      return isSelecting ? [...otherSelectedUserNames, user] : otherSelectedUserNames;
    });
  };
  const isUserSelected = (user: UserProps) => selectedUserNames.some((r) => r.username === user.username);
  const onSelectUser = (user: UserProps, isSelecting: boolean) => {
    setUserSelected(user, isSelecting);
  };

  return data?.reduce<RowProps[]>(
    (
      acc,
      { username, is_active: isActive, email, first_name: firstName, last_name: lastName, is_org_admin: isOrgAdmin, external_source_id },
      rowIndex
    ) => {
      const user = {
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
          <Td
            key="select"
            select={{
              rowIndex,
              onSelect: (_event, isSelecting) => onSelectUser(user, isSelecting),
              isSelected: isUserSelected(user),
            }}
          />,
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
          <ActivateToggle key="active-toggle" user={user} intl={intl} />,
        ],
        selected: isSelectable ? Boolean(checkedRows?.find?.(({ uuid }) => uuid === username)) : false,
      };

      return [...acc, newEntry];
    },
    []
  );
};
