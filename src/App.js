import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Routes } from './routes';
import './App.scss';
import { Main } from '@redhat-cloud-services/frontend-components';
import { NotificationsPortal } from '@redhat-cloud-services/frontend-components-notifications/';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import { IntlProvider } from 'react-intl';

import '@redhat-cloud-services/frontend-components-notifications/index.css';
import './App.scss';

class App extends Component {
  state = {
    chromeNavAvailable: true,
    auth: false
  }

  componentDidMount () {
    insights.chrome.init();
    insights.chrome.auth.getUser().then(() => this.setState({ auth: true }));
    insights.chrome.identifyApp('rbac');
  }

  render () {
    const { auth } = this.state;
    if (!auth) {
      return <AppPlaceholder />;
    }

    return (
      <IntlProvider locale="en">
        <React.Fragment>
          <NotificationsPortal />
          <Main style={ { marginLeft: 0, padding: 0 } }>
            <Routes />
          </Main>
        </React.Fragment>
      </IntlProvider>
    );
  }
}

App.propTypes = {
  history: PropTypes.object
};

export default withRouter(connect()(App));
