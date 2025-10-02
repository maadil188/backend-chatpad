const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment system for stories and chapters
 */

/**
 * @swagger
 * /api/comments/{storyId}:
 *   get:
 *     summary: Get comments for a story
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *       - in: query
 *         name: chapterId
 *         schema:
 *           type: string
 *         description: Chapter ID (optional, for chapter-specific comments)
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
 *         description: Comments per page
 *     responses:
 *       200:
 *         description: List of comments
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
 *                   example: "Comments endpoint - coming soon"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Story not found
 */
router.get('/:storyId', (req, res) => {
  res.json({
    success: true,
    message: 'Comments endpoint - coming soon',
    data: []
  });
});

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - story
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *                 minLength: 1
 *                 example: "Great story! Can't wait for the next chapter."
 *               story:
 *                 type: string
 *                 description: Story ID
 *               chapter:
 *                 type: string
 *                 description: Chapter ID (optional, for chapter-specific comments)
 *               parentComment:
 *                 type: string
 *                 description: Parent comment ID (for replies)
 *               paragraphIndex:
 *                 type: integer
 *                 minimum: 0
 *                 description: Paragraph index for inline comments
 *     responses:
 *       201:
 *         description: Comment created successfully
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
 *                   example: "Create comment endpoint - coming soon"
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Story or chapter not found
 */
router.post('/', (req, res) => {
  res.json({
    success: true,
    message: 'Create comment endpoint - coming soon',
    data: {}
  });
});

module.exports = router;