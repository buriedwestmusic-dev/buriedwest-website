import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const {
  STRIPE_SECRET_KEY = '',
  STRIPE_PUBLISHABLE_KEY = '',
  CHECKOUT_ORIGIN = 'http://localhost:4242',
  PORT = '4242',
} = process.env;
const origin = new URL(CHECKOUT_ORIGIN).origin;
const testMode = /^(sk|rk)_test_/.test(STRIPE_SECRET_KEY) &&
  STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');
const sizes = new Set(['S', 'M', 'L', 'XL', '2XL']);
const pages = new Map([
  ['/', 'index.html'],
  ['/checkout', 'checkout.html'],
  ['/checkout/return', 'checkout.html'],
]);
const assets = /^(styles\.css|(?:script|checkout)\.js|[a-z0-9-]+\.(?:svg|jpg))$/;
const types = {
  html: 'text/html', css: 'text/css', js: 'text/javascript',
  svg: 'image/svg+xml', jpg: 'image/jpeg',
};

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function stripe(path, params) {
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions' + path, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + STRIPE_SECRET_KEY,
      ...(params && { 'Content-Type': 'application/x-www-form-urlencoded' }),
    },
    body: params,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Stripe request failed with HTTP ' + response.status);
  return response.json();
}

async function serve(req, res) {
  const url = new URL(req.url, origin);
  if (url.pathname.startsWith('/api/checkout/')) {
    if (!testMode) return json(res, 503, { error: 'Stripe sandbox keys are required.' });

    if (req.method === 'POST' && url.pathname === '/api/checkout/session') {
      if (req.headers.origin !== origin) return json(res, 403, { error: 'Invalid checkout origin.' });
      const size = url.searchParams.get('size');
      if (!sizes.has(size)) return json(res, 400, { error: 'Choose a hoodie size.' });
      const session = await stripe('', new URLSearchParams({
        mode: 'payment',
        ui_mode: 'embedded_page',
        return_url: origin + '/checkout/return?session_id={CHECKOUT_SESSION_ID}',
        'payment_method_types[0]': 'card',
        'shipping_address_collection[allowed_countries][0]': 'US',
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': '100',
        'line_items[0][price_data][product_data][name]': 'Moonrise Hoodie (test) — ' + size,
        'metadata[product]': 'moonrise-hoodie',
        'metadata[size]': size,
      }));
      return json(res, 200, {
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        clientSecret: session.client_secret,
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/checkout/status') {
      const id = url.searchParams.get('session_id') ?? '';
      if (!/^cs_test_[A-Za-z0-9]+$/.test(id)) return json(res, 400, { error: 'Invalid test session.' });
      const session = await stripe('/' + id);
      if (session.metadata?.product !== 'moonrise-hoodie') return json(res, 404, { error: 'Unknown checkout.' });
      return json(res, 200, { paid: session.payment_status === 'paid' });
    }

    return json(res, 404, { error: 'Unknown checkout endpoint.' });
  }

  const asset = url.pathname.slice(1);
  const file = pages.get(url.pathname) ?? (assets.test(asset) ? asset : null);
  if (!file || !['GET', 'HEAD'].includes(req.method)) return json(res, 404, { error: 'Not found.' });
  const data = await readFile(new URL('./' + file, import.meta.url)).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (!data) return json(res, 404, { error: 'Not found.' });
  res.writeHead(200, { 'Content-Type': types[file.split('.').pop()], 'Referrer-Policy': 'no-referrer' });
  res.end(req.method === 'HEAD' ? undefined : data);
}

createServer((req, res) => {
  serve(req, res).catch(error => {
    console.error(error.message);
    json(res, 502, { error: 'Checkout is temporarily unavailable. Try again.' });
  });
}).listen(Number(PORT), () => console.log('Buried West checkout preview at ' + origin));
