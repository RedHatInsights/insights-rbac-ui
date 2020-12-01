import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './utilities/store';
import App from './App';
import { getBaseName } from '@redhat-cloud-services/frontend-components-utilities/files/helpers';

const InsightsRbac = () => (
  <Provider store={store}>
    <Router basename={getBaseName(location.pathname)}>
      <App />
    </Router>
  </Provider>
);

export default InsightsRbac;
