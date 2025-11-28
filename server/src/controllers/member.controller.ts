import { Request, Response } from 'express';
import { GymMember } from '../models/GymMember.model';

/**
 * Member Controller
 * Handles all gym member-related business logic
 */

/**
 * Add a member to a gym
 * @param req Express request object
 * @param res Express response object
 */
export const addMember = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { gymId, userId, trainerId } = req.body;

    if (!gymId || !userId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Gym ID and User ID are required' }
      });
    }

    // Check if member already exists
    const existingMember = await GymMember.findOne({ gymId, userId });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        error: { message: 'Member already exists in this gym' }
      });
    }

    const member = new GymMember({
      gymId,
      userId,
      trainerId,
      status: 'active'
    });

    await member.save();

    return res.status(201).json({
      success: true,
      data: { member }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get all members (with optional filtering)
 * @param req Express request object
 * @param res Express response object
 */
export const getMembers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { gymId, userId, trainerId, status } = req.query;

    const query: any = {};
    if (gymId) query.gymId = gymId;
    if (userId) query.userId = userId;
    if (trainerId) query.trainerId = trainerId;
    if (status) query.status = status;

    const members = await GymMember.find(query)
      .populate('gymId', 'name address')
      .populate('userId', 'email name')
      .populate('trainerId', 'email name');

    return res.json({
      success: true,
      data: { members }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get a single member by ID
 * @param req Express request object
 * @param res Express response object
 */
export const getMemberById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const member = await GymMember.findById(id)
      .populate('gymId', 'name address')
      .populate('userId', 'email name')
      .populate('trainerId', 'email name');

    if (!member) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' }
      });
    }

    return res.json({
      success: true,
      data: { member }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Update a member
 * @param req Express request object
 * @param res Express response object
 */
export const updateMember = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { trainerId, status } = req.body;

    const member = await GymMember.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' }
      });
    }

    if (trainerId !== undefined) member.trainerId = trainerId;
    if (status) {
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid status. Must be: active, inactive, or suspended' }
        });
      }
      member.status = status;
    }

    await member.save();

    return res.json({
      success: true,
      data: { member }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Remove a member from a gym
 * @param req Express request object
 * @param res Express response object
 */
export const removeMember = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const member = await GymMember.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' }
      });
    }

    await GymMember.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

