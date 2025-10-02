const Story = require('../models/Story');
const Chapter = require('../models/Chapter');
const Like = require('../models/Like');
const Rating = require('../models/Rating');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @desc    Get all stories with filtering and pagination
// @route   GET /api/stories
// @access  Public
const getStories = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      language,
      sortBy = 'newest',
      q,
      status,
      featured
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = { visibility: 'public' };
    
    // Add filters
    if (genre) query.genre = genre;
    if (language) query.language = language;
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;
    
    // Search functionality
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    // Sorting
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { publishedAt: 1 };
        break;
      case 'popular':
        sort = { totalViews: -1, totalLikes: -1 };
        break;
      case 'trending':
        sort = { totalViews: -1, publishedAt: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1, ratingCount: -1 };
        break;
      default: // newest
        sort = { publishedAt: -1 };
    }
    
    const [stories, total] = await Promise.all([
      Story.find(query)
        .populate('author', 'username fullName profilePicture followersCount')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Story.countDocuments(query)
    ]);
    
    // Add additional data for authenticated users
    if (req.userId) {
      for (let story of stories) {
        const [isLiked, isInReadingList] = await Promise.all([
          Like.isLikedBy(req.userId, story._id, 'story'),
          User.exists({
            _id: req.userId,
            'readingList.story': story._id
          })
        ]);
        
        story.isLiked = !!isLiked;
        story.isInReadingList = !!isInReadingList;
      }
    }
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending stories
// @route   GET /api/stories/trending
// @access  Public
const getTrendingStories = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const stories = await Story.getTrending(parseInt(limit));
    
    res.json({
      success: true,
      data: { stories }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured stories
// @route   GET /api/stories/featured
// @access  Public
const getFeaturedStories = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    
    const stories = await Story.getFeatured(parseInt(limit));
    
    res.json({
      success: true,
      data: { stories }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Public
const getStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('author', 'username fullName profilePicture bio followersCount storiesCount')
      .populate({
        path: 'chapters',
        match: { status: 'published' },
        select: 'title chapterNumber publishedAt views likes',
        options: { sort: { chapterNumber: 1 } }
      });
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }
    
    // Check if story is accessible
    if (story.visibility === 'private' && (!req.userId || story.author._id.toString() !== req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'This story is private'
      });
    }
    
    // Increment view count
    story.incrementViews();
    
    // Get additional data for authenticated users
    let additionalData = {};
    if (req.userId) {
      const [isLiked, isInReadingList, userRating, isFollowing] = await Promise.all([
        Like.isLikedBy(req.userId, story._id, 'story'),
        User.exists({
          _id: req.userId,
          'readingList.story': story._id
        }),
        Rating.getUserRating(req.userId, story._id),
        require('../models/Follow').isFollowing(req.userId, story.author._id)
      ]);
      
      additionalData = {
        isLiked: !!isLiked,
        isInReadingList: !!isInReadingList,
        userRating: userRating ? userRating.value : null,
        isFollowingAuthor: !!isFollowing
      };
    }
    
    res.json({
      success: true,
      data: {
        story,
        ...additionalData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res, next) => {
  try {
    const {
      title,
      description,
      genre,
      tags,
      language,
      ageRating,
      warnings
    } = req.body;
    
    const storyData = {
      title,
      description,
      genre,
      author: req.userId,
      tags: tags || [],
      language: language || 'en',
      ageRating: ageRating || 'everyone',
      warnings: warnings || []
    };
    
    // Handle cover image upload
    if (req.file) {
      const { getFileUrl } = require('../middleware/upload');
      storyData.coverImage = getFileUrl(req.file.filename, 'cover');
    }
    
    const story = new Story(storyData);
    await story.save();
    
    // Update user's story count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { storiesCount: 1 }
    });
    
    await story.populate('author', 'username fullName profilePicture');
    
    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: { story }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update story
// @route   PUT /api/stories/:id
// @access  Private
const updateStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }
    
    // Check ownership
    if (story.author.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this story'
      });
    }
    
    const allowedFields = [
      'title', 'description', 'genre', 'tags', 'language',
      'status', 'visibility', 'ageRating', 'warnings'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Handle cover image upload
    if (req.file) {
      const { getFileUrl, deleteFile } = require('../middleware/upload');
      
      // Delete old cover image if exists
      if (story.coverImage) {
        const oldFileName = story.coverImage.split('/').pop();
        deleteFile(`uploads/covers/${oldFileName}`);
      }
      
      updates.coverImage = getFileUrl(req.file.filename, 'cover');
    }
    
    const updatedStory = await Story.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username fullName profilePicture');
    
    res.json({
      success: true,
      message: 'Story updated successfully',
      data: { story: updatedStory }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }
    
    // Check ownership
    if (story.author.toString() !== req.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this story'
      });
    }
    
    // Delete associated data
    await Promise.all([
      Chapter.deleteMany({ story: story._id }),
      Comment.deleteMany({ story: story._id }),
      Like.deleteMany({ story: story._id }),
      Rating.deleteMany({ story: story._id })
    ]);
    
    // Delete cover image if exists
    if (story.coverImage) {
      const { deleteFile } = require('../middleware/upload');
      const fileName = story.coverImage.split('/').pop();
      deleteFile(`uploads/covers/${fileName}`);
    }
    
    await story.deleteOne();
    
    // Update user's story count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { storiesCount: -1 }
    });
    
    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's stories
// @route   GET /api/stories/user/:userId
// @access  Public
const getUserStories = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { author: userId };
    
    // If not the owner, only show public stories
    if (!req.userId || req.userId !== userId) {
      query.visibility = 'public';
      query.status = { $ne: 'draft' };
    } else if (status) {
      query.status = status;
    }
    
    const [stories, total] = await Promise.all([
      Story.find(query)
        .populate('author', 'username fullName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Story.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get story analytics (for authors)
// @route   GET /api/stories/:id/analytics
// @access  Private
const getStoryAnalytics = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }
    
    // Check ownership
    if (story.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this story'
      });
    }
    
    const [chapters, comments, ratings] = await Promise.all([
      Chapter.find({ story: story._id, status: 'published' })
        .select('title views likes chapterNumber')
        .sort({ chapterNumber: 1 }),
      Comment.find({ story: story._id })
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .limit(10),
      Rating.find({ story: story._id })
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);
    
    const ratingDistribution = await Rating.getRatingDistribution(story._id);
    
    res.json({
      success: true,
      data: {
        story: {
          title: story.title,
          totalViews: story.totalViews,
          totalLikes: story.totalLikes,
          totalComments: story.totalComments,
          averageRating: story.averageRating,
          ratingCount: story.ratingCount,
          chaptersCount: story.chaptersCount
        },
        chapters,
        recentComments: comments,
        recentRatings: ratings,
        ratingDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStories,
  getTrendingStories,
  getFeaturedStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  getUserStories,
  getStoryAnalytics
};