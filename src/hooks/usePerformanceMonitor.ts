import React, { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentCount: number;
  lastUpdate: number;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  sampleInterval?: number;
  logThreshold?: number;
}

export function usePerformanceMonitor(
  componentName: string,
  options: UsePerformanceMonitorOptions = {}
) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    sampleInterval = 1000,
    logThreshold = 16 // 16ms = 60fps threshold
  } = options;

  const renderStartRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    lastUpdate: Date.now()
  });
  const [metrics, setMetrics] = useState<PerformanceMetrics>(metricsRef.current);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    if (!enabled) return;
    renderStartRef.current = performance.now();
  }, [enabled]);

  // End performance measurement
  const endMeasurement = useCallback(() => {
    if (!enabled || renderStartRef.current === 0) return;

    const renderTime = performance.now() - renderStartRef.current;
    const now = Date.now();

    metricsRef.current = {
      renderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
      componentCount: metricsRef.current.componentCount + 1,
      lastUpdate: now
    };

    // Log performance warnings
    if (renderTime > logThreshold) {
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${logThreshold}ms)`
      );
    }

    renderStartRef.current = 0;
  }, [enabled, componentName, logThreshold]);

  // Periodic metrics update
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setMetrics({ ...metricsRef.current });
    }, sampleInterval);

    return () => clearInterval(interval);
  }, [enabled, sampleInterval]);

  // Memory usage monitoring
  const getMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }, []);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (metrics.renderTime > 16) {
      suggestions.push('Consider using React.memo() or useMemo() for expensive calculations');
    }
    
    if (metrics.renderTime > 50) {
      suggestions.push('Component is rendering slowly - consider code splitting or virtualization');
    }
    
    const memoryInfo = getMemoryUsage();
    if (memoryInfo && memoryInfo.used > memoryInfo.limit * 0.8) {
      suggestions.push('High memory usage detected - check for memory leaks');
    }
    
    return suggestions;
  }, [metrics.renderTime, getMemoryUsage]);

  return {
    startMeasurement,
    endMeasurement,
    metrics,
    getMemoryUsage,
    getOptimizationSuggestions,
    isEnabled: enabled
  };
}

// HOC for automatic performance monitoring
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const PerformanceMonitoredComponent = (props: P) => {
    const { startMeasurement, endMeasurement } = usePerformanceMonitor(displayName);
    
    useEffect(() => {
      startMeasurement();
      return () => {
        endMeasurement();
      };
    });
    
    return React.createElement(WrappedComponent, props);
  };
  
  PerformanceMonitoredComponent.displayName = `withPerformanceMonitor(${displayName})`;
  
  return PerformanceMonitoredComponent;
}

// Performance debugging utilities
export const PerformanceDebugger = {
  // Log render cycles
  logRender: (componentName: string, props?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName}`, props);
    }
  },

  // Measure function execution time
  measureFunction: <T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T => {
    return ((...args: any[]) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Function] ${name} took ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    }) as T;
  },

  // Track component mount/unmount
  trackLifecycle: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Lifecycle] ${componentName} mounted`);
      
      return () => {
        console.log(`[Lifecycle] ${componentName} unmounted`);
      };
    }
    
    return () => {};
  }
};