import React, { Fragment } from 'react';
import ResourceDefinitionsLink from './components/ResourceDefinitionsLink';

export const createRows = (data, showResourceDefinitions, onRdClick) =>
  data.reduce((acc, { permission, ...access }, index) => {
    const [appName, type, operation] = permission.split(':');
    return [
      ...acc,
      {
        cells: [
          appName,
          type,
          operation,
          ...(showResourceDefinitions
            ? [
                <Fragment key="rd">
                  <ResourceDefinitionsLink onClick={() => onRdClick(index)} access={access} />
                </Fragment>,
              ]
            : []),
        ],
      },
    ];
  }, []);
