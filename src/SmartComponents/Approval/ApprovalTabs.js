import { TabLayout } from '@red-hat-insights/insights-frontend-components';
import propTypes from 'prop-types';
import React, { Component } from 'react';
import './approvaltabs.scss';

class ApprovalTabs extends Component {

  redirectTab = (event, tab) => {
    this.props.children.props.childProps.history.push(tab.name);
  }

  render() {
    return (
      <React.Fragment>
        <TabLayout
          items={ [{ title: 'Approvers', name: '/users' }, { title: 'Groups', name: '/groups' }] }
          onTabClick={ this.redirectTab }
          active={ this.props.children.props.childProps.location.pathname }
        >
          { this.props.children }
        </TabLayout>
      </React.Fragment>
    );
  }
}

ApprovalTabs.propTypes = {
  children: propTypes.any,
  location: propTypes.object,
  history: propTypes.object
};

export default ApprovalTabs;
