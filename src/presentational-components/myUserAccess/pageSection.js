import React from 'react';
import PropTypes from 'prop-types';

import { Stack, StackItem, Title } from '@patternfly/react-core';

import './pageSection.scss';

const MUAPageSection = ({ title, children, description }) => (
  <section className='ins-l-myUserAccess-section'>
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="2xl">
          { title }
        </Title>
        <p> { description }</p>
      </StackItem>
      <StackItem> { children } </StackItem>
    </Stack>
  </section>
);

MUAPageSection.propTypes = {
    title: PropTypes.node,
    children: PropTypes.any,
    description: PropTypes.string
  };

export default MUAPageSection;
