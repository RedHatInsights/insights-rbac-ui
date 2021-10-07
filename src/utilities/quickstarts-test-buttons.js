import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import pathnames from '../utilities/pathnames';
import monitorSampleAppQuickStart from './sample-quickstart';

const QuickstartsTestButtons = () => {
  const [openQuickstart, setOpenQuickstart] = useState(false);
  const chromeHook = useChrome();
  const history = useHistory();
  const { quickStarts } = chromeHook;
  const [isQuickstartEnabled, setIsQuickstartEnabled] = useState(false);

  useEffect(() => {
    const flag = localStorage.getItem('quickstarts:enabled') === 'true';

    if (flag) {
      chromeHook.quickStarts.set('monitor-sampleapp', [monitorSampleAppQuickStart]);
      setIsQuickstartEnabled(flag);
    }
  }, []);

  const handleActivateQuickstart = () => {
    openQuickstart ? quickStarts.toggle() : quickStarts.toggle('monitor-sampleapp', {});
    setOpenQuickstart(!openQuickstart);
  };

  const handleOpenCatalog = () => {
    history.push(pathnames['quickstarts-test']);
  };

  const btnStyle = {
    margin: '24px 0px 24px 24px',
  };

  return (
    <>
      {isQuickstartEnabled && (
        <>
          <Button onClick={handleActivateQuickstart} variant={'primary'} style={btnStyle}>
            Trigger my quickstart
          </Button>
          <Button onClick={handleOpenCatalog} variant={'primary'} style={btnStyle}>
            Trigger my catalog
          </Button>
        </>
      )}
    </>
  );
};

export default QuickstartsTestButtons;
