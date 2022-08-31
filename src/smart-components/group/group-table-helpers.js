import React, { Fragment, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Popover } from '@patternfly/react-core';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { getDateFormat } from '../../helpers/shared/helpers';
import { useIntl } from 'react-intl';
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

export const createRows = (isAdmin, data, _opened, selectedRows = []) => {
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
                <Link key={`${uuid}-link`} state={{ uuid }} to={{ pathname: `/groups/detail/${isPlatformDefault ? 'default-access' : uuid}` }}>
                  {name}
                </Link>
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
