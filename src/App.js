/**
 * App.jsx
 * -------
 * The main user-facing page for recording audio or video.
 * Refactored to use useReducer and extracted components while preserving exact UI behavior.
 */

import React, { useReducer } from 'react';
import { FaMicrophoneAlt, FaVideo, FaCircle, FaPause, FaPlay } from 'react-icons/fa';

// Configuration
import { RECORDING_LIMITS } from './config';
import { LAYOUT, TIME_FORMAT, VIDEO_PLAYER } from './constants/recording';

// State management
import { appReducer, initialAppState, APP_ACTIONS } from './reducers/appReducer';

// Extracted components
import RecordingFlow from './components/RecordingFlow';
import SubmissionHandler from './components/SubmissionHandler';
import MediaPlayer from './components/MediaPlayer';
import NavigationController from './components/NavigationController';

// Existing components (unchanged)
import PromptCard from './components/PromptCard';
import RecordingBar from './components/RecordingBar';
import VideoPreview from './components/VideoPreview';
import AudioRecorder from './components/AudioRecorder';
import AudioPlayback from './components/AudioPlayback';
import CountdownOverlay from './components/CountdownOverlay';
import ProgressOverlay from './components/ProgressOverlay';
import ConfirmOverlay from './components/ConfirmOverlay';
import ConfettiScreen from './components/confettiScreen';

import './styles/App.css';

function App() {
  // Replace multiple useState with useReducer
  const [appState, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <RecordingFlow 
      onDoneAndSubmitStage={() => dispatch({ type: APP_ACTIONS.SET_SUBMIT_STAGE, payload: true })}
    >
      {(recordingFlowState) => {
        const {
          captureMode,
          countdownActive,
          countdownValue,
          isRecording,
          isPaused,
          elapsedSeconds,
          recordedBlobUrl,
          mediaStream,
          handleVideoClick,
          handleAudioClick,
          handleStartRecording,
          handlePause,
          handleResume,
          handleDone,
          setCaptureMode,
          actualMimeType,
        } = recordingFlowState;

        // Initialize extracted components
        const submissionHandler = SubmissionHandler({
          recordedBlobUrl,
          captureMode,
          actualMimeType,
          appState,
          dispatch,
          APP_ACTIONS
        });

        const mediaPlayer = MediaPlayer({ appState, dispatch, APP_ACTIONS });

        const navigationController = NavigationController({
          appState,
          dispatch,
          APP_ACTIONS,
          handleDone,
          setCaptureMode
        });

        // Format Time utility (using constants for maintainability)
        const formatTime = (sec) => {
          if (!sec || isNaN(sec) || !isFinite(sec)) return TIME_FORMAT.DEFAULT_TIME_DISPLAY;
          const m = Math.floor(sec / TIME_FORMAT.SECONDS_PER_MINUTE);
          const s = Math.floor(sec % TIME_FORMAT.SECONDS_PER_MINUTE);
          return `${m}:${s < TIME_FORMAT.ZERO_PADDING_THRESHOLD ? '0' : ''}${s}`;
        };

        // Render Helpers (preserves exact logic from original App.js:252-348)
        function renderTwoButtonRow(leftText, leftOnClick, rightText, rightOnClick) {
          return (
            <div className="two-button-row">
              <button
                type="button"
                className="two-button-left"
                onClick={leftOnClick}
              >
                {leftText}
              </button>
              <button
                type="button"
                className="two-button-right"
                onClick={rightOnClick}
              >
                {rightText}
              </button>
            </div>
          );
        }

        function renderSingleButtonPlusPreview(buttonText, buttonOnClick) {
          const previewElement =
            captureMode === 'audio'
              ? <AudioRecorder stream={mediaStream} isRecording={isRecording} />
              : <VideoPreview stream={mediaStream} />;

          return (
            <div className="single-plus-video-row">
              <div className="single-plus-left">
                {mediaStream ? previewElement : <div className="video-placeholder" />}
              </div>
              <button
                type="button"
                className="single-plus-right"
                onClick={buttonOnClick}
              >
                {buttonText}
              </button>
            </div>
          );
        }

        function renderBottomRow() {
          // Show "Audio" & "Video" if no stream, captureMode == null, and not in submit stage
          if (!mediaStream && captureMode == null && !appState.submitStage) {
            return renderTwoButtonRow(
              <>
                <FaMicrophoneAlt style={{ marginRight: '8px' }} />
                Audio
              </>,
              handleAudioClick,
              <>
                <FaVideo style={{ marginRight: '8px' }} />
                Video
              </>,
              handleVideoClick
            );
          }

          if (!isRecording && !isPaused && !appState.submitStage && mediaStream) {
            // Start
            return renderSingleButtonPlusPreview(
              <>
                <FaCircle style={{ marginRight: '8px' }} />
                Start recording
              </>,
              handleStartRecording
            );
          }

          if (isRecording && !isPaused && !appState.submitStage) {
            // Pause
            return renderSingleButtonPlusPreview(
              <>
                <FaPause style={{ marginRight: '8px' }} />
                Pause
              </>,
              handlePause
            );
          }

          if (isPaused && !appState.submitStage) {
            // Resume + Done
            return renderTwoButtonRow(
              <>
                <FaPlay style={{ marginRight: '8px' }} />
                Resume
              </>,
              handleResume,
              'Done',
              navigationController.handleDoneAndSubmitStage
            );
          }

          return null;
        }

        // Confetti Short-Circuit (preserves exact logic from original App.js:106-108)
        if (appState.showConfetti) {
          return <ConfettiScreen docId={appState.docId} />;
        }

        // Main UI (preserves exact JSX structure from original App.js:353-489)
        return (
          <div className="page-container">
            {(isRecording || isPaused) && (
              <div
                style={{
                  position: 'fixed',
                  top: '15px',
                  left: 0,
                  width: '100%',
                  zIndex: 999,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div style={{ maxWidth: LAYOUT.MAX_WIDTH, width: '100%', padding: LAYOUT.RECORDING_BAR_PADDING }}>
                  <RecordingBar
                    elapsedSeconds={elapsedSeconds}
                    totalSeconds={RECORDING_LIMITS.MAX_DURATION_SECONDS}
                    isRecording={isRecording}
                    isPaused={isPaused}
                    formatTime={formatTime}
                  />
                </div>
              </div>
            )}

            <div className="main-layout-container">
              <PromptCard />
              <div className="bottom-section">
                <div
                  className="prompt-link"
                  style={{
                    marginTop: LAYOUT.MARGIN_TOP_SMALL,
                    visibility: mediaStream ? 'hidden' : 'visible',
                  }}
                >
                  Or <a href="#different">choose a different prompt</a>
                </div>
                <div
                  className="prompt-info-text"
                  style={{
                    visibility: mediaStream ? 'hidden' : 'visible',
                  }}
                >
                  Choose your recording mode
                </div>
                {renderBottomRow()}
              </div>
            </div>

            {/* Countdown Overlay */}
            {countdownActive && (
              <CountdownOverlay countdownValue={countdownValue} />
            )}

            {/* Submit Overlay */}
            {appState.submitStage && (
              <div className="submit-overlay">
                <div className="submit-card">
                  <div className="submit-header">
                    <div className="submit-title">Submit your recording</div>
                  </div>

                  {/* Video Submission */}
                  {captureMode === 'video' && recordedBlobUrl && (
                    <div className="video-frame">
                      <video
                        ref={mediaPlayer.playbackRef}
                        src={recordedBlobUrl}
                        preload="metadata"
                        onLoadedMetadata={mediaPlayer.handleLoadedMetadata}
                        onTimeUpdate={mediaPlayer.handleTimeUpdate}
                        playsInline
                      />
                      <div className="custom-player-region">
                        <div className="player-controls">
                          <div className="player-left-control">
                            <button type="button" onClick={mediaPlayer.handleTogglePlay}>
                              {mediaPlayer.isPlaying ? <FaPause /> : <FaPlay />}
                            </button>
                          </div>
                          <input
                            className="player-slider"
                            type="range"
                            min="0"
                            max={mediaPlayer.duration}
                            step={VIDEO_PLAYER.SLIDER_STEP}
                            value={mediaPlayer.currentTime}
                            onChange={mediaPlayer.handleSeek}
                          />
                          <div className="player-right-time">
                            {mediaPlayer.formatTime(mediaPlayer.currentTime)} / {mediaPlayer.formatTime(mediaPlayer.duration)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio Submission */}
                  {captureMode === 'audio' && recordedBlobUrl && (
                    <AudioPlayback audioSrc={recordedBlobUrl} />
                  )}

                  <div className="submit-footer">
                    <button
                      type="button"
                      className="btn-left-lower"
                      onClick={navigationController.handleStartOverClick}
                    >
                      Start Over
                    </button>
                    <button
                      type="button"
                      className="btn-right-lower"
                      onClick={submissionHandler.handleSubmit}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Overlay */}
            {appState.showStartOverConfirm && (
              <ConfirmOverlay
                onYes={navigationController.handleStartOverYes}
                onNo={navigationController.handleStartOverNo}
              />
            )}

            {/* Upload Overlay => progress */}
            {appState.uploadInProgress && (
              <ProgressOverlay fraction={appState.uploadFraction} />
            )}
          </div>
        );
      }}
    </RecordingFlow>
  );
}

export default App;