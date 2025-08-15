import React from 'react';
import { Provider } from 'react-redux';
import registry, { RegistryContext } from '../../../utilities/store';
import { IntlProvider } from 'react-intl';
import messages from '../../../locales/data.json';
import CreateWorkspaceWizard, { CreateWorkspaceWizardProps } from './CreateWorkspaceWizard';

export const locale = 'en';

const CreateWorkspaceWizardModule: React.FunctionComponent<CreateWorkspaceWizardProps> = ({ ...props }) => {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <RegistryContext.Provider
        value={{
          getRegistry: () => registry,
        }}
      >
        <Provider store={registry.getStore()}>
          <CreateWorkspaceWizard {...props} />
        </Provider>
      </RegistryContext.Provider>
    </IntlProvider>
  );
};

export default CreateWorkspaceWizardModule;
