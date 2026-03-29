import PDFDocument from 'pdfkit';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class InvoiceService {
  /**
   * Get invoice by payment ID (JSON format).
   */
  async getInvoiceByPaymentId(paymentId) {
    const invoice = await Invoice.findOne({ paymentId });
    if (!invoice) {
      throw new NotFoundError(`Invoice not found for payment: ${paymentId}`);
    }
    return invoice;
  }

  /**
   * Generate a PDF invoice and return as a Buffer stream.
   * @param {string} paymentId
   * @returns {Promise<{doc: PDFDocument, invoice: Object}>}
   */
  async generatePdfInvoice(paymentId) {
    const invoice = await Invoice.findOne({ paymentId });
    if (!invoice) {
      throw new NotFoundError(`Invoice not found for payment: ${paymentId}`);
    }

    const payment = await Payment.findOne({ paymentId });

    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice #: ${invoice.invoiceId}`, { align: 'right' })
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, { align: 'right' })
      .text(`Status: ${invoice.status}`, { align: 'right' })
      .moveDown(1);

    // Separator
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(1);

    // Payment Details
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Payment Details')
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Payment ID: ${invoice.paymentId}`)
      .text(`User ID: ${invoice.userId}`)
      .text(`Payment Method: ${payment?.paymentMethod || 'N/A'}`)
      .text(`Payment Gateway: ${payment?.paymentGateway || 'N/A'}`)
      .moveDown(1);

    // Items Table
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Items')
      .moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Description', 50, tableTop)
      .text('Qty', 300, tableTop)
      .text('Unit Price', 370, tableTop)
      .text('Total', 470, tableTop);

    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Table rows
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    if (invoice.items && invoice.items.length > 0) {
      for (const item of invoice.items) {
        doc
          .text(item.description || 'Service', 50, y)
          .text(String(item.quantity || 1), 300, y)
          .text(`${invoice.currency} ${(item.unitPrice || 0).toLocaleString()}`, 370, y)
          .text(`${invoice.currency} ${(item.total || 0).toLocaleString()}`, 470, y);
        y += 20;
      }
    }

    // Total
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(50, y + 5)
      .lineTo(550, y + 5)
      .stroke();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Total: ${invoice.currency} ${invoice.amount.toLocaleString()}`, 370, y + 15);

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .text('This is a computer-generated invoice.', 50, 720, { align: 'center' });

    logger.info(`PDF invoice generated for payment: ${paymentId}`);
    return { doc, invoice };
  }
}

export default new InvoiceService();
