import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import global_palette_red_100 from '@patternfly/react-tokens/dist/js/global_palette_red_100';

const GroupNameErrorState = ({ setHideFooter }) => {
  useEffect(() => {
    setHideFooter(true);
    return () => {
      setHideFooter(false);
    };
  });

  return (
    <EmptyState variant={EmptyStateVariant.small}>
      <EmptyStateIcon color={global_palette_red_100.value} icon={ExclamationCircleIcon} />
      <Title headingLevel="h4">Group name already taken</Title>
      <EmptyStateBody>Please return to Step 1: Group information and choose a&nbsp;unique name for your group.</EmptyStateBody>
      <Button variant="primary" onClick={() => document.getElementsByClassName('pf-c-wizard__nav-link')[0].click()}>
        Return to Step 1
      </Button>
    </EmptyState>
  );
};

GroupNameErrorState.propTypes = {
  setHideFooter: PropTypes.func,
};

export default GroupNameErrorState;
