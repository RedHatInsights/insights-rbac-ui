import React from 'react';
import { createPortal } from 'react-dom';
import './Portal.scss';

// Insights notification
const Portal = ({ children }) => {
  if (!children || Array.isArray(children) && children.length === 0) {
    return null;
  }

  return createPortal (
    <div className="portal">
      { children }
    </div>, document.getElementById('root')
  );
};

export default Portal;
