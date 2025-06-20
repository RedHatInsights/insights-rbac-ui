import type { Preview } from '@storybook/react-webpack5';
import '@patternfly/react-core/dist/styles/base.css';
import React from 'react';
import { IntlProvider } from 'react-intl';
import messages from '../src/locales/data.json';
import { locale } from '../src/locales/locale';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    // 👇 Defining the decorator in the preview file applies it to all stories
    (Story, { parameters }) => {
      return (
        <IntlProvider locale={locale} messages={messages[locale]}>
          <Story />
        </IntlProvider>
      );
    },
  ],
};

export default preview;
