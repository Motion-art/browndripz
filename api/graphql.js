/**
 * Vercel Serverless Function: GraphQL Proxy to Shopify
 * 
 * This function proxies GraphQL requests from the frontend to Shopify's Storefront API.
 * It bypasses CORS restrictions since the request originates from a Vercel server (same origin as frontend).
 * 
 * Usage (from browser):
 *   fetch('/api/graphql', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ query: '...', variables: {...} })
 *   })
 */

// Get Shopify credentials from environment variables (set in Vercel dashboard)
const SHOP = process.env.SHOPIFY_SHOP;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-07';
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate credentials are set
  if (!SHOP || !STOREFRONT_TOKEN) {
    console.error('Missing Shopify credentials in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { query, variables } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query in request body' });
    }

    // Call Shopify's Storefront GraphQL API
    const shopifyUrl = `https://${SHOP}/api/${API_VERSION}/graphql.json`;
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });

    const data = await response.json();

    // Return Shopify's response (including any errors)
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Shopify' });
  }
}
