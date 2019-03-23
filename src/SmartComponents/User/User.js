import React, { Component } from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Stack,
  StackItem,
  DataListItem,
  DataListCell,
  DataListCheck,
  DataListToggle,
  DataListContent,
  DropdownItem,
  Dropdown,
  DropdownPosition,
  KebabToggle,
  Title,
  TextVariants,
  TextContent } from '@patternfly/react-core';

class User extends Component {
  state = {
    isKebabOpen: false
  };

  onKebabToggle = isOpen => {
    this.setState({
      isKebabOpen: isOpen
    });
  };

  onKebabSelect = () => {
    this.setState({ isKebabOpen: !this.state.isKebabOpen });
  };

  buildUserActionKebab = (user) => {
    return (
      <Dropdown
        position={ DropdownPosition.right }
        onSelect={ this.onKebabSelect }
        toggle={ <KebabToggle onToggle={ this.onKebabToggle }/> }
        isOpen = { this.state.isKebabOpen }
        dropdownItems={ [
          <DropdownItem aria-label="Edit User" key="edit-user">
            <Link to={ `/users/edit/${user.id}` }>
              Edit
            </Link>
          </DropdownItem>,
          <DropdownItem component="link" aria-label="Remove User" key="remove-user">
            <Link to={ `/users/remove/${user.id}` }>
              Delete
            </Link>
          </DropdownItem>
        ] }
        isPlain
      />
    );
  };

  fetchGroupListForUser = (user) => {
    if (!user.groups) {
      return '';
    }

    return user.groups.map(group => group.name).join(', ');
  };

  render() {
    let { item } = this.props;

    return (
      <DataListItem key={ `user-${item.id}` }
        aria-labelledby={ `check-user-${item.id}` }
        isExpanded={ this.props.isExpanded(`user-${item.id}`) }>
        <DataListToggle
          onClick={ () => this.props.toggleExpand(`user-${item.id}`) }
          isExpanded={ this.props.isExpanded(`user-${item.id}`) }
          id={ `user-${item.id}` }
          aria-labelledby={ `user-${item.id} user-${item.id}` }
          aria-label="Toggle details for"
        />
        <DataListCheck aria-labelledby={ `check-user-${item.id}` } name={ `check-user-${item.id}` }/>
        <DataListCell>
          <StackItem>
            <span id={ item.id }>{ `${item.username}` } </span>
          </StackItem>
          <StackItem>
            <span id={ item.email }>{ `${item.email}` } </span>
          </StackItem>
        </DataListCell>
        <DataListCell>
          { this.fetchGroupListForUser(item) }
        </DataListCell>
        <DataListContent aria-label="User Content Details"
          isHidden={ !this.props.isExpanded(`user-${item.id}`) }>
          <Stack gutter="md">
            <StackItem>
              <Title size="md">Groups</Title>
            </StackItem>
            <StackItem>
              <TextContent component={ TextVariants.h6 }>
                { this.fetchGroupListForUser(item) }
              </TextContent>
            </StackItem>
          </Stack>
        </DataListContent>
      </DataListItem>
    );
  };
}

User.propTypes = {
  isLoading: propTypes.bool,
  item: propTypes.object,
  isExpanded: propTypes.func.isRequired,
  toggleExpand: propTypes.func.isRequired,
  noItems: propTypes.string
};

export default User;
