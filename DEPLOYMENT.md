# Production Deployment

## API (Render Web Service)

- Root Directory: `apps/api`
- Build Command:

```bash
npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

- Start Command:

```bash
npm run start:prod
```

### Environment

```text
DATABASE_URL=<private PostgreSQL internal URL>
JWT_SECRET=<private random value, minimum 32 characters>
NODE_ENV=production
SWAGGER_ENABLED=false
CORS_ORIGINS=https://tamir-bakim-programi.onrender.com
ALLOW_PUBLIC_REGISTRATION=false
CUSTOMER_PORTAL_JWT_SECRET=<private random value, minimum 32 characters>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<private random value>
WHATSAPP_APP_SECRET=<Meta app secret>
# Optional paid SMS fallback:
PORTAL_OTP_WEBHOOK_URL=<SMS provider webhook URL>
```

Do not commit or share production secrets.

### Free WhatsApp phone verification

The free flow does not send an outbound OTP. The customer opens WhatsApp from the app and sends the prefilled `TB-123456` challenge from the phone number registered on the customer record. Meta delivers that inbound message to:

```text
GET/POST https://tamir-bakim-api.onrender.com/customer-portal/whatsapp/webhook
```

Configure this URL for WhatsApp `messages` webhooks in the Meta app. Use the same value for Meta's verify token and `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. The API verifies every POST with `WHATSAPP_APP_SECRET` before accepting a phone number.

Set each organization's WhatsApp number in Settings. The number must belong to the WhatsApp Business account whose messages are delivered to the webhook.

### Media persistence

The API supports a configurable upload directory.

If a persistent disk is attached and mounted at `/var/data`, set:

```text
MEDIA_STORAGE_DIR=/var/data/uploads
```

Without persistent storage, files written to the service filesystem can be lost when the service is recreated or redeployed.

## Web (Render Static Site)

- Root Directory: `apps/web`
- Build Command:

```bash
npm ci && npm run build
```

- Publish Directory: `dist`

### Environment

```text
VITE_API_URL=https://tamir-bakim-api.onrender.com
```

### SPA rewrite

Configure a rewrite:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

This is required for direct React Router routes such as service orders, proforma pages, delivery reports, account pages and QR cards.

## Database migrations

Never edit a migration after it has been applied to production. New schema changes must use a new migration directory.

Before a production deploy, verify locally:

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

## Security notes

- Public organization registration is disabled by default in production.
- Password changes increment the user's token version, invalidating older JWT sessions.
- Roles and branch access are reloaded from the database on authenticated requests.
- Audit logs redact password/token/secret fields.
- The public QR maintenance card excludes customer identity and financial amounts.
