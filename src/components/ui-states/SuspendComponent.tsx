import React, { ComponentType, Fragment, ReactNode, Suspense } from 'react';

interface SuspendComponentProps {
  asyncFunction: () => Promise<any>;
  callback: (data: any, props: any) => JSX.Element;
  fallback?: ReactNode;
  [key: string]: any;
}

const asyncComponent = (asyncFunction: () => Promise<any>, callback: (data: any, props: any) => JSX.Element, props: any): ComponentType =>
  React.lazy(() =>
    asyncFunction().then((data) => ({
      default: () => callback(data, props),
    })),
  );

export const SuspendComponent: React.FC<SuspendComponentProps> = ({ asyncFunction, callback, fallback, ...props }) => {
  const Async = asyncComponent(asyncFunction, callback, props);
  return (
    <Suspense fallback={fallback || <Fragment />}>
      <Async />
    </Suspense>
  );
};
