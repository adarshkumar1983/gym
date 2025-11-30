import { Request, Response } from 'express';
import { WorkoutTemplate } from '../models/WorkoutTemplate.model';

/**
 * Workout Controller
 * Handles all workout template-related business logic
 */

/**
 * Create a new workout template
 * @param req Express request object
 * @param res Express response object
 */
export const createWorkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const { gymId, name, description, exercises, tags, isActive } = req.body;

    if (!gymId || !name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Gym ID and name are required' }
      });
    }

    const workout = new WorkoutTemplate({
      gymId,
      name,
      description,
      exercises: exercises || [],
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: userId
    });

    await workout.save();

    return res.status(201).json({
      success: true,
      data: { workout }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get all workout templates (with optional filtering)
 * @param req Express request object
 * @param res Express response object
 */
export const getWorkouts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { gymId, createdBy, isActive } = req.query;

    const query: any = {};
    if (gymId) query.gymId = gymId;
    if (createdBy) query.createdBy = createdBy;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const workouts = await WorkoutTemplate.find(query)
      .populate('gymId', 'name')
      .populate('createdBy', 'email name')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { workouts }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Get a single workout template by ID
 * @param req Express request object
 * @param res Express response object
 */
export const getWorkoutById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const workout = await WorkoutTemplate.findById(id)
      .populate('gymId', 'name')
      .populate('createdBy', 'email name');

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workout template not found' }
      });
    }

    return res.json({
      success: true,
      data: { workout }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Update a workout template
 * @param req Express request object
 * @param res Express response object
 */
export const updateWorkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const workout = await WorkoutTemplate.findById(id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workout template not found' }
      });
    }

    // Check if user is the creator
    if (workout.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to update this workout template' }
      });
    }

    const { name, description, exercises, tags, isActive } = req.body;

    if (name) workout.name = name;
    if (description !== undefined) workout.description = description;
    if (exercises) workout.exercises = exercises;
    if (tags) workout.tags = tags;
    if (isActive !== undefined) workout.isActive = isActive;

    await workout.save();

    return res.json({
      success: true,
      data: { workout }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};

/**
 * Delete a workout template
 * @param req Express request object
 * @param res Express response object
 */
export const deleteWorkout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const workout = await WorkoutTemplate.findById(id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workout template not found' }
      });
    }

    // Check if user is the creator
    if (workout.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to delete this workout template' }
      });
    }

    await WorkoutTemplate.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Workout template deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
};


