// Enhanced Analytics Service
import { recordAnalyticsEvent, logError } from './firebase';
import { ANALYTICS_EVENTS, DEV_CONFIG } from '../utils/constants';
import { getDeviceType, getBrowserInfo, generateEventId } from '../utils/helpers';

class AnalyticsService {
  constructor() {
    this.sessionId = null;
    this.sessionStartTime = null;
    this.eventQueue = [];
    this.isEnabled = DEV_CONFIG.ANALYTICS_ENABLED;
    this.userProperties = this.collectUserProperties();
  }

  // Initialize analytics for a session
  initialize(sessionId) {
    this.sessionId = sessionId;
    this.sessionStartTime = Date.now();
    
    if (this.isEnabled) {
      this.trackEvent(ANALYTICS_EVENTS.SESSION_START, {
        sessionId,
        userAgent: navigator.userAgent,
        ...this.userProperties
      });
    }
  }

  // Collect user properties
  collectUserProperties() {
    const browserInfo = getBrowserInfo();
    return {
      deviceType: getDeviceType(),
      browser: browserInfo.browser,
      browserVersion: browserInfo.version,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
  }

  // Track a custom event
  async trackEvent(eventType, data = {}) {
    if (!this.isEnabled || !this.sessionId) {
      return;
    }

    const eventData = {
      eventId: generateEventId(),
      eventType,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
      ...this.userProperties,
      ...data
    };

    try {
      await recordAnalyticsEvent(this.sessionId, eventType, eventData);
      
      if (DEV_CONFIG.VERBOSE_LOGGING) {
        console.log('Analytics Event:', eventType, eventData);
      }
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
      // Queue the event for retry
      this.eventQueue.push(eventData);
    }
  }

  // Track user interactions
  trackInteraction(element, action, data = {}) {
    this.trackEvent('user_interaction', {
      element,
      action,
      ...data
    });
  }

  // Track errors
  async trackError(error, context = '', severity = 'error') {
    const errorData = {
      error: error.message || error,
      stack: error.stack || '',
      context,
      severity,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Log to Firebase
    try {
      await logError(this.sessionId, error, context);
    } catch (logErr) {
      console.error('Failed to log error to Firebase:', logErr);
    }

    // Track as analytics event
    this.trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, errorData);
  }

  // Track performance metrics
  trackPerformance(metric, value, unit = 'ms') {
    this.trackEvent('performance_metric', {
      metric,
      value,
      unit,
      timestamp: performance.now()
    });
  }

  // Track recording quality metrics
  trackRecordingQuality(data) {
    this.trackEvent('recording_quality', {
      fileSize: data.fileSize,
      duration: data.duration,
      recordingType: data.recordingType,
      compressionRatio: data.compressionRatio || null,
      ...data
    });
  }

  // Track conversion funnel
  trackFunnelStep(step, data = {}) {
    const funnelSteps = [
      'session_loaded',
      'mode_selected', 
      'permissions_granted',
      'recording_started',
      'recording_completed',
      'upload_started',
      'upload_completed'
    ];

    const stepIndex = funnelSteps.indexOf(step);
    
    this.trackEvent('funnel_step', {
      step,
      stepIndex,
      stepName: step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      ...data
    });
  }

  // Track user journey time
  trackTimingEvent(eventName, startTime, endTime = Date.now()) {
    const duration = endTime - startTime;
    
    this.trackEvent('timing_event', {
      eventName,
      duration,
      startTime,
      endTime
    });
  }

  // Track feature usage
  trackFeatureUsage(feature, action, data = {}) {
    this.trackEvent('feature_usage', {
      feature,
      action,
      ...data
    });
  }

  // Retry failed events
  async retryFailedEvents() {
    if (this.eventQueue.length === 0) return;

    const eventsToRetry = [...this.eventQueue];
    this.eventQueue = [];

    for (const eventData of eventsToRetry) {
      try {
        await recordAnalyticsEvent(
          this.sessionId, 
          eventData.eventType, 
          eventData
        );
      } catch (error) {
        // Put back in queue if still failing
        this.eventQueue.push(eventData);
      }
    }
  }

  // Get session summary
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
      startTime: this.sessionStartTime,
      userProperties: this.userProperties,
      queuedEvents: this.eventQueue.length
    };
  }

  // Enable/disable analytics
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Convenience functions for common events
export const analytics = {
  // Core tracking
  initialize: (sessionId) => analyticsService.initialize(sessionId),
  track: (event, data) => analyticsService.trackEvent(event, data),
  
  // Specific event tracking
  trackPageView: (page) => analyticsService.trackEvent('page_view', { page }),
  trackModeSelection: (mode) => analyticsService.trackEvent(ANALYTICS_EVENTS.MODE_SELECTED, { mode }),
  trackPermissionRequest: (type) => analyticsService.trackEvent('permission_request', { type }),
  trackPermissionResult: (type, granted) => analyticsService.trackEvent(
    granted ? ANALYTICS_EVENTS.PERMISSIONS_GRANTED : ANALYTICS_EVENTS.PERMISSION_DENIED, 
    { type, granted }
  ),
  trackRecordingStart: (mode) => analyticsService.trackEvent(ANALYTICS_EVENTS.RECORDING_STARTED, { mode }),
  trackRecordingPause: (duration) => analyticsService.trackEvent(ANALYTICS_EVENTS.RECORDING_PAUSED, { duration }),
  trackRecordingResume: (duration) => analyticsService.trackEvent(ANALYTICS_EVENTS.RECORDING_RESUMED, { duration }),
  trackRecordingComplete: (data) => analyticsService.trackEvent(ANALYTICS_EVENTS.RECORDING_COMPLETED, data),
  trackUploadStart: (data) => analyticsService.trackEvent(ANALYTICS_EVENTS.UPLOAD_STARTED, data),
  trackUploadProgress: (progress) => analyticsService.trackEvent(ANALYTICS_EVENTS.UPLOAD_PROGRESS, { progress }),
  trackUploadComplete: (data) => analyticsService.trackEvent(ANALYTICS_EVENTS.UPLOAD_COMPLETED, data),
  trackUploadFailed: (error) => analyticsService.trackEvent(ANALYTICS_EVENTS.UPLOAD_FAILED, { error: error.message }),
  
  // Error tracking
  trackError: (error, context, severity) => analyticsService.trackError(error, context, severity),
  
  // Performance tracking
  trackPerformance: (metric, value, unit) => analyticsService.trackPerformance(metric, value, unit),
  trackTiming: (event, startTime, endTime) => analyticsService.trackTimingEvent(event, startTime, endTime),
  
  // User behavior
  trackInteraction: (element, action, data) => analyticsService.trackInteraction(element, action, data),
  trackFeature: (feature, action, data) => analyticsService.trackFeatureUsage(feature, action, data),
  trackFunnel: (step, data) => analyticsService.trackFunnelStep(step, data),
  
  // Quality metrics
  trackQuality: (data) => analyticsService.trackRecordingQuality(data),
  
  // Utility
  getSummary: () => analyticsService.getSessionSummary(),
  retry: () => analyticsService.retryFailedEvents(),
  setEnabled: (enabled) => analyticsService.setEnabled(enabled)
};

// Auto-retry failed events periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    analyticsService.retryFailedEvents();
  }, 30000); // Retry every 30 seconds
}

export default analytics;