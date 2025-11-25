// Lightweight Shopify Storefront client for browser usage
// Usage: import { initShopify, getProducts, renderProductCard, createCheckout, cartAPI } from './src/js/shopify-client.js'

let SHOP = '';
// Cart state (in-memory, can be persisted by UI)
let cart = {
  items: [], // { variantId, title, price, quantity }
};

// Cart API for UI integration
export const cartAPI = {
  // Return a shallow copy of the items array for safe consumption
  getCart: () => cart.items.slice(),
  addItem: (variantId, title, price, quantity = 1) => {
    const idx = cart.items.findIndex(i => i.variantId === variantId);
    if (idx >= 0) {
      cart.items[idx].quantity += quantity;
    } else {
      cart.items.push({ variantId, title, price, quantity });
    }
  },
  removeItem: (variantId) => {
    cart.items = cart.items.filter(i => i.variantId !== variantId);
  },
  updateQuantity: (variantId, quantity) => {
    const idx = cart.items.findIndex(i => i.variantId === variantId);
    if (idx >= 0) {
      cart.items[idx].quantity = quantity;
      if (cart.items[idx].quantity <= 0) cart.items.splice(idx, 1);
    }
  },
  clear: () => { cart.items = []; },
  getTotal: () => {
    return cart.items.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);
  }
};
let API_VERSION = '2025-07';
let STOREFRONT_TOKEN = '';

export function initShopify({ shop, apiVersion = '2025-07', token }) {
  SHOP = shop;
  API_VERSION = apiVersion;
  STOREFRONT_TOKEN = token;
}

async function shopifyGraphQL(query, variables = {}) {
  if (!SHOP || !STOREFRONT_TOKEN) throw new Error('Shopify config not initialized');

  // Use local proxy endpoint (works on localhost, Vercel, or any server with /api/graphql)
  const url = '/api/graphql';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const payload = await res.json();
  if (payload.errors) {
    console.error('Shopify GraphQL API error:', payload.errors, { query, variables, payload });
    const err = new Error('Shopify GraphQL errors');
    err.details = payload.errors;
    throw err;
  }
  return payload.data;
}

export async function getProducts(first = 12) {
  const query = `query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
          variants(first: 5) { edges { node { id priceV2 { amount currencyCode } title } } }
        }
      }
    }
  }`;

  const data = await shopifyGraphQL(query, { first });
  return (data.products.edges || []).map(e => e.node);
}

export async function getProductByHandle(handle) {
  const query = `query getProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      title
      description
      featuredImage { url altText }
      images(first: 10) { edges { node { url altText } } }
      priceRange { minVariantPrice { amount currencyCode } }
      variants(first: 20) { edges { node { id title priceV2 { amount currencyCode } availableForSale } } }
    }
  }`;

  const data = await shopifyGraphQL(query, { handle });
  return data.productByHandle;
}

// Create a checkout (Shopify CheckoutCreate) and return webUrl
export async function createCheckout(lineItems = []) {
  // lineItems: [{ variantId, quantity }]
  const mutation = `mutation checkoutCreate($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout { id webUrl }
      userErrors { field message }
    }
  }`;

  const input = { lineItems: lineItems.map(li => ({ variantId: li.variantId, quantity: li.quantity })) };
  const data = await shopifyGraphQL(mutation, { input });
  if (data.checkoutCreate && data.checkoutCreate.userErrors && data.checkoutCreate.userErrors.length) {
    console.error('Shopify CheckoutCreate userErrors:', data.checkoutCreate.userErrors, { lineItems });
    const err = new Error('Checkout creation error');
    err.details = data.checkoutCreate.userErrors;
    throw err;
  }
  return data.checkoutCreate.checkout;
}

// -----------------------------
// New: Storefront Cart API helpers
// -----------------------------

function _getStoredCartId() {
  try { return localStorage.getItem('shopify_cart_id'); } catch(e) { return null; }
}
function _setStoredCartId(id) {
  try { localStorage.setItem('shopify_cart_id', id); } catch(e) {}
}
function _clearStoredCartId() {
  try { localStorage.removeItem('shopify_cart_id'); } catch(e) {}
}

// Create a new cart with optional initial lines
export async function createRemoteCart(lines = []) {
  // lines: [{ variantId, quantity }]
  const mutation = `mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) { cart { id checkoutUrl } userErrors { field message } }
  }`;

  const input = { lines: lines.map(l => ({ merchandiseId: l.variantId, quantity: l.quantity })) };
  const data = await shopifyGraphQL(mutation, { input });
  if (data.cartCreate && data.cartCreate.userErrors && data.cartCreate.userErrors.length) {
    console.error('Shopify cartCreate userErrors:', data.cartCreate.userErrors, { lines });
    const err = new Error('Cart create error');
    err.details = data.cartCreate.userErrors;
    throw err;
  }
  const cart = data.cartCreate.cart;
  if (cart && cart.id) _setStoredCartId(cart.id);
  return cart;
}

