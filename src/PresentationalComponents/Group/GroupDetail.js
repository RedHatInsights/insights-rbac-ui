import React from 'react';
import propTypes from 'prop-types';
import ItemDetails from '../Shared/DetailCommon';
import { Link } from 'react-router-dom';
import { GridItem, Button } from '@patternfly/react-core';
import { EditAltIcon, TrashIcon } from '@patternfly/react-icons';

const TO_DISPLAY = [ 'description', 'modified' ];
const ICON_FILL = 'white';

const createToolbarActions = (groupName, groupId) => [
  <Link key="edit-group-action" to={ `/groups/edit/${groupId}` }>
    <Button
      variant="plain"
      aria-label={ `edit-group-${groupName}` }
      onClick={ () => console.log('Edit group api helper not available.') }
    >
      <EditAltIcon fill={ ICON_FILL } />
    </Button>
  </Link>,
  <Link key="remove-group-action" to={ `/groups/remove/${groupId}` }>
    <Button
      key="remove-group-action"
      variant="plain"
      aria-label={ `remove-group-${groupName}` }
      onClick={ () => console.log('Remove group api helper not available.') }
    >
      <TrashIcon fill={ ICON_FILL } />
    </Button>
  </Link>
];

const GroupDetail = ({ imageUrl, name, id, ...props }) => (
  <GridItem sm={ 6 } md={ 4 } lg={ 4 } xl={ 3 }>
    <Link className="card-link" to={ `/group/${id}` }>
      <div
        groupName={ name }
        headerActions={ createToolbarActions(name, id) }
      />
      <ItemDetails { ...{ name, imageUrl, ...props } } toDisplay={ TO_DISPLAY } />
    </Link>
  </GridItem>
);

GroupDetail.propTypes = {
  history: propTypes.object,
  imageUrl: propTypes.string,
  name: propTypes.string,
  id: propTypes.string
};

export default GroupDetail;
