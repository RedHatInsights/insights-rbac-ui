import React, { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { DateFormat } from '@redhat-cloud-services/frontend-components';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Popover } from '@patternfly/react-core';
import classNames from 'classnames';

export const createRows = (data, opened, selectedRows = []) => {
  const [isPopoverVisible, setPopoverVisible] = useState(false);
  return data.reduce(
    (acc, { uuid, name, roleCount, principalCount, modified, platform_default: isPlatformDefault }) => [
      ...acc,
      {
        uuid,
        isPlatformDefault,
        cells: [
          <Fragment key={uuid}>
            <div className="pf-m-inline-flex">
              <Link key={`${uuid}-link`} to={`/groups/detail/${uuid}`}>
                {name}
              </Link>
              {isPlatformDefault && (
                <span key={`${uuid}-popover`} id="default-group-popover">
                  <Popover
                    zIndex="110"
                    position="right"
                    isVisible={isPopoverVisible}
                    shouldClose={() => setPopoverVisible(false)}
                    hideOnOutsideClick={true}
                    bodyContent="This group contains the roles that all users in your organization inherit by default."
                    appendTo={document.getElementById('default-group-popover')}
                  >
                    <OutlinedQuestionCircleIcon
                      onClick={() => setPopoverVisible(!isPopoverVisible)}
                      className={classNames('pf-c-question-circle-icon', { 'icon-active': isPopoverVisible })}
                    />
                  </Popover>
                </span>
              )}
            </div>
          </Fragment>,
          roleCount,
          principalCount,
          <Fragment key={`${uuid}-modified`}>
            <DateFormat date={modified} type="relative" />
          </Fragment>,
        ],
        selected: Boolean(selectedRows && selectedRows.find((row) => row.uuid === uuid)),
      },
    ],
    []
  );
};
