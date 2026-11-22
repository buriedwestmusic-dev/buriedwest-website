# buriedwest-website
## Stripe checkout preview

Requires Node.js 22 or later. Store your Stripe sandbox keys in a local
`.env` file and start the preview with `node --env-file=.env server.mjs`.
The server reads `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` and
accepts sandbox keys only. Open http://localhost:4242/checkout and use a
Stripe test card. The Moonrise Hoodie has a fixed $1 test price.

Set `PORT` and `CHECKOUT_ORIGIN` for a separate hosted test instance.
Live selling requires a commerce-capable host, approved pricing and
shipping, and a server-side fulfillment integration that verifies paid
Stripe events and deduplicates supplier orders.
