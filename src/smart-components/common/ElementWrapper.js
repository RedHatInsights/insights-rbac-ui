import { cloneElement } from 'react';
import { useOutletContext } from 'react-router-dom';
import PropTypes from 'prop-types';

export const ElementWrapper = ({ children, path }) => {
  const componentProps = useOutletContext();
  return cloneElement(children, { ...componentProps, ...(componentProps?.[path] || {}) });
};

ElementWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  path: PropTypes.string,
};

export default ElementWrapper;
