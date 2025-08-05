import React, { useEffect, useState } from 'react';
import { FaMicrophone } from 'react-icons/fa';

const AudioVisualizer = ({ isRecording, audioLevel, mode }) => {
  const [bars, setBars] = useState(Array(16).fill(0));
  const [animationFrame, setAnimationFrame] = useState(null);

  // Generate visualizer bars based on audio level
  useEffect(() => {
    if (isRecording && audioLevel > 0) {
      // Create realistic bar animation
      const newBars = Array.from({ length: 16 }, (_, index) => {
        // Create a wave pattern with some randomness
        const baseHeight = Math.sin((index / 16) * Math.PI * 2) * audioLevel;
        const randomVariation = (Math.random() - 0.5) * 0.3 * audioLevel;
        const normalizedHeight = Math.max(0, Math.min(1, baseHeight + randomVariation));
        
        return normalizedHeight;
      });
      
      setBars(newBars);
    } else if (!isRecording) {
      // Gradually fade out when not recording
      setBars(prevBars => 
        prevBars.map(bar => Math.max(0, bar * 0.9))
      );
    }
  }, [isRecording, audioLevel]);

  // Smooth animation for bars
  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        setBars(prevBars => 
          prevBars.map(bar => {
            // Add subtle fluctuation
            const fluctuation = (Math.random() - 0.5) * 0.1;
            return Math.max(0, Math.min(1, bar + fluctuation));
          })
        );
        
        setAnimationFrame(requestAnimationFrame(animate));
      };
      
      setAnimationFrame(requestAnimationFrame(animate));
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isRecording, animationFrame]);

  return (
    <div className={`audio-visualizer ${isRecording ? 'recording' : ''}`}>
      {isRecording ? (
        <div className="visualizer-bars">
          {bars.map((height, index) => (
            <div
              key={index}
              className="visualizer-bar"
              style={{
                height: `${Math.max(4, height * 40)}px`,
                backgroundColor: height > 0.3 ? '#d32f2f' : '#ff6b6b',
                opacity: height > 0.1 ? 1 : 0.6
              }}
            />
          ))}
        </div>
      ) : (
        <div className="mic-icon-container">
          <FaMicrophone 
            className={`mic-icon ${isRecording ? 'live' : ''}`}
            style={{
              fontSize: '2rem',
              color: isRecording ? '#d32f2f' : '#666'
            }}
          />
          {!isRecording && (
            <div style={{
              marginTop: '8px',
              fontSize: '0.85rem',
              color: '#666'
            }}>
              Ready to record
            </div>
          )}
        </div>
      )}
      
      {/* Audio level indicator */}
      {isRecording && audioLevel > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          fontSize: '0.7rem',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 6px',
          borderRadius: '3px'
        }}>
          {Math.round(audioLevel * 100)}%
        </div>
      )}
      
      <style jsx>{`
        .audio-visualizer {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 300px;
          height: 80px;
          background-color: var(--bg-tertiary);
          border-radius: var(--border-radius);
          margin: 20px auto;
          overflow: hidden;
          transition: background-color 0.3s ease;
        }
        
        .audio-visualizer.recording {
          background-color: #f8f8f8;
        }
        
        .visualizer-bars {
          display: flex;
          align-items: end;
          justify-content: center;
          gap: 2px;
          height: 50px;
          padding: 0 20px;
        }
        
        .visualizer-bar {
          width: 3px;
          min-height: 4px;
          background-color: #d32f2f;
          border-radius: 2px;
          transition: height 0.1s ease, background-color 0.2s ease;
        }
        
        .mic-icon-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .mic-icon {
          transition: color 0.3s ease;
        }
        
        .mic-icon.live {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.7; 
            transform: scale(1.1);
          }
          100% { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        @media (max-width: 480px) {
          .audio-visualizer {
            height: 70px;
            max-width: 280px;
          }
          
          .visualizer-bars {
            height: 40px;
            gap: 1px;
          }
          
          .visualizer-bar {
            width: 2px;
          }
          
          .mic-icon {
            font-size: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioVisualizer;