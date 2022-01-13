import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import NotAuthorized from '@redhat-cloud-services/frontend-components/NotAuthorized/NotAuthorized';
import { useLocation } from 'react-router-dom';
import { API_ERROR } from '../../redux/action-types';

const errorStates = {
  403: NotAuthorized,
};

const sectionTitles = {
  '/users': 'RBAC Users',
  '/groups': 'RBAC Groups',
};

const ErroReducerCatcher = ({ children }) => {
  const errorCode = useSelector(({ errorReducer: { errorCode } }) => errorCode);
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (errorCode) {
      dispatch({ type: API_ERROR, payload: undefined });
    }
  }, [pathname]);

  if (errorCode) {
    const State = errorStates[errorCode];
    const name = sectionTitles[Object.keys(sectionTitles).find((key) => pathname.includes(key))] || 'RBAC';
    return <State serviceName={name} />;
  }

  return children;
};

ErroReducerCatcher.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErroReducerCatcher;
