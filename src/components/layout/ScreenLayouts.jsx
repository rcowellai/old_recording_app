/**
 * ScreenLayouts.jsx
 * -----------------
 * Pre-built layout compositions for common screen patterns.
 * These provide ready-to-use layout structures while maintaining flexibility.
 */

import React from 'react';
import { Container, FlexBox, Section, ButtonRow, MediaContainer } from './Primitives';
import { useLayout } from './LayoutProvider';

/**
 * RecordingScreenLayout - Layout for the main recording interface
 */
export const RecordingScreenLayout = ({ 
  children, 
  screenId = 'recording',
  showTopBar = false,
  ...props 
}) => {
  const { responsive } = useLayout();
  
  return (
    <Container 
      screenId={screenId}
      maxWidth={responsive('100%', '480px')}
      padding={responsive('16px', '24px 16px')}
      fullHeight
      centerContent
      {...props}
    >
      {showTopBar && (
        <Section screenId={screenId} padding="0 0 var(--spacing-lg, 24px) 0">
          {/* Top bar content can be inserted here */}
        </Section>
      )}
      
      <FlexBox
        screenId={screenId}
        gap={responsive('16px', '24px')}
        align="center"
        style={{ flex: 1, width: '100%' }}
      >
        {children}
      </FlexBox>
    </Container>
  );
};

/**
 * ModalScreenLayout - Layout for modal/overlay content
 */
export const ModalScreenLayout = ({ 
  children, 
  screenId = 'modal',
  maxWidth = '600px',
  ...props 
}) => {
  return (
    <Container 
      screenId={screenId}
      maxWidth={maxWidth}
      padding="32px 24px"
      {...props}
    >
      <FlexBox screenId={screenId} gap="24px">
        {children}
      </FlexBox>
    </Container>
  );
};

/**
 * AdminScreenLayout - Layout for admin/settings pages
 */
export const AdminScreenLayout = ({ 
  children, 
  screenId = 'admin',
  sidebar = null,
  ...props 
}) => {
  const { responsive, isDesktop } = useLayout();
  
  const layoutDirection = sidebar && isDesktop ? 'row' : 'column';
  
  return (
    <Container 
      screenId={screenId}
      maxWidth={responsive('100%', '100%', '1200px')}
      padding={responsive('16px', '24px', '32px 24px')}
      {...props}
    >
      <FlexBox
        screenId={screenId}
        direction={layoutDirection}
        gap={responsive('24px', '32px')}
        align={sidebar ? 'flex-start' : 'stretch'}
      >
        {sidebar && (
          <div style={{ 
            minWidth: responsive('100%', '100%', '250px'),
            maxWidth: responsive('100%', '100%', '250px')
          }}>
            {sidebar}
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <FlexBox screenId={`${screenId}-content`} gap="32px">
            {children}
          </FlexBox>
        </div>
      </FlexBox>
    </Container>
  );
};

/**
 * MediaScreenLayout - Layout for media playback/viewing
 */
export const MediaScreenLayout = ({ 
  children, 
  media,
  controls,
  screenId = 'media',
  ...props 
}) => {
  const { responsive } = useLayout();
  
  return (
    <Container 
      screenId={screenId}
      maxWidth={responsive('100%', '600px')}
      padding={responsive('16px', '24px 16px')}
      {...props}
    >
      <FlexBox screenId={screenId} gap={responsive('16px', '24px')}>
        {/* Media container */}
        {media && (
          <MediaContainer 
            screenId={screenId}
            width="100%"
            aspectRatio="16/9"
          >
            {media}
          </MediaContainer>
        )}
        
        {/* Controls */}
        {controls && (
          <Section screenId={`${screenId}-controls`} padding="0">
            {controls}
          </Section>
        )}
        
        {/* Additional content */}
        {children}
      </FlexBox>
    </Container>
  );
};

/**
 * TwoColumnLayout - Generic two-column layout
 */
export const TwoColumnLayout = ({ 
  left, 
  right, 
  screenId = 'two-column',
  leftWidth = '1fr',
  rightWidth = '1fr',
  stackOnMobile = true,
  ...props 
}) => {
  const { responsive, isMobile } = useLayout();
  
  const shouldStack = stackOnMobile && isMobile;
  
  return (
    <Container screenId={screenId} {...props}>
      <FlexBox
        screenId={screenId}
        direction={shouldStack ? 'column' : 'row'}
        gap={responsive('16px', '24px', '32px')}
        align="flex-start"
      >
        <div style={{ 
          flex: shouldStack ? 'none' : leftWidth,
          width: shouldStack ? '100%' : 'auto'
        }}>
          {left}
        </div>
        
        <div style={{ 
          flex: shouldStack ? 'none' : rightWidth,
          width: shouldStack ? '100%' : 'auto'
        }}>
          {right}
        </div>
      </FlexBox>
    </Container>
  );
};

/**
 * CenteredLayout - Simple centered content layout
 */
export const CenteredLayout = ({ 
  children, 
  screenId = 'centered',
  maxWidth = '480px',
  ...props 
}) => {
  return (
    <Container 
      screenId={screenId}
      maxWidth={maxWidth}
      fullHeight
      centerContent
      {...props}
    >
      <FlexBox screenId={screenId} gap="24px" align="center">
        {children}
      </FlexBox>
    </Container>
  );
};

/**
 * FormLayout - Layout optimized for forms
 */
export const FormLayout = ({ 
  children, 
  title,
  actions,
  screenId = 'form',
  ...props 
}) => {
  const { responsive } = useLayout();
  
  return (
    <Container 
      screenId={screenId}
      maxWidth={responsive('100%', '600px')}
      padding={responsive('16px', '24px')}
      {...props}
    >
      <FlexBox screenId={screenId} gap={responsive('20px', '24px')}>
        {/* Title */}
        {title && (
          <Section screenId={`${screenId}-header`} padding="0 0 var(--spacing-md, 16px) 0">
            {title}
          </Section>
        )}
        
        {/* Form content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
        
        {/* Actions */}
        {actions && (
          <ButtonRow
            screenId={`${screenId}-actions`}
            variant="split"
            stackOnMobile
          >
            {actions}
          </ButtonRow>
        )}
      </FlexBox>
    </Container>
  );
};

// Export all layouts as default object
export default {
  RecordingScreenLayout,
  ModalScreenLayout,
  AdminScreenLayout,
  MediaScreenLayout,
  TwoColumnLayout,
  CenteredLayout,
  FormLayout
};