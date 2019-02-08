import React, { Component } from 'react';
import propTypes from 'prop-types';
import { PageHeader, PageHeaderTitle, Section } from '@red-hat-insights/insights-frontend-components';
import {
  Bullseye,
  Stack,
  StackItem,
  DataList,
  DataListItem,
  DataListCell,
  DataListCheck,
  DataListAction,
  DataListToggle,
  DataListContent,
  Title,
  Text,
  TextVariants,
  TextContent } from '@patternfly/react-core';

class GroupList extends Component {

  state= {
    expanded: []
  };

  toggle = id => {
    const expanded = this.state.expanded;
    const index = expanded.indexOf(id);
    const newExpanded =
        index >= 0 ? [ ...expanded.slice(0, index), ...expanded.slice(index + 1, expanded.length) ] : [ ...expanded, id ];
    this.setState(() => ({ expanded: newExpanded }));
  };

  fetchUserListForGroup = (group) => {
    if (!group.members) {
      return '';
    }

    return group.members.map(user => `${user.first_name} ${user.last_name}`).join(', ');
  };

  render() {
    if (this.props.isLoading) {
      return (
        <PageHeader>
          <PageHeaderTitle title={ this.props.noItems }/>
        </PageHeader>
      );
    }

    // <GroupDetail isExpanded={ expandedList.includes(item.name) } toggle={ toggle }/>) }
    return (
      <React.Fragment>
        <Bullseye>
          <div>
            { this.props.isLoading && (<span color={ '#00b9e4' }> Loading...</span>) }
          </div>
        </Bullseye>
        <Section type='content'>
          { (this.props.items && this.props.items.length > 0) && (
            <DataList aria-label="Expandable data list">
              { this.props.items.map((item) => {
                return (
                  <DataListItem key={ `toggle-${item.id}` }
                    aria-labelledby={ `check-group-${item.id}` }
                    isExpanded={ this.state.expanded.includes(`toggle-${item.id}`) }>
                    <DataListToggle
                      onClick={ () => this.toggle(`toggle-${item.id}`) }
                      isExpanded={ this.state.expanded.includes(`toggle-${item.id}`) }
                      id={ `toggle-${item.id}` }
                      aria-labelledby={ `toggle-${item.id} group-${item.id}` }
                      aria-label="Toggle details for"
                    />
                    <DataListCheck aria-labelledby={ `check-group-${item.id}` } name={ `check-group-${item.id}` }/>
                    <DataListCell>
                      <span id={ item.id }>{ item.name } </span>
                    </DataListCell>
                    <DataListCell>
                      { this.fetchUserListForGroup(item) }
                    </DataListCell>
                    <DataListAction
                      aria-labelledby={ `check-group-${item.id} check-action-action${item.id}` }
                      id={ `check-action-action${item.id}` }
                      aria-label="Actions"
                    />
                    <DataListContent aria-label="Group Content Details"
                      isHidden={ !this.state.expanded.includes(`toggle-${item.id}`) }>
                      <p>
                        <Stack gutter="md">
                          <StackItem>
                            <Title size="md">Description</Title>
                          </StackItem>
                          <StackItem>
                            <Text>
                              <TextContent component={ TextVariants.h6 }>Placeholder for Group Description</TextContent>
                            </Text>
                          </StackItem>
                          <StackItem>
                          </StackItem>
                          <StackItem>
                            <Title size="md">Members</Title>
                          </StackItem>
                          <StackItem>
                            <Text>
                              <TextContent component={ TextVariants.h6 }>
                                { this.fetchUserListForGroup(item) }
                              </TextContent>
                            </Text>
                          </StackItem>
                        </Stack>
                      </p>
                    </DataListContent>
                  </DataListItem>);
              }
              )
              }
            </DataList>)
          }
        </Section>
      </React.Fragment>
    );
  };
}

GroupList.propTypes = {
  isLoading: propTypes.bool,
  items: propTypes.array,
  noItems: propTypes.string
};

export default GroupList;
