import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {
    Stack, StackItem,
    Title,
    Card, CardTitle, CardBody
} from '@patternfly/react-core';

import { bundleData } from '../../presentational-components/myUserAccess/bundles';

import './mua.scss';

const entitlements2 = {
    ansible: {
      is_entitled: true,
      is_trial: false
    },
    cost_management: {
      is_entitled: true,
      is_trial: false
    },
    insights: {
      is_entitled: false,
      is_trial: false
    },
    migrations: {
      is_entitled: true,
      is_trial: false
    },
    openshift: {
      is_entitled: true,
      is_trial: false
    },
    settings: {
      is_entitled: true,
      is_trial: false
    },
    smart_management: {
      is_entitled: true,
      is_trial: false
    },
    subscriptions: {
      is_entitled: true,
      is_trial: false
    },
    user_preferences: {
      is_entitled: true,
      is_trial: false
    }
};

const CardSection = ({ header, entitlements, isDisabled }) => {

  return (
    <React.Fragment>
      <Title headingLevel="h3" size="xl"> { header } </Title>
      { entitlements && entitlements.map(([ key ]) => {
        const data = bundleData.find(({ entitlement }) => entitlement === key);
        console.log('data', data);
        return (
          data ? <Card
            isFlat
            className={ classNames(
              'ins-c-mua-bundles__card',
              `ins-c-mua-bundles__card--${data.entitlement}`,
              { 'ins-c-mua-bundles__card--disabled': isDisabled }
            ) }>
            <CardTitle className='ins-c-mua-bundles__card--header'> { data.title }</CardTitle>
            <CardBody>
              <Stack hasGutter>
                <StackItem className='ins-c-mua-bundles__card--applist'>
                  { data.apps && Object.entries(data.apps).map(([ appName ]) => (
                      <span key={ appName }> { appName } </span>
                  )) }
                </StackItem>
              </Stack>
            </CardBody>
          </Card> : <React.Fragment/>
        );
      })}
    </React.Fragment>
  );
};

CardSection.propTypes = {
  header: PropTypes.string,
  entitlements: PropTypes.array,
  isDisabled: PropTypes.bool
};

const MUAContent = ({ entitlements }) => {

    console.log('entitlements', entitlements, entitlements2);
    // const entitledBundles = [];
    // const unEntitledBundles = [];

    const entitledBundles = Object.entries(entitlements2).filter(([ , { is_entitled }]) => is_entitled);
    const unEntitledBundles = Object.entries(entitlements2).filter(([ , { is_entitled }]) => !is_entitled);

    console.log(entitledBundles, unEntitledBundles);

    return (
        <React.Fragment>
            <section className='ins-l-myUserAccess-section'>
                <Stack hasGutter>
                    <StackItem>
                      <CardSection header={ `Your organization's subscriptions` } entitlements={ entitledBundles }/>
                    </StackItem>
                    <StackItem className='ins-l-not-subscribed'>
                      <CardSection header='Not subscribed' entitlements={ unEntitledBundles } isDisabled/>
                    </StackItem>
                </Stack>
            </section>
            <span> test </span>
        </React.Fragment>
    );
};

MUAContent.propTypes = {
    entitlements: PropTypes.object
};

export default MUAContent;
