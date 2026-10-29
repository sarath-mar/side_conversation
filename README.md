# Vendor Details API

Simple Express server that returns mock vendor and gift card details.

## Setup

```bash
npm install
```

## Run

```bash
npm start
```

Dev mode (auto-reload):

```bash
npm run dev
```

Server starts at `http://localhost:3000`.

## Endpoints

### `GET /vendor-details`

Returns all vendors when no query params are passed.

```bash
curl http://localhost:3000/vendor-details
```

#### Query parameters

| Param | Description |
| --- | --- |
| `email` | Match `vendorEmail` |
| `customerId` | Match any ID in the vendor's `customerId` array |
| `customerEmail` | Match any email in the vendor's `customerEmail` array |
| `giftName` | Match `giftCardName` (only matching gift cards are returned) |

Any combination is supported. All provided params must match.

```bash
# By email
curl "http://localhost:3006/vendor-details?email=james.hubspot@yopmail.com"

# By customerId
curl "http://localhost:3006/vendor-details?customerId=9566416404713"

# By customerEmail
curl "http://localhost:3006/vendor-details?customerEmail=rajeev.veettil@klarion.ai"

# By gift name
curl "http://localhost:3006/vendor-details?giftName=hubspotGiftcard"

# Specific vendor
curl "http://localhost:3006/vendor-details/V002"
```

If nothing matches, the API returns `[]` with status `200`.

### `GET /side-conversation-events`

Proxies Zendesk side conversation events. Auth cookie is read from `.env`.

```bash
cp .env.example .env
# set ZENDESK_COOKIE, ZENDESK_SIDE_CONVERSATIONS_URL, OPENAI_API_KEY in .env

curl http://localhost:3006/side-conversation-events
```

### `GET /gift-card-policy-analysis`

Fetches side conversation events, analyzes them with `gpt-4o-mini`, and returns vendor/gift-card cancellation policy JSON.

```bash
curl http://localhost:3006/gift-card-policy-analysis
```

## Expose to Zendesk (no ngrok)

Zendesk cannot call `localhost`. In a separate terminal:

```bash
./scripts/start-tunnel.sh
```

Copy the printed `https://....lhr.life` URL into Zendesk (use `127.0.0.1`, not `localhost`, in the tunnel). Keep that terminal open; free tunnels drop when it closes and the URL changes on restart.

For a permanent URL, deploy the app (Render / Railway / Fly.io).

## Project structure

```
.
├── data/vendors.js
├── routes/vendorDetails.js
├── routes/sideConversationEvents.js
├── routes/giftCardPolicyAnalysis.js
├── services/zendesk.js
├── services/analyzeGiftCardPolicies.js
├── .env.example
├── server.js
├── package.json
└── README.md
```
# side_conversation
