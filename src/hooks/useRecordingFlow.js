/**
 * useRecordingFlow.js
 * -------------------
 * Custom React hook that manages the entire audio/video
 * recording cycle:
 *   - Getting media permissions
 *   - Handling pause, resume
 *   - 30-second timer (capped, but no auto-stop)
 *   - Generating a Blob URL of the final recording
 *
 * Helps keep App.jsx lean by encapsulating recording logic.
 */

import { useState, useRef, useEffect } from 'react';

export default function useRecordingFlow() {
  // ===========================
  // State & References
  // ===========================
  const [captureMode, setCaptureMode] = useState(null); // 'audio' or 'video'
  const [mediaStream, setMediaStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const recordedChunksRef = useRef([]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Countdown overlay
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState(null);

  // Elapsed time (up to 30s)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track the actual MIME type chosen by MediaRecorder
  const [actualMimeType, setActualMimeType] = useState(null);

  // ===========================
  // Effects
  // ===========================
  // 30-second timer: no longer auto-stop
  useEffect(() => {
    let intervalId;
    if (isRecording && !isPaused) {
      intervalId = setInterval(() => {
        setElapsedSeconds((prev) => {
          // If we've hit 30, just cap it.
          // We no longer call handleDone() here.
          if (prev >= 30) {
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording, isPaused]);

  // ===========================
  // Permission & Capture Setup
  // ===========================
  async function handleVideoClick() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMediaStream(stream);
      setCaptureMode('video');
    } catch (err) {
      console.error('Error accessing camera/mic (video mode):', err);
    }
  }

  async function handleAudioClick() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setMediaStream(stream);
      setCaptureMode('audio');
    } catch (err) {
      console.error('Error accessing mic (audio mode):', err);
    }
  }

  // ===========================
  // Recording Lifecycle
  // ===========================
  function beginRecording() {
    if (!mediaStream) {
      console.warn('No media stream available to record.');
      return;
    }
    recordedChunksRef.current = [];

    let options = {};
    // Decide on best possible format based on captureMode
    if (window.MediaRecorder && typeof MediaRecorder.isTypeSupported === 'function') {
      if (captureMode === 'video') {
        // Video first tries mp4/h264, else fallback to webm/vp8
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
          options = { mimeType: 'video/mp4;codecs=h264' };
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          options = { mimeType: 'video/webm;codecs=vp8,opus' };
        }
      } else {
        // Audio => prefer AAC in MP4, else fallback to WebM/Opus
        if (MediaRecorder.isTypeSupported('audio/mp4;codecs=aac')) {
          options = { mimeType: 'audio/mp4;codecs=aac' };
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else {
          console.warn('No supported audio MIME type found, using default');
        }
      }
    }

    let recorder;
    try {
      recorder = new MediaRecorder(mediaStream, options);
    } catch (err) {
      console.error('Failed to create MediaRecorder:', err);
      return;
    }

    // Store the actual MIME type used
    setActualMimeType(recorder.mimeType);

    recorder.onstart = () => console.log('Recorder started');
    recorder.onpause = () => console.log('Recorder paused');
    recorder.onresume = () => console.log('Recorder resumed');
    recorder.onstop = () => {
      console.log('Recorder stopped');
      const completeBlob = new Blob(recordedChunksRef.current, {
        type: recorder.mimeType,
      });
      const url = URL.createObjectURL(completeBlob);
      setRecordedBlobUrl(url);
    };

    recorder.ondataavailable = (evt) => {
      if (evt.data && evt.data.size > 0) {
        recordedChunksRef.current.push(evt.data);
      }
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setIsPaused(false);
  }

  // Start with 3-2-1 countdown
  function handleStartRecording() {
    setCountdownActive(true);
    const steps = [3, 2, 1, 'BEGIN'];
    let index = 0;
    setCountdownValue(steps[index]);

    const intervalId = setInterval(() => {
      index += 1;
      if (index < steps.length) {
        setCountdownValue(steps[index]);
      } else {
        clearInterval(intervalId);
        setCountdownActive(false);
        setElapsedSeconds(0);
        beginRecording();
      }
    }, 1000);
  }

  function handlePause() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsRecording(false);
      setIsPaused(true);
    }
  }

  function handleResume() {
    setIsPaused(false);
    setCountdownActive(true);

    const steps = [3, 2, 1, 'BEGIN'];
    let index = 0;
    setCountdownValue(steps[index]);

    const intervalId = setInterval(() => {
      index += 1;
      if (index < steps.length) {
        setCountdownValue(steps[index]);
      } else {
        clearInterval(intervalId);
        if (mediaRecorder && mediaRecorder.state === 'paused') {
          mediaRecorder.resume();
          setIsRecording(true);
        }
        setCountdownActive(false);
      }
    }, 1000);
  }

  function handleDone() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    setMediaStream(null);
    setMediaRecorder(null);
    setIsRecording(false);
    setIsPaused(false);
  }

  // ===========================
  // Return everything needed by UI
  // ===========================
  return {
    captureMode,
    countdownActive,
    countdownValue,
    isRecording,
    isPaused,
    elapsedSeconds,
    recordedBlobUrl,
    mediaStream,
    // Expose actualMimeType so parent can set file extension accordingly
    actualMimeType,

    handleVideoClick,
    handleAudioClick,
    handleStartRecording,
    handlePause,
    handleResume,
    handleDone,

    // We also expose setCaptureMode if your UI needs it
    setCaptureMode,
  };
}
