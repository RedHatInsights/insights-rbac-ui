import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
import DeniedState from './presentational-components/states/DeniedState';

class App extends Component {
  state = {
    chromeNavAvailable: true,
    userReady: false,
    isAdmin: undefined
  }

  componentDidMount () {
    const { history } = this.props;
    insights.chrome.init();
    insights.chrome.auth.getUser().then((user) => this.setState({ userReady: true, isAdmin: user.identity.user.is_org_admin }));
    insights.chrome.identifyApp('rbac');
    this.unregister = insights.chrome.on('APP_NAVIGATION', (event) => {
      if (event.domEvent) {
        history.push(`/${event.navId}`);
      }
    });
  }

  componentWillUnmount() {
    this.unregister && this.unregister();
  }

  render () {
    const { userReady, isAdmin } = this.state;

    if (!userReady) {
      return <AppPlaceholder />;
    }

    if (!isAdmin) {
      return <DeniedState/>;
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
