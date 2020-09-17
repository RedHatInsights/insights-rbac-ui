import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextContent, Title } from '@patternfly/react-core';
import './review.scss';

const ReviewTemplate = ({ formFields }) => {
  return (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="ins-c-rbac__gutter-sm">
        Review details
      </Title>
      <TextContent className="ins-c-rbac__gutter-md">
        <Text>Review and confirm the details for your role, or click Back to revise.</Text>
      </TextContent>
      {[[{ ...formFields?.[0]?.[0] }]]}
    </React.Fragment>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
