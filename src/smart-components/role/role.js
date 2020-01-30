import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { shallowEqual, useSelector } from 'react-redux';

const Role = () => {
  const history = useHistory();
  const params = useParams();
  const role = useSelector(state => state.roleReducer.selectedRole, shallowEqual);
  console.log(role);
  return <div>Role</div>;
};

Role.propTypes = {
  role: PropTypes.shape({
    uuid: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string
  })
};
Role.defaultPropTypes = {};

const mapStateToProps = () => ({});
const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Role);
