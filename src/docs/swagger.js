import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payment Service API',
      version: '1.0.0',
      description:
        'Production-ready Payment Service microservice with Stripe integration, wallet management, refunds, and invoice generation.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        PaymentResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                paymentId: { type: 'string', example: 'PAY123ABC456DE' },
                orderId: { type: 'string', example: 'ORD789' },
                userId: { type: 'string', example: 'U456' },
                amount: { type: 'number', example: 279000 },
                currency: { type: 'string', example: 'LKR' },
                paymentMethod: { type: 'string', example: 'CARD' },
                cardLast4: { type: 'string', example: '1234' },
                status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'VOIDED'] },
                transactionId: { type: 'string', example: 'TXN789012ABC' },
                paymentGateway: { type: 'string', example: 'Stripe' },
                createdAt: { type: 'string', format: 'date-time' },
                completedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        WalletResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                wallet: {
                  type: 'object',
                  properties: {
                    walletId: { type: 'string', example: 'WAL001ABC' },
                    userId: { type: 'string', example: 'U456' },
                    balance: { type: 'number', example: 5000 },
                    currency: { type: 'string', example: 'LKR' },
                  },
                },
                transactions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      transactionId: { type: 'string' },
                      type: { type: 'string', enum: ['TOPUP', 'PAYMENT', 'REFUND'] },
                      amount: { type: 'number' },
                      date: { type: 'string', format: 'date-time' },
                    },
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    pages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
        InvoiceResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                invoiceId: { type: 'string', example: 'INV001ABC' },
                paymentId: { type: 'string', example: 'PAY123' },
                userId: { type: 'string', example: 'U456' },
                amount: { type: 'number', example: 2790 },
                currency: { type: 'string', example: 'LKR' },
                status: { type: 'string', enum: ['PAID', 'REFUNDED', 'PENDING'] },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      quantity: { type: 'number' },
                      unitPrice: { type: 'number' },
                      total: { type: 'number' },
                    },
                  },
                },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            status: { type: 'string', example: 'fail' },
            message: { type: 'string', example: 'Validation error: Amount is required' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger UI on the Express app.
 */
export const setupSwagger = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Payment Service API Docs',
    })
  );

  // Serve raw spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;
