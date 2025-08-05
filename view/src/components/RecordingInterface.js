import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaStop } from 'react-icons/fa';

// Services
import { CONFIG, recordAnalyticsEvent } from '../services/firebase';

// Components
import AudioVisualizer from './AudioVisualizer';
import PermissionHandler from './PermissionHandler';

const RecordingInterface = ({
  question,
  asker,
  mode, // 'audio' or 'video'
  state, // 'recording_ready', 'recording', 'paused'
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onRecordingDone,
  sessionId
}) => {
  // Refs for media handling
  const videoRef = useRef(null);
  const liveVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Component state
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [deviceError, setDeviceError] = useState(null);

  // Audio analysis for visualization
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Maximum recording time in seconds (15 minutes)
  const MAX_RECORDING_TIME = CONFIG.MAX_RECORDING_TIME;

  // Get media constraints based on mode
  const getMediaConstraints = useCallback(() => {
    const baseConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    };

    if (mode === 'video') {
      return {
        ...baseConstraints,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user' // Front-facing camera
        }
      };
    }

    return baseConstraints;
  }, [mode]);

  // Request permissions and initialize media
  const initializeMedia = useCallback(async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    setPermissionError(null);
    setDeviceError(null);

    try {
      const constraints = getMediaConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      
      // Set up video preview for video mode
      if (mode === 'video' && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Set up live video box for video mode
      if (mode === 'video' && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }

      // Set up audio visualization
      if (stream.getAudioTracks().length > 0) {
        setupAudioAnalysis(stream);
      }

      // Initialize MediaRecorder
      setupMediaRecorder(stream);
      
      setHasPermissions(true);
      
      // Record analytics
      await recordAnalyticsEvent(sessionId, 'permissions_granted', { mode });
      
    } catch (error) {
      console.error('Failed to get user media:', error);
      
      let errorMessage = 'Failed to access camera or microphone.';
      let errorType = 'general';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied. Please allow access to your camera and microphone.';
        errorType = 'permission_denied';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please check your device.';
        errorType = 'no_device';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Your browser does not support media recording.';
        errorType = 'not_supported';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera settings not supported by your device.';
        errorType = 'overconstrained';
      }
      
      setPermissionError({ message: errorMessage, type: errorType });
      
      // Record analytics
      await recordAnalyticsEvent(sessionId, 'permission_denied', { 
        mode, 
        error: error.name,
        message: error.message 
      });
      
    } finally {
      setIsInitializing(false);
    }
  }, [mode, sessionId, getMediaConstraints, isInitializing, setupAudioAnalysis, setupMediaRecorder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Setup audio analysis for visualization
  const setupAudioAnalysis = useCallback((stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start audio level monitoring
      monitorAudioLevel();
      
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
    }
  }, []);

  // Monitor audio level for visualization
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average level
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = average / 255;
      
      setAudioLevel(normalizedLevel);
      
      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
  };

  // Setup MediaRecorder
  const setupMediaRecorder = useCallback((stream) => {
    try {
      const options = { mimeType: 'video/webm' };
      
      // Fallback for browsers that don't support webm
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          delete options.mimeType;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mode === 'video' ? 'video/webm' : 'audio/webm'
        });
        
        onRecordingDone(blob, recordingTime);
        
        // Clear chunks for next recording
        chunksRef.current = [];
      };
      
      mediaRecorderRef.current = mediaRecorder;
      
    } catch (error) {
      console.error('Failed to setup MediaRecorder:', error);
      setDeviceError('Failed to initialize recording. Your browser may not support this feature.');
    }
  }, []);

  // Start recording timer
  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prevTime => {
        const newTime = prevTime + 1;
        
        // Auto-stop at max time
        if (newTime >= MAX_RECORDING_TIME) {
          handleStopRecording();
          return MAX_RECORDING_TIME;
        }
        
        return newTime;
      });
    }, 1000);
  };

  // Stop recording timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle start recording
  const handleStartRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'recording') {
      return;
    }
    
    try {
      chunksRef.current = [];
      mediaRecorderRef.current.start(1000); // Capture data every second
      startTimer();
      onStartRecording();
      
      // Record analytics
      await recordAnalyticsEvent(sessionId, 'recording_started', { 
        mode,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setDeviceError('Failed to start recording. Please try again.');
    }
  };

  // Handle pause recording
  const handlePauseRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      onPauseRecording();
      
      // Record analytics
      await recordAnalyticsEvent(sessionId, 'recording_paused', { 
        mode,
        duration: recordingTime
      });
    }
  };

  // Handle resume recording
  const handleResumeRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      onResumeRecording();
      
      // Record analytics
      await recordAnalyticsEvent(sessionId, 'recording_resumed', { 
        mode,
        duration: recordingTime
      });
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    if (mediaRecorderRef.current && 
        (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
      stopTimer();
      
      // Record analytics
      await recordAnalyticsEvent(sessionId, 'recording_stopped', { 
        mode,
        duration: recordingTime,
        reason: recordingTime >= MAX_RECORDING_TIME ? 'max_time_reached' : 'user_stopped'
      });
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format max time display
  const formatMaxTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}:00`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize media when component mounts
  useEffect(() => {
    if (!hasPermissions && !isInitializing && !permissionError) {
      initializeMedia();
    }
  }, [hasPermissions, isInitializing, permissionError, initializeMedia]);

  // Show permission handler if needed
  if (!hasPermissions) {
    return (
      <PermissionHandler
        mode={mode}
        error={permissionError}
        isInitializing={isInitializing}
        onRetry={initializeMedia}
      />
    );
  }

  // Show device error if any
  if (deviceError) {
    return (
      <div className="error-message">
        <p>{deviceError}</p>
        <button 
          className="btn-base btn-primary mt-20"
          onClick={() => {
            setDeviceError(null);
            initializeMedia();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="recording-interface">
      {/* Recording Status Display */}
      {state !== 'recording_ready' && (
        <div className="recording-status">
          <div className="recording-time">
            {formatTime(recordingTime)} / {formatMaxTime(MAX_RECORDING_TIME)}
          </div>
          
          <div className="recording-indicator">
            {state === 'recording' && (
              <>
                <div className="recording-dot"></div>
                <span>REC</span>
              </>
            )}
            {state === 'paused' && (
              <span>⏸ PAUSED</span>
            )}
          </div>
        </div>
      )}

      {/* Question Display */}
      <div className="question-display">
        <div className="question-asker">
          {asker} asked
        </div>
        <h2 className="question-text">
          {question}
        </h2>
      </div>

      {/* Media Preview */}
      <div className="media-preview-container">
        {mode === 'video' ? (
          <div className="video-preview-container">
            <div className="video-preview">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
              />
              
              {/* Live video box in bottom left during recording */}
              {(state === 'recording' || state === 'paused') && (
                <div className="live-video-box">
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="audio-visualizer-container">
            <AudioVisualizer
              isRecording={state === 'recording'}
              audioLevel={audioLevel}
              mode={mode}
            />
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="recording-controls">
        {state === 'recording_ready' && (
          <div className="one-button-row">
            <button
              className="btn-base btn-primary btn-large one-button-wide"
              onClick={handleStartRecording}
            >
              <FaPlay style={{ marginRight: '8px' }} />
              Start Recording
            </button>
          </div>
        )}

        {state === 'recording' && (
          <div className="one-button-row">
            <button
              className="btn-base btn-primary btn-large one-button-wide"
              onClick={handlePauseRecording}
            >
              <FaPause style={{ marginRight: '8px' }} />
              Pause
            </button>
          </div>
        )}

        {state === 'paused' && (
          <div className="two-button-row">
            <button
              className="btn-base btn-secondary btn-large two-button-left"
              onClick={handleResumeRecording}
            >
              <FaPlay style={{ marginRight: '8px' }} />
              Resume
            </button>
            <button
              className="btn-base btn-primary btn-large two-button-right"
              onClick={handleStopRecording}
            >
              <FaStop style={{ marginRight: '8px' }} />
              Done
            </button>
          </div>
        )}
      </div>

      {/* Recording Progress Warning */}
      {recordingTime > MAX_RECORDING_TIME * 0.8 && state === 'recording' && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          color: '#856404',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          ⚠️ Recording will automatically stop in {formatTime(MAX_RECORDING_TIME - recordingTime)}
        </div>
      )}
    </div>
  );
};

export default RecordingInterface;