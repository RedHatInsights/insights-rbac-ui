import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Routes } from './routes';
import './App.scss';
import AppTabs from './smart-components/app-tabs/app-tabs';
import { Main, PageHeader } from '@redhat-cloud-services/frontend-components';
import { Title } from '@patternfly/react-core';
import { NotificationsPortal } from '@redhat-cloud-services/frontend-components-notifications/';
import '@redhat-cloud-services/frontend-components-notifications/index.css';
import { AppPlaceholder } from './presentational-components/shared/loader-place-holders';

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
      <React.Fragment>
        <NotificationsPortal />
        <PageHeader style={ { paddingBottom: 0 } }>
          <Title size="3xl">
            Role Based Access Control
          </Title>
          <AppTabs />
        </PageHeader>
        <Main>
          <Routes childProps={ this.props } />
        </Main>
      </React.Fragment>
    );
  }
}

App.propTypes = {
  history: PropTypes.object
};

export default withRouter(connect()(App));
