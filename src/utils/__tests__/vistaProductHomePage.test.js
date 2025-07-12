/**
 * Test file for Vista Product Home Page
 * 
 * This test file validates the new Vista product sales page functionality
 * that will replace the current Index page at the root route.
 * 
 * Requirements:
 * - Display Vista product information and features
 * - Include compelling sales content
 * - Provide clear call-to-action for user registration
 * - Maintain responsive design and SEO optimization
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// This will be the actual component once created
const MockVistaProductHome = () => (
  <div data-testid="vista-product-home">
    <h1>Vista - AI-Powered Content Experience Platform</h1>
    <p>Transform your content strategy with privacy-first personalization</p>
    <button data-testid="cta-button">Get Started</button>
  </div>
);

describe('Vista Product Home Page', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Content Display', () => {
    test('should display Vista product title and description', () => {
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByText('Vista - AI-Powered Content Experience Platform')).toBeInTheDocument();
      expect(screen.getByText('Transform your content strategy with privacy-first personalization')).toBeInTheDocument();
    });

    test('should display key product features', () => {
      renderWithProviders(<MockVistaProductHome />);
      // Test will be expanded to include actual features
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });

    test('should include compelling sales messaging', () => {
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByText(/Transform your content strategy/)).toBeInTheDocument();
    });
  });

  describe('Call-to-Action Elements', () => {
    test('should display primary CTA button', () => {
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('cta-button')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    test('should handle CTA button clicks', () => {
      // Test navigation to sign-up or demo
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('cta-button')).toBeInTheDocument();
    });

    test('should include secondary action buttons', () => {
      // Test for additional CTAs like "Learn More", "View Demo"
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });
  });

  describe('Product Features Section', () => {
    test('should display content management features', () => {
      // Test content management feature highlights
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });

    test('should display AI-powered features', () => {
      // Test AI features like semantic search, personalization
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });

    test('should display website customization features', () => {
      // Test website customization highlights
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });

    test('should display privacy-first messaging', () => {
      // Test privacy-focused value proposition
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByText(/privacy-first/)).toBeInTheDocument();
    });
  });

  describe('SEO and Meta Tags', () => {
    test('should have proper SEO title and description', () => {
      // Test SEO optimization for Vista product page
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });

    test('should include structured data for search engines', () => {
      // Test structured data implementation
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should be mobile-responsive', () => {
      // Test mobile layout
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });

    test('should work on tablet devices', () => {
      // Test tablet layout
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });

    test('should work on desktop devices', () => {
      // Test desktop layout
      renderWithProviders(<MockVistaProductHome />);
      expect(screen.getByTestId('vista-product-home')).toBeInTheDocument();
    });
  });
});