import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import './groupitem.scss';
import propTypes from 'prop-types';
import CatItemSvg from '../../assets/images/vendor-openshift.svg';
import ImageWithDefault from '../../PresentationalComponents/Shared/ImageWithDefault';
import ItemDetails from '../../PresentationalComponents/Shared/CardCommon';
import { hideModal, showModal } from '../../redux/Actions/MainModalActions';
import { GridItem, Card, CardHeader, CardBody, CardFooter } from '@patternfly/react-core';
import CardCheckbox from '../../SmartComponents/Common/CardCheckbox';

const TO_DISPLAY = [ 'description' ];

const mapDispatchToProps = dispatch => bindActionCreators({
  hideModal,
  showModal
}, dispatch);

class GroupItem extends Component {
  handleOnClick = () => {
    this.setState({ showOrder: true });
    this.props.showModal({
      modalProps: {
        open: true,
        servicedata: this.props,
        closeModal: this.props.hideModal
      },
      modalType: 'order'
    });
  };

  render() {
    return (
      <GridItem sm={ 6 } md={ 4 } lg={ 4 } xl={ 3 }>
        <Card>
          <div onClick={ () => this.handleOnClick(this.props) }>
            <CardHeader className="card_header">
              { this.props.isSelectable && <CardCheckbox
                handleCheck={ () => { this.props.onSelect(this.props.id); } }
                isChecked={ this.props.isSelected }
                id={ this.props.id } />
              }
              <ImageWithDefault src={ this.props.imageUrl || CatItemSvg } width="30" height="20" />
            </CardHeader>
            <CardBody className="card_body">
              <h4>{ this.props.name }</h4>
              <ItemDetails { ...this.props } toDisplay={ TO_DISPLAY } />
            </CardBody>
            <CardFooter>
            </CardFooter>
          </div>
        </Card>
      </GridItem>
    );
  };
}

GroupItem.propTypes = {
  history: propTypes.object,
  showModal: propTypes.func,
  hideModal: propTypes.func,
  imageUrl: propTypes.string,
  name: propTypes.string,
  id: propTypes.string,
  isSelectable: propTypes.bool,
  isSelected: propTypes.bool,
  onSelect: propTypes.func
};

export default connect(null, mapDispatchToProps)(GroupItem);
