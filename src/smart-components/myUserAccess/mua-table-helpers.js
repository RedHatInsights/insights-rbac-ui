import React, { Fragment } from 'react';
import ResourceDefinitionsButton from '../../presentational-components/myUserAccess/ResourceDefinitionsButton';

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
                  <ResourceDefinitionsButton onClick={() => onRdClick(index)} access={access} />
                </Fragment>,
              ]
            : []),
        ],
      },
    ];
  }, []);
