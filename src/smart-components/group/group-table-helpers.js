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

export const createRows = (isAdmin, data, selectedRows = []) => {
  const intl = useIntl();
  return data.reduce(
    (acc, { uuid, name, roleCount, principalCount, modified, platform_default: isPlatformDefault, admin_default: isAdminDefault }) => [
      ...acc,
      {
        uuid,
        isAdminDefault,
        isPlatformDefault,
        cells: [
          <Fragment key={uuid}>
            <div className="pf-m-inline-flex">
              {isAdmin ? (
                <AppLink
                  key={`${uuid}-link`}
                  state={{ uuid }}
                  to={pathnames['group-detail'].link.replace(':groupId', isPlatformDefault ? DEFAULT_ACCESS_GROUP_ID : uuid)}
                >
                  {name}
                </AppLink>
              ) : (
                name
              )}
              {(isPlatformDefault || isAdminDefault) && (
                <DefaultPlatformPopover
                  id={`default${isAdminDefault ? '-admin' : ''}-group-popover`}
                  uuid={uuid}
                  key={`${uuid}-popover`}
                  bodyContent={intl.formatMessage(isAdminDefault ? messages.orgAdminInheritedRoles : messages.usersInheritedRoles)}
                />
              )}
            </div>
          </Fragment>,
          roleCount,
          principalCount,
          <Fragment key={`${uuid}-modified`}>
            <DateFormat date={modified} type={getDateFormat(modified)} />
          </Fragment>,
        ],
        selected: Boolean(selectedRows && selectedRows.find((row) => row.uuid === uuid)),
      },
    ],
    []
  );
};
