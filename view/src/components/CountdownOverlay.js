import React, { useEffect, useState } from 'react';

const CountdownOverlay = ({ number }) => {
  const [currentNumber, setCurrentNumber] = useState(number);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (number !== currentNumber) {
      setAnimate(true);
      
      // Update number after animation starts
      setTimeout(() => {
        setCurrentNumber(number);
        setAnimate(false);
      }, 100);
    }
  }, [number, currentNumber]);

  return (
    <div className="countdown-overlay">
      <div className={`countdown-text ${animate ? 'animate' : ''}`}>
        {currentNumber}
      </div>
      
      <style jsx>{`
        .countdown-text.animate {
          animation: countdownPulse 1s ease-in-out;
        }
        
        @keyframes countdownPulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CountdownOverlay;