import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { Card, CardBody, CardHeader, CardTitle, List, ListItem, Stack, StackItem, Title } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { bundleData } from '../bundleData';
import './BundleCard.scss';

export type EntitlementTuple = [string, { is_entitled: boolean }];
export type Entitlements = EntitlementTuple[];

interface BundleCardProps {
  header?: string;
  entitlements?: Entitlements;
  isDisabled?: boolean;
  currentBundle: string;
}

export const BundleCard: React.FC<BundleCardProps> = ({ header, entitlements = [], isDisabled = false, currentBundle }) => {
  const [, setIsChecked] = useState('');
  const location = useLocation();

  const isITLess = useFlag('platform.rbac.itless');

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.id);
  };

  const bundles = isITLess ? bundleData.filter((data) => data.entitlement === 'rhel') : bundleData;

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
          bundles?.map((data) => {
            const entitlementEntry = entitlements.find(([key]) => data.entitlement === key);
            const isEntitled = entitlementEntry && entitlementEntry[1]?.is_entitled;
            const key = data.entitlement;
            return isEntitled ? (
              <StackItem key={key} className="rbac-c-mua-cardWrapper">
                <NavLink
                  aria-label="card-link"
                  className={classNames('rbac-c-mua-bundles__cardlink', { 'pf-v5-u-background-color-disabled-color-300': isDisabled })}
                  to={{ pathname: location.pathname, search: `bundle=${key}` }}
                >
                  <Card
                    ouiaId={`${data.title}-card`}
                    key={data.title}
                    isFlat={isDisabled || key !== currentBundle}
                    isSelectable={!isDisabled}
                    isSelected={!isDisabled && key === currentBundle}
                    className={classNames({
                      'pf-v5-u-background-color-disabled-color-300': isDisabled,
                    })}
                  >
                    <CardHeader
                      selectableActions={{
                        selectableActionId: '',
                        name: data.title,
                        variant: 'single',
                        onChange: (event: React.FormEvent<HTMLInputElement>) => onChange(event as React.ChangeEvent<HTMLInputElement>),
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
