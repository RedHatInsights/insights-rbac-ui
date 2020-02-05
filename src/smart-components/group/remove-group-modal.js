import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Grid, GridItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { fetchGroup, removeGroup } from '../../redux/actions/group-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';

const RemoveGroupModal = ({
  history: { goBack, push },
  match: { params: { id }},
  removeGroup,
  group,
  isLoading,
  fetchGroup,
  postMethod,
  closeUrl
}) => {
  useEffect(() => {
    fetchGroup(id);
  }, []);

  const onSubmit = () =>
    postMethod ? removeGroup(id).then(() => postMethod([ id ])).then(push(closeUrl)) :
      removeGroup(id).then(() => push(closeUrl));

  const onCancel = () => goBack();

  return (
    <Modal
      isOpen
      isSmall
      title = { '' }
      onClose={ onCancel }
      actions={ [
        <Button key="cancel" variant="secondary" type="button" onClick={ onCancel }>
          Cancel
        </Button>,
        <Button key="submit" isDisabled={ isLoading  }  variant="primary" type="button" onClick={ onSubmit }>
          Confirm
        </Button>
      ] }
    >
      <Grid gutter="sm">
        <GridItem span={ 5 }>
          <TextContent>
            <Text component={ TextVariants.h1 }>
                Removing Group:
            </Text>
          </TextContent>
        </GridItem>
        <GridItem span={ 6 }>
          <TextContent>
            { !isLoading && <Text component={ TextVariants.h1 }>
              { group.name }
            </Text> }
          </TextContent>
          { isLoading && <FormItemLoader/> }
        </GridItem>
      </Grid>
    </Modal>
  );
};

RemoveGroupModal.defaultProps = {
  group: {},
  isLoading: true,
  closeUrl: '/groups'
};

RemoveGroupModal.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string
    }).isRequired
  }).isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  removeGroup: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  isLoading: PropTypes.bool,
  group: PropTypes.object,
  closeUrl: PropTypes.string
};

const mapStateToProps = ({ groupReducer: { selectedGroup }}) => ({
  group: selectedGroup,
  isLoading: !selectedGroup.loaded
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchGroup,
  removeGroup
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemoveGroupModal));