// Add lines to an existing cart
export async function cartLinesAdd(cartId, lines = []) {
  const mutation = `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl lines(first:50) { edges { node { id quantity merchandise { ... on ProductVariant { id } } } } } }
      userErrors { field message }
    }
  }`;

  const payloadLines = lines.map(l => ({ merchandiseId: l.variantId, quantity: l.quantity }));
  const data = await shopifyGraphQL(mutation, { cartId, lines: payloadLines });
  if (data.cartLinesAdd && data.cartLinesAdd.userErrors && data.cartLinesAdd.userErrors.length) {
    console.error('Shopify cartLinesAdd userErrors:', data.cartLinesAdd.userErrors, { cartId, lines });
    const err = new Error('cartLinesAdd error');
    err.details = data.cartLinesAdd.userErrors;
    throw err;
  }
  return data.cartLinesAdd.cart;
}

// Fetch cart by id
export async function getRemoteCart(cartId) {
  const query = `query getCart($id: ID!) {
    cart(id: $id) { id checkoutUrl lines(first:50) { edges { node { id quantity merchandise { ... on ProductVariant { id } } } } } }
  }`;
  const data = await shopifyGraphQL(query, { id: cartId });
  return data.cart;
}

// Public helper to add a variant to cart (create cart if needed)
export async function addToRemoteCart(variantId, quantity = 1) {
  if (!variantId) throw new Error('Missing variantId');
  let cartId = _getStoredCartId();
  try {
    if (!cartId) {
      // create cart with initial line
      const cart = await createRemoteCart([{ variantId, quantity }]);
      return cart;
    }
    // attempt to add lines
    const cart = await cartLinesAdd(cartId, [{ variantId, quantity }]);
    return cart;
  } catch (err) {
    // If cart not found or invalid, clear stored and try create
    console.warn('addToRemoteCart failed, attempting recreate cart', err);
    _clearStoredCartId();
    const cart = await createRemoteCart([{ variantId, quantity }]);
    return cart;
  }
}

export async function getCheckoutUrlForStoredCart() {
  const cartId = _getStoredCartId();
  if (!cartId) return null;
  const cart = await getRemoteCart(cartId);
  return cart ? cart.checkoutUrl || null : null;
}

// Simple DOM renderer for a product card (returns HTMLElement)
export function renderProductCard(product) {
    const wrapper = document.createElement('article');
    wrapper.className = 'group cursor-pointer collection-card';
    wrapper.style.cursor = 'pointer';

    const imgUrl = (product.featuredImage && product.featuredImage.url) || '';
    const imgAlt = (product.featuredImage && product.featuredImage.altText) || product.title || '';
    const price = (product.priceRange && product.priceRange.minVariantPrice) ? `${product.priceRange.minVariantPrice.amount}` : '';

    // Correctly extract first variant ID from Shopify product data (edges structure)
    let variantId = '';
    let variantTitle = '';
    if (product.variants && product.variants.edges && product.variants.edges.length > 0) {
        const variantNode = product.variants.edges[0].node;
        variantId = variantNode.id;
        variantTitle = variantNode.title;
    }

    const addToCartDisabled = !variantId ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : '';

    wrapper.innerHTML = `
      <div class="bg-white shadow-card hover:shadow-premium transition-all duration-400 transition-premium overflow-hidden flex flex-col">
        <div class="relative w-full">
          <img src="${imgUrl}" alt="${escapeHtml(imgAlt)}" class="product-image w-full h-64 sm:h-72 object-cover group-hover:scale-105 transition-transform duration-400" onerror="this.src='https://via.placeholder.com/800x600?text=No+Image'" />
        </div>

        <div class="p-4 flex-1 flex flex-col justify-between">
          <div class="mb-3">
            <h3 class="product-title font-playfair font-semibold text-lg leading-tight mb-1 overflow-hidden" title="${escapeHtml(product.title)}">${escapeHtml(product.title)}</h3>
            <p class="font-inter text-sm text-text-secondary mb-2 product-desc" style="display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${escapeHtml((product.description || '').slice(0, 80))}</p>
          </div>

          <div class="card-cta flex items-center justify-between mt-2">
            <span class="font-inter text-sm text-primary">${price ? '$' + price : ''}</span>
            <button class="add-to-cart-btn bg-accent text-white px-3 py-2 rounded text-sm hover:bg-accent/80 transition-colors ml-4 flex-shrink-0" ${addToCartDisabled}>
              Add to Cart
            </button>
          </div>

          ${!variantId ? '<div class="text-xs text-red-300 mt-2">No variant available for this product</div>' : ''}
        </div>
      </div>
    `;

    // Store product data for click handlers
    wrapper.dataset.handle = product.handle || '';
    wrapper.dataset.variantId = variantId;
    wrapper.dataset.variantTitle = variantTitle;

    return wrapper;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
  });
}
