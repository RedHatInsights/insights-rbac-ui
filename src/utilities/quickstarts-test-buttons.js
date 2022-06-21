import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import pathnames from '../utilities/pathnames';
import monitorSampleAppQuickStart from './sample-quickstart';
import { QuickStartContext } from '@patternfly/quickstarts';

const QuickstartsTestButtons = () => {
  const [openQuickstart, setOpenQuickstart] = useState(false);
  const chromeHook = useChrome();
  const navigate = useNavigate();
  const quickstartsContext = React.useContext(QuickStartContext);
  const { quickStarts } = chromeHook;
  const [isQuickstartEnabled, setIsQuickstartEnabled] = useState(false);

  /*
    This effect is to populate our catalog for this test 'environment' given that there is still no db being connected to the platform to pull
    persistant quickstarts from. For now, we enable the quickstarts while pushing a new entry to the catalog in Chrome through the set function.
  */
  useEffect(() => {
    const flag = localStorage.getItem('quickstarts:enabled') === 'true';

    if (flag) {
      quickStarts.set('monitor-sampleapp', [monitorSampleAppQuickStart]);
      setIsQuickstartEnabled(flag);
    }
  }, []);

  useEffect(() => {
    setOpenQuickstart(quickstartsContext.activeQuickStartID === '' ? false : true);
  }, [quickstartsContext]);

  const handleActivateQuickstart = () => {
    openQuickstart & !!quickstartsContext.activeQuickStartID ? quickStarts.toggle() : quickStarts.toggle('monitor-sampleapp', {});
    setOpenQuickstart(!openQuickstart);
  };

  const handleOpenCatalog = () => {
    navigate(pathnames['quickstarts-test'].path);
  };

  const btnStyle = {
    margin: '24px 0px 24px 24px',
  };

  return (
    <>
      {isQuickstartEnabled && (
        <>
          <Button onClick={handleActivateQuickstart} variant={'primary'} style={btnStyle} isDisabled={openQuickstart}>
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
