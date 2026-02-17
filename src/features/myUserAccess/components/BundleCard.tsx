import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardHeader } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useFlag } from '@unleash/proxy-client-react';
import { bundleData } from '../bundleData';

export type EntitlementTuple = [string, { is_entitled: boolean; is_trial?: boolean }];
export type Entitlements = EntitlementTuple[];

interface BundleCardProps {
  header?: string;
  entitlements?: Entitlements;
  isDisabled?: boolean;
  currentBundle: string;
  /** When set, bundle switch uses this callback instead of NavLink (avoids navigation-triggered freeze) */
  onBundleSelect?: (bundle: string) => void;
}

export const BundleCard: React.FC<BundleCardProps> = ({ header, entitlements = [], isDisabled = false, currentBundle, onBundleSelect }) => {
  const [, setIsChecked] = useState('');
  const location = useLocation();

  const isITLess = useFlag('platform.rbac.itless');
  const lightSpeedRebrand = useFlag('platform.lightspeed-rebrand');

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.id);
  };

  const bundles = isITLess ? bundleData.filter((data) => data.entitlement === 'rhel') : bundleData;

  const getAppDisplayName = (appName: string): string => {
    if (lightSpeedRebrand && appName === 'insights') {
      return 'red hat lightspeed';
    }
    return appName;
  };

  return (
    <React.Fragment>
      {header && (
        <Title headingLevel="h3" size="xl">
          {header}
        </Title>
      )}
      <Stack hasGutter>
        {entitlements &&
          bundles?.map((data) => {
            const entitlementEntry = entitlements.find(([key]) => data.entitlement === key);
            const isEntitled = entitlementEntry && entitlementEntry[1]?.is_entitled;
            const key = data.entitlement;
            return isEntitled ? (
              <StackItem key={key} className="rbac-c-mua-cardWrapper">
                {onBundleSelect ? (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="card-link"
                    className={classNames({ 'pf-v6-u-background-color-disabled-color-300': isDisabled })}
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                    onClick={() => !isDisabled && onBundleSelect(key)}
                    onKeyDown={(e) => e.key === 'Enter' && !isDisabled && onBundleSelect(key)}
                  >
                    <Card
                      ouiaId={`${data.title}-card`}
                      key={data.title}
                      isSelectable={!isDisabled}
                      isSelected={!isDisabled && key === currentBundle}
                      className={classNames({
                        'pf-v6-u-background-color-disabled-color-300': isDisabled,
                      })}
                    >
                      <CardHeader
                        selectableActions={{
                          selectableActionId: `bundle-card-${key}`,
                          selectableActionAriaLabelledby: `bundle-card-title-${key}`,
                          name: data.title,
                          variant: 'single',
                          onChange: (event: React.FormEvent<HTMLInputElement>) => onChange(event as React.ChangeEvent<HTMLInputElement>),
                        }}
                      >
                        <CardTitle
                          id={`bundle-card-title-${key}`}
                          className="pf-v6-u-font-weight-light"
                          data-ouia-component-id={`${data.title}-card-title`}
                        >
                          {data.title}
                        </CardTitle>
                      </CardHeader>
                      <CardBody data-ouia-component-id={`${data.title}-card-body`}>
                        <List className="pf-v6-u-color-400 pf-v6-u-font-size-sm rbac-c-mua-bundles__card--applist" isPlain>
                          {Object.entries(data.apps || {}).map(([appName]) => (
                            <ListItem key={appName}> {getAppDisplayName(appName)} </ListItem>
                          ))}
                        </List>
                      </CardBody>
                    </Card>
                  </div>
                ) : (
                  <NavLink
                    aria-label="card-link"
                    className={classNames({ 'pf-v6-u-background-color-disabled-color-300': isDisabled })}
                    to={{ pathname: location.pathname, search: `bundle=${key}` }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                  <Card
                    ouiaId={`${data.title}-card`}
                    key={data.title}
                    isSelectable={!isDisabled}
                    isSelected={!isDisabled && key === currentBundle}
                    className={classNames({
                      'pf-v6-u-background-color-disabled-color-300': isDisabled,
                    })}
                  >
                    <CardHeader
                      selectableActions={{
                        selectableActionId: `bundle-card-${key}`,
                        selectableActionAriaLabelledby: `bundle-card-title-${key}`,
                        name: data.title,
                        variant: 'single',
                        onChange: (event: React.FormEvent<HTMLInputElement>) => onChange(event as React.ChangeEvent<HTMLInputElement>),
                      }}
                    >
                      <CardTitle
                        id={`bundle-card-title-${key}`}
                        className="pf-v6-u-font-weight-light"
                        data-ouia-component-id={`${data.title}-card-title`}
                      >
                        {data.title}
                      </CardTitle>
                    </CardHeader>

                    <CardBody data-ouia-component-id={`${data.title}-card-body`}>
                      <List className="pf-v6-u-color-400 pf-v6-u-font-size-sm rbac-c-mua-bundles__card--applist" isPlain>
                        {Object.entries(data.apps || {}).map(([appName]) => (
                          <ListItem key={appName}> {getAppDisplayName(appName)} </ListItem>
                        ))}
                      </List>
                    </CardBody>
                  </Card>
                </NavLink>
                )}
              </StackItem>
            ) : null;
          })}
      </Stack>
    </React.Fragment>
  );
};
