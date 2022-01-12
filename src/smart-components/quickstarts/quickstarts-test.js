import React from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const QuickstartsTest = () => {
  const chrome = useChrome();
  const { quickStarts } = chrome;
  const { Catalog } = quickStarts;

  return <Catalog />;
};

export default QuickstartsTest;
