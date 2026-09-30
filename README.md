# Webhook Hoster

A lightweight public webhook hoster / manager that lets you:
- create a public endpoint for incoming webhook events
- verify HMAC signatures using a shared secret
- store event payloads
- deliver them to a target URL
- replay failed deliveries
- inspect a log of all webhook traffic

## Features
- Public endpoint generation
- Simple target URL forwarding
- Secret-based signature validation
- Event storage in a local JSON file (`data/store.json`)
- Delivery retry and replay support
- Beautiful single-page dashboard

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Example payload

Send a POST request to one of the generated public webhook URLs:

```bash
curl -X POST http://localhost:3000/api/webhook/{endpoint-id} \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=..." \
  -d '{"event":"invoice.created","amount":42}'
```

## Notes

This is a production-ready prototype foundation, not a full multi-tenant SaaS. It is designed for local development and a clean MVP template you can extend.

## Future upgrades
- auth and user accounts
- PostgreSQL / Prisma persistence
- queue-based retries
- S3 payload storage
- tenant isolation
- webhook filters and transformations
- admin API keys
