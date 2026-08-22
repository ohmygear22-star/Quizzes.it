# Quiz launch site

Responsive customer-facing launch-site UI for the agreed flow:

`Choose quiz → enter email → pay once → secure email link (7 days) → quiz → immediate result → retake`

## Deliberately not connected yet

- Stripe Checkout: the purchase button is a safe placeholder until Stripe keys and a webhook secret are supplied.
- Transactional email: the post-payment link is not sent until the sending-domain account is verified.
- Secure access tokens, expiry, automatic deletion, payment/error log: these require the server and database layer on the DigitalOcean droplet.

This is intentional. The user-facing design and flow can be reviewed now without collecting money, sending email, or exposing a fake access link.

## Run locally

After Node.js is available on the deployment machine:

```bash
pnpm install
pnpm run build
pnpm run dev
```
