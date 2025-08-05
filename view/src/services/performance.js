// Performance Monitoring Service
import analytics from './analytics';
import { DEV_CONFIG } from '../utils/constants';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.observers = new Map();
    this.isEnabled = DEV_CONFIG.ANALYTICS_ENABLED;
    this.initializeObservers();
  }

  // Initialize performance observers
  initializeObservers() {
    if (!this.isEnabled || typeof PerformanceObserver === 'undefined') {
      return;
    }

    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackNavigationMetrics(entry);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);

      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackResourceMetrics(entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackLCPMetric(entry);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackFIDMetric(entry);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  // Track navigation metrics
  trackNavigationMetrics(entry) {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstPaint: 0,
      firstContentfulPaint: 0
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(paintEntry => {
      if (paintEntry.name === 'first-paint') {
        metrics.firstPaint = paintEntry.startTime;
      } else if (paintEntry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = paintEntry.startTime;
      }
    });

    this.recordMetric('page_load', metrics);
  }

  // Track resource loading metrics
  trackResourceMetrics(entry) {
    // Only track significant resources
    if (entry.transferSize < 1000) return; // Skip small resources

    const resourceType = this.getResourceType(entry.name);
    
    const metrics = {
      name: entry.name,
      type: resourceType,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize
    };

    this.recordMetric('resource_load', metrics);
  }

  // Track Largest Contentful Paint
  trackLCPMetric(entry) {
    this.recordMetric('largest_contentful_paint', {
      value: entry.startTime,
      element: entry.element?.tagName || 'unknown'
    });
  }

  // Track First Input Delay
  trackFIDMetric(entry) {
    this.recordMetric('first_input_delay', {
      value: entry.processingStart - entry.startTime,
      name: entry.name
    });
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(mp4|webm|ogg|mp3|wav)$/)) return 'media';
    if (url.includes('fonts') || url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  // Start timing a custom operation
  startTimer(name) {
    this.timers.set(name, {
      startTime: performance.now(),
      startTimestamp: Date.now()
    });
  }

  // End timing and record metric
  endTimer(name, additionalData = {}) {
    const timer = this.timers.get(name);
    if (!timer) {
      console.warn(`Timer '${name}' not found`);
      return;
    }

    const duration = performance.now() - timer.startTime;
    this.timers.delete(name);

    this.recordMetric('custom_timing', {
      name,
      duration,
      ...additionalData
    });

    return duration;
  }

  // Measure function execution time
  measureFunction(fn, name) {
    return async (...args) => {
      this.startTimer(name);
      try {
        const result = await fn(...args);
        this.endTimer(name, { success: true });
        return result;
      } catch (error) {
        this.endTimer(name, { success: false, error: error.message });
        throw error;
      }
    };
  }

  // Record a custom metric
  recordMetric(type, data) {
    const metric = {
      type,
      timestamp: Date.now(),
      ...data
    };

    // Store locally
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    this.metrics.get(type).push(metric);

    // Send to analytics
    if (this.isEnabled) {
      analytics.trackPerformance(type, data.duration || data.value || 0);
    }

    // Log in development
    if (DEV_CONFIG.VERBOSE_LOGGING) {
      console.log('Performance Metric:', type, data);
    }
  }

  // Track memory usage
  trackMemoryUsage() {
    if (performance.memory) {
      const memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };

      this.recordMetric('memory_usage', memory);
      return memory;
    }
    return null;
  }

  // Track recording performance
  trackRecordingPerformance(data) {
    this.recordMetric('recording_performance', {
      recordingType: data.type,
      duration: data.duration,
      fileSize: data.fileSize,
      compressionRatio: data.fileSize / (data.duration * 1000), // bytes per ms
      fps: data.fps || null,
      resolution: data.resolution || null
    });
  }

  // Track upload performance
  trackUploadPerformance(data) {
    this.recordMetric('upload_performance', {
      fileSize: data.fileSize,
      uploadTime: data.uploadTime,
      uploadSpeed: data.fileSize / (data.uploadTime / 1000), // bytes per second
      retryCount: data.retryCount || 0,
      success: data.success
    });
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {
      totalMetrics: 0,
      metricTypes: {},
      recentMetrics: []
    };

    for (const [type, metrics] of this.metrics) {
      summary.totalMetrics += metrics.length;
      summary.metricTypes[type] = metrics.length;
      
      // Get recent metrics (last 10)
      const recent = metrics.slice(-10);
      summary.recentMetrics.push(...recent);
    }

    // Sort recent metrics by timestamp
    summary.recentMetrics.sort((a, b) => b.timestamp - a.timestamp);
    summary.recentMetrics = summary.recentMetrics.slice(0, 20);

    return summary;
  }

  // Get Core Web Vitals
  getCoreWebVitals() {
    const vitals = {
      lcp: null, // Largest Contentful Paint
      fid: null, // First Input Delay
      cls: null  // Cumulative Layout Shift
    };

    // Get LCP
    const lcpMetrics = this.metrics.get('largest_contentful_paint') || [];
    if (lcpMetrics.length > 0) {
      vitals.lcp = lcpMetrics[lcpMetrics.length - 1].value;
    }

    // Get FID
    const fidMetrics = this.metrics.get('first_input_delay') || [];
    if (fidMetrics.length > 0) {
      vitals.fid = fidMetrics[fidMetrics.length - 1].value;
    }

    // CLS would need additional implementation
    
    return vitals;
  }

  // Monitor specific recording operations
  monitorRecordingOperations() {
    return {
      permission: this.measureFunction.bind(this),
      startRecording: this.measureFunction.bind(this),
      stopRecording: this.measureFunction.bind(this),
      uploadFile: this.measureFunction.bind(this)
    };
  }

  // Clear old metrics
  clearOldMetrics(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Date.now() - maxAge;
    
    for (const [type, metrics] of this.metrics) {
      const filtered = metrics.filter(metric => metric.timestamp > cutoff);
      this.metrics.set(type, filtered);
    }
  }

  // Enable/disable monitoring
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Cleanup observers
  cleanup() {
    for (const observer of this.observers.values()) {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Error disconnecting performance observer:', error);
      }
    }
    this.observers.clear();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const performance = {
  // Timer functions
  start: (name) => performanceMonitor.startTimer(name),
  end: (name, data) => performanceMonitor.endTimer(name, data),
  measure: (fn, name) => performanceMonitor.measureFunction(fn, name),
  
  // Recording specific
  trackRecording: (data) => performanceMonitor.trackRecordingPerformance(data),
  trackUpload: (data) => performanceMonitor.trackUploadPerformance(data),
  
  // System metrics
  trackMemory: () => performanceMonitor.trackMemoryUsage(),
  
  // Reporting
  getSummary: () => performanceMonitor.getPerformanceSummary(),
  getVitals: () => performanceMonitor.getCoreWebVitals(),
  
  // Maintenance
  clearOld: (maxAge) => performanceMonitor.clearOldMetrics(maxAge),
  setEnabled: (enabled) => performanceMonitor.setEnabled(enabled),
  cleanup: () => performanceMonitor.cleanup()
};

// Auto-cleanup old metrics every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.clearOldMetrics();
  }, 60 * 60 * 1000); // 1 hour
}

export default performance;