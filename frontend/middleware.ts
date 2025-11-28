// @AI-HINT: Next.js middleware for security headers and request handling

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to add security headers to all responses
 * and handle authentication redirects
 */
export function middleware(request: NextRequest) {
  // Get response
  const response = NextResponse.next();

  // Security Headers
  const securityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy - don't leak referrer to cross-origin requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy - restrict browser features
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CSP Header (Content Security Policy) - adjust for your needs
  // Note: In development, you might need to relax some of these
  if (process.env.NODE_ENV === 'production') {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com wss: https:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ];
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  }

  // Handle authentication for protected routes
  const { pathname } = request.nextUrl;
  
  // Protected portal routes that require authentication
  const protectedPaths = [
    '/client',
    '/freelancer', 
    '/admin',
    '/dashboard',
    '/settings',
    '/messages',
  ];

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Check for auth token in cookies
  const authToken = request.cookies.get('auth_token')?.value;
  
  if (isProtectedPath && !authToken) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Prevent authenticated users from accessing auth pages
  const authPaths = ['/login', '/signup', '/forgot-password'];
  const isAuthPath = authPaths.some(path => pathname === path);
  
  if (isAuthPath && authToken) {
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

/**
 * Configure which paths the middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - API routes (handled by backend)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
