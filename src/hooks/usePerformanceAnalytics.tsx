
import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'paint' | 'resource' | 'custom';
}

interface PerformanceAnalytics {
  metrics: PerformanceMetric[];
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordMetric: (name: string, value: number, type?: PerformanceMetric['type']) => void;
  getMetricsByType: (type: PerformanceMetric['type']) => PerformanceMetric[];
  clearMetrics: () => void;
}

export const usePerformanceAnalytics = (): PerformanceAnalytics => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const recordMetric = useCallback((
    name: string, 
    value: number, 
    type: PerformanceMetric['type'] = 'custom'
  ) => {
    if (!isRecording) return;
    
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type
    };
    
    setMetrics(prev => [...prev, metric]);
  }, [isRecording]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    
    // Record initial navigation metrics
    if (performance.timing) {
      const timing = performance.timing;
      recordMetric('dom-content-loaded', timing.domContentLoadedEventEnd - timing.navigationStart, 'navigation');
      recordMetric('page-load', timing.loadEventEnd - timing.navigationStart, 'navigation');
    }

    // Record paint metrics
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        recordMetric(entry.name, entry.startTime, 'paint');
      });
    }
  }, [recordMetric]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const getMetricsByType = useCallback((type: PerformanceMetric['type']) => {
    return metrics.filter(metric => metric.type === type);
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  useEffect(() => {
    if (!isRecording) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          recordMetric(`resource-${entry.name}`, entry.duration, 'resource');
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => {
      observer.disconnect();
    };
  }, [isRecording, recordMetric]);

  return {
    metrics,
    isRecording,
    startRecording,
    stopRecording,
    recordMetric,
    getMetricsByType,
    clearMetrics
  };
};
