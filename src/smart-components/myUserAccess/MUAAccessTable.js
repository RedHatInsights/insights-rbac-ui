import React, { useEffect, useState }  from 'react';

import { useSelector, shallowEqual } from 'react-redux';
import { defaultSettings } from '../../helpers/shared/pagination';

const MUAAccessTable = () => {

  const [ config, setConfig ] = useState({
    pagination: {
      ...defaultSettings,
      filter: ''
    }
  });

  const { permissions, isLoading } = useSelector(state => (console.log(state), {
    permissions: state.accessReducer.access,
    isLoading: state.accessReducer.isLoading
  }), shallowEqual);

  useEffect(() => {
    setConfig({
      ...config,
      pagination: {
        ...config.pagination,
        count: permissions ? permissions.length : 0
      }
    });
  }, [ permissions ]);

  console.log(permissions, isLoading);

  return <span> foo </span>;
};

export default MUAAccessTable;
