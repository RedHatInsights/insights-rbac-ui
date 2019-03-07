import React from 'react';

export const callReducer = reducer => (state, action) => {
  if (!reducer[action.type]) {
    return;
  }

  return reducer[action.type](state, action);
};
