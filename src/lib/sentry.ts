import * as Sentry from '@sentry/react';

// Initialize Sentry for error tracking and performance monitoring
export function initSentry() {
  // Only initialize if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('[NovaSync] Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/.*\.supabase\.co/,
      /^https:\/\/.*\.n8n\.cloud/,
    ],

    // Session Replay for debugging user issues
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: `novasync@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

    // Integration configurations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text for privacy
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive query parameters
      if (event.request?.query_string) {
        event.request.query_string = '[Filtered]';
      }
      return event;
    },
    
    // Custom tags for filtering
    initialScope: {
      tags: {
        app: 'novasync',
        region: 'colombia',
        type: 'b2b-ecommerce',
      },
    },
  });

  console.log('[NovaSync] Sentry initialized successfully');
}

// Utility functions for manual error tracking
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Track specific business events
export function trackWebhookEvent(webhookUrl: string, success: boolean, responseTime?: number) {
  Sentry.addBreadcrumb({
    category: 'webhook',
    message: `Webhook ${success ? 'sent' : 'failed'}: ${webhookUrl}`,
    level: success ? 'info' : 'error',
    data: {
      url: webhookUrl,
      success,
      responseTime,
    },
  });
}

export function trackSaleEvent(saleId: string, total: number, itemCount: number) {
  Sentry.addBreadcrumb({
    category: 'sale',
    message: `Sale completed: ${saleId}`,
    level: 'info',
    data: {
      saleId,
      total,
      itemCount,
    },
  });
}

export function trackProductEvent(action: 'created' | 'updated' | 'deleted', productId: string, productName: string) {
  Sentry.addBreadcrumb({
    category: 'product',
    message: `Product ${action}: ${productName}`,
    level: 'info',
    data: {
      action,
      productId,
      productName,
    },
  });
}

// User identification for error context
export function identifyUser(userId: string, email?: string, company?: string) {
  Sentry.setUser({
    id: userId,
    email,
    company,
  });
}

export function clearUser() {
  Sentry.setUser(null);
}

// Performance transaction helpers
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

export { Sentry };
