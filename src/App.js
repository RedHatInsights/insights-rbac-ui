import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Routes } from './Routes';
import './App.scss';
import ApprovalTabs from './SmartComponents/Approval/ApprovalTabs';
import { Main, PageHeader, PageHeaderTitle } from '@red-hat-insights/insights-frontend-components';
import { NotificationsPortal } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import '@red-hat-insights/insights-frontend-components/components/Notifications.css';

class App extends Component {
  state = {
    chromeNavAvailable: true
  }

  componentDidMount () {
    insights.chrome.init();
    try {
      insights.chrome.identifyApp('approval');
    } catch (error) {
      this.setState({
        chromeNavAvailable: false
      });
    }
  }

  componentWillUnmount () {
    if (this.state.chromeNavAvailable) {
      this.appNav();
      this.buildNav();
    }
  }

  render () {
    return (
      <React.Fragment>
        <NotificationsPortal />
        <PageHeader style={ { margin: 0, padding: 0 } }>
          <PageHeaderTitle title={ 'Approval' }/>
        </PageHeader>
        <Main style={ { margin: 0, padding: 0 } }>
          <ApprovalTabs>
            <Routes childProps={ this.props } />
          </ApprovalTabs>
        </Main>
      </React.Fragment>
    );
  }
}

App.propTypes = {
  history: PropTypes.object
};

export default withRouter (connect()(App));
