import { Router } from 'express';
import { getInvoice } from '../controllers/invoiceController.js';
import authenticate from '../middlewares/authenticate.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Invoices
 *   description: Invoice generation and retrieval
 */

/**
 * @swagger
 * /api/invoices/{paymentId}:
 *   get:
 *     summary: Get invoice by payment ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *           default: json
 *         description: Response format (json or pdf)
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceResponse'
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found
 */
router.get('/:paymentId', authenticate, getInvoice);

export default router;
