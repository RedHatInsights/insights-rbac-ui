import React from 'react';
import { Provider } from 'react-redux';
import { RegistryContext, getRegistry } from '../../../utilities/store';
import { IntlProvider } from 'react-intl';
import messages from '../../../locales/data.json';
import CreateWorkspaceWizard, { CreateWorkspaceWizardProps } from './CreateWorkspaceWizard';

export const locale = 'en';

const CreateWorkspaceWizardModule: React.FunctionComponent<CreateWorkspaceWizardProps> = ({ ...props }) => {
  // Always get the current registry instance (supports resetRegistry() in Storybook)
  const registry = getRegistry();

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <RegistryContext.Provider
        value={{
          getRegistry,
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
