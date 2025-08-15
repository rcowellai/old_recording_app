/**
 * DebugConfirmModal.jsx
 * ---------------------
 * Debug version of ModernConfirmModal to troubleshoot the disappearing issue.
 * This version includes console logs to track the modal lifecycle.
 */

import React, { useCallback, useEffect } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useTokens } from '../../theme/TokenProvider';

const DebugConfirmModal = NiceModal.create(({ 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?", 
  confirmText = "Yes",
  cancelText = "No",
  variant = "warning" // warning, danger, info
}) => {
  const modal = useModal();
  const { tokens } = useTokens();

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('🔍 Modal state:', {
      visible: modal.visible,
      id: modal.id,
      args: modal.args
    });
  }, [modal.visible, modal.id]);

  // Handle confirm action - use useCallback to prevent recreation
  const handleConfirm = useCallback(() => {
    console.log('✅ Confirm clicked');
    modal.resolve(true);
    modal.hide();
  }, [modal]);

  // Handle cancel action - use useCallback to prevent recreation
  const handleCancel = useCallback(() => {
    console.log('❌ Cancel clicked');
    modal.resolve(false);
    modal.hide();
  }, [modal]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      console.log('🖱️ Backdrop clicked');
      handleCancel();
    }
  }, [handleCancel]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        console.log('⌨️ Escape pressed');
        handleCancel();
      }
    };
    
    if (modal.visible) {
      console.log('🎧 Adding escape listener');
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      console.log('🎧 Removing escape listener');
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [modal.visible, handleCancel]);

  // Simple render - no auto-removal logic for debugging
  useEffect(() => {
    return () => {
      console.log('🧹 Modal component cleanup');
    };
  }, []);

  console.log('🎨 Rendering modal, visible:', modal.visible);

  if (!modal.visible) {
    console.log('👻 Modal not visible, returning null');
    return null;
  }

  // Variant-specific styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: '#dc3545',
          confirmBg: '#dc3545',
          confirmText: '#ffffff'
        };
      case 'info':
        return {
          iconColor: tokens.colors.accent.bg,
          confirmBg: tokens.colors.accent.bg,
          confirmText: tokens.colors.accent.text
        };
      default: // warning
        return {
          iconColor: '#fbbf24',
          confirmBg: tokens.colors.accent.bg,
          confirmText: tokens.colors.accent.text
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className="modern-modal-overlay"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '20px',
        animation: 'modalFadeIn 0.2s ease-out'
      }}
    >
      <div
        className="modern-modal-content"
        style={{
          backgroundColor: tokens.colors.card.bg,
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          maxWidth: '400px',
          width: '100%',
          padding: '32px 24px 24px',
          textAlign: 'center',
          animation: 'modalSlideIn 0.3s ease-out',
          fontFamily: tokens.fonts.primary
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Debug info */}
        <div style={{
          fontSize: '0.7rem',
          color: '#666',
          marginBottom: '16px',
          fontFamily: 'monospace'
        }}>
          DEBUG: visible={modal.visible ? 'true' : 'false'}, id={modal.id}
        </div>

        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: `${variantStyles.iconColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '28px',
            color: variantStyles.iconColor
          }}
        >
          {variant === 'danger' ? '⚠️' : variant === 'info' ? 'ℹ️' : '❓'}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: tokens.fonts.weights.semibold,
            color: tokens.colors.card.text,
            margin: '0 0 12px 0',
            lineHeight: 1.3
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: '1rem',
            color: tokens.colors.textGray,
            lineHeight: 1.5,
            margin: '0 0 32px 0'
          }}
        >
          {message}
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}
        >
          <button
            onClick={handleCancel}
            style={{
              padding: '12px 24px',
              border: `1px solid ${tokens.colors.secondary.bg}`,
              borderRadius: tokens.layout.borderRadius,
              backgroundColor: 'transparent',
              color: tokens.colors.secondary.text,
              fontSize: '1rem',
              fontWeight: tokens.fonts.weights.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '90px'
            }}
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: tokens.layout.borderRadius,
              backgroundColor: variantStyles.confirmBg,
              color: variantStyles.confirmText,
              fontSize: '1rem',
              fontWeight: tokens.fonts.weights.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '90px'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
});

export default DebugConfirmModal;