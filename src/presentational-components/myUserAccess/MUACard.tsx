import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import classNames from 'classnames';
import { Card, CardBody, CardHeader, CardTitle, List, ListItem, Stack, StackItem, Title } from '@patternfly/react-core';
import { useFlag } from '@unleash/proxy-client-react';

import { bundleData } from './bundles';
import useSearchParams from '../../hooks/useSearchParams';

import './MUACard.scss';

interface MUACardProps {
  header?: string;
  entitlements?: Array<[string, any]>;
  isDisabled?: boolean;
}

interface BundleData {
  entitlement: string;
  title: string;
  apps: Record<string, string | undefined>;
  appsIds: string[];
}

const MUACard: React.FC<MUACardProps> = ({ header, entitlements = [], isDisabled = false }) => {
  const { bundle: bundleParam } = useSearchParams('bundle') as { bundle?: string };
  const [, setIsChecked] = useState<string>('');

  const isITLess = useFlag('platform.rbac.itless');

  const onChange = (event: React.FormEvent<HTMLInputElement>) => {
    setIsChecked((event.target as HTMLInputElement).id);
  };

  const bundles: BundleData[] = isITLess ? bundleData.filter((data) => data.entitlement === 'rhel') : bundleData;

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

export default MUACard;
