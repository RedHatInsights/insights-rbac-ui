import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import pathnames from './pathnames';
import monitorSampleAppQuickStart from './sampleQuickstart';
import { QuickStartContext } from '@patternfly/quickstarts';
import { useIntl } from 'react-intl';
import messages from '../Messages';

const QuickstartsTestButtons: React.FC = () => {
  const intl = useIntl();
  const [openQuickstart, setOpenQuickstart] = useState<boolean>(false);
  const chromeHook = useChrome();
  const navigate = useNavigate();
  const quickstartsContext = React.useContext(QuickStartContext);
  const { quickStarts } = chromeHook;
  const [isQuickstartEnabled, setIsQuickstartEnabled] = useState<boolean>(false);

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
  }, [quickStarts]);

  useEffect(() => {
    setOpenQuickstart(quickstartsContext.activeQuickStartID === '' ? false : true);
  }, [quickstartsContext]);

  const handleActivateQuickstart = () => {
    if (openQuickstart && !!quickstartsContext.activeQuickStartID) {
      quickStarts.toggle(quickstartsContext.activeQuickStartID);
    } else {
      quickStarts.toggle('monitor-sampleapp');
    }
    setOpenQuickstart(!openQuickstart);
  };

  const handleOpenCatalog = () => {
    navigate(pathnames['quickstarts-test'].link);
  };

  const btnStyle: React.CSSProperties = {
    margin: '24px 0px 24px 24px',
  };

  return (
    <>
      {isQuickstartEnabled && (
        <>
          <Button onClick={handleActivateQuickstart} variant="primary" style={btnStyle} isDisabled={openQuickstart}>
            {intl.formatMessage(messages.triggerMyQuickstart)}
          </Button>
          <Button onClick={handleOpenCatalog} variant="primary" style={btnStyle}>
            {intl.formatMessage(messages.triggerMyCatalog)}
          </Button>
        </>
      )}
    </>
  );
};

export default QuickstartsTestButtons;
