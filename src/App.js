import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Routes } from './routes';
import Main from '@redhat-cloud-services/frontend-components/Main';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal/';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import { IntlProvider } from 'react-intl';
import ErroReducerCatcher from './presentational-components/shared/ErrorReducerCatcher';

import './App.scss';

class App extends Component {
  state = {
    chromeNavAvailable: true,
    userReady: false,
    isAdmin: undefined,
  };

  componentDidMount() {
    const { history } = this.props;
    insights.chrome.init();
    insights.chrome.registerModule('access-requests');
    !insights.chrome.getApp() && history.push('/my-user-access'); // redirect to MUA if url is "/settings"
    insights.chrome.auth.getUser().then(() => this.setState({ userReady: true }));
    insights.chrome.identifyApp(insights.chrome.getApp());
    this.unregister = insights.chrome.on('APP_NAVIGATION', (event) => {
      if (event.domEvent) {
        history.push(`/${event.navId}`);
      }
    });
  }

  componentWillUnmount() {
    this.unregister && this.unregister();
  }

  render() {
    const { userReady } = this.state;

    if (!userReady) {
      return <AppPlaceholder />;
    }

    return (
      <IntlProvider locale="en">
        <React.Fragment>
          <NotificationPortal />
          <ErroReducerCatcher>
            <Main style={{ marginLeft: 0, padding: 0 }}>
              <Routes />
            </Main>
          </ErroReducerCatcher>
        </React.Fragment>
      </IntlProvider>
    );
  }
}

App.propTypes = {
  history: PropTypes.object,
};

export default withRouter(connect()(App));
