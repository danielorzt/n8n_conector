import posthog from 'posthog-js';

// Initialize PostHog for product analytics
export function initPostHog() {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('[NovaSync] PostHog API key not configured. Analytics disabled.');
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    
    // Privacy settings
    persistence: 'localStorage+cookie',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    
    // Session recording (optional)
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '.sensitive-data',
    },
    
    // Feature flags
    bootstrap: {
      featureFlags: {},
    },
    
    // Loaded callback
    loaded: (posthog) => {
      if (import.meta.env.DEV) {
        // In development, enable debug mode
        posthog.debug();
      }
      console.log('[NovaSync] PostHog initialized successfully');
    },
  });
}

// ==========================================
// Page & Navigation Tracking
// ==========================================

export function trackPageView(pageName: string, properties?: Record<string, unknown>) {
  posthog.capture('$pageview', {
    page_name: pageName,
    ...properties,
  });
}

// ==========================================
// E-Commerce Events
// ==========================================

export function trackProductViewed(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  posthog.capture('product_viewed', {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    product_price: product.price,
  });
}

export function trackProductAddedToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  posthog.capture('product_added_to_cart', {
    product_id: product.id,
    product_name: product.name,
    product_price: product.price,
    quantity: product.quantity,
  });
}

export function trackProductRemovedFromCart(productId: string, productName: string) {
  posthog.capture('product_removed_from_cart', {
    product_id: productId,
    product_name: productName,
  });
}

export function trackCheckoutStarted(cart: {
  items: number;
  subtotal: number;
  total: number;
}) {
  posthog.capture('checkout_started', {
    cart_items: cart.items,
    cart_subtotal: cart.subtotal,
    cart_total: cart.total,
  });
}

export function trackOrderCompleted(order: {
  id: string;
  total: number;
  items: number;
  customer: string;
}) {
  posthog.capture('order_completed', {
    order_id: order.id,
    order_total: order.total,
    order_items: order.items,
    customer_name: order.customer,
  });
}

// ==========================================
// Inventory & Product Management Events
// ==========================================

export function trackProductCreated(product: {
  id: string;
  name: string;
  category: string;
  price: number;
}) {
  posthog.capture('product_created', {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    product_price: product.price,
  });
}

export function trackProductUpdated(product: {
  id: string;
  name: string;
  changes: string[];
}) {
  posthog.capture('product_updated', {
    product_id: product.id,
    product_name: product.name,
    changes: changes,
  });
}

export function trackProductDeleted(productId: string, productName: string) {
  posthog.capture('product_deleted', {
    product_id: productId,
    product_name: productName,
  });
}

export function trackStockAlert(product: {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
}) {
  posthog.capture('stock_alert', {
    product_id: product.id,
    product_name: product.name,
    current_stock: product.currentStock,
    min_stock: product.minStock,
  });
}

// ==========================================
// Webhook & Integration Events
// ==========================================

export function trackWebhookConfigured(webhookUrl: string) {
  posthog.capture('webhook_configured', {
    webhook_url: webhookUrl,
    integration_type: 'n8n',
  });
}

export function trackWebhookSent(success: boolean, responseTime?: number) {
  posthog.capture('webhook_sent', {
    success,
    response_time_ms: responseTime,
  });
}

// ==========================================
// User Management
// ==========================================

export function identifyUser(userId: string, properties?: {
  email?: string;
  company?: string;
  role?: string;
}) {
  posthog.identify(userId, properties);
}

export function resetUser() {
  posthog.reset();
}

export function setUserProperties(properties: Record<string, unknown>) {
  posthog.people.set(properties);
}

// ==========================================
// Feature Flags
// ==========================================

export function isFeatureEnabled(featureName: string): boolean {
  return posthog.isFeatureEnabled(featureName) ?? false;
}

export function getFeatureFlag(featureName: string): string | boolean | undefined {
  return posthog.getFeatureFlag(featureName);
}

// ==========================================
// Custom Events
// ==========================================

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  posthog.capture(eventName, properties);
}

// Export the posthog instance for advanced usage
export { posthog };
