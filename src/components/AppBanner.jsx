/**
 * AppBanner.jsx
 * -------------
 * Configurable top banner component for the Recording App.
 * Provides a 100px (configurable) banner that adjusts all app positioning.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTokens } from '../theme/TokenProvider';
import Logo from '../Assets/Logo.png';

/**
 * AppBanner Component
 * Displays a permanent logo banner at the top of the application
 */
const AppBanner = ({ 
  logoSize = 60,  // Change this value to adjust logo size
  className = '', 
  style = {} 
}) => {
  const { tokens } = useTokens();

  // Don't render if banner is disabled in tokens
  if (!tokens.banner.enabled) {
    return null;
  }

  const bannerStyle = {
    ...style
  };

  const logoStyle = {
    height: `${logoSize}px`,
    width: 'auto',
    objectFit: 'contain',
    maxWidth: '100%',
    maxHeight: '80%', // Ensures logo doesn't exceed banner height
  };

  return (
    <div className={`app-banner ${className}`.trim()} style={bannerStyle}>
      <img 
        src={Logo} 
        alt="Love Retold Logo" 
        style={logoStyle}
      />
    </div>
  );
};

/**
 * BannerControl Component
 * Provides toggle and configuration controls for the banner
 */
export const BannerControl = ({ className = '' }) => {
  const { tokens, enableBanner, disableBanner, updateBannerConfig } = useTokens();

  const handleToggle = () => {
    if (tokens.banner.enabled) {
      disableBanner();
    } else {
      enableBanner();
    }
  };

  const handleHeightChange = (e) => {
    const height = e.target.value + 'px';
    updateBannerConfig({ height });
  };

  const handleColorChange = (e) => {
    updateBannerConfig({ backgroundColor: e.target.value });
  };

  return (
    <div className={`banner-control ${className}`.trim()}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={tokens.banner.enabled}
            onChange={handleToggle}
          />
          Enable Banner
        </label>
      </div>

      {tokens.banner.enabled && (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Height: {parseInt(tokens.banner.height)}px
            </label>
            <input
              type="range"
              min="50"
              max="200"
              value={parseInt(tokens.banner.height)}
              onChange={handleHeightChange}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Background Color:
            </label>
            <input
              type="color"
              value={tokens.banner.backgroundColor}
              onChange={handleColorChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

AppBanner.propTypes = {
  logoSize: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object
};

BannerControl.propTypes = {
  className: PropTypes.string
};

export default AppBanner;