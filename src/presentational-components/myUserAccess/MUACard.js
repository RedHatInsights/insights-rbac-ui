import React from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { routes } from '../../../package.json';

import { Stack, StackItem, Title, Card, CardTitle, CardBody } from '@patternfly/react-core';

import { bundleData } from './bundles';
import useSearchParams from '../../hooks/useSearchParams';

import './MUACard.scss';

const MUACard = ({ header, entitlements, isDisabled }) => {
  const { bundle: bundleParam } = useSearchParams('bundle');
  return (
    <React.Fragment>
      <Title headingLevel="h3" size="xl">
        {header}
      </Title>
      <Stack hasGutter>
        {entitlements &&
          entitlements?.map(([key]) => {
            const data = bundleData.find(({ entitlement }) => entitlement === key);
            return data ? (
              <StackItem key={key} className="ins-c-mua-cardWrapper">
                <NavLink
                  className={classNames('ins-c-mua-bundles__cardlink', { 'ins-c-mua-bundles__cardlink--disabled': isDisabled })}
                  to={{ pathname: routes['my-user-access'], search: `bundle=${key}` }}
                >
                  <Card
                    key={data.title}
                    isFlat={isDisabled || key !== bundleParam}
                    isSelectable={!isDisabled}
                    isSelected={!isDisabled && key === bundleParam}
                    className={classNames('ins-c-mua-bundles__card', `ins-c-mua-bundles__card--${data.entitlement}`, {
                      'ins-c-mua-bundles__card--disabled': isDisabled,
                    })}
                  >
                    <CardTitle className="ins-c-mua-bundles__card--header"> {data.title}</CardTitle>
                    <CardBody>
                      <Stack hasGutter>
                        <StackItem className="ins-c-mua-bundles__card--applist">
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
