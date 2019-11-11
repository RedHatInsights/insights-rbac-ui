import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
import { fetchGroup } from '../../redux/actions/group-actions';
import { connect } from 'react-redux';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components';

const ExpandableDescription = ({ members, fetchGroup, uuid, loaded }) => {
  useEffect(() => {
    fetchGroup(uuid);
  }, []);

  return (
    <Fragment>
      <TextContent>
        <Text className="groups-table-detail heading" component={ TextVariants.small }>Members</Text>
        {
          loaded ?
            <Text className="groups-table-detail content" component={ TextVariants.h5 }>
              {
                members.length === 0 ? 'No members' :
                  members.map(({ first_name, last_name }) => `${first_name} ${last_name}`)
              }
            </Text> :
            <div>
              <Skeleton size={ SkeletonSize.sm } />
            </div>
        }
      </TextContent>
    </Fragment>
  );};

ExpandableDescription.propTypes = {
  description: PropTypes.string,
  uuid: PropTypes.string,
  members: PropTypes.arrayOf(PropTypes.shape({
    first_name: PropTypes.string,
    last_name: PropTypes.string
  })),
  loaded: PropTypes.bool,
  fetchGroup: PropTypes.func
};

ExpandableDescription.defaultProps = {
  members: [],
  loaded: false,
  fetchGroup: () => undefined
};

const mapStateToProps = ({ groupReducer: { groups }}, { uuid }) => {
  const activeGroup = groups.data.find((group) => group.uuid === uuid) || {};
  return ({
    members: activeGroup.principals,
    description: activeGroup.description,
    loaded: activeGroup.loaded
  });
};

const mapDispatchToProps = (dispatch) => ({
  fetchGroup: (uuid) => dispatch(fetchGroup(uuid))
});

export default connect(mapStateToProps, mapDispatchToProps)(ExpandableDescription);

