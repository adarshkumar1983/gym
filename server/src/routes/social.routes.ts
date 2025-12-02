/**
 * Social Routes
 * API endpoints for social features
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getFeed,
  createPost,
  getStories,
  createStory,
  viewStory,
  followUser,
  unfollowUser,
  likePost,
  addComment,
  getComments,
  searchUsers,
  getSuggestedUsers,
} from '../controllers/social.controller';

const router = Router();

// Feed
router.get('/feed', requireAuth, getFeed);
router.post('/posts', requireAuth, createPost);

// Stories (Snapchat-style)
router.get('/stories', requireAuth, getStories);
router.post('/stories', requireAuth, createStory);
router.post('/stories/:storyId/view', requireAuth, viewStory);

// Follow/Unfollow
router.post('/follow', requireAuth, followUser);
router.post('/unfollow', requireAuth, unfollowUser);

// Likes
router.post('/posts/:postId/like', requireAuth, likePost);

// Comments
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/comments', requireAuth, addComment);

// Search & Suggestions
router.get('/users/search', requireAuth, searchUsers);
router.get('/users/suggested', requireAuth, getSuggestedUsers);

export default router;

