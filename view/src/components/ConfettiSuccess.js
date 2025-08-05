import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

const ConfettiSuccess = () => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="confetti-screen">
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
          colors={['#2c2f48', '#e4e2d8', '#f5f4f0', '#666', '#999']}
        />
      )}
      
      <div className="success-content">
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: '20px',
          animation: 'bounce 2s infinite'
        }}>
          🎉
        </div>
        
        <h1 className="success-title">
          Memory Captured!
        </h1>
        
        <p className="success-message">
          Your story has been successfully recorded and saved. 
          Thank you for sharing your memory.
        </p>
        
        <div style={{ 
          marginTop: '40px',
          fontSize: '0.9rem',
          color: '#666',
          lineHeight: '1.5'
        }}>
          <p>Your recording is now safely stored and will be processed shortly.</p>
          <p>You can close this page - your work is complete!</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        .success-content {
          text-align: center;
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .success-title {
          font-size: 2rem;
          font-weight: 600;
          color: var(--color-primary);
          margin-bottom: 16px;
          animation: fadeInUp 1s ease-out 0.5s both;
        }
        
        .success-message {
          font-size: 1.1rem;
          color: var(--color-secondary);
          margin-bottom: 30px;
          animation: fadeInUp 1s ease-out 0.7s both;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 480px) {
          .success-title {
            font-size: 1.6rem;
          }
          
          .success-message {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfettiSuccess;