import { Request, Response } from 'express';
import { Gym } from '../models/Gym.model';

/**
 * Gym Controller
 * Handles all gym-related business logic
 */

/**
 * Create a new gym
 * @param req Express request object
 * @param res Express response object
 */
export const createGym = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const { name, address, timezone, settings } = req.body;

    const gym = new Gym({
      ownerId: userId,
      name,
      address,
      timezone: timezone || 'UTC',
      settings: settings || {}
    });

    await gym.save();

    return res.status(201).json({
      success: true,
      data: { gym }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get all gyms (with optional filtering)
 * @param req Express request object
 * @param res Express response object
 */
export const getGyms = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    const { ownerId } = req.query;

    const query: any = {};
    if (ownerId) {
      query.ownerId = ownerId;
    } else if (userId) {
      // If no ownerId specified, show user's gyms
      query.ownerId = userId;
    }

    const gyms = await Gym.find(query).populate('ownerId', 'email name');

    return res.json({
      success: true,
      data: { gyms }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get a single gym by ID
 * @param req Express request object
 * @param res Express response object
 */
export const getGymById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const gym = await Gym.findById(id).populate('ownerId', 'email name');

    if (!gym) {
      return res.status(404).json({
        success: false,
        error: { message: 'Gym not found' }
      });
    }

    return res.json({
      success: true,
      data: { gym }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Update a gym
 * @param req Express request object
 * @param res Express response object
 */
export const updateGym = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      return res.status(404).json({
        success: false,
        error: { message: 'Gym not found' }
      });
    }

    // Check if user is the owner
    if (gym.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to update this gym' }
      });
    }

    const { name, address, timezone, settings } = req.body;

    if (name) gym.name = name;
    if (address !== undefined) gym.address = address;
    if (timezone) gym.timezone = timezone;
    if (settings) gym.settings = { ...gym.settings, ...settings };

    await gym.save();

    return res.json({
      success: true,
      data: { gym }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Delete a gym
 * @param req Express request object
 * @param res Express response object
 */
export const deleteGym = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const gym = await Gym.findById(id);

    if (!gym) {
      return res.status(404).json({
        success: false,
        error: { message: 'Gym not found' }
      });
    }

    // Check if user is the owner
    if (gym.ownerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to delete this gym' }
      });
    }

    await Gym.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Gym deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

