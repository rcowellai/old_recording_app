import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Components
import SessionValidator from './SessionValidator';
import RecordingModeSelector from './RecordingModeSelector';
import RecordingInterface from './RecordingInterface';
import CountdownOverlay from './CountdownOverlay';
import SubmitOverlay from './SubmitOverlay';
import ConfettiSuccess from './ConfettiSuccess';

// Services
import { getRecordingSession, recordAnalyticsEvent } from '../services/firebase';

// Recording App States
const APP_STATES = {
  LOADING: 'loading',
  SESSION_ERROR: 'session_error',
  MODE_SELECTION: 'mode_selection',
  RECORDING_READY: 'recording_ready',
  COUNTDOWN: 'countdown',
  RECORDING: 'recording',
  PAUSED: 'paused',
  REVIEW: 'review',
  UPLOADING: 'uploading',
  SUCCESS: 'success'
};

const RecordingApp = () => {
  const { sessionId } = useParams();
  
  // Core app state
  const [appState, setAppState] = useState(APP_STATES.LOADING);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  
  // Recording state
  const [recordingMode, setRecordingMode] = useState('video'); // 'audio' or 'video'
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // UI state
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize session on component mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        if (!sessionId) {
          setError({ 
            type: 'invalid_url', 
            message: 'Invalid recording URL. Please check your link.' 
          });
          setAppState(APP_STATES.SESSION_ERROR);
          return;
        }

        // Record analytics - session start
        await recordAnalyticsEvent(sessionId, 'session_start', {
          url: window.location.href,
          referrer: document.referrer
        });

        // Fetch session data
        const session = await getRecordingSession(sessionId);
        
        if (session.status !== 'active') {
          setError({
            type: session.status,
            message: session.message
          });
          setAppState(APP_STATES.SESSION_ERROR);
          return;
        }

        setSessionData(session);
        setAppState(APP_STATES.MODE_SELECTION);

      } catch (error) {
        console.error('Failed to load session:', error);
        setError({
          type: 'network_error',
          message: 'Failed to load recording session. Please check your connection and try again.'
        });
        setAppState(APP_STATES.SESSION_ERROR);
      }
    };

    loadSession();
  }, [sessionId]);

  // Handle mode selection
  const handleModeSelected = async (mode) => {
    setRecordingMode(mode);
    setAppState(APP_STATES.RECORDING_READY);
    
    // Record analytics
    await recordAnalyticsEvent(sessionId, 'mode_selected', { mode });
  };

  // Handle recording start
  const handleStartRecording = async () => {
    setAppState(APP_STATES.COUNTDOWN);
    
    // Record analytics
    await recordAnalyticsEvent(sessionId, 'recording_start_initiated', { mode: recordingMode });
    
    // Start countdown
    let count = 3;
    setCountdownNumber(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        setCountdownNumber('BEGIN');
        setTimeout(() => {
          clearInterval(countdownInterval);
          setAppState(APP_STATES.RECORDING);
        }, 1000);
      }
    }, 1000);
  };

  // Handle recording pause
  const handlePauseRecording = () => {
    setAppState(APP_STATES.PAUSED);
  };

  // Handle recording resume
  const handleResumeRecording = () => {
    setAppState(APP_STATES.RECORDING);
  };

  // Handle recording done
  const handleRecordingDone = (blob, duration) => {
    setRecordedBlob(blob);
    setRecordingDuration(duration);
    setAppState(APP_STATES.REVIEW);
    
    // Record analytics
    recordAnalyticsEvent(sessionId, 'recording_completed', { 
      duration,
      fileSize: blob.size,
      mode: recordingMode
    });
  };

  // Handle start over
  const handleStartOver = () => {
    setRecordedBlob(null);
    setRecordingDuration(0);
    setUploadProgress(0);
    setAppState(APP_STATES.RECORDING_READY);
    
    // Record analytics
    recordAnalyticsEvent(sessionId, 'recording_restarted');
  };

  // Handle submit recording
  const handleSubmitRecording = () => {
    setAppState(APP_STATES.UPLOADING);
    setUploadProgress(0);
    
    // Record analytics
    recordAnalyticsEvent(sessionId, 'upload_started', {
      fileSize: recordedBlob?.size,
      mode: recordingMode
    });
  };

  // Handle upload progress
  const handleUploadProgress = (progress) => {
    setUploadProgress(progress);
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    setAppState(APP_STATES.SUCCESS);
    
    // Record analytics
    recordAnalyticsEvent(sessionId, 'upload_completed', {
      finalFileSize: recordedBlob?.size,
      totalDuration: recordingDuration,
      mode: recordingMode
    });
  };

  // Handle upload error
  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    setError({
      type: 'upload_error',
      message: 'Failed to upload your recording. Please try again.'
    });
    setAppState(APP_STATES.REVIEW);
    
    // Record analytics
    recordAnalyticsEvent(sessionId, 'upload_failed', {
      error: error.message,
      fileSize: recordedBlob?.size
    });
  };

  // Render based on current state
  const renderCurrentState = () => {
    switch (appState) {
      case APP_STATES.LOADING:
        return (
          <div className="loading">
            Loading your recording session...
          </div>
        );

      case APP_STATES.SESSION_ERROR:
        return (
          <SessionValidator 
            error={error}
            sessionId={sessionId}
          />
        );

      case APP_STATES.MODE_SELECTION:
        return (
          <RecordingModeSelector
            question={sessionData?.question}
            asker={sessionData?.asker}
            onModeSelected={handleModeSelected}
          />
        );

      case APP_STATES.RECORDING_READY:
      case APP_STATES.RECORDING:
      case APP_STATES.PAUSED:
        return (
          <RecordingInterface
            question={sessionData?.question}
            asker={sessionData?.asker}
            mode={recordingMode}
            state={appState}
            onStartRecording={handleStartRecording}
            onPauseRecording={handlePauseRecording}
            onResumeRecording={handleResumeRecording}
            onRecordingDone={handleRecordingDone}
            sessionId={sessionId}
          />
        );

      case APP_STATES.REVIEW:
      case APP_STATES.UPLOADING:
        return (
          <SubmitOverlay
            recordedBlob={recordedBlob}
            recordingMode={recordingMode}
            duration={recordingDuration}
            isUploading={appState === APP_STATES.UPLOADING}
            uploadProgress={uploadProgress}
            onStartOver={handleStartOver}
            onSubmit={handleSubmitRecording}
            onUploadProgress={handleUploadProgress}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            sessionId={sessionId}
            error={error}
          />
        );

      case APP_STATES.SUCCESS:
        return (
          <ConfettiSuccess />
        );

      default:
        return (
          <div className="error-message">
            Unknown application state. Please refresh the page.
          </div>
        );
    }
  };

  return (
    <div className="page-container">
      <div className="main-layout-container">
        <div className="card-container">
          {renderCurrentState()}
        </div>
        
        {/* Countdown Overlay */}
        {appState === APP_STATES.COUNTDOWN && (
          <CountdownOverlay number={countdownNumber} />
        )}
      </div>
    </div>
  );
};

export default RecordingApp;