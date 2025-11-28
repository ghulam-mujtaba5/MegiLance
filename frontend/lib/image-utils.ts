// @AI-HINT: Image optimization utilities for responsive images and lazy loading
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface ImageSource {
  src: string;
  width: number;
  height?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty' | 'shimmer';
  blurDataURL?: string;
  sizes?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export interface ResponsiveImageConfig {
  breakpoints: number[];
  devicePixelRatios: number[];
  formats: Array<'webp' | 'avif' | 'jpeg' | 'png'>;
  quality: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ResponsiveImageConfig = {
  breakpoints: [320, 640, 768, 1024, 1280, 1536, 1920],
  devicePixelRatios: [1, 2, 3],
  formats: ['avif', 'webp', 'jpeg'],
  quality: 80,
};

// ============================================================================
// Image URL Generators
// ============================================================================

/**
 * Generate optimized image URL (for use with image CDN like Cloudinary, imgix, etc.)
 */
export function generateOptimizedUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    fit?: 'cover' | 'contain' | 'fill';
  } = {}
): string {
  // If using Next.js image optimization
  if (src.startsWith('/') || src.startsWith('/_next')) {
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
  }

  // For external URLs, return as-is (would typically use CDN transform)
  return src;
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  config: Partial<ResponsiveImageConfig> = {}
): string {
  const { breakpoints, quality } = { ...DEFAULT_CONFIG, ...config };
  
  return breakpoints
    .map((width) => {
      const url = generateOptimizedUrl(src, { width, quality });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(
  breakpoints: Array<{ minWidth: number; size: string }>,
  defaultSize: string = '100vw'
): string {
  const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
  
  const sizes = sorted.map(
    ({ minWidth, size }) => `(min-width: ${minWidth}px) ${size}`
  );
  
  sizes.push(defaultSize);
  
  return sizes.join(', ');
}

// ============================================================================
// Lazy Loading Hook
// ============================================================================

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useLazyImage(options: UseLazyImageOptions = {}) {
  const { threshold = 0.1, rootMargin = '200px', triggerOnce = true } = options;
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return {
    imgRef,
    isLoaded,
    isInView,
    hasError,
    handleLoad,
    handleError,
  };
}

// ============================================================================
// Progressive Image Loading
// ============================================================================

interface UseProgressiveImageOptions {
  lowQualitySrc: string;
  highQualitySrc: string;
}

export function useProgressiveImage({
  lowQualitySrc,
  highQualitySrc,
}: UseProgressiveImageOptions) {
  const [src, setSrc] = useState(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = highQualitySrc;
    
    img.onload = () => {
      setSrc(highQualitySrc);
      setIsHighQualityLoaded(true);
    };

    return () => {
      img.onload = null;
    };
  }, [highQualitySrc]);

  return {
    src,
    isHighQualityLoaded,
    blur: !isHighQualityLoaded,
  };
}

// ============================================================================
// Blur Placeholder Generator
// ============================================================================

/**
 * Generate a tiny placeholder for blur-up effect
 */
export function generateBlurPlaceholder(
  width: number = 10,
  height: number = 10,
  color: string = '#f0f0f0'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="blur" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="20" />
      </filter>
      <rect width="${width}" height="${height}" fill="${color}" filter="url(#blur)" />
    </svg>
  `;
  
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Generate shimmer placeholder
 */
export function generateShimmerPlaceholder(
  width: number,
  height: number
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f0f0f0">
            <animate attributeName="offset" values="-2; 1" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stop-color="#e0e0e0">
            <animate attributeName="offset" values="-1; 2" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stop-color="#f0f0f0">
            <animate attributeName="offset" values="0; 3" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shimmer)" />
    </svg>
  `;
  
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

// ============================================================================
// Aspect Ratio Calculator
// ============================================================================

export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}/${height / divisor}`;
}

export function getAspectRatioPercentage(width: number, height: number): number {
  return (height / width) * 100;
}

// ============================================================================
// Image Preloader
// ============================================================================

export class ImagePreloader {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loading: Map<string, Promise<HTMLImageElement>> = new Map();

  preload(src: string): Promise<HTMLImageElement> {
    // Return cached image
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src)!);
    }

    // Return existing loading promise
    if (this.loading.has(src)) {
      return this.loading.get(src)!;
    }

    // Create new loading promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loading.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loading.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.loading.set(src, promise);
    return promise;
  }

  preloadMultiple(sources: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(sources.map((src) => this.preload(src)));
  }

  isLoaded(src: string): boolean {
    return this.cache.has(src);
  }

  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }
}

// ============================================================================
// Global Preloader Instance
// ============================================================================

export const imagePreloader = new ImagePreloader();

// ============================================================================
// Responsive Image Component Helper
// ============================================================================

export interface ResponsiveImageSources {
  srcSet: string;
  sizes: string;
  src: string;
}

export function getResponsiveImageSources(
  src: string,
  options: {
    maxWidth?: number;
    aspectRatio?: number;
    breakpoints?: Array<{ minWidth: number; size: string }>;
  } = {}
): ResponsiveImageSources {
  const { maxWidth = 1920, breakpoints = [] } = options;

  // Generate srcSet
  const widths = DEFAULT_CONFIG.breakpoints.filter((w) => w <= maxWidth);
  const srcSet = widths
    .map((width) => {
      const url = generateOptimizedUrl(src, { width, quality: DEFAULT_CONFIG.quality });
      return `${url} ${width}w`;
    })
    .join(', ');

  // Generate sizes
  const sizes = breakpoints.length > 0
    ? generateSizes(breakpoints)
    : `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;

  return {
    srcSet,
    sizes,
    src: generateOptimizedUrl(src, { width: maxWidth }),
  };
}

// ============================================================================
// Avatar/Profile Image Helpers
// ============================================================================

export function getAvatarUrl(
  url: string | undefined | null,
  name: string,
  size: number = 100
): string {
  if (url) {
    return generateOptimizedUrl(url, { width: size, height: size });
  }
  
  // Generate placeholder with initials
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  const colors = [
    '#4573df', '#27AE60', '#E67E22', '#9B59B6', '#1ABC9C',
    '#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#E91E63'
  ];
  
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${bgColor}" />
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="central" 
        text-anchor="middle" 
        fill="white" 
        font-family="system-ui, sans-serif" 
        font-size="${size * 0.4}"
        font-weight="600"
      >
        ${initials}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default {
  generateOptimizedUrl,
  generateSrcSet,
  generateSizes,
  useLazyImage,
  useProgressiveImage,
  generateBlurPlaceholder,
  generateShimmerPlaceholder,
  calculateAspectRatio,
  getAspectRatioPercentage,
  imagePreloader,
  getResponsiveImageSources,
  getAvatarUrl,
};
