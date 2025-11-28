// @AI-HINT: Performance monitoring utilities for Core Web Vitals and custom metrics
// Tracks LCP, FID, CLS, TTFB, and custom application metrics

type MetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';

interface PerformanceMetric {
  name: MetricName | string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

type MetricCallback = (metric: PerformanceMetric) => void;

class PerformanceMonitor {
  private callbacks: MetricCallback[] = [];
  private metrics: Map<string, PerformanceMetric> = new Map();

  /**
   * Initialize performance monitoring
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Dynamically import web-vitals for tree-shaking
      const { onCLS, onFID, onLCP, onTTFB, onFCP, onINP } = await import('web-vitals');

      onCLS(this.handleMetric.bind(this));
      onFID(this.handleMetric.bind(this));
      onLCP(this.handleMetric.bind(this));
      onTTFB(this.handleMetric.bind(this));
      onFCP(this.handleMetric.bind(this));
      onINP(this.handleMetric.bind(this));

      // Custom metrics
      this.trackCustomMetrics();
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  /**
   * Handle incoming metric
   */
  private handleMetric(metric: any): void {
    const processedMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id,
    };

    this.metrics.set(metric.name, processedMetric);
    this.callbacks.forEach((cb) => cb(processedMetric));

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${metric.name}:`, metric.value.toFixed(2), `(${processedMetric.rating})`);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(processedMetric);
    }
  }

  /**
   * Get rating based on Core Web Vitals thresholds
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      TTFB: [800, 1800],
      FCP: [1800, 3000],
      INP: [200, 500],
    };

    const [good, poor] = thresholds[name] || [0, 0];
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Track custom application metrics
   */
  private trackCustomMetrics(): void {
    // Track time to interactive (custom)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'longtask') {
              this.handleMetric({
                name: 'LongTask',
                value: entry.duration,
                delta: entry.duration,
                id: `longtask-${Date.now()}`,
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task observer not supported
      }
    }
  }

  /**
   * Send metric to analytics
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
        metric_rating: metric.rating,
      });
    }
  }

  /**
   * Subscribe to metric updates
   */
  onMetric(callback: MetricCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics);
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Check if all Core Web Vitals pass
   */
  allVitalsPassing(): boolean {
    const vitals = ['LCP', 'FID', 'CLS'];
    return vitals.every((name) => {
      const metric = this.metrics.get(name);
      return metric && metric.rating === 'good';
    });
  }

  /**
   * Measure custom timing
   */
  measureTiming(name: string, startMark: string, endMark?: string): number | null {
    if (typeof window === 'undefined' || !window.performance) return null;

    try {
      if (endMark) {
        window.performance.measure(name, startMark, endMark);
      } else {
        window.performance.measure(name, startMark);
      }

      const entries = window.performance.getEntriesByName(name, 'measure');
      const duration = entries[entries.length - 1]?.duration ?? null;

      if (duration !== null) {
        this.handleMetric({
          name: `custom_${name}`,
          value: duration,
          delta: duration,
          id: `${name}-${Date.now()}`,
        });
      }

      return duration;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set a performance mark
   */
  mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
