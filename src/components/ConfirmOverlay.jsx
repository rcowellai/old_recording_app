/**
 * ConfirmOverlay.jsx
 * ------------------
 * A simple modal overlay for confirming actions like
 * "Are you sure you want to start over?" or other
 * user confirmations. 
 */

import React from 'react';
import PropTypes from 'prop-types';

function ConfirmOverlay({ onYes, onNo }) {
  return (
    <div className="confirm-overlay">
      <div className="apple-style-dialog">
        <p className="confirm-text">Are you sure you want to start over?</p>
        <div className="confirm-actions">
          <button
            type="button"
            className="apple-style-btn confirm-yes"
            onClick={onYes}
          >
            Yes
          </button>
          <button
            type="button"
            className="apple-style-btn confirm-no"
            onClick={onNo}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

ConfirmOverlay.propTypes = {
  onYes: PropTypes.func.isRequired,
  onNo: PropTypes.func.isRequired
};

export default ConfirmOverlay;
