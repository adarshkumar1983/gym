import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as memberController from '../controllers/member.controller';

const router = Router();

/**
 * Add a member to a gym
 * POST /api/members
 */
router.post('/', requireAuth, memberController.addMember);

/**
 * Get all members
 * GET /api/members
 */
router.get('/', requireAuth, memberController.getMembers);

/**
 * Get a single member by ID
 * GET /api/members/:id
 */
router.get('/:id', requireAuth, memberController.getMemberById);

/**
 * Update a member
 * PUT /api/members/:id
 */
router.put('/:id', requireAuth, memberController.updateMember);

/**
 * Remove a member from a gym
 * DELETE /api/members/:id
 */
router.delete('/:id', requireAuth, memberController.removeMember);

export default router;


