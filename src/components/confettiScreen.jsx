/**
 * confettiScreen.jsx
 * ------------------
 * A celebration screen that displays confetti and 
 * provides a link to view the uploaded recording.
 * Shows after successful upload.
 */

import React from 'react';
import Confetti from 'react-confetti';

function ConfettiScreen({ docId }) {
  return (
    <div className="confetti-container">
      <Confetti />
      
      <div className="confetti-content">
        <div className="confetti-card">
          <div className="confetti-header">
            <div className="confetti-title">🎉 Recording Uploaded!</div>
          </div>
          
          <div className="confetti-body">
            <p className="confetti-message">
              Your memory has been successfully recorded and saved.
            </p>
            
            <div className="confetti-actions">
              <a 
                href={`/view/${docId}`}
                className="btn-view-recording"
              >
                View Recording
              </a>
              
              <button 
                className="btn-new-recording"
                onClick={() => window.location.href = '/'}
              >
                Record Another Memory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfettiScreen;