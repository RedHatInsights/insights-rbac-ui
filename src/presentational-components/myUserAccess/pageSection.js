import React from 'react';
import PropTypes from 'prop-types';
import { Stack, StackItem, Title } from '@patternfly/react-core';

const MUAPageSection = ({ title, children, description }) => (
  <section className='pf-u-mt-sm'>
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="2xl" className="pf-u-mb-sm">
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
