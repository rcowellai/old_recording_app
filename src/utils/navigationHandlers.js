/**
 * navigationHandlers.js
 * ----------------------
 * Utility functions for handling navigation and overlay states.
 * Moved from components/NavigationController.jsx for better architecture.
 * Updated to use modern modal system.
 */

// Modal imports removed - now using Radix Dialog directly in App.js

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
  setCaptureMode,
  setShowStartOverDialog
}) {
  
  // "Start Over" Flow - Now using Radix Dialog
  const handleStartOverClick = () => {
    console.log('🚀 Start Over button clicked');
    console.log('📱 Showing Radix dialog...');
    setShowStartOverDialog(true);
  };

  // Handle the actual start over confirmation
  const handleStartOverConfirm = () => {
    console.log('✨ Start over confirmed');
    
    // Execute the same reset logic as before
    handleDone();
    dispatch({ type: APP_ACTIONS.SET_SUBMIT_STAGE, payload: false });
    dispatch({ type: APP_ACTIONS.SET_SHOW_CONFETTI, payload: false });
    dispatch({ type: APP_ACTIONS.SET_DOC_ID, payload: null });
    dispatch({ type: APP_ACTIONS.SET_UPLOAD_IN_PROGRESS, payload: false });
    dispatch({ type: APP_ACTIONS.SET_UPLOAD_FRACTION, payload: 0 });
    
    // Reset captureMode so user sees Audio/Video choice
    setCaptureMode(null);
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
    handleStartOverConfirm,
    handleStartOverYes, 
    handleStartOverNo,
    handleDoneAndSubmitStage
  };
}