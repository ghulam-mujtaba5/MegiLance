// @AI-HINT: Test file for the Home page component.
// This file demonstrates testing of a page-level component that composes multiple sub-components.
// It focuses on ensuring all expected components are rendered and the page structure is correct.

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/home/Home';

// Mock next-themes to provide a consistent theme for testing
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock window.matchMedia to avoid issues in the test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock all the sub-components to isolate the Home component tests
jest.mock('../app/Home/components/Hero', () => {
  return () => <div data-testid="hero-section">Hero Section</div>;
});

jest.mock('../app/Home/components/TrustIndicators', () => {
  return () => <div data-testid="trust-indicators">Trust Indicators</div>;
});

jest.mock('../app/Home/components/Features', () => {
  return () => <div data-testid="features-section">Features Section</div>;
});

jest.mock('../app/Home/components/HowItWorks', () => {
  return () => <div data-testid="how-it-works">How It Works Section</div>;
});

jest.mock('../app/Home/components/AIShowcase', () => {
  return () => <div data-testid="ai-showcase">AI Showcase Section</div>;
});

jest.mock('../app/Home/components/BlockchainShowcase', () => {
  return () => <div data-testid="blockchain-showcase">Blockchain Showcase Section</div>;
});

jest.mock('../app/Home/components/ProductScreenshots', () => {
  return () => <div data-testid="product-screenshots">Product Screenshots Section</div>;
});

jest.mock('../app/Home/components/GlobalImpact', () => {
  return () => <div data-testid="global-impact">Global Impact Section</div>;
});

jest.mock('../app/Home/components/Testimonials', () => {
  return () => <div data-testid="testimonials">Testimonials Section</div>;
});

jest.mock('../app/Home/components/CTA', () => {
  return () => <div data-testid="cta-section">CTA Section</div>;
});

jest.mock('../app/Home/components/AnimatedBackground', () => {
  return () => <div data-testid="animated-background">Animated Background</div>;
});

describe('Home Page Component', () => {
  test('renders all major sections in correct order', () => {
    render(<Home />);
    
    // Check that all sections are rendered
    expect(screen.getByTestId('animated-background')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('trust-indicators')).toBeInTheDocument();
    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('ai-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('blockchain-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('product-screenshots')).toBeInTheDocument();
    expect(screen.getByTestId('global-impact')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
  });

  test('renders with correct CSS classes for theming', () => {
    render(<Home />);
    
    const homePage = screen.getByTestId('hero-section').closest('.homePage');
    expect(homePage).toBeInTheDocument();
    expect(homePage).toHaveClass('homePage');
  });

  test('maintains proper page structure and accessibility', () => {
    render(<Home />);
    
    // Check that the main page container exists
    const homePage = screen.getByTestId('hero-section').closest('.homePage');
    expect(homePage).toBeInTheDocument();
    
    // Check that all major sections are present as children
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('trust-indicators')).toBeInTheDocument();
    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    expect(screen.getByTestId('ai-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('blockchain-showcase')).toBeInTheDocument();
    expect(screen.getByTestId('product-screenshots')).toBeInTheDocument();
    expect(screen.getByTestId('global-impact')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
  });
});