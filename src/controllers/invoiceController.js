import invoiceService from '../services/invoiceService.js';
import { asyncHandler, apiResponse } from '../utils/helpers.js';

/**
 * @desc    Get invoice by payment ID (JSON or PDF)
 * @route   GET /api/invoices/:paymentId
 * @access  Private
 */
export const getInvoice = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { format } = req.query;

  if (format === 'pdf') {
    const { doc, invoice } = await invoiceService.generatePdfInvoice(paymentId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${invoice.invoiceId}.pdf`
    );

    doc.pipe(res);
    doc.end();
    return;
  }

  // Default: JSON
  const invoice = await invoiceService.getInvoiceByPaymentId(paymentId);
  return apiResponse(res, 200, 'Invoice retrieved successfully', invoice);
});
