import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * Create a new payment record
 * POST /api/payments
 */
router.post('/', requireAuth, paymentController.createPayment);

/**
 * Get all payment records
 * GET /api/payments
 */
router.get('/', requireAuth, paymentController.getPayments);

/**
 * Get a single payment record by ID
 * GET /api/payments/:id
 */
router.get('/:id', requireAuth, paymentController.getPaymentById);

/**
 * Update a payment record
 * PUT /api/payments/:id
 */
router.put('/:id', requireAuth, paymentController.updatePayment);

/**
 * Delete a payment record
 * DELETE /api/payments/:id
 */
router.delete('/:id', requireAuth, paymentController.deletePayment);

export default router;

