import React, { Component } from 'react';
import propTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { fetchUsers } from '../../redux/Actions/UserActions';
import { fetchGroups } from '../../redux/Actions/GroupActions';
import './ApprovalNav.scss';
import { NavLoader } from '../../PresentationalComponents/Shared/LoaderPlaceholders';

class ApprovalNav extends Component {

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
  // TODO - only call if the user is an admin
    this.props.fetchPortfolios();
    this.props.fetchPlatforms();
  }

  platformNavItems = () => this.props.platforms.map(item => (
    <NavItem key={ item.id } id={ item.id } groupId="platforms">
      <NavLink to={ `${PLATFORM_URL_BASE}/${item.id}` }>
        { item.name }
      </NavLink>
    </NavItem>
  ))

  portfolioNavItems = () => this.props.portfolios.map(item => (
    <NavItem key={ item.id } id={ item.id }>
      <NavLink to={ `${PORTFOLIO_URL_BASE}/${item.id}` }>
        { item.name }
      </NavLink>
    </NavItem>
  ));

  renderPlatformNav = () => this.props.isPlatformDataLoading && this.props.platforms.length === 0
    ? <NavLoader items={ 3 } />
    : this.platformNavItems()

  renderPortfolioNav = () => this.props.isLoading && this.props.portfolios.length === 0
    ? <NavLoader items={ 5 } />
    : this.portfolioNavItems()

  render() {
    return (
      <Nav aria-label="Approval" className="approval-nav">
        <NavGroup title="Platforms">
          <NavItem key='all' id="all-platforms">
            <NavLink exact to={ PLATFORMS_URL_BASE }>
            All Platforms
            </NavLink>
          </NavItem>
          { this.renderPlatformNav() }
        </NavGroup>
        <NavGroup title="Portfolios">
          <NavItem key='all' id="all-portfolios">
            <NavLink exact to={ PORTFOLIOS_URL_BASE }>
              All Portfolios
            </NavLink>
          </NavItem>
          { this.renderPortfolioNav() }
        </NavGroup>
      </Nav>
    );
  }
}

const mapStateToProps = ({
  platformReducer: { platforms, isPlatformDataLoading },
  portfolioReducer: { isLoading, portfolios }
}) => ({
  isPlatformDataLoading,
  platforms,
  isLoading,
  portfolios
});

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchPlatforms,
  fetchPortfolios
}, dispatch);

ApprovalNav.propTypes = {
  portfolios: propTypes.array,
  platforms: propTypes.array,
  isPlatformDataLoading: propTypes.bool,
  fetchPortfolios: propTypes.func,
  fetchPlatforms: propTypes.func,
  isLoading: propTypes.bool
};

ApprovalNav.defaultProps = {
  platforms: []
};

export default connect(mapStateToProps, mapDispatchToProps)(ApprovalNav);
