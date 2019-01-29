import React from 'react';
import propTypes from 'prop-types';
import ItemDetails from '../Shared/DetailCommon';
import { Link } from 'react-router-dom';
import { GridItem, Button } from '@patternfly/react-core';
import { EditAltIcon, TrashIcon } from '@patternfly/react-icons';

const TO_DISPLAY = [ 'description', 'modified' ];
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

UserDetail.propTypes = {
  history: propTypes.object,
  imageUrl: propTypes.string,
  name: propTypes.string,
  id: propTypes.string
};

export default UserDetail;
