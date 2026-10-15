import React, { cloneElement } from 'react';
import { useOutletContext } from 'react-router-dom';

interface ElementWrapperProps {
  path?: string;
  children: React.ReactElement;
}

export const ElementWrapper: React.FC<ElementWrapperProps> = ({ children, path }) => {
  const componentProps = useOutletContext<Record<string, unknown>>();
  return cloneElement(children, { ...componentProps, ...((path && componentProps?.[path]) || {}) });
};

export default ElementWrapper;
