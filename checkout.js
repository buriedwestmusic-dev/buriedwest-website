const form = document.querySelector('#checkout-form');
const status = document.querySelector('#checkout-status');
const button = form.querySelector('button');

async function request(path, options) {
  const response = await fetch('/api/checkout/' + path, options);
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('The checkout server is unavailable.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  button.disabled = true;
  status.textContent = 'Loading Stripe Checkout…';
  try {
    if (typeof Stripe !== 'function') throw new Error('Stripe could not load. Try again.');
    const query = new URLSearchParams(new FormData(form));
    const { publishableKey, clientSecret } = await request('session?' + query, { method: 'POST' });
    const checkout = await Stripe(publishableKey).createEmbeddedCheckoutPage({
      fetchClientSecret: async () => clientSecret,
    });
    checkout.mount('#checkout');
    form.hidden = true;
    status.textContent = '';
  } catch (error) {
    status.textContent = error.message;
    button.disabled = false;
  }
});

if (location.pathname === '/checkout/return') {
  form.hidden = true;
  status.textContent = 'Checking your test payment…';
  request('status?' + new URLSearchParams(location.search)).then(({ paid }) => {
    status.textContent = paid ? 'Test payment confirmed.' : 'Stripe has not confirmed a test payment.';
  }).catch(error => {
    status.textContent = error.message;
  });
}
