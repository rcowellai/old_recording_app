/**
 * App.jsx
 * -------
 * The main user-facing page for recording audio or video.
 * Provides:
 *   - UI flow for selecting audio/video, starting/stopping,
 *   - Overlays for countdown, uploading progress, submission,
 *   - Transition to a confetti screen on successful upload.
 * Uses useRecordingFlow for actual recording logic.
 */

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophoneAlt, FaVideo, FaCircle, FaPause, FaPlay } from 'react-icons/fa';

// Hooks
import useRecordingFlow from './hooks/useRecordingFlow';

// Components
import PromptCard from './components/PromptCard';
import RecordingBar from './components/RecordingBar';
import VideoPreview from './components/VideoPreview';
import AudioRecorder from './components/AudioRecorder';
import AudioPlayback from './components/AudioPlayback';
import CountdownOverlay from './components/CountdownOverlay';
import ProgressOverlay from './components/ProgressOverlay';
import ConfirmOverlay from './components/ConfirmOverlay';
import ConfettiScreen from './components/confettiScreen';

// Local storage service
import { uploadRecording } from './services/localRecordingService';

import './styles/App.css';

function App() {
  // =============================
  // HOOK: Recording Flow
  // =============================
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

    // Newly exposed from useRecordingFlow
    actualMimeType,
  } = useRecordingFlow();

  // =============================
  // UI States
  // =============================
  const [submitStage, setSubmitStage] = useState(false);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [docId, setDocId] = useState(null);

  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadFraction, setUploadFraction] = useState(0);

  // Video/audio playback states in the submit overlay
  const playbackRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // =============================
  // Format Time
  // =============================
  const formatTime = (sec) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // =============================
  // "Done" => Move to Submit Stage
  // =============================
  function handleDoneAndSubmitStage() {
    handleDone();
    setSubmitStage(true);
  }

  // =============================
  // Auto-transition at 30s
  // =============================
  useEffect(() => {
    if (elapsedSeconds >= 30 && isRecording && !isPaused) {
      handleDoneAndSubmitStage();
    }
  }, [elapsedSeconds, isRecording, isPaused]);

  // =============================
  // Confetti Short-Circuit
  // =============================
  if (showConfetti) {
    return <ConfettiScreen docId={docId} />;
  }

  // =============================
  // Submit => Uses uploadRecording() from the service
  // =============================
  async function handleSubmit() {
    try {
      if (!recordedBlobUrl) {
        console.warn('No recorded blob URL found.');
        return;
      }

      // Convert the object URL => Blob
      const response = await fetch(recordedBlobUrl);
      const recordedBlob = await response.blob();

      // Create a unique filename
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');

      // =============================
      // Determine the correct extension based on mimeType
      // =============================
      let fileExtension;
      if (captureMode === 'video') {
        // If actualMimeType includes 'mp4', we use .mp4, else .webm
        if (actualMimeType?.includes('mp4')) {
          fileExtension = 'mp4';
        } else {
          fileExtension = 'webm';
        }
      } else {
        // Audio
        if (actualMimeType?.includes('mp4')) {
          // We'll use .m4a for AAC-based recordings
          fileExtension = 'm4a';
        } else {
          fileExtension = 'webm';
        }
      }

      const fileName = `${year}-${month}-${day}_${hours}${mins}${secs}_${captureMode}.${fileExtension}`;

      setUploadInProgress(true);
      setUploadFraction(0);

      // Pass the actual mimeType to uploadRecording so we set proper metadata
      const result = await uploadRecording(
        recordedBlob,
        fileName,
        captureMode,
        (fraction) => setUploadFraction(fraction),
        actualMimeType
      );

      // If successful, we have docId and downloadURL
      setDocId(result.docId);
      setUploadInProgress(false);
      setShowConfetti(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Something went wrong during upload.');
      setUploadInProgress(false);
    }
  }

  // =============================
  // "Start Over" Flow
  // =============================
  function handleStartOverClick() {
    setShowStartOverConfirm(true);
  }

  function handleStartOverYes() {
    // 1) Stop recording & close overlays
    handleDone();
    setShowStartOverConfirm(false);
    setSubmitStage(false);
    setShowConfetti(false);
    setDocId(null);
    setUploadInProgress(false);
    setUploadFraction(0);

    // 2) Reset captureMode so user sees Audio/Video choice
    setCaptureMode(null);
  }

  function handleStartOverNo() {
    setShowStartOverConfirm(false);
  }

  // =============================
  // Video Playback (Submit Overlay)
  // =============================
  const handleLoadedMetadata = () => {
    if (!playbackRef.current) return;
    let dur = playbackRef.current.duration;
    if (!dur || isNaN(dur) || !isFinite(dur)) dur = 0;
    setDuration(dur);
    setCurrentTime(0);
    setIsPlaying(false);
    try {
      // iOS fix
      playbackRef.current.currentTime = 0.001;
    } catch (e) {
      console.log('Could not set video time on iOS:', e);
    }
  };

  const handleTimeUpdate = () => {
    if (!playbackRef.current) return;
    let ct = playbackRef.current.currentTime;
    if (!ct || isNaN(ct) || !isFinite(ct)) ct = 0;
    setCurrentTime(ct);
    if (ct >= (playbackRef.current.duration || 0) && isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    if (!playbackRef.current) return;
    if (isPlaying) {
      playbackRef.current.pause();
      setIsPlaying(false);
    } else {
      playbackRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!playbackRef.current) return;
    playbackRef.current.currentTime = Number(e.target.value) || 0;
    setCurrentTime(playbackRef.current.currentTime);
  };

  // =============================
  // Render Helpers
  // =============================
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
    if (!mediaStream && captureMode == null && !submitStage) {
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

    if (!isRecording && !isPaused && !submitStage && mediaStream) {
      // Start
      return renderSingleButtonPlusPreview(
        <>
          <FaCircle style={{ marginRight: '8px' }} />
          Start recording
        </>,
        handleStartRecording
      );
    }

    if (isRecording && !isPaused && !submitStage) {
      // Pause
      return renderSingleButtonPlusPreview(
        <>
          <FaPause style={{ marginRight: '8px' }} />
          Pause
        </>,
        handlePause
      );
    }

    if (isPaused && !submitStage) {
      // Resume + Done
      return renderTwoButtonRow(
        <>
          <FaPlay style={{ marginRight: '8px' }} />
          Resume
        </>,
        handleResume,
        'Done',
        handleDoneAndSubmitStage
      );
    }

    return null;
  }

  // =============================
  // Main UI
  // =============================
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
          <div style={{ maxWidth: '480px', width: '100%', padding: '0 16px' }}>
            <RecordingBar
              elapsedSeconds={elapsedSeconds}
              totalSeconds={30}
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
              marginTop: '10px',
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
      {submitStage && (
        <div className="submit-overlay">
          <div className="submit-card">
            <div className="submit-header">
              <div className="submit-title">Submit your recording</div>
            </div>

            {/* Video Submission */}
            {captureMode === 'video' && recordedBlobUrl && (
              <div className="video-frame">
                <video
                  ref={playbackRef}
                  src={recordedBlobUrl}
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  playsInline
                />
                <div className="custom-player-region">
                  <div className="player-controls">
                    <div className="player-left-control">
                      <button type="button" onClick={handleTogglePlay}>
                        {isPlaying ? <FaPause /> : <FaPlay />}
                      </button>
                    </div>
                    <input
                      className="player-slider"
                      type="range"
                      min="0"
                      max={duration}
                      step="0.1"
                      value={currentTime}
                      onChange={handleSeek}
                    />
                    <div className="player-right-time">
                      {formatTime(currentTime)} / {formatTime(duration)}
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
                onClick={handleStartOverClick}
              >
                Start Over
              </button>
              <button
                type="button"
                className="btn-right-lower"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Overlay */}
      {showStartOverConfirm && (
        <ConfirmOverlay
          onYes={handleStartOverYes}
          onNo={handleStartOverNo}
        />
      )}

      {/* Upload Overlay => progress */}
      {uploadInProgress && (
        <ProgressOverlay fraction={uploadFraction} />
      )}
    </div>
  );
}

export default App;
