import { useState, useRef, useCallback } from 'react';
import { CONFIG } from '../services/firebase';

// Custom hook for managing recording state and MediaRecorder
const useRecording = (mode = 'video') => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Get media constraints based on mode
  const getConstraints = useCallback(() => {
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
          facingMode: 'user'
        }
      };
    }

    return baseConstraints;
  }, [mode]);

  // Initialize media stream
  const initializeStream = useCallback(async () => {
    try {
      setError(null);
      const constraints = getConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      return stream;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [getConstraints]);

  // Setup MediaRecorder
  const setupRecorder = useCallback((stream) => {
    try {
      const options = { mimeType: 'video/webm' };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          delete options.mimeType;
        }
      }

      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mode === 'video' ? 'video/webm' : 'audio/webm'
        });
        setRecordedBlob(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current = recorder;
      return recorder;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [mode]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      if (!streamRef.current) {
        await initializeStream();
      }
      
      if (!mediaRecorderRef.current) {
        setupRecorder(streamRef.current);
      }

      chunksRef.current = [];
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= CONFIG.MAX_RECORDING_TIME) {
            stopRecording();
            return CONFIG.MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);

    } catch (err) {
      setError(err);
      console.error('Failed to start recording:', err);
    }
  }, [initializeStream, setupRecorder]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= CONFIG.MAX_RECORDING_TIME) {
            stopRecording();
            return CONFIG.MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && 
        (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset recording
  const resetRecording = useCallback(() => {
    stopRecording();
    setRecordedBlob(null);
    setRecordingTime(0);
    setError(null);
  }, [stopRecording]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    resetRecording();
  }, [resetRecording]);

  return {
    // State
    isRecording,
    isPaused,
    recordingTime,
    recordedBlob,
    error,
    stream: streamRef.current,
    
    // Actions
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    cleanup,
    
    // Utils
    formatTime: (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };
};

export default useRecording;