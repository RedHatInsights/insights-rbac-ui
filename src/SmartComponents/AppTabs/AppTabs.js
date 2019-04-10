import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Tabs, Tab } from '@patternfly/react-core';
import './apptabs.scss';

const tabItems = [{ eventKey: 0, title: 'Principals', name: '/users' }, { eventKey: 1, title: 'Groups', name: '/groups' }];

const AppTabs = ({ children, history: { push }, location: { pathname }}) => {
  const activeTab = tabItems.find(({ name }) => pathname.includes(name));
  const handleTabClick = (_event, tabIndex) => push(tabItems[tabIndex].name);

  return (
    <Fragment>
      <div className="ins-tabs">
        <Tabs activeKey={ activeTab ? activeTab.eventKey : 0 } onSelect={ handleTabClick }>
          { tabItems.map((item) => <Tab title={ item.title } key={ item.eventKey } eventKey={ item.eventKey } name={ item.name }/>) }
        </Tabs>
      </div>
      { children }
    </Fragment>
  );
};

AppTabs.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  })
};

export default withRouter(AppTabs);
