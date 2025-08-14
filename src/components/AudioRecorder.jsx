/**
 * AudioRecorder.jsx
 * -----------------
 * Visual component showing a live waveform/mic icon
 * while recording audio. Connects to the user's
 * microphone input stream and draws levels in real time.
 */


import React, { useEffect, useRef } from 'react';
import { FaMicrophoneAlt } from 'react-icons/fa';

function AudioRecorder({ stream, isRecording }) {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    if (!stream || !isRecording) return undefined;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Canvas is 80x80, so the vertical center is 40
    const centerY = 40;
    // Horizontal offset & width for wave
    const offsetX = 16;
    const waveWidth = 48; // total wave region in x-direction

    // We'll let waveHeight = 48 so the wave can swing ~24px above/below center
    const waveHeight = 48;
    const sensitivityFactor = 1.3; // Increase if you want more dramatic movement

    function draw() {
      if (!analyserRef.current || !dataArrayRef.current) {
        requestAnimationFrame(draw);
        return;
      }

      analyser.getByteTimeDomainData(dataArrayRef.current);

      // Clear entire 80x80
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fill the background to match the box color
      ctx.fillStyle = '#E4E2D8';
      ctx.fillRect(0, 0, 80, 80);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#B3261E'; // red wave
      ctx.beginPath();

      // Each data point: 0..255 => after /128 => 0..2. 
      // We'll center it by subtracting 1 => range -1..+1, then multiply for amplitude.
      const sliceWidth = waveWidth / bufferLength;
      let xPos = offsetX;

      for (let i = 0; i < bufferLength; i++) {
        let v = dataArrayRef.current[i] / 128.0;    // 0..2
        v = (v - 1.0) * sensitivityFactor;          // -1..+1 => scaled

        // Convert that range into a Y offset from center
        const y = centerY + (v * (waveHeight / 2)); 
        if (i === 0) {
          ctx.moveTo(xPos, y);
        } else {
          ctx.lineTo(xPos, y);
        }
        xPos += sliceWidth;
      }

      ctx.stroke();
      requestAnimationFrame(draw);
    }
    draw();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, [stream, isRecording]);

  // If not recording, draw diagonal slash
  useEffect(() => {
    if (isRecording) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 80, 80);

    // Fill
    ctx.fillStyle = '#E4E2D8';
    ctx.fillRect(0, 0, 80, 80);

    // slash
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.lineTo(64, 64);
    ctx.stroke();
  }, [isRecording]);

  // Container styling
  const containerStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: '#E4E2D8',
    borderRadius: '8px',
    boxSizing: 'border-box',
    padding: '8px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Canvas covers the container area
  const canvasStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  // Mic icon => bigger if recording
  const iconStyle = {
    fontSize: '1.8rem',
    color: isRecording ? '#B3261E' : '#999999',
    zIndex: 2,
  };

  return (
    <div style={containerStyle}>
      <canvas
        ref={canvasRef}
        width={80}
        height={80}
        style={canvasStyle}
      />
      <FaMicrophoneAlt style={iconStyle} />
    </div>
  );
}

export default AudioRecorder;
