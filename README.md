# 💳 Payment Service

A production-ready Payment Service microservice built with Node.js, Express, MongoDB, and Stripe.

## 🚀 Features

- **Payment Processing** — Process payments via Stripe Payment Intents API
- **Wallet Management** — Top-up, deduct, and track wallet balance
- **Refund Handling** — Full and partial refunds with Stripe integration
- **Invoice Generation** — JSON and PDF invoice generation
- **Transaction History** — Complete audit trail with before/after balances
- **Stripe Webhooks** — Handle async payment events
- **Idempotency** — Prevent duplicate payment charges
- **Retry Mechanism** — Automatic retry for failed payments (3 attempts)
- **Rate Limiting** — Configurable API rate limiting
- **JWT Authentication** — Secure all endpoints
- **Swagger Docs** — Interactive API documentation at `/api-docs`
- **Docker Ready** — Multi-stage Dockerfile + docker-compose
- **CI/CD** — GitHub Actions pipeline for AWS ECR + ECS deployment

## 📦 Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js 20 | Runtime |
| Express.js | HTTP framework |
| MongoDB + Mongoose | Database & ODM |
| Stripe | Payment gateway |
| JWT | Authentication |
| Joi | Request validation |
| Winston | Logging |
| PDFKit | PDF generation |
| Swagger | API documentation |
| Jest + Supertest | Testing |
| Docker | Containerization |
| GitHub Actions | CI/CD |

## 🏗️ Project Structure

```
payment-service/
├── src/
│   ├── config/          # App configuration & DB connection
│   ├── controllers/     # Route handlers
│   ├── docs/            # Swagger setup
│   ├── middlewares/      # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes with Swagger JSDoc
│   ├── services/        # Business logic layer
│   └── utils/           # Helpers, validators, errors, logger
├── tests/
│   ├── unit/            # Unit tests
│   └── integration/     # API integration tests
├── .github/workflows/   # CI/CD pipeline
├── app.js               # Express app assembly
├── server.js            # Entry point
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Full stack with MongoDB
└── .env                 # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Docker)
- Stripe account (test keys)

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env .env.local   # Edit with your Stripe keys

# Start development server
npm run dev
```

### Docker

```bash
# Start everything (app + MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f payment-service
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

## 📡 API Endpoints

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Process a payment |
| GET | `/api/payments/order/:orderId` | Get payments by order |
| GET | `/api/payments/user/:userId` | Get payments by user |
| PUT | `/api/payments/:paymentId/status` | Update payment status |
| DELETE | `/api/payments/:paymentId` | Void pending payment |
| POST | `/api/payments/refund` | Process a refund |
| POST | `/api/payments/webhook` | Stripe webhook handler |

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallet/topup` | Top up wallet via Stripe |
| GET | `/api/wallet/:userId` | Get balance + transactions |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices/:paymentId` | Get invoice (JSON or PDF) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger UI |

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/payment-service` |
| `JWT_SECRET` | JWT signing secret | — |
| `STRIPE_SECRET_KEY` | Stripe secret key | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | — |
| `LOG_LEVEL` | Winston log level | `info` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## ☁️ Deployment (AWS)

The included GitHub Actions pipeline will:

1. ✅ Run tests with MongoDB service container
2. 🐳 Build Docker image
3. 📦 Push to AWS ECR
4. 🚀 Deploy to ECS Fargate

Required GitHub Secrets:
- `AWS_ROLE_ARN` — IAM role with ECR/ECS permissions

## 📄 License

ISC
