/**
 * navigationHandlers.js
 * ----------------------
 * Utility functions for handling navigation and overlay states.
 * Moved from components/NavigationController.jsx for better architecture.
 * Updated to use modern modal system.
 */

import NiceModal from '@ebay/nice-modal-react';
import FixedConfirmModal from '../components/modals/FixedConfirmModal';

/**
 * Creates navigation handler functions
 * @param {Object} params - Navigation parameters
 * @returns {Object} Object containing navigation handlers
 */
export function createNavigationHandlers({ 
  appState, 
  dispatch, 
  APP_ACTIONS,
  handleDone,
  setCaptureMode 
}) {
  
  // "Start Over" Flow - Now using debug modal system for troubleshooting
  const handleStartOverClick = async () => {
    console.log('🚀 Start Over button clicked');
    try {
      console.log('📱 Showing modal...');
      const confirmed = await NiceModal.show(FixedConfirmModal, {
        title: "Start Over?",
        message: "Are you sure you want to start over? This will discard your current recording.",
        confirmText: "Yes, Start Over",
        cancelText: "Cancel",
        variant: "warning"
      });
      
      console.log('✨ Modal resolved with:', confirmed);
      
      if (confirmed) {
        // Execute the same logic as handleStartOverYes
        handleDone();
        dispatch({ type: APP_ACTIONS.SET_SUBMIT_STAGE, payload: false });
        dispatch({ type: APP_ACTIONS.SET_SHOW_CONFETTI, payload: false });
        dispatch({ type: APP_ACTIONS.SET_DOC_ID, payload: null });
        dispatch({ type: APP_ACTIONS.SET_UPLOAD_IN_PROGRESS, payload: false });
        dispatch({ type: APP_ACTIONS.SET_UPLOAD_FRACTION, payload: 0 });
        
        // Reset captureMode so user sees Audio/Video choice
        setCaptureMode(null);
      }
    } catch (error) {
      console.warn('Modal was cancelled or errored:', error);
    }
  };

  // Keep legacy handlers for backward compatibility during transition
  const handleStartOverYes = () => {
    // 1) Stop recording & close overlays
    handleDone();
    dispatch({ type: APP_ACTIONS.SET_SHOW_START_OVER_CONFIRM, payload: false });
    dispatch({ type: APP_ACTIONS.SET_SUBMIT_STAGE, payload: false });
    dispatch({ type: APP_ACTIONS.SET_SHOW_CONFETTI, payload: false });
    dispatch({ type: APP_ACTIONS.SET_DOC_ID, payload: null });
    dispatch({ type: APP_ACTIONS.SET_UPLOAD_IN_PROGRESS, payload: false });
    dispatch({ type: APP_ACTIONS.SET_UPLOAD_FRACTION, payload: 0 });

    // 2) Reset captureMode so user sees Audio/Video choice
    setCaptureMode(null);
  };

  const handleStartOverNo = () => {
    dispatch({ type: APP_ACTIONS.SET_SHOW_START_OVER_CONFIRM, payload: false });
  };

  // "Done" => Move to Submit Stage (preserves exact logic from App.js:89-92)
  const handleDoneAndSubmitStage = () => {
    handleDone();
    dispatch({ type: APP_ACTIONS.SET_SUBMIT_STAGE, payload: true });
  };

  return {
    handleStartOverClick,
    handleStartOverYes, 
    handleStartOverNo,
    handleDoneAndSubmitStage
  };
}