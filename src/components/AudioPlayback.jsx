/**
 * AudioPlayback.jsx
 * -----------------
 * Provides a custom audio player UI with a progress slider,
 * play/pause button, and speed controls. Used for reviewing
 * final audio recordings or playing them back later.
 */


import React, { useEffect, useRef, useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

function AudioPlayback({ audioSrc }) {
  const audioRef = useRef(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Playback speed
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const speeds = [1.0, 1.25, 1.5, 2.0];

  /************************************************************
   *  On mount or when audioSrc changes:
   *   - Add event listeners to catch final duration
   *   - Reset currentTime to 0
   ************************************************************/
  useEffect(() => {
    if (!audioRef.current) return;

    const audioEl = audioRef.current;

    // A function to update our stored duration if the browser reports a new value
    const updateDuration = () => {
      if (!audioEl.duration || isNaN(audioEl.duration)) return;
      setDuration(audioEl.duration);
    };

    // We also reset the current time to zero whenever we load a new file
    const handleLoadedMetadata = () => {
      updateDuration();
      setCurrentTime(0);
      // Apply the playback rate we last selected
      audioEl.playbackRate = playbackRate;
    };

    // Attach listeners
    audioEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioEl.addEventListener('durationchange', updateDuration);
    audioEl.addEventListener('canplay', updateDuration);
    audioEl.addEventListener('canplaythrough', updateDuration);

    // Clean up on unmount or if audioSrc changes
    return () => {
      audioEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioEl.removeEventListener('durationchange', updateDuration);
      audioEl.removeEventListener('canplay', updateDuration);
      audioEl.removeEventListener('canplaythrough', updateDuration);
    };
  }, [audioSrc, playbackRate]);

  /************************************************************
   * onTimeUpdate => move slider in real time
   ************************************************************/
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);

    // If we've reached the end, pause
    if (
      audioRef.current.currentTime >= audioRef.current.duration &&
      isPlaying
    ) {
      setIsPlaying(false);
    }
  };

  /************************************************************
   * Play / Pause
   ************************************************************/
  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        // If autoplay is blocked, log error
        console.warn('Play attempt was blocked:', err);
      });
      setIsPlaying(true);
    }
  };

  /************************************************************
   * Scrub / Seek
   ************************************************************/
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const newTime = Number(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  /************************************************************
   * Change playback speed
   ************************************************************/
  const handleSpeedClick = (speed) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  /************************************************************
   * Format time as mm:ss
   ************************************************************/
  const formatTime = (sec) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // If no audio src, render nothing
  if (!audioSrc) {
    return null;
  }

  /************************************************************
   *  STYLES
   ************************************************************/
  // Outer container => bigger card, extra padding
  const containerStyle = {
    width: '100%',
    maxWidth: '600px',
    border: '1px solid #DDD',
    borderRadius: '8px',
    padding: '20px',
    boxSizing: 'border-box',
    backgroundColor: '#FFF',
    marginTop: '16px', // extra space for heading above
  };

  // Top row => [currentTime] [slider] [totalTime]
  const topRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  };

  const timeTextStyle = {
    width: '40px',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#333',
  };

  // The slider => step="any" for smooth scrubbing
  const sliderStyle = {
    flex: 1,
    margin: '0 8px',
  };

  // Bottom row => [Play/Pause], [Speed Buttons]
  const bottomRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const playButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    color: '#2C2F48',
  };

  // Speed area => smaller font
  const speedsContainerStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  // === RENDER ===
  return (
    <div style={containerStyle}>
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* Top Row => currentTime, slider, totalTime */}
      <div style={topRowStyle}>
        <span style={timeTextStyle}>{formatTime(currentTime)}</span>
        <input
          type="range"
          step="any" 
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          style={sliderStyle}
        />
        <span style={timeTextStyle}>{formatTime(duration)}</span>
      </div>

      {/* Bottom Row => play/pause button, speed buttons */}
      <div style={bottomRowStyle}>
        <button type="button" onClick={handleTogglePlay} style={playButtonStyle}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <div style={speedsContainerStyle}>
          {speeds.map((speed) => {
            const isSelected = speed === playbackRate;
            return (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedClick(speed)}
                style={{
                  background: 'none',
                  border: isSelected ? '1px solid #2C2F48' : '1px solid transparent',
                  fontWeight: isSelected ? '600' : '400',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  marginRight: '8px',
                  color: '#2C2F48',
                  fontSize: '0.675rem', // ~25% smaller for better fit
                }}
              >
                {`${speed}x`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AudioPlayback;
