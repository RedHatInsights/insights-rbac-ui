import React from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import pathnames from '../../utilities/pathnames';

import { Stack, StackItem, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';

import { bundleData } from './bundles';
import useSearchParams from '../../hooks/useSearchParams';

import './MUACard.scss';

const MUACard = ({ header, entitlements, isDisabled }) => {
  const { bundle: bundleParam } = useSearchParams('bundle');
  return (
    <React.Fragment>
      {header && (
        <Title headingLevel="h3" size="xl">
          {header}
        </Title>
      )}
      <Stack
        className={classNames({
          'pf-u-mt-lg': !header,
        })}
        hasGutter
      >
        {entitlements &&
          bundleData?.map((data) => {
            const isEntitled = entitlements.find(([key]) => data.entitlement === key);
            const key = data.entitlement;
            return isEntitled ? (
              <StackItem key={key} className="rbac-c-mua-cardWrapper">
                <NavLink
                  className={classNames('rbac-c-mua-bundles__cardlink', { 'rbac-c-mua-bundles__cardlink--disabled': isDisabled })}
                  to={{ pathname: ''.path, search: `bundle=${key}` }}
                >
                  <Card
                    key={data.title}
                    isFlat={isDisabled || key !== bundleParam}
                    isSelectable={!isDisabled}
                    isSelected={!isDisabled && key === bundleParam}
                    className={classNames('rbac-c-mua-bundles__card', `rbac-c-mua-bundles__card--${data.entitlement}`, {
                      'rbac-c-mua-bundles__card--disabled': isDisabled,
                    })}
                  >
                    <CardTitle className="rbac-c-mua-bundles__card--header"> {data.title}</CardTitle>
                    <CardBody>
                      <Stack hasGutter>
                        <StackItem className="rbac-c-mua-bundles__card--applist">
                          {Object.entries(data.apps || {}).map(([appName]) => (
                            <span key={appName}> {appName} </span>
                          ))}
                        </StackItem>
                      </Stack>
                    </CardBody>
                  </Card>
                </NavLink>
              </StackItem>
            ) : null;
          })}
      </Stack>
    </React.Fragment>
  );
};

MUACard.propTypes = {
  header: PropTypes.string,
  entitlements: PropTypes.array,
  isDisabled: PropTypes.bool,
};

export default MUACard;
