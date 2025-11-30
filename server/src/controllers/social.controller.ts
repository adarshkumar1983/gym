/**
 * Social Controller
 * Handles social feed, stories, follows, likes, and comments
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Post } from '../models/Post.model';
import { Story } from '../models/Story.model';
import { Follow } from '../models/Follow.model';
import { Comment } from '../models/Comment.model';
import { User } from '../models/User.model';

/**
 * Get social feed (posts from users you follow)
 */
export const getFeed = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    // Get users that current user follows
    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);
    followingIds.push(new mongoose.Types.ObjectId(userId)); // Include own posts

    // Get posts from followed users
    const posts = await Post.find({ userId: { $in: followingIds } })
      .populate('userId', 'name email image')
      .populate('workoutId')
      .populate('mealId')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      data: { posts },
    });
  } catch (error: any) {
    console.error('Error getting feed:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get feed' },
    });
  }
};

/**
 * Create a new post
 */
export const createPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { type, content, mediaUrls, workoutId, mealId, tags, location, isPremium } = req.body;

    if (!content && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Content or media is required' },
      });
    }

    // Extract hashtags from content
    const extractedTags = content?.match(/#\w+/g)?.map((tag: string) => tag.slice(1).toLowerCase()) || [];
    const allTags = [...new Set([...(tags || []), ...extractedTags])];

    const post = new Post({
      userId,
      type: type || 'general',
      content: content || '',
      mediaUrls: mediaUrls || [],
      workoutId,
      mealId,
      tags: allTags,
      location,
      isPremium: isPremium || false,
    });

    await post.save();
    await post.populate('userId', 'name email image');

    return res.json({
      success: true,
      data: { post },
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create post' },
    });
  }
};

/**
 * Get stories (Snapchat-style)
 */
export const getStories = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    // Get users that current user follows
    const following = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = following.map(f => f.followingId);
    followingIds.push(new mongoose.Types.ObjectId(userId)); // Include own stories

    // Get active stories (not expired)
    const stories = await Story.find({
      userId: { $in: followingIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', 'name email image')
      .sort({ createdAt: -1 });

    // Group stories by user
    const storiesByUser: any = {};
    stories.forEach(story => {
      const userId = (story.userId as any)._id.toString();
      if (!storiesByUser[userId]) {
        storiesByUser[userId] = {
          user: story.userId,
          stories: [],
        };
      }
      storiesByUser[userId].stories.push(story);
    });

    return res.json({
      success: true,
      data: { stories: Object.values(storiesByUser) },
    });
  } catch (error: any) {
    console.error('Error getting stories:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get stories' },
    });
  }
};

/**
 * Create a story
 */
export const createStory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { mediaUrl, mediaType, caption } = req.body;

    if (!mediaUrl || !mediaType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Media URL and type are required' },
      });
    }

    const story = new Story({
      userId,
      mediaUrl,
      mediaType,
      caption,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await story.save();
    await story.populate('userId', 'name email image');

    return res.json({
      success: true,
      data: { story },
    });
  } catch (error: any) {
    console.error('Error creating story:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create story' },
    });
  }
};

/**
 * View a story (mark as viewed)
 */
export const viewStory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        error: { message: 'Story not found' },
      });
    }

    // Add user to views if not already viewed
    if (!story.views.includes(userId as any)) {
      story.views.push(userId as any);
      await story.save();
    }

    return res.json({
      success: true,
      data: { story },
    });
  } catch (error: any) {
    console.error('Error viewing story:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to view story' },
    });
  }
};

/**
 * Follow a user
 */
export const followUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { followingId } = req.body;

    if (!followingId || followingId === userId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid user to follow' },
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ followerId: userId, followingId });
    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already following this user' },
      });
    }

    const follow = new Follow({
      followerId: userId,
      followingId,
    });

    await follow.save();

    return res.json({
      success: true,
      data: { follow },
    });
  } catch (error: any) {
    console.error('Error following user:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to follow user' },
    });
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { followingId } = req.body;

    const follow = await Follow.findOneAndDelete({ followerId: userId, followingId });

    if (!follow) {
      return res.status(404).json({
        success: false,
        error: { message: 'Not following this user' },
      });
    }

    return res.json({
      success: true,
      data: { message: 'Unfollowed successfully' },
    });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to unfollow user' },
    });
  }
};

/**
 * Like a post
 */
export const likePost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { message: 'Post not found' },
      });
    }

    const isLiked = post.likes.includes(userId as any);
    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      post.likes.push(userId as any);
    }

    await post.save();

    return res.json({
      success: true,
      data: { 
        post,
        isLiked: !isLiked,
        likesCount: post.likes.length,
      },
    });
  } catch (error: any) {
    console.error('Error liking post:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to like post' },
    });
  }
};

/**
 * Add a comment to a post
 */
export const addComment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' },
      });
    }

    const { postId } = req.params;
    const { content, parentCommentId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Comment content is required' },
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: { message: 'Post not found' },
      });
    }

    const comment = new Comment({
      userId,
      postId,
      content: content.trim(),
      parentCommentId,
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    await comment.populate('userId', 'name email image');

    return res.json({
      success: true,
      data: { comment },
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to add comment' },
    });
  }
};

/**
 * Get comments for a post
 */
export const getComments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .populate('userId', 'name email image')
      .populate('parentCommentId')
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: { comments },
    });
  } catch (error: any) {
    console.error('Error getting comments:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get comments' },
    });
  }
};

/**
 * Search users
 */
export const searchUsers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.session?.user?.id;
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' },
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
      _id: { $ne: userId }, // Exclude self
    })
      .select('name email image')
      .limit(20);

    // Get follow status for each user
    const userIds = users.map(u => u._id);
    const follows = await Follow.find({ 
      followerId: userId, 
      followingId: { $in: userIds } 
    });

    const followingMap = new Map(follows.map(f => [f.followingId.toString(), true]));

    const usersWithFollowStatus = users.map(user => ({
      ...user.toObject(),
      isFollowing: followingMap.has(user._id.toString()),
    }));

    return res.json({
      success: true,
      data: { users: usersWithFollowStatus },
    });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to search users' },
    });
  }
};

