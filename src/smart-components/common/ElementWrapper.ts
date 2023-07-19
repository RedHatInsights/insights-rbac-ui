import React, { cloneElement } from 'react';
import { useOutletContext } from 'react-router-dom';

interface ElementWrapperProps {
  path?: string;
  children: React.ReactElement;
}

export const ElementWrapper: React.FC<ElementWrapperProps> = ({ children, path }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const componentProps: any = useOutletContext();
  return cloneElement(children, { ...componentProps, ...((path && componentProps?.[path]) || {}) });
};

export default ElementWrapper;
