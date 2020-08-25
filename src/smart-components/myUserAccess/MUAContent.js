import React from 'react';
import PropTypes from 'prop-types';

import {
  Stack, StackItem,
  Title
} from '@patternfly/react-core';

import MUATable from './MUATable';
import MUACard from '../../presentational-components/myUserAccess/MUACard';

import './MUAContent.scss';

const MUAContent = ({ entitlements }) => {

  const entitledBundles = Object.entries(entitlements).filter(([ , { is_entitled }]) => is_entitled);
  const unEntitledBundles = Object.entries(entitlements).filter(([ , { is_entitled }]) => !is_entitled);

  return (
    <React.Fragment>
      <section className='ins-l-myUserAccess-section ins-l-myUserAccess-section__cards'>
        <Stack hasGutter>
          <StackItem className='ins-l-myUserAccess-section__cards--entitled'>
            { /* No conditional here because you have to have a subscription to get to /settings */ }
            <MUACard header={ `Your organization's subscriptions` } entitlements={ entitledBundles }/>
          </StackItem>
          { unEntitledBundles.length > 0 &&
            <StackItem className='ins-l-myUserAccess-section__cards--unentitled'>
              <MUACard header='Not subscribed' entitlements={ unEntitledBundles } isDisabled/>
            </StackItem>
          }
        </Stack>
      </section>
      <section className='ins-l-myUserAccess-section ins-l-myUserAccess-section__table'>
        <Title headingLevel="h3" size="xl"> Your roles </Title>
        <MUATable/>
      </section>
    </React.Fragment>
  );
};

MUAContent.propTypes = {
    entitlements: PropTypes.object
};

export default MUAContent;
