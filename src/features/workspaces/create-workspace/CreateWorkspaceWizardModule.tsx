import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { createStandaloneQueryClient } from '../../../components/QueryClientSetup';
import messages from '../../../locales/data.json';
import CreateWorkspaceWizard, { CreateWorkspaceWizardProps } from './CreateWorkspaceWizard';

export const locale = 'en';

// Create a standalone query client for the module (no global error handling needed)
const moduleQueryClient = createStandaloneQueryClient();

const CreateWorkspaceWizardModule: React.FunctionComponent<CreateWorkspaceWizardProps> = ({ ...props }) => {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <QueryClientProvider client={moduleQueryClient}>
        <CreateWorkspaceWizard {...props} />
      </QueryClientProvider>
    </IntlProvider>
  );
};

export default CreateWorkspaceWizardModule;
