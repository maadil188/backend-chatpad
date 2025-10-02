const express = require('express');
const router = express.Router();

// Import controllers
const {
  getStories,
  getTrendingStories,
  getFeaturedStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  getUserStories,
  getStoryAnalytics
} = require('../controllers/storyController');

// Import middleware
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadSingle, cleanupOnError } = require('../middleware/upload');
const {
  validateStoryCreation,
  validateStoryUpdate,
  validateMongoId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Story management and discovery
 */

/**
 * @swagger
 * /api/stories:
 *   get:
 *     summary: Get all stories with filtering and pagination
 *     tags: [Stories]
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
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *           enum: [Romance, Fantasy, Mystery, Thriller, Horror, Adventure, Sci-Fi, Drama, Comedy, Action, Historical, Young Adult, Poetry, Non-Fiction, Biography, Other]
 *         description: Filter by genre
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, es, fr, de, it, pt, ar, other]
 *         description: Filter by language
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, popular, trending, rating]
 *           default: newest
 *         description: Sort stories by
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for title, description, or tags
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured stories only
 *     responses:
 *       200:
 *         description: List of stories with pagination
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
 */
router.get('/', 
  optionalAuth,
  validatePagination,
  validateSearch,
  getStories
);

/**
 * @swagger
 * /api/stories/trending:
 *   get:
 *     summary: Get trending stories
 *     tags: [Stories]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending stories to return
 *     responses:
 *       200:
 *         description: List of trending stories
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
 */
router.get('/trending', getTrendingStories);

/**
 * @swagger
 * /api/stories/featured:
 *   get:
 *     summary: Get featured stories
 *     tags: [Stories]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of featured stories to return
 *     responses:
 *       200:
 *         description: List of featured stories
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
 */
router.get('/featured', getFeaturedStories);

/**
 * @swagger
 * /api/stories/user/{userId}:
 *   get:
 *     summary: Get stories by a specific user
 *     tags: [Stories]
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
 *         description: Stories per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, ongoing, completed, on-hold, discontinued]
 *         description: Filter by status (only works for story owner)
 *     responses:
 *       200:
 *         description: User's stories
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
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/user/:userId',
  optionalAuth,
  validateMongoId('userId'),
  validatePagination,
  getUserStories
);

/**
 * @swagger
 * /api/stories:
 *   post:
 *     summary: Create a new story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - genre
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "The Chronicles of Magic"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "An epic fantasy adventure about a young wizard's journey"
 *               genre:
 *                 type: string
 *                 enum: [Romance, Fantasy, Mystery, Thriller, Horror, Adventure, Sci-Fi, Drama, Comedy, Action, Historical, Young Adult, Poetry, Non-Fiction, Biography, Other]
 *                 example: "Fantasy"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["magic", "adventure", "friendship"]
 *               language:
 *                 type: string
 *                 enum: [en, es, fr, de, it, pt, ar, other]
 *                 default: en
 *               ageRating:
 *                 type: string
 *                 enum: [everyone, teen, mature]
 *                 default: everyone
 *               warnings:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [violence, mature-content, strong-language, sensitive-topics]
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Story cover image
 *     responses:
 *       201:
 *         description: Story created successfully
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
 *                   example: "Story created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     story:
 *                       $ref: '#/components/schemas/Story'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/',
  authenticate,
  uploadSingle('coverImage'),
  cleanupOnError,
  validateStoryCreation,
  createStory
);

/**
 * @swagger
 * /api/stories/{id}:
 *   get:
 *     summary: Get a single story by ID
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story details
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
 *                     story:
 *                       $ref: '#/components/schemas/Story'
 *                     isLiked:
 *                       type: boolean
 *                       description: Whether current user liked this story
 *                     isInReadingList:
 *                       type: boolean
 *                       description: Whether story is in user's reading list
 *                     userRating:
 *                       type: integer
 *                       description: User's rating for this story
 *                     isFollowingAuthor:
 *                       type: boolean
 *                       description: Whether user follows the author
 *       404:
 *         description: Story not found
 *       403:
 *         description: Story is private
 *   put:
 *     summary: Update a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               genre:
 *                 type: string
 *                 enum: [Romance, Fantasy, Mystery, Thriller, Horror, Adventure, Sci-Fi, Drama, Comedy, Action, Historical, Young Adult, Poetry, Non-Fiction, Biography, Other]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, ongoing, completed, on-hold, discontinued]
 *               visibility:
 *                 type: string
 *                 enum: [public, private, premium]
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Story updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this story
 *       404:
 *         description: Story not found
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this story
 *       404:
 *         description: Story not found
 */
router.get('/:id',
  optionalAuth,
  validateMongoId(),
  getStory
);

router.put('/:id',
  authenticate,
  uploadSingle('coverImage'),
  cleanupOnError,
  validateMongoId(),
  validateStoryUpdate,
  updateStory
);

router.delete('/:id',
  authenticate,
  validateMongoId(),
  deleteStory
);

/**
 * @swagger
 * /api/stories/{id}/analytics:
 *   get:
 *     summary: Get story analytics (for authors only)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Story ID
 *     responses:
 *       200:
 *         description: Story analytics data
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
 *                     story:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                         totalViews:
 *                           type: integer
 *                         totalLikes:
 *                           type: integer
 *                         totalComments:
 *                           type: integer
 *                         averageRating:
 *                           type: number
 *                         chaptersCount:
 *                           type: integer
 *                     chapters:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chapter'
 *                     recentComments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     ratingDistribution:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view analytics for this story
 *       404:
 *         description: Story not found
 */
router.get('/:id/analytics',
  authenticate,
  validateMongoId(),
  getStoryAnalytics
);

module.exports = router;