import React, { Component } from 'react';
import propTypes from 'prop-types';
import { Tabs, Tab } from '@patternfly/react-core';
import './approvaltabs.scss';

const tabItems = [{ eventKey: 0, title: 'Approvers', name: '/users' }, { eventKey: 1, title: 'Groups', name: '/groups' }];

class ApprovalTabs extends Component {
  state = {
    activeTabKey: 0
  };

  // Toggle currently active tab
  handleTabClick = (event, tabIndex) => {
    this.setState({
      activeTabKey: tabIndex
    });

    this.props.children.props.childProps.history.push(tabItems[tabIndex].name);
  };

  render() {
    return (
      <React.Fragment>
        <Tabs activeKey={ this.state.activeTabKey } onSelect={ this.handleTabClick }>
          { tabItems.map((item) => <Tab title={ item.title } key={ item.eventKey } eventKey={ item.eventKey } name={ item.name }/>) }
        </Tabs>
        { this.props.children }
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
