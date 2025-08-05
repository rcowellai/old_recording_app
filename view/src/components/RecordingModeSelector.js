import React, { useState } from 'react';
import { FaMicrophone, FaVideo } from 'react-icons/fa';

const RecordingModeSelector = ({ question, asker, onModeSelected }) => {
  const [selectedMode, setSelectedMode] = useState('video');
  const [isLoading, setIsLoading] = useState(false);

  const handleModeSelect = async (mode) => {
    if (isLoading) return;
    
    setSelectedMode(mode);
    setIsLoading(true);
    
    try {
      // Brief delay to show selection
      await new Promise(resolve => setTimeout(resolve, 300));
      onModeSelected(mode);
    } catch (error) {
      console.error('Error selecting mode:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="card-content">
      {/* Question Display */}
      <div className="question-display">
        <div className="question-asker">
          {asker} asked
        </div>
        <h1 className="question-text">
          {question}
        </h1>
      </div>

      {/* Recording Mode Selection */}
      <div className="prompt-info-text">
        Choose your recording mode
      </div>

      <div className="recording-mode-selector">
        {/* Audio Mode Button */}
        <button
          className={`mode-button audio ${selectedMode === 'audio' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('audio')}
          disabled={isLoading}
        >
          <div className="mode-icon">
            <FaMicrophone />
          </div>
          <div>Audio</div>
        </button>

        {/* Video Mode Button */}
        <button
          className={`mode-button video ${selectedMode === 'video' ? 'selected' : ''}`}
          onClick={() => handleModeSelect('video')}
          disabled={isLoading}
        >
          <div className="mode-icon">
            <FaVideo />
          </div>
          <div>Video</div>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading" style={{ marginTop: '20px' }}>
          Initializing {selectedMode} recording...
        </div>
      )}

      {/* Information Text */}
      {!isLoading && (
        <div style={{ 
          marginTop: '30px',
          fontSize: '0.85rem',
          color: '#666',
          lineHeight: '1.4'
        }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>Audio:</strong> Voice recording with real-time visualization
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>Video:</strong> Camera and microphone recording (720p)
          </p>
          <p style={{ marginBottom: '0' }}>
            Maximum recording time: 15 minutes
          </p>
        </div>
      )}
    </div>
  );
};

export default RecordingModeSelector;