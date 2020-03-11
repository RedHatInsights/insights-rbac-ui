import React from 'react';
import PropTypes from 'prop-types';

import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import './warningModal.scss';

export const WarningModalHeader = ({ type }) => (
  <span className='ins-c-wizard__cancel-warning-header'>
    <ExclamationTriangleIcon size='md' className='ins-c-wizard__cancel-warning-header--icon'/>
    Exit { type } creation
  </span>
);

WarningModalHeader.propTypes = {
  type: PropTypes.string
};

export const WarningModalText = ({ type }) => (
  <React.Fragment>
    <span> Are you sure you want to stop creating a { type } in user access? </span>
    <span> All inputs will be discarded.</span>
  </React.Fragment>
);

WarningModalText.propTypes = {
  type: PropTypes.string
};
