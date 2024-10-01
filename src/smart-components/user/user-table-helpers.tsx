import React, { Fragment } from 'react';
import { Label } from '@patternfly/react-core';
import { IntlShape } from 'react-intl';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import AppLink from '../../presentational-components/shared/AppLink';

export interface UserProps {
  email: string;
  first_name: string;
  is_active: boolean;
  is_org_admin: boolean;
  last_name: string;
  username: string;
  uuid: string;
}

export type CellObject = { title: string | React.RefAttributes<HTMLAnchorElement>; props?: { 'data-is-active': boolean } };

export interface RowProps {
  uuid: string; // username
  cells: [
    React.ReactNode, // yes or no for isOrgAdmin
    CellObject, // link to user or just username
    string, // email
    string, // firstName
    string, // lastName
    CellObject // status
  ];
  selected: boolean;
}

export const createRows = (userLinks: boolean, data: UserProps[] = [], intl: IntlShape, checkedRows = [], isSelectable = false): RowProps[] =>
  data?.reduce<RowProps[]>((acc, { username, is_active: isActive, email, first_name: firstName, last_name: lastName, is_org_admin: isOrgAdmin }) => {
    const newEntry: RowProps = {
      uuid: username,
      cells: [
        isOrgAdmin ? (
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
      ],
      selected: isSelectable ? Boolean(checkedRows?.find?.(({ uuid }) => uuid === username)) : false,
    };

    return [...acc, newEntry];
  }, []);
