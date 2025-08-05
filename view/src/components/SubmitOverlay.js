import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaRedo, FaUpload } from 'react-icons/fa';

// Services
import { uploadRecording } from '../services/firebase';

const SubmitOverlay = ({
  recordedBlob,
  recordingMode,
  duration,
  isUploading,
  uploadProgress,
  onStartOver,
  onSubmit,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  sessionId,
  error
}) => {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // UI state
  const [showConfirmStartOver, setShowConfirmStartOver] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);
  
  // Refs
  const mediaRef = useRef(null);
  const progressInterval = useRef(null);

  // Create object URL for playback
  const [mediaUrl, setMediaUrl] = useState(null);
  
  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setMediaUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [recordedBlob]);

  // Handle media loaded
  const handleMediaLoaded = () => {
    if (mediaRef.current) {
      setTotalDuration(mediaRef.current.duration || duration);
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    } else {
      mediaRef.current.play();
      setIsPlaying(true);
      
      // Update progress
      progressInterval.current = setInterval(() => {
        if (mediaRef.current) {
          setCurrentTime(mediaRef.current.currentTime);
        }
      }, 100);
    }
  };

  // Handle seek
  const handleSeek = (e) => {
    if (!mediaRef.current) return;
    
    const rect = e.target.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * totalDuration;
    
    mediaRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle playback speed change
  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  };

  // Handle media ended
  const handleMediaEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    clearInterval(progressInterval.current);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle start over with confirmation
  const handleStartOverClick = () => {
    setShowConfirmStartOver(true);
  };

  const handleConfirmStartOver = () => {
    setShowConfirmStartOver(false);
    onStartOver();
  };

  const handleCancelStartOver = () => {
    setShowConfirmStartOver(false);
  };

  // Handle submit recording
  const handleSubmitClick = async () => {
    if (isUploading || uploadStarted) return;
    
    setUploadStarted(true);
    onSubmit();
    
    try {
      await uploadRecording(
        sessionId,
        recordedBlob,
        recordingMode,
        onUploadProgress
      );
      
      onUploadSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      onUploadError(error);
      setUploadStarted(false);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  return (
    <>
      <div className="submit-overlay">
        <div className="submit-card">
          {/* Header */}
          <div className="submit-header">
            <h3 className="submit-title">
              {isUploading ? 'Uploading Your Recording' : 'Review Your Recording'}
            </h3>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message" style={{ margin: '16px 0' }}>
              <p>{error.message}</p>
            </div>
          )}

          {/* Media Player */}
          {!isUploading && mediaUrl && (
            <div className="media-player-container">
              {recordingMode === 'video' ? (
                <video
                  ref={mediaRef}
                  src={mediaUrl}
                  onLoadedMetadata={handleMediaLoaded}
                  onEnded={handleMediaEnded}
                  controls={false}
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'contain' }}
                />
              ) : (
                <div className="custom-audio-player">
                  <audio
                    ref={mediaRef}
                    src={mediaUrl}
                    onLoadedMetadata={handleMediaLoaded}
                    onEnded={handleMediaEnded}
                    style={{ display: 'none' }}
                  />
                  
                  {/* Audio Controls */}
                  <div className="audio-controls">
                    <button
                      className="play-pause-btn"
                      onClick={handlePlayPause}
                    >
                      {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    
                    <div
                      className="audio-progress"
                      onClick={handleSeek}
                    >
                      <div
                        className="audio-progress-fill"
                        style={{
                          width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`
                        }}
                      />
                    </div>
                    
                    <div className="audio-time">
                      {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </div>
                  </div>
                  
                  {/* Speed Controls for Audio */}
                  <div className="speed-controls">
                    {[0.5, 1, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        className={`speed-btn ${playbackRate === speed ? 'active' : ''}`}
                        onClick={() => handleSpeedChange(speed)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="upload-progress-container">
              <div className="upload-progress-text">
                Uploading your {recordingMode} recording...
              </div>
              
              <div className="upload-progress-bar">
                <div
                  className="upload-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              
              <div className="upload-progress-percent">
                {Math.round(uploadProgress)}%
              </div>
              
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginTop: '8px' 
              }}>
                File size: {(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          )}

          {/* Recording Info */}
          {!isUploading && (
            <div style={{
              margin: '16px 0',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Duration:</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Type:</span>
                <span>{recordingMode === 'video' ? 'Video + Audio' : 'Audio Only'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Size:</span>
                <span>{(recordedBlob.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isUploading && (
            <div className="submit-footer">
              <button
                className="btn-base btn-secondary btn-left-lower"
                onClick={handleStartOverClick}
              >
                <FaRedo style={{ marginRight: '6px' }} />
                Start Over
              </button>
              
              <button
                className="btn-base btn-primary btn-right-lower"
                onClick={handleSubmitClick}
                disabled={uploadStarted}
              >
                <FaUpload style={{ marginRight: '6px' }} />
                {uploadStarted ? 'Uploading...' : 'Submit Recording'}
              </button>
            </div>
          )}

          {/* Upload Status */}
          {isUploading && (
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              <p>Please don't close this page while uploading...</p>
              {uploadProgress > 90 && (
                <p style={{ marginTop: '8px', color: '#2c2f48', fontWeight: '500' }}>
                  Almost done! Processing your recording...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmStartOver && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p className="confirm-text">
              Are you sure you want to start over? Your current recording will be lost.
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-btn"
                onClick={handleCancelStartOver}
              >
                Cancel
              </button>
              <button
                className="confirm-btn primary"
                onClick={handleConfirmStartOver}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubmitOverlay;