import React from 'react';
import propTypes from 'prop-types';
import ItemDetails from '../Shared/DetailCommon';
import { Link } from 'react-router-dom';
import { GridItem, Button } from '@patternfly/react-core';
import { EditAltIcon, TrashIcon } from '@patternfly/react-icons';
import {
  GridItem,
  Button,
  DataList,
  DataListItem,
  DataListCell,
  DataListToggle,
  DataListContent,
  DataListCheck,
  DataListAction
} from '@patternfly/react-core';

const ICON_FILL = 'white';

const createToolbarActions = (userName, userId) => [
  <Link key="edit-user-action" to={ `/users/edit/${userId}` }>
    <Button
      variant="plain"
      aria-label={ `edit-user-${userName}` }
      onClick={ () => console.log('Edit user api helper not available.') }
    >
      <EditAltIcon fill={ ICON_FILL } />
    </Button>
  </Link>,
  <Link key="remove-user-action" to={ `/users/remove/${userId}` }>
    <Button
      key="remove-user-action"
      variant="plain"
      aria-label={ `remove-user-${userName}` }
      onClick={ () => console.log('Remove user api helper not available.') }
    >
      <TrashIcon fill={ ICON_FILL } />
    </Button>
  </Link>
];

const UserDetail = ({ imageUrl, name, id, ...props }) => (
  <GridItem sm={ 6 } md={ 4 } lg={ 4 } xl={ 3 }>
    <Link className="card-link" to={ `/user/${id}` }>
      <div
        userName={ name }
        headerActions={ createToolbarActions(name, id) }
      />
      <ItemDetails { ...{ name, imageUrl, ...props } } toDisplay={ TO_DISPLAY } />
    </Link>
  </GridItem>
);

  const dataRow = () => {
    return (
    <DataList aria-label="Expandable data list example">
      <DataListItem aria-labelledby="ex-item1" isExpanded={expanded.includes('detail-toggle')}>
        <DataListToggle
          onClick={() => toggle('detail-toggle')}
          isExpanded={this.state.expanded.includes('detail-toggle')}
          id="detail-toggle"
          aria-labelledby="detail-toggle ex-item1"
          aria-label="Toggle details for"
        />
        <DataListCheck aria-labelledby="ex-item1" name="ex-check1" />
        <DataListCell>
          <div id="ex-item1">Primary content</div>
          <a href="#">link</a>
        </DataListCell>
        <DataListCell>
          <span>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>
        </DataListCell>
        <DataListAction aria-labelledby="ex-item1 ex-action1" id="ex-action1" aria-label="Actions" />
        <DataListContent aria-label="Primary Content Details" isHidden={!this.state.expanded.includes('detail-toggle')}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua.
          </p>
        </DataListContent>
      </DataListItem>
    </DataList>
  }
}

UserDetail.propTypes = {
  history: propTypes.object,
  imageUrl: propTypes.string,
  name: propTypes.string,
  id: propTypes.string
};

export default UserDetail;
