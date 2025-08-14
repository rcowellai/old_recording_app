/**
 * MediaPlayer.jsx
 * ---------------
 * Manages video/audio playback controls in the submit overlay.
 * Extracts media player concerns from App.js while preserving exact behavior.
 */

import { useRef } from 'react';
import { TIME_FORMAT, VIDEO_PLAYER } from '../config';
import { createError, UPLOAD_ERRORS } from '../utils/errors';

function MediaPlayer({ appState, dispatch, APP_ACTIONS }) {
  const playbackRef = useRef(null);
  const { isPlaying, currentTime, duration } = appState;

  // Format time utility (using constants for maintainability)
  const formatTime = (sec) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return TIME_FORMAT.DEFAULT_TIME_DISPLAY;
    const m = Math.floor(sec / TIME_FORMAT.SECONDS_PER_MINUTE);
    const s = Math.floor(sec % TIME_FORMAT.SECONDS_PER_MINUTE);
    return `${m}:${s < TIME_FORMAT.ZERO_PADDING_THRESHOLD ? '0' : ''}${s}`;
  };

  // Handle loaded metadata (preserves exact logic from App.js:207-220)
  const handleLoadedMetadata = () => {
    if (!playbackRef.current) return;
    let dur = playbackRef.current.duration;
    if (!dur || isNaN(dur) || !isFinite(dur)) dur = 0;
    dispatch({ type: APP_ACTIONS.SET_DURATION, payload: dur });
    dispatch({ type: APP_ACTIONS.SET_CURRENT_TIME, payload: 0 });
    dispatch({ type: APP_ACTIONS.SET_IS_PLAYING, payload: false });
    try {
      // iOS fix using centralized constant
      playbackRef.current.currentTime = VIDEO_PLAYER.IOS_TIME_FIX;
    } catch (e) {
      const structuredError = createError(
        UPLOAD_ERRORS.UNKNOWN,
        'Failed to set initial video time (iOS compatibility fix)',
        e
      );
      console.warn('Video time setting error:', structuredError);
    }
  };

  // Handle time update (preserves exact logic from App.js:222-230)
  const handleTimeUpdate = () => {
    if (!playbackRef.current) return;
    let ct = playbackRef.current.currentTime;
    if (!ct || isNaN(ct) || !isFinite(ct)) ct = 0;
    dispatch({ type: APP_ACTIONS.SET_CURRENT_TIME, payload: ct });
    if (ct >= (playbackRef.current.duration || 0) && isPlaying) {
      dispatch({ type: APP_ACTIONS.SET_IS_PLAYING, payload: false });
    }
  };

  // Handle toggle play (preserves exact logic from App.js:232-241)
  const handleTogglePlay = () => {
    if (!playbackRef.current) return;
    if (isPlaying) {
      playbackRef.current.pause();
      dispatch({ type: APP_ACTIONS.SET_IS_PLAYING, payload: false });
    } else {
      playbackRef.current.play();
      dispatch({ type: APP_ACTIONS.SET_IS_PLAYING, payload: true });
    }
  };

  // Handle seek (preserves exact logic from App.js:243-247)
  const handleSeek = (e) => {
    if (!playbackRef.current) return;
    playbackRef.current.currentTime = Number(e.target.value) || 0;
    dispatch({ type: APP_ACTIONS.SET_CURRENT_TIME, payload: playbackRef.current.currentTime });
  };

  return {
    playbackRef,
    formatTime,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleTogglePlay,
    handleSeek,
    // Export state for easy access
    isPlaying,
    currentTime,
    duration
  };
}

export default MediaPlayer;