import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './Utilities/store';
import App from './App';

/**
 * Hooks up redux to app.
 *  https://redux.js.org/advanced/usage-with-react-router
 */
ReactDOM.render(
  <Provider store={ store }>
    <Router basename='/insights/platform/approval'>
      <App />
    </Router>
  </Provider>,
  document.getElementById('root')
);
