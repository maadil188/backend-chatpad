const express = require('express');
const router = express.Router();

const {
  toggleLike,
  getUserLikedStories,
  checkLikeStatus
} = require('../controllers/likeController');

const { authenticate } = require('../middleware/auth');
const { validateMongoId, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: Like system for stories, chapters, and comments
 */

/**
 * @swagger
 * /api/likes/{targetType}/{targetId}:
 *   post:
 *     summary: Toggle like on story, chapter, or comment
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [story, chapter, comment]
 *         description: Type of content to like
 *         example: story
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the content to like
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Liked successfully"
 *                 liked:
 *                   type: boolean
 *                   description: True if liked, false if unliked
 *                   example: true
 *       400:
 *         description: Invalid target type or ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Target content not found
 */
router.post('/:targetType/:targetId',
  authenticate,
  validateMongoId('targetId'),
  toggleLike
);

/**
 * @swagger
 * /api/likes/stories:
 *   get:
 *     summary: Get user's liked stories
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of stories per page
 *     responses:
 *       200:
 *         description: List of user's liked stories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Story'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/stories',
  authenticate,
  validatePagination,
  getUserLikedStories
);

/**
 * @swagger
 * /api/likes/check/{targetType}/{targetId}:
 *   get:
 *     summary: Check if user has liked specific content
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [story, chapter, comment]
 *         description: Type of content to check
 *         example: story
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the content to check
 *     responses:
 *       200:
 *         description: Like status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isLiked:
 *                       type: boolean
 *                       description: Whether user has liked this content
 *                       example: true
 *       400:
 *         description: Invalid target type
 *       401:
 *         description: Unauthorized
 */
router.get('/check/:targetType/:targetId',
  authenticate,
  validateMongoId('targetId'),
  checkLikeStatus
);

module.exports = router;