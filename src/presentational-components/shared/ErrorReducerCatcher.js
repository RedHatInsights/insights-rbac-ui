import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import NotAuthorized from '@redhat-cloud-services/frontend-components/NotAuthorized/NotAuthorized';

const errorStates = {
  403: NotAuthorized,
};

const ErroReducerCatcher = ({ children }) => {
  const errorCode = useSelector(({ errorReducer: { errorCode } }) => errorCode);
  if (errorCode) {
    const State = errorStates[errorCode];
    return <State />;
  }

  return children;
};

ErroReducerCatcher.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErroReducerCatcher;
