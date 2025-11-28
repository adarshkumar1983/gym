import { Request, Response } from 'express';
import { PaymentRecord } from '../models/PaymentRecord.model';

/**
 * Payment Controller
 * Handles all payment-related business logic
 */

/**
 * Create a new payment record
 * @param req Express request object
 * @param res Express response object
 */
export const createPayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { membershipId, provider, providerId, amount, currency, status, invoiceUrl, receiptUrl, metadata } = req.body;

    if (!membershipId || !amount) {
      return res.status(400).json({
        success: false,
        error: { message: 'Membership ID and amount are required' }
      });
    }

    const payment = new PaymentRecord({
      membershipId,
      provider: provider || 'stripe',
      providerId,
      amount,
      currency: currency || 'USD',
      status: status || 'pending',
      invoiceUrl,
      receiptUrl,
      metadata: metadata || {}
    });

    await payment.save();

    return res.status(201).json({
      success: true,
      data: { payment }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get all payment records (with optional filtering)
 * @param req Express request object
 * @param res Express response object
 */
export const getPayments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { membershipId, provider, status } = req.query;

    const query: any = {};
    if (membershipId) query.membershipId = membershipId;
    if (provider) query.provider = provider;
    if (status) query.status = status;

    const payments = await PaymentRecord.find(query)
      .populate('membershipId')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { payments }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get a single payment record by ID
 * @param req Express request object
 * @param res Express response object
 */
export const getPaymentById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const payment = await PaymentRecord.findById(id).populate('membershipId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment record not found' }
      });
    }

    return res.json({
      success: true,
      data: { payment }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Update a payment record
 * @param req Express request object
 * @param res Express response object
 */
export const updatePayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { status, invoiceUrl, receiptUrl, providerId, metadata } = req.body;

    const payment = await PaymentRecord.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment record not found' }
      });
    }

    if (status) {
      if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid status. Must be: pending, completed, failed, or refunded' }
        });
      }
      payment.status = status;
    }
    if (invoiceUrl !== undefined) payment.invoiceUrl = invoiceUrl;
    if (receiptUrl !== undefined) payment.receiptUrl = receiptUrl;
    if (providerId !== undefined) payment.providerId = providerId;
    if (metadata) payment.metadata = { ...payment.metadata, ...metadata };

    await payment.save();

    return res.json({
      success: true,
      data: { payment }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Delete a payment record
 * @param req Express request object
 * @param res Express response object
 */
export const deletePayment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const payment = await PaymentRecord.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment record not found' }
      });
    }

    await PaymentRecord.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Payment record deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

