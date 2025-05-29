import React from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Card, CardBody, CardHeader, CardTitle, List, ListItem, Stack, StackItem, Title } from '@patternfly/react-core';

import { bundleData } from './bundles';
import useSearchParams from '../../hooks/useSearchParams';

import './MUACard.scss';

const MUACard = ({ header, entitlements, isDisabled }) => {
  const { bundle: bundleParam } = useSearchParams('bundle');
  const [, setIsChecked] = React.useState('');

  const onChange = (event) => {
    setIsChecked(event.currentTarget.id);
  };

  return (
    <React.Fragment>
      {header && (
        <Title headingLevel="h3" size="xl">
          {header}
        </Title>
      )}
      <Stack
        className={classNames({
          'pf-v5-u-mt-lg': !header,
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
                  aria-label="card-link"
                  className={classNames('rbac-c-mua-bundles__cardlink', { 'pf-v5-u-background-color-disabled-color-300': isDisabled })}
                  to={{ pathname: '', search: `bundle=${key}` }}
                >
                  <Card
                    ouiaId={`${data.title}-card`}
                    key={data.title}
                    isFlat={isDisabled || key !== bundleParam}
                    isSelectable={!isDisabled}
                    isSelected={!isDisabled && key === bundleParam}
                    className={classNames({
                      'pf-v5-u-background-color-disabled-color-300': isDisabled,
                    })}
                  >
                    <CardHeader
                      selectableActions={{
                        selectableActionId: '',
                        name: data.title,
                        variant: 'single',
                        onChange,
                      }}
                    >
                      <CardTitle className="pf-v5-u-font-weight-light" data-ouia-component-id={`${data.title}-card-title`}>
                        {data.title}
                      </CardTitle>
                    </CardHeader>

                    <CardBody data-ouia-component-id={`${data.title}-card-body`}>
                      <List className="pf-v5-u-color-400 pf-v5-u-font-size-sm rbac-c-mua-bundles__card--applist" isPlain>
                        {Object.entries(data.apps || {}).map(([appName]) => (
                          <ListItem key={appName}> {appName} </ListItem>
                        ))}
                      </List>
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
