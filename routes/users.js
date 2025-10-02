const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profiles
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Search and get users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for username or full name
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
 *         description: Users per page
 *     responses:
 *       200:
 *         description: List of users
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
 *                   example: "Users endpoint - coming soon"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Users endpoint - coming soon',
    data: []
  });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile
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
 *                   example: "User profile endpoint - coming soon"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint - coming soon',
    data: {}
  });
});

module.exports = router;