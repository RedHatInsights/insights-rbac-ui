import React from 'react';
import propTypes from 'prop-types';

const ImageWithDefault = ({ src, ...props }) => <img src={ src } { ...props } />;

ImageWithDefault.propTypes = {
  src: propTypes.string.isRequired
};

export default ImageWithDefault;
