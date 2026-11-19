document.getElementById('year').textContent = new Date().getFullYear();

const cart = new Map();
const price = 100;
const usd = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const dialog = document.querySelector('#store-cart');
const content = document.querySelector('#cart-content');
const summary = document.querySelector('#cart-summary');

function changeQuantity(name, difference) {
  const quantity = Math.max(0, (cart.get(name) || 0) + difference);
  if (quantity) cart.set(name, quantity);
  else cart.delete(name);
  renderCart();
}

function renderCart(message = 'Your cart is empty.') {
  const count = [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
  document.querySelector('#cart-count').textContent = count;
  document.querySelector('#cart-total').textContent = usd(count * price);
  summary.hidden = !count;
  content.replaceChildren();

  if (!count) {
    const empty = document.createElement('p');
    empty.textContent = message;
    empty.setAttribute('role', 'status');
    content.append(empty);
  }

  for (const [name, quantity] of cart) {
    const row = document.createElement('div');
    row.className = 'cart-row';
    const label = document.createElement('strong');
    label.textContent = name;
    const controls = document.createElement('div');
    controls.className = 'cart-controls';
    const quantityLabel = document.createElement('span');
    quantityLabel.textContent = String(quantity);
    quantityLabel.setAttribute('aria-label', 'Quantity: ' + quantity);
    for (const [delta, text, action] of [[-1, '−', 'Decrease'], [1, '+', 'Increase']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'store-button';
      button.textContent = text;
      button.setAttribute('aria-label', action + ' quantity of ' + name);
      button.addEventListener('click', () => {
        changeQuantity(name, delta);
        (Array.from(content.querySelectorAll('button')).find(control => control.getAttribute('aria-label') === action + ' quantity of ' + name) || document.querySelector('#close-cart')).focus();
      });
      if (delta === 1) controls.append(quantityLabel);
      controls.append(button);
    }
    row.append(label, controls);
    content.append(row);
  }
}

document.querySelectorAll('[data-product]').forEach(button => {
  button.addEventListener('click', () => {
    changeQuantity(button.dataset.product, 1);
    document.querySelector('#cart-status').textContent = button.dataset.product + ' added. Cart quantity: ' + cart.get(button.dataset.product);
  });
});
document.querySelector('#open-cart').addEventListener('click', () => {
  renderCart();
  dialog.showModal();
});
document.querySelector('#close-cart').addEventListener('click', () => dialog.close());
document.querySelector('#test-checkout').addEventListener('click', () => {
  if (!cart.size) return;
  cart.clear();
  renderCart('Test checkout complete. No payment was taken and no order was placed.');
  document.querySelector('#close-cart').focus();
});
renderCart();
