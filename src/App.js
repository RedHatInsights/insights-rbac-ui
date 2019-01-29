import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Routes } from './Routes';
import './App.scss';
import ApprovalNav from './SmartComponents/Approval/ApprovalNav';
import { Main } from '@red-hat-insights/insights-frontend-components';
import { NotificationsPortal } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { Grid, GridItem } from '@patternfly/react-core';
import { MIN_SCREEN_HEIGHT } from './constants/ui-constants';
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
        <Main style={ { marginLeft: 0, padding: 0 } }>
          <Grid style={ { minHeight: MIN_SCREEN_HEIGHT } }>
            <GridItem style={ { backgroundColor: '#FFFFFF' } } sm={ 4 } md={ 4 } lg={ 2 } xl={ 2 }>
              <ApprovalNav />
            </GridItem >
            <GridItem sm={ 8 } md={ 8 } lg={ 10 } xl={ 10 }>
              <Routes childProps={ this.props } />
            </GridItem>
          </Grid>
        </Main>
      </React.Fragment>
    );
  }
}

App.propTypes = {
  history: PropTypes.object
};

export default withRouter (connect()(App));
