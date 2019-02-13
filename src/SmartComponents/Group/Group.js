import React, { Component } from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Section } from '@red-hat-insights/insights-frontend-components';
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

class Group extends Component {
  state = {
    isKebabOpen: false
  };

  onKebabToggle = isOpen => {
    this.setState({
      isKebabOpen: isOpen
    });
  };

  onKebabSelect = (event) => {
    this.setState({ isKebabOpen: !this.state.isKebabOpen });
  };

  buildGroupActionKebab = (group) => {
    return (
      <Dropdown
        position={ DropdownPosition.right }
        onSelect={ this.onKebabSelect }
        toggle={ <KebabToggle onToggle={ this.onKebabToggle }/> }
        isOpen = { this.state.isKebabOpen}
        dropdownItems={ [
          <DropdownItem aria-label="Edit Group" key="edit-group">
            <Link to={ `/groups/edit/${group.id}` }>
              Edit
            </Link>
          </DropdownItem>,
          <DropdownItem component="link" aria-label="Remove Group" key="remove-group">
            <Link to={ `/groups/remove/${group.id}` }>
              Delete
            </Link>
          </DropdownItem>
        ] }
        isPlain
      />
    );
  };

  fetchUserListForGroup = (group) => {
    if (!group.members) {
      return '';
    }
    return group.members.map(user => `${user.first_name} ${user.last_name}`).join(', ');
  };

  render() {
    let { item } = this.props;

    return (
      <DataListItem key={ `group-${item.id}` }
        aria-labelledby={ `check-group-${item.id}` }
        isExpanded={ this.props.isExpanded(`group-${item.id}`) }>
        <DataListToggle
          onClick={ () => this.props.toggleExpand(`group-${item.id}`) }
          isExpanded={ this.props.isExpanded(`group-${item.id}`) }
          id={ `group-${item.id}` }
          aria-labelledby={ `group-${item.id} group-${item.id}` }
          aria-label="Toggle details for"
        />
        <DataListCheck aria-labelledby={ `check-group-${item.id}` } name={ `check-group-${item.id}` }/>
        <DataListCell>
          <span id={ item.id }>{ item.name } </span>
        </DataListCell>
        <DataListCell>
          { this.fetchUserListForGroup(item) }
        </DataListCell>
        <DataListCell
          class="pf-c-data-list__action"
          aria-labelledby={ `group-${item.id} check-group-action${item.id}` }
          id={ `group-${item.id}` }
          aria-label="Actions">
          { this.buildGroupActionKebab(item) }
        </DataListCell>
        <DataListContent aria-label="Group Content Details"
          isHidden={ !this.props.isExpanded(`group-${item.id}`) }>
          <Stack gutter="md">
            <StackItem>
              <Title size="md">Description</Title>
            </StackItem>
            <StackItem>
              <TextContent component={ TextVariants.h6 }>Placeholder for Group Description</TextContent>
            </StackItem>
            <StackItem>
            </StackItem>
            <StackItem>
              <Title size="md">Members</Title>
            </StackItem>
            <StackItem>
              <TextContent component={ TextVariants.h6 }>
                { this.fetchUserListForGroup(item) }
              </TextContent>
            </StackItem>
          </Stack>
        </DataListContent>
      </DataListItem>
    );
  };
}

Group.propTypes = {
  isLoading: propTypes.bool,
  item: propTypes.object,
  isExpanded: propTypes.func.isRequired,
  toggleExpand: propTypes.func.isRequired,
  noItems: propTypes.string
};

export default Group;
