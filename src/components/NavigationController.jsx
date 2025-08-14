/**
 * NavigationController.jsx
 * ------------------------
 * Manages overlay states, confirmations, and start-over flow.
 * Extracts navigation concerns from App.js while preserving exact behavior.
 */

function NavigationController({ 
  appState, 
  dispatch, 
  APP_ACTIONS,
  handleDone,
  setCaptureMode 
}) {
  
  // "Start Over" Flow (preserves exact logic from App.js:182-202)
  const handleStartOverClick = () => {
    dispatch({ type: APP_ACTIONS.SET_SHOW_START_OVER_CONFIRM, payload: true });
  };

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

export default NavigationController;