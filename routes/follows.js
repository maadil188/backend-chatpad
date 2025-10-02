const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Follows
 *   description: User following system
 */

/**
 * @swagger
 * /api/follows/{userId}:
 *   post:
 *     summary: Toggle follow/unfollow a user
 *     tags: [Follows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to follow/unfollow
 *     responses:
 *       200:
 *         description: Follow status toggled successfully
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
 *                   example: "Follow endpoint - coming soon"
 *                 following:
 *                   type: boolean
 *                   description: True if now following, false if unfollowed
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Cannot follow yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/:userId', (req, res) => {
  res.json({
    success: true,
    message: 'Follow endpoint - coming soon',
    data: {}
  });
});

/**
 * @swagger
 * /api/follows/followers/{userId}:
 *   get:
 *     summary: Get user's followers
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Followers per page
 *     responses:
 *       200:
 *         description: List of user's followers
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
 *                   example: "Followers endpoint - coming soon"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: User not found
 */
router.get('/followers/:userId', (req, res) => {
  res.json({
    success: true,
    message: 'Followers endpoint - coming soon',
    data: []
  });
});

/**
 * @swagger
 * /api/follows/following/{userId}:
 *   get:
 *     summary: Get users that a user is following
 *     tags: [Follows]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Following per page
 *     responses:
 *       200:
 *         description: List of users being followed
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
 *                   example: "Following endpoint - coming soon"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: User not found
 */
router.get('/following/:userId', (req, res) => {
  res.json({
    success: true,
    message: 'Following endpoint - coming soon',
    data: []
  });
});

module.exports = router;